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
