/**
 * Consolidador de datos para el ATS (Anexo Transaccional Simplificado)
 * Recopila compras, ventas y anulados del período para generar el XML
 */
import { getRangoPeriodo } from '@/lib/utils/vencimientos';

/**
 * Consolida todos los datos de un período para generar el ATS
 * @param {Object} supabase - Cliente Supabase autenticado
 * @param {string} empresaId - UUID de la empresa
 * @param {number} anio - Año fiscal
 * @param {number} mes - Mes (1-12) o mes final del semestre
 * @param {boolean} esSemestral - Si es RIMPE semestral
 * @returns {Object} Datos consolidados listos para construir XML
 */
export async function consolidarDatosATS(supabase, empresaId, anio, mes, esSemestral = false) {
	// 1. Obtener datos de la empresa
	const { data: empresa } = await supabase
		.from('empresas')
		.select('*, establecimientos(*)')
		.eq('id', empresaId)
		.single();

	if (!empresa) throw new Error('Empresa no encontrada');

	// 2. Determinar rango de fechas
	const { fechaInicio, fechaFin } = getRangoPeriodo(anio, mes, esSemestral);

	// 3. Compras recibidas (con sus retenciones)
	const { data: compras } = await supabase
		.from('compras_recibidas')
		.select('*, compras_recibidas_retenciones(*)')
		.eq('empresa_id', empresaId)
		.eq('incluir_ats', true)
		.gte('fecha_registro', fechaInicio)
		.lte('fecha_registro', fechaFin);

	// 4. Excluir compras que tengan retención electrónica autorizada
	const comprasParaATS = (compras || []).filter((c) => {
		// Si tiene retención electrónica asociada, NO reportar en compras ATS
		if (c.comprobante_retencion_id) return false;
		return true;
	});

	// 5. Calcular total ventas del período (todas, para cabecera)
	const { data: totalVentasData } = await supabase
		.rpc('calcular_total_ventas_periodo', {
			p_empresa_id: empresaId,
			p_fecha_inicio: fechaInicio,
			p_fecha_fin: fechaFin,
		});

	const ventasTotales = totalVentasData?.[0] || { total: 0, total_iva: 0, total_0: 0, total_exento: 0, num_comprobantes: 0 };

	// 6. Ventas por establecimiento
	const ventasPorEstab = (empresa.establecimientos || []).map((estab) => ({
		codigo: estab.codigo,
		totalVentas: ventasTotales.total || 0,
		ivaCompensado: 0,
	}));

	// Si no hay establecimientos, crear uno por defecto
	if (ventasPorEstab.length === 0) {
		ventasPorEstab.push({
			codigo: '001',
			totalVentas: ventasTotales.total || 0,
			ivaCompensado: 0,
		});
	}

	return {
		cabecera: {
			tipoIdInformante: 'R',
			idInformante: empresa.ruc,
			razonSocial: normalizarRazonSocial(empresa.razon_social),
			anio,
			mes: String(mes).padStart(2, '0'),
			regimenMicroempresa: esSemestral ? 'SI' : undefined,
			numEstabRuc: String(empresa.establecimientos?.length || 1).padStart(3, '0'),
			totalVentas: formatDecimal(ventasTotales.total),
			codigoOperativo: 'IVA',
		},
		compras: comprasParaATS,
		ventas: [], // facturIA es 100% electrónico, ventas electrónicas NO van en ATS
		anulados: [], // Anulados electrónicos NO van en ATS
		ventasEstablecimiento: ventasPorEstab,
		periodo: { fechaInicio, fechaFin, esSemestral },
		resumen: {
			totalCompras: comprasParaATS.length,
			totalBaseCompras: comprasParaATS.reduce((sum, c) =>
				sum + parseFloat(c.base_imponible_iva || 0) + parseFloat(c.base_imponible_0 || 0), 0
			),
			totalIVACompras: comprasParaATS.reduce((sum, c) => sum + parseFloat(c.monto_iva || 0), 0),
			totalVentas: parseFloat(ventasTotales.total || 0),
			numComprobantesVentas: ventasTotales.num_comprobantes || 0,
		},
	};
}

/**
 * Normaliza razón social para ATS (solo alfanumérico + espacios)
 * @param {string} razonSocial
 * @returns {string}
 */
function normalizarRazonSocial(razonSocial) {
	return (razonSocial || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9\s.]/g, '')
		.trim()
		.substring(0, 500);
}

/**
 * Formatea un valor a 2 decimales
 * @param {number|string} value
 * @returns {string}
 */
function formatDecimal(value) {
	return parseFloat(value || 0).toFixed(2);
}

export { formatDecimal, normalizarRazonSocial };
