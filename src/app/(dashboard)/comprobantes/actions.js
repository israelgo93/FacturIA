'use server';

/**
 * Server Actions para comprobantes electrónicos
 * CRUD + procesamiento + anulación
 */
import { createClient } from '@/lib/supabase/server';
import { obtenerSiguienteSecuencial, generarNumeroCompleto } from '@/lib/sri/secuencial-manager';
import { procesarComprobante as procesarComprobanteMotor } from '@/lib/sri/comprobante-orchestrator';

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
		const resultado = await procesarComprobanteMotor(comprobanteId);
		return { data: resultado };
	} catch (error) {
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
		motivoModificacion,
		detalles,
		infoAdicional,
	} = formData;

	// Obtener códigos
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

	// Crear comprobante NC
	const { data: comprobante, error: insertError } = await supabase
		.from('comprobantes')
		.insert({
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
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar detalles
	await insertarDetallesComprobante(supabase, comprobante.id, empresa.id, detalles);

	return { data: { id: comprobante.id, numeroCompleto } };
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

	// Para ND, los motivos son los detalles
	const totalMotivos = motivos.reduce((sum, m) => sum + Number(m.valor), 0);

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
			importe_total: totalMotivos.toFixed(2),
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar motivos como detalles
	for (let i = 0; i < motivos.length; i++) {
		const m = motivos[i];
		await supabase.from('comprobante_detalles').insert({
			comprobante_id: comprobante.id,
			empresa_id: empresa.id,
			codigo_principal: `MOT${i + 1}`,
			descripcion: m.razon,
			cantidad: 1,
			precio_unitario: m.valor,
			precio_total_sin_impuesto: m.valor,
			impuestos: [],
			orden: i,
		});
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
		tipoSujetoRetenido,
		documentosSustento,
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

	// Calcular total retenido
	let totalRetenido = 0;
	for (const doc of documentosSustento) {
		for (const ret of doc.retenciones) {
			totalRetenido += Number(ret.valorRetenido);
		}
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
			tipo_sujeto_retenido: tipoSujetoRetenido || null,
			tipo_identificacion_comprador: tipoIdentificacionSujetoRetenido,
			identificacion_comprador: identificacionSujetoRetenido,
			razon_social_comprador: razonSocialSujetoRetenido,
			importe_total: totalRetenido.toFixed(2),
			info_adicional: infoAdicional || [],
			created_by: user.id,
		})
		.select('id')
		.single();

	if (insertError) return { error: insertError.message };

	// Insertar detalles de retención
	for (const doc of documentosSustento) {
		for (const ret of doc.retenciones) {
			await supabase.from('retencion_detalles').insert({
				comprobante_id: comprobante.id,
				empresa_id: empresa.id,
				cod_sustento: doc.codSustento,
				cod_doc_sustento: doc.codDocSustento,
				num_doc_sustento: doc.numDocSustento,
				fecha_emision_doc_sustento: doc.fechaEmision,
				fecha_registro_contable: doc.fechaRegistroContable || doc.fechaEmision,
				num_aut_doc_sustento: doc.numAutorizacion,
				pago_loc_ext: doc.pagoLocExt || '01',
				codigo_impuesto: ret.codigoImpuesto,
				codigo_retencion: ret.codigoRetencion,
				base_imponible: ret.baseImponible,
				porcentaje_retener: ret.porcentaje,
				valor_retenido: ret.valorRetenido,
				forma_pago: doc.pagos?.[0]?.formaPago || '20',
				total_sin_impuestos: doc.totalSinImpuestos,
				importe_total: doc.importeTotal,
			});
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
		fechaIniTransporte,
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
			fecha_inicio_transporte: fechaIniTransporte,
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
				direccion_destinatario: dest.direccion,
				motivo_traslado: dest.motivoTraslado,
				ruta: dest.ruta || null,
				cod_doc_sustento: dest.codDocSustento || null,
				num_doc_sustento: dest.numDocSustento || null,
				num_autorizacion_doc_sustento: dest.numAutDocSustento || null,
				fecha_emision_doc_sustento: dest.fechaEmisionDocSustento || null,
				cod_estab_destino: dest.codEstabDestino || null,
			})
			.select('id')
			.single();

		if (destError) continue;

		// Insertar items del destinatario
		for (const item of (dest.items || [])) {
			await supabase.from('guia_remision_detalles').insert({
				destinatario_id: destData.id,
				empresa_id: empresa.id,
				codigo_interno: item.codigoInterno || null,
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

	const totales = calcularTotalesDesdeDetalles(detalles);

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

	// Insertar detalles
	await insertarDetallesComprobante(supabase, comprobante.id, empresa.id, detalles);

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
