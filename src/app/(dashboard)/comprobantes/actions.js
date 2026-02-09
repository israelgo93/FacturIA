'use server';

/**
 * Server Actions para comprobantes electrónicos
 * CRUD + procesamiento + anulación
 */
import { createClient } from '@/lib/supabase/server';
import { obtenerSiguienteSecuencial, generarNumeroCompleto } from '@/lib/sri/secuencial-manager';
import { procesarComprobante as procesarComprobanteMotor } from '@/lib/sri/comprobante-orchestrator';
import { consultarAutorizacion, getWSUrl } from '@/lib/sri/soap-client';
import { getTarifaIVA } from '@/lib/utils/sri-catalogs';

/**
 * Crea un borrador de comprobante (factura)
 */
export async function crearBorrador(formData) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	// Obtener empresa del usuario
	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) return { error: 'Empresa no configurada' };

	const {
		establecimientoId,
		puntoEmisionId,
		clienteId,
		tipoIdentificacionComprador,
		identificacionComprador,
		razonSocialComprador,
		direccionComprador,
		emailComprador,
		telefonoComprador,
		detalles,
		pagos,
		observaciones,
		infoAdicional,
	} = formData;

	// Obtener códigos de establecimiento y punto de emisión
	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	// Obtener siguiente secuencial
	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '01', // Factura
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	// Calcular totales desde detalles
	const totales = calcularTotalesDesdeDetalles(detalles);

	// Crear comprobante en estado draft
	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
			empresa_id: empresa.id,
			establecimiento_id: establecimientoId,
			punto_emision_id: puntoEmisionId,
			cliente_id: clienteId || null,
			tipo_comprobante: '01',
			ambiente: empresa.ambiente,
			tipo_emision: empresa.tipo_emision || 1,
			secuencial,
			serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
			numero_completo: numeroCompleto,
			estado: 'draft',
			fecha_emision: new Date().toISOString().split('T')[0],
			tipo_identificacion_comprador: tipoIdentificacionComprador,
			identificacion_comprador: identificacionComprador,
			razon_social_comprador: razonSocialComprador,
			direccion_comprador: direccionComprador || null,
			email_comprador: emailComprador || null,
			telefono_comprador: telefonoComprador || null,
			subtotal_sin_impuestos: totales.subtotalSinImpuestos,
			subtotal_iva: totales.subtotalIva,
			subtotal_iva_0: totales.subtotalIva0,
			subtotal_no_objeto: totales.subtotalNoObjeto,
			subtotal_exento: totales.subtotalExento,
			total_descuento: totales.totalDescuento,
			valor_iva: totales.valorIva,
			propina: 0,
			importe_total: totales.importeTotal,
			observaciones: observaciones || null,
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar detalles
	for (let i = 0; i < detalles.length; i++) {
		const det = detalles[i];
		const { data: detalle, error: detError } = await supabase
			.from('comprobante_detalles')
			.insert({
				comprobante_id: comprobante.id,
				empresa_id: empresa.id,
				producto_id: det.productoId || null,
				codigo_principal: det.codigoPrincipal,
				descripcion: det.descripcion,
				cantidad: det.cantidad,
				precio_unitario: det.precioUnitario,
				descuento: det.descuento || 0,
				precio_total_sin_impuesto: det.precioTotalSinImpuesto,
				impuestos: det.impuestos || [],
				orden: i,
			})
			.select('id')
			.single();

		if (detError) continue;

		// Insertar impuestos separados
		if (det.impuestos && det.impuestos.length > 0) {
			await supabase.from('comprobante_impuestos').insert(
				det.impuestos.map((imp) => ({
					comprobante_detalle_id: detalle.id,
					codigo: imp.codigo,
					codigo_porcentaje: imp.codigoPorcentaje,
					tarifa: imp.tarifa,
					base_imponible: imp.baseImponible,
					valor: imp.valor,
				}))
			);
		}
	}

	// Insertar pagos
	if (pagos && pagos.length > 0) {
		await supabase.from('comprobante_pagos').insert(
			pagos.map((p) => ({
				comprobante_id: comprobante.id,
				forma_pago: p.formaPago,
				total: p.total,
				plazo: p.plazo || null,
				unidad_tiempo: p.unidadTiempo || 'dias',
			}))
		);
	}

	return { data: { id: comprobante.id, numeroCompleto } };
}

/**
 * Procesa un comprobante (firmar + enviar + autorizar)
 */
export async function procesarComprobante(comprobanteId) {
	try {
		console.log('[procesarComprobante] Iniciando para:', comprobanteId);
		const resultado = await procesarComprobanteMotor(comprobanteId);
		console.log('[procesarComprobante] Resultado:', JSON.stringify(resultado, null, 2));
		return { data: resultado };
	} catch (error) {
		console.error('[procesarComprobante] Error:', error.message, error.stack);
		return { error: error.message };
	}
}

/**
 * Anula un comprobante (solo borradores)
 */
export async function anularComprobante(comprobanteId) {
	const supabase = await createClient();

	const { data: comp } = await supabase
		.from('comprobantes')
		.select('estado')
		.eq('id', comprobanteId)
		.single();

	if (!comp) return { error: 'Comprobante no encontrado' };
	if (comp.estado !== 'draft' && comp.estado !== 'NAT' && comp.estado !== 'DEV') {
		return { error: 'Solo se pueden anular comprobantes en estado borrador, no autorizado o devuelto' };
	}

	const { error } = await supabase
		.from('comprobantes')
		.update({ estado: 'voided' })
		.eq('id', comprobanteId);

	if (error) return { error: error.message };
	return { data: { estado: 'voided' } };
}

/**
 * Lista comprobantes con paginación y filtros
 */
export async function listarComprobantes({
	page = 1,
	pageSize = 20,
	estado,
	tipoComprobante,
	fechaDesde,
	fechaHasta,
	busqueda,
} = {}) {
	const supabase = await createClient();

	let query = supabase
		.from('comprobantes')
		.select(
			'id, tipo_comprobante, secuencial, numero_completo, clave_acceso, estado, fecha_emision, razon_social_comprador, identificacion_comprador, importe_total, created_at',
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false });

	if (estado) query = query.eq('estado', estado);
	if (tipoComprobante) query = query.eq('tipo_comprobante', tipoComprobante);
	if (fechaDesde) query = query.gte('fecha_emision', fechaDesde);
	if (fechaHasta) query = query.lte('fecha_emision', fechaHasta);
	if (busqueda) {
		query = query.or(
			`razon_social_comprador.ilike.%${busqueda}%,identificacion_comprador.ilike.%${busqueda}%,numero_completo.ilike.%${busqueda}%`
		);
	}

	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;
	query = query.range(from, to);

	const { data, count, error } = await query;
	if (error) return { error: error.message };

	return {
		data: {
			comprobantes: data || [],
			total: count || 0,
			page,
			pageSize,
			totalPages: Math.ceil((count || 0) / pageSize),
		},
	};
}

/**
 * Obtiene un comprobante completo por ID
 */
export async function obtenerComprobante(id) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('comprobantes')
		.select(`
			*,
			empresa:empresas(ruc, razon_social, nombre_comercial, direccion_matriz),
			establecimiento:establecimientos(codigo, direccion),
			punto_emision:puntos_emision(codigo),
			cliente:clientes(razon_social, identificacion, email),
			detalles:comprobante_detalles(
				*,
				impuestos:comprobante_impuestos(*)
			),
			pagos:comprobante_pagos(*)
		`)
		.eq('id', id)
		.single();

	if (error) return { error: error.message };
	return { data };
}

// =========================================
// Utilidades de cálculo
// =========================================

/**
 * Transforma detalles crudos del formulario (con codigoIVA) al formato
 * esperado por calcularTotalesDesdeDetalles e insertarDetallesComprobante
 * (con precioTotalSinImpuesto e impuestos[]).
 * @param {Array} detallesRaw - Detalles del formulario [{codigoPrincipal, descripcion, cantidad, precioUnitario, descuento, codigoIVA}]
 * @returns {Array} Detalles normalizados con impuestos computados
 */
function normalizarDetallesFormulario(detallesRaw) {
	return detallesRaw.map((d) => {
		const cantidad = Number(d.cantidad) || 0;
		const precioUnitario = Number(d.precioUnitario) || 0;
		const descuento = Number(d.descuento) || 0;
		const precioTotalSinImpuesto = cantidad * precioUnitario - descuento;
		const tarifa = getTarifaIVA(String(d.codigoIVA));
		const valorImpuesto = precioTotalSinImpuesto * (tarifa / 100);

		return {
			codigoPrincipal: d.codigoPrincipal,
			descripcion: d.descripcion,
			cantidad,
			precioUnitario,
			descuento,
			precioTotalSinImpuesto,
			productoId: d.productoId || null,
			impuestos: [
				{
					codigo: '2', // IVA
					codigoPorcentaje: String(d.codigoIVA),
					tarifa,
					baseImponible: precioTotalSinImpuesto,
					valor: Number(valorImpuesto.toFixed(2)),
				},
			],
		};
	});
}

function calcularTotalesDesdeDetalles(detalles) {
	let subtotalSinImpuestos = 0;
	let subtotalIva = 0;
	let subtotalIva0 = 0;
	let subtotalNoObjeto = 0;
	let subtotalExento = 0;
	let totalDescuento = 0;
	let valorIva = 0;

	for (const det of detalles) {
		const base = Number(det.precioTotalSinImpuesto);
		subtotalSinImpuestos += base;
		totalDescuento += Number(det.descuento || 0);

		for (const imp of (det.impuestos || [])) {
			if (imp.codigo === '2') {
				// IVA
				valorIva += Number(imp.valor);
				const codPct = imp.codigoPorcentaje;
				if (codPct === '0') subtotalIva0 += Number(imp.baseImponible);
				else if (codPct === '6') subtotalNoObjeto += Number(imp.baseImponible);
				else if (codPct === '7') subtotalExento += Number(imp.baseImponible);
				else subtotalIva += Number(imp.baseImponible);
			}
		}
	}

	return {
		subtotalSinImpuestos: subtotalSinImpuestos.toFixed(2),
		subtotalIva: subtotalIva.toFixed(2),
		subtotalIva0: subtotalIva0.toFixed(2),
		subtotalNoObjeto: subtotalNoObjeto.toFixed(2),
		subtotalExento: subtotalExento.toFixed(2),
		totalDescuento: totalDescuento.toFixed(2),
		valorIva: valorIva.toFixed(2),
		importeTotal: (subtotalSinImpuestos + valorIva).toFixed(2),
	};
}

// =============================================
// FASE 4: Server Actions Comprobantes Adicionales
// =============================================

/**
 * Busca comprobantes autorizados para usar como documento sustento
 */
export async function buscarComprobantesAutorizados({
	busqueda = '',
	tipoComprobante = '01',
	limit = 20,
} = {}) {
	const supabase = await createClient();

	let query = supabase
		.from('comprobantes')
		.select('id, tipo_comprobante, numero_completo, clave_acceso, fecha_emision, razon_social_comprador, identificacion_comprador, importe_total, numero_autorizacion')
		.eq('estado', 'AUT')
		.order('fecha_emision', { ascending: false })
		.limit(limit);

	if (tipoComprobante) {
		query = query.eq('tipo_comprobante', tipoComprobante);
	}

	if (busqueda) {
		query = query.or(
			`razon_social_comprador.ilike.%${busqueda}%,identificacion_comprador.ilike.%${busqueda}%,numero_completo.ilike.%${busqueda}%`
		);
	}

	const { data, error } = await query;
	if (error) return { error: error.message };
	return { data: data || [] };
}

/**
 * Crea un borrador de Nota de Crédito
 */
export async function crearNotaCredito(formData) {
	try {
	console.log('[crearNotaCredito] Iniciando con formData keys:', Object.keys(formData));
	console.log('[crearNotaCredito] establecimientoId:', formData.establecimientoId);
	console.log('[crearNotaCredito] puntoEmisionId:', formData.puntoEmisionId);
	console.log('[crearNotaCredito] docSustentoTipo:', formData.docSustentoTipo);
	console.log('[crearNotaCredito] docSustentoNumero:', formData.docSustentoNumero);
	console.log('[crearNotaCredito] detalles count:', formData.detalles?.length);

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) { console.log('[crearNotaCredito] No autenticado'); return { error: 'No autenticado' }; }

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) { console.log('[crearNotaCredito] Empresa no configurada'); return { error: 'Empresa no configurada' }; }
	console.log('[crearNotaCredito] Empresa:', empresa.id);

	const {
		establecimientoId,
		puntoEmisionId,
		docSustentoTipo,
		docSustentoNumero,
		docSustentoFecha,
		comprobanteReferenciaId,
		tipoIdentificacionComprador,
		identificacionComprador,
		razonSocialComprador,
		direccionComprador,
		emailComprador,
		motivoModificacion,
		detalles,
		infoAdicional,
	} = formData;

	// Obtener códigos
	const { data: establecimiento, error: estabErr } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision, error: peErr } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	console.log('[crearNotaCredito] Establecimiento:', establecimiento, 'Error:', estabErr);
	console.log('[crearNotaCredito] PuntoEmision:', puntoEmision, 'Error:', peErr);

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	// Obtener secuencial para NC
	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '04',
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	const totales = calcularTotalesDesdeDetalles(detalles);
	console.log('[crearNotaCredito] Totales:', totales);
	console.log('[crearNotaCredito] Detalles count:', detalles?.length, 'First:', JSON.stringify(detalles?.[0]));

	// Crear comprobante NC
	const insertPayload = {
		empresa_id: empresa.id,
		establecimiento_id: establecimientoId,
		punto_emision_id: puntoEmisionId,
		tipo_comprobante: '04',
		ambiente: empresa.ambiente,
		tipo_emision: empresa.tipo_emision || 1,
		secuencial,
		serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
		numero_completo: numeroCompleto,
		estado: 'draft',
		fecha_emision: new Date().toISOString().split('T')[0],
		doc_sustento_tipo: docSustentoTipo,
		doc_sustento_numero: docSustentoNumero,
		doc_sustento_fecha: docSustentoFecha,
		comprobante_referencia_id: comprobanteReferenciaId || null,
		motivo_modificacion: motivoModificacion,
		tipo_identificacion_comprador: tipoIdentificacionComprador,
		identificacion_comprador: identificacionComprador,
		razon_social_comprador: razonSocialComprador,
		direccion_comprador: direccionComprador || null,
		email_comprador: emailComprador || null,
		subtotal_sin_impuestos: totales.subtotalSinImpuestos,
		subtotal_iva: totales.subtotalIva,
		subtotal_iva_0: totales.subtotalIva0,
		total_descuento: totales.totalDescuento,
		valor_iva: totales.valorIva,
		importe_total: totales.importeTotal,
		info_adicional: infoAdicional || [],
		created_by: user.id,
	};
	console.log('[crearNotaCredito] Insert payload keys:', Object.keys(insertPayload));

	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert(insertPayload)
		.select('id')
		.single();

	console.log('[crearNotaCredito] Insert result:', comprobante, 'Error:', insertError);
	if (insertError) return { error: insertError.message };

	// Insertar detalles
	await insertarDetallesComprobante(supabase, comprobante.id, empresa.id, detalles);

	return { data: { id: comprobante.id, numeroCompleto } };
	} catch (error) {
		console.error('[crearNotaCredito] Error:', error.message, error.stack);
		return { error: error.message };
	}
}

/**
 * Crea un borrador de Nota de Débito
 */
export async function crearNotaDebito(formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) return { error: 'Empresa no configurada' };

	const {
		establecimientoId,
		puntoEmisionId,
		docSustentoTipo,
		docSustentoNumero,
		docSustentoFecha,
		comprobanteReferenciaId,
		tipoIdentificacionComprador,
		identificacionComprador,
		razonSocialComprador,
		direccionComprador,
		emailComprador,
		motivos,
		pagos,
		infoAdicional,
	} = formData;

	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '05',
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	// Para ND, los motivos son los detalles - calcular IVA (15%)
	const IVA_TARIFA = 15;
	const IVA_CODIGO_PORCENTAJE = '4'; // 15% IVA vigente
	const totalMotivos = motivos.reduce((sum, m) => sum + Number(m.valor), 0);
	const valorIvaND = totalMotivos * (IVA_TARIFA / 100);
	const importeTotalND = totalMotivos + valorIvaND;

	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
			empresa_id: empresa.id,
			establecimiento_id: establecimientoId,
			punto_emision_id: puntoEmisionId,
			tipo_comprobante: '05',
			ambiente: empresa.ambiente,
			tipo_emision: empresa.tipo_emision || 1,
			secuencial,
			serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
			numero_completo: numeroCompleto,
			estado: 'draft',
			fecha_emision: new Date().toISOString().split('T')[0],
			doc_sustento_tipo: docSustentoTipo,
			doc_sustento_numero: docSustentoNumero,
			doc_sustento_fecha: docSustentoFecha,
			comprobante_referencia_id: comprobanteReferenciaId || null,
			tipo_identificacion_comprador: tipoIdentificacionComprador,
			identificacion_comprador: identificacionComprador,
			razon_social_comprador: razonSocialComprador,
			direccion_comprador: direccionComprador || null,
			email_comprador: emailComprador || null,
			subtotal_sin_impuestos: totalMotivos.toFixed(2),
			subtotal_iva: totalMotivos.toFixed(2),
			valor_iva: valorIvaND.toFixed(2),
			importe_total: importeTotalND.toFixed(2),
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar motivos como detalles con impuestos IVA
	for (let i = 0; i < motivos.length; i++) {
		const m = motivos[i];
		const valorMotivo = Number(m.valor);
		const ivaMotivo = Number((valorMotivo * (IVA_TARIFA / 100)).toFixed(2));

		const { data: detalle, error: detError } = await supabase.from('comprobante_detalles').insert({
			comprobante_id: comprobante.id,
			empresa_id: empresa.id,
			codigo_principal: `MOT${i + 1}`,
			descripcion: m.razon,
			cantidad: 1,
			precio_unitario: valorMotivo,
			precio_total_sin_impuesto: valorMotivo,
			impuestos: [
				{
					codigo: '2',
					codigoPorcentaje: IVA_CODIGO_PORCENTAJE,
					tarifa: IVA_TARIFA,
					baseImponible: valorMotivo,
					valor: ivaMotivo,
				},
			],
			orden: i,
		}).select('id').single();

		if (!detError && detalle) {
			await supabase.from('comprobante_impuestos').insert({
				comprobante_detalle_id: detalle.id,
				codigo: '2',
				codigo_porcentaje: IVA_CODIGO_PORCENTAJE,
				tarifa: IVA_TARIFA,
				base_imponible: valorMotivo,
				valor: ivaMotivo,
			});
		}
	}

	// Insertar pagos (ajustar al total con IVA incluido)
	if (pagos && pagos.length > 0) {
		await supabase.from('comprobante_pagos').insert(
			pagos.map((p) => ({
				comprobante_id: comprobante.id,
				forma_pago: p.formaPago,
				total: importeTotalND.toFixed(2),
				plazo: p.plazo || null,
				unidad_tiempo: p.unidadTiempo || 'dias',
			}))
		);
	}

	return { data: { id: comprobante.id, numeroCompleto } };
}

/**
 * Crea un borrador de Comprobante de Retención
 */
export async function crearRetencion(formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) return { error: 'Empresa no configurada' };

	const {
		establecimientoId,
		puntoEmisionId,
		periodoFiscal,
		tipoIdentificacionSujetoRetenido,
		identificacionSujetoRetenido,
		razonSocialSujetoRetenido,
		emailSujetoRetenido,
		docSustentoTipo,
		docSustentoNumero,
		docSustentoFecha,
		detalles,
		infoAdicional,
	} = formData;

	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '07',
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	// Calcular total retenido desde los detalles planos
	let totalRetenido = 0;
	for (const d of detalles) {
		totalRetenido += Number(d.valorRetenido) || 0;
	}

	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
			empresa_id: empresa.id,
			establecimiento_id: establecimientoId,
			punto_emision_id: puntoEmisionId,
			tipo_comprobante: '07',
			ambiente: empresa.ambiente,
			tipo_emision: empresa.tipo_emision || 1,
			secuencial,
			serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
			numero_completo: numeroCompleto,
			estado: 'draft',
			fecha_emision: new Date().toISOString().split('T')[0],
			periodo_fiscal: periodoFiscal,
			tipo_identificacion_comprador: tipoIdentificacionSujetoRetenido,
			identificacion_comprador: identificacionSujetoRetenido,
			razon_social_comprador: razonSocialSujetoRetenido,
			email_comprador: emailSujetoRetenido || null,
			importe_total: totalRetenido.toFixed(2),
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar detalles de retención
	for (const d of detalles) {
		const { error: detError } = await supabase.from('retencion_detalles').insert({
			comprobante_id: comprobante.id,
			empresa_id: empresa.id,
			cod_sustento: '01',
			cod_doc_sustento: docSustentoTipo,
			num_doc_sustento: docSustentoNumero,
			fecha_emision_doc_sustento: docSustentoFecha || null,
			codigo_impuesto: d.tipoImpuesto,
			codigo_retencion: d.codigoRetencion,
			base_imponible: Number(d.baseImponible),
			porcentaje_retener: Number(d.porcentajeRetener),
			valor_retenido: Number(d.valorRetenido),
			pago_loc_ext: '01',
			forma_pago: '20',
		});
		if (detError) {
			console.error('Error insertando detalle retención:', detError);
		}
	}

	return { data: { id: comprobante.id, numeroCompleto } };
}

/**
 * Crea un borrador de Guía de Remisión
 */
export async function crearGuiaRemision(formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) return { error: 'Empresa no configurada' };

	const {
		establecimientoId,
		puntoEmisionId,
		dirPartida,
		fechaInicioTransporte,
		fechaFinTransporte,
		placa,
		tipoIdentificacionTransportista,
		rucTransportista,
		razonSocialTransportista,
		destinatarios,
		infoAdicional,
	} = formData;

	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '06',
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
			empresa_id: empresa.id,
			establecimiento_id: establecimientoId,
			punto_emision_id: puntoEmisionId,
			tipo_comprobante: '06',
			ambiente: empresa.ambiente,
			tipo_emision: empresa.tipo_emision || 1,
			secuencial,
			serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
			numero_completo: numeroCompleto,
			estado: 'draft',
			fecha_emision: new Date().toISOString().split('T')[0],
			dir_partida: dirPartida,
			fecha_inicio_transporte: fechaInicioTransporte,
			fecha_fin_transporte: fechaFinTransporte,
			placa,
			tipo_identificacion_transportista: tipoIdentificacionTransportista,
			ruc_transportista: rucTransportista,
			razon_social_transportista: razonSocialTransportista,
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar destinatarios
	for (const dest of destinatarios) {
		const { data: destData, error: destError } = await supabase
			.from('guia_remision_destinatarios')
			.insert({
				comprobante_id: comprobante.id,
				empresa_id: empresa.id,
				identificacion_destinatario: dest.identificacion,
				razon_social_destinatario: dest.razonSocial,
				direccion_destinatario: dest.dirDestinatario,
				motivo_traslado: dest.motivoTraslado,
				ruta: dest.ruta || null,
				cod_doc_sustento: dest.docSustentoTipo || null,
				num_doc_sustento: dest.docSustentoNumero || null,
				num_autorizacion_doc_sustento: dest.numAutDocSustento || null,
				fecha_emision_doc_sustento: dest.docSustentoFecha || null,
				cod_estab_destino: dest.codEstabDestino || null,
			})
			.select('id')
			.single();

		if (destError) {
			console.error('[crearGuiaRemision] Error insertando destinatario:', destError.message);
			continue;
		}

		// Insertar items del destinatario
		for (const item of (dest.detalles || [])) {
			await supabase.from('guia_remision_detalles').insert({
				destinatario_id: destData.id,
				empresa_id: empresa.id,
				codigo_interno: item.codigoPrincipal || null,
				codigo_adicional: item.codigoAdicional || null,
				descripcion: item.descripcion,
				cantidad: item.cantidad,
			});
		}
	}

	return { data: { id: comprobante.id, numeroCompleto } };
}

/**
 * Crea un borrador de Liquidación de Compra
 */
export async function crearLiquidacionCompra(formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ambiente, tipo_emision')
		.eq('user_id', user.id)
		.single();
	if (!empresa) return { error: 'Empresa no configurada' };

	const {
		establecimientoId,
		puntoEmisionId,
		tipoIdentificacionProveedor,
		identificacionProveedor,
		razonSocialProveedor,
		direccionProveedor,
		detalles,
		pagos,
		infoAdicional,
	} = formData;

	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('codigo')
		.eq('id', establecimientoId)
		.single();

	const { data: puntoEmision } = await supabase
		.from('puntos_emision')
		.select('codigo')
		.eq('id', puntoEmisionId)
		.single();

	if (!establecimiento || !puntoEmision) {
		return { error: 'Establecimiento o punto de emisión no encontrado' };
	}

	const secuencial = await obtenerSiguienteSecuencial({
		empresaId: empresa.id,
		establecimientoId,
		puntoEmisionId,
		tipoComprobante: '03',
	});

	const numeroCompleto = generarNumeroCompleto(
		establecimiento.codigo,
		puntoEmision.codigo,
		secuencial
	);

	// Normalizar detalles: transformar codigoIVA del formulario a formato con impuestos computados
	const detallesNormalizados = normalizarDetallesFormulario(detalles);
	const totales = calcularTotalesDesdeDetalles(detallesNormalizados);

	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
			empresa_id: empresa.id,
			establecimiento_id: establecimientoId,
			punto_emision_id: puntoEmisionId,
			tipo_comprobante: '03',
			ambiente: empresa.ambiente,
			tipo_emision: empresa.tipo_emision || 1,
			secuencial,
			serie: `${establecimiento.codigo}${puntoEmision.codigo}`,
			numero_completo: numeroCompleto,
			estado: 'draft',
			fecha_emision: new Date().toISOString().split('T')[0],
			tipo_identificacion_proveedor: tipoIdentificacionProveedor,
			identificacion_proveedor: identificacionProveedor,
			razon_social_proveedor: razonSocialProveedor,
			direccion_proveedor: direccionProveedor || null,
			subtotal_sin_impuestos: totales.subtotalSinImpuestos,
			subtotal_iva: totales.subtotalIva,
			subtotal_iva_0: totales.subtotalIva0,
			total_descuento: totales.totalDescuento,
			valor_iva: totales.valorIva,
			importe_total: totales.importeTotal,
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar detalles (con impuestos ya computados)
	await insertarDetallesComprobante(supabase, comprobante.id, empresa.id, detallesNormalizados);

	// Insertar pagos
	if (pagos && pagos.length > 0) {
		await supabase.from('comprobante_pagos').insert(
			pagos.map((p) => ({
				comprobante_id: comprobante.id,
				forma_pago: p.formaPago,
				total: p.total,
				plazo: p.plazo || null,
				unidad_tiempo: p.unidadTiempo || 'dias',
			}))
		);
	}

	return { data: { id: comprobante.id, numeroCompleto } };
}

// =============================================
// Función auxiliar para insertar detalles
// =============================================

/**
 * Re-consulta la autorización de un comprobante en estado PPR (En Procesamiento)
 */
export async function reConsultarAutorizacion(comprobanteId) {
	const supabase = await createClient();

	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: comp, error } = await supabase
		.from('comprobantes')
		.select('id, clave_acceso, estado, ambiente, empresa_id')
		.eq('id', comprobanteId)
		.single();

	if (error || !comp) return { error: 'Comprobante no encontrado' };
	if (!comp.clave_acceso) return { error: 'El comprobante no tiene clave de acceso' };

	const ambiente = String(comp.ambiente);
	const autorizacion = await consultarAutorizacion(comp.clave_acceso, ambiente);

	// Registrar en log
	await supabase.from('sri_log').insert({
		empresa_id: comp.empresa_id,
		comprobante_id: comprobanteId,
		tipo_operacion: 'AUTORIZACION',
		url_servicio: getWSUrl(ambiente, 'autorizacion'),
		estado_respuesta: autorizacion.estado,
		mensajes_error: autorizacion.mensajes,
		duracion_ms: autorizacion.tiempoMs,
	});

	if (autorizacion.estado === 'AUTORIZADO') {
		await supabase.from('comprobantes').update({
			estado: 'AUT',
			numero_autorizacion: autorizacion.numeroAutorizacion,
			fecha_autorizacion: autorizacion.fechaAutorizacion,
			xml_autorizado: autorizacion.xmlAutorizado,
		}).eq('id', comprobanteId);

		return { data: { estado: 'AUT', autorizacion } };
	} else if (autorizacion.estado === 'NO AUTORIZADO') {
		await supabase.from('comprobantes').update({ estado: 'NAT' }).eq('id', comprobanteId);
		return { data: { estado: 'NAT', mensajes: autorizacion.mensajes } };
	}

	return { data: { estado: autorizacion.estado, mensajes: autorizacion.mensajes } };
}

async function insertarDetallesComprobante(supabase, comprobanteId, empresaId, detalles) {
	for (let i = 0; i < detalles.length; i++) {
		const det = detalles[i];
		const { data: detalle, error: detError } = await supabase
			.from('comprobante_detalles')
			.insert({
				comprobante_id: comprobanteId,
				empresa_id: empresaId,
				producto_id: det.productoId || null,
				codigo_principal: det.codigoPrincipal,
				descripcion: det.descripcion,
				cantidad: det.cantidad,
				precio_unitario: det.precioUnitario,
				descuento: det.descuento || 0,
				precio_total_sin_impuesto: det.precioTotalSinImpuesto,
				impuestos: det.impuestos || [],
				orden: i,
			})
			.select('id')
			.single();

		if (detError) continue;

		if (det.impuestos && det.impuestos.length > 0) {
			await supabase.from('comprobante_impuestos').insert(
				det.impuestos.map((imp) => ({
					comprobante_detalle_id: detalle.id,
					codigo: imp.codigo,
					codigo_porcentaje: imp.codigoPorcentaje,
					tarifa: imp.tarifa,
					base_imponible: imp.baseImponible,
					valor: imp.valor,
				}))
			);
		}
	}
}
