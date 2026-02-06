/**
 * Motor de análisis tributario con IA
 * Detecta anomalías, calcula vencimientos y genera proyecciones
 */
import { generateWithFallback } from './gemini-client';
import { getAnalisisSystemPrompt } from './reportes-prompts';
import { infoVencimiento } from '@/lib/utils/vencimientos';

/**
 * Ejecuta análisis tributario completo de un período
 * @param {Object} supabase
 * @param {Object} empresa
 * @param {Object} datosConsolidados - Datos del período (form104, form103, ventas)
 * @returns {Object} Resultado del análisis
 */
export async function analizarPeriodo(empresa, datosConsolidados) {
	const alertas = [];
	const { form104, form103, ventasReport } = datosConsolidados;

	// 1. Vencimientos
	if (empresa?.ruc && form104?.periodo) {
		const venc = infoVencimiento(empresa.ruc, form104.periodo.anio, form104.periodo.mes);
		if (venc.estado === 'vencido') {
			alertas.push({
				tipo: 'vencimiento',
				severidad: 'error',
				titulo: 'Declaración vencida',
				mensaje: `La declaración del período ${form104.periodo.mes}/${form104.periodo.anio} venció el ${venc.fecha} (hace ${Math.abs(venc.dias)} días).`,
			});
		} else if (venc.estado === 'urgente') {
			alertas.push({
				tipo: 'vencimiento',
				severidad: 'warning',
				titulo: 'Declaración próxima a vencer',
				mensaje: `Quedan ${venc.dias} días para declarar (vence ${venc.fecha}).`,
			});
		} else if (venc.estado === 'proximo') {
			alertas.push({
				tipo: 'vencimiento',
				severidad: 'info',
				titulo: 'Recordatorio de declaración',
				mensaje: `La declaración vence en ${venc.dias} días (${venc.fecha}).`,
			});
		}
	}

	// 2. Consistencia IVA
	if (form104) {
		if (form104.casillero_601 > 0 && form104.casillero_605 < 0) {
			alertas.push({
				tipo: 'consistencia',
				severidad: 'warning',
				titulo: 'IVA cobrado negativo después de NC',
				mensaje: `Las notas de crédito ($${form104.casillero_602?.toFixed(2)}) superan el IVA cobrado ($${form104.casillero_601?.toFixed(2)}).`,
			});
		}
	}

	// 3. Retenciones faltantes
	if (form103 && ventasReport) {
		if (form103.totalRetencionesRenta === 0 && ventasReport.resumen?.ventasNetas > 0) {
			alertas.push({
				tipo: 'retenciones',
				severidad: 'info',
				titulo: 'Sin retenciones emitidas',
				mensaje: 'No se registran retenciones en este período. Verifica si aplica emitir retenciones por compras realizadas.',
			});
		}
	}

	// 4. Bancarización
	if (datosConsolidados.comprasGrandes) {
		for (const compra of datosConsolidados.comprasGrandes) {
			if (!compra.forma_pago) {
				alertas.push({
					tipo: 'bancarizacion',
					severidad: 'warning',
					titulo: 'Compra sin forma de pago',
					mensaje: `Compra a ${compra.razon_social_proveedor} por $${(parseFloat(compra.base_imponible_iva || 0) + parseFloat(compra.monto_iva || 0)).toFixed(2)} supera $500 y no tiene forma de pago registrada (bancarización obligatoria).`,
				});
			}
		}
	}

	return {
		alertas,
		resumen: {
			totalAlertas: alertas.length,
			errores: alertas.filter((a) => a.severidad === 'error').length,
			advertencias: alertas.filter((a) => a.severidad === 'warning').length,
			informativos: alertas.filter((a) => a.severidad === 'info').length,
		},
	};
}

/**
 * Genera análisis IA avanzado con Gemini
 * @param {Object} empresa
 * @param {Object} datos - Datos consolidados
 * @returns {string} Análisis en texto
 */
export async function generarAnalisisIA(empresa, datos) {
	const prompt = `Analiza los siguientes datos tributarios y genera un resumen ejecutivo con recomendaciones:

Período: ${datos.periodo?.mes || 'N/A'}/${datos.periodo?.anio || 'N/A'}
Ventas totales: $${datos.totalVentas || '0.00'}
Compras registradas: ${datos.totalCompras || 0}
IVA cobrado: $${datos.ivaCobrado || '0.00'}
IVA pagado: $${datos.ivaPagado || '0.00'}
Retenciones emitidas: $${datos.totalRetenciones || '0.00'}
Comprobantes autorizados: ${datos.totalComprobantes || 0}

Incluye:
1. Resumen de la situación fiscal
2. Anomalías detectadas (si hay)
3. Sugerencias de optimización
4. Estimación de impuesto a pagar`;

	try {
		const response = await generateWithFallback({
			contents: prompt,
			config: {
				systemInstruction: getAnalisisSystemPrompt(empresa),
			},
		});
		return response.text;
	} catch (error) {
		console.error('Error en análisis IA:', error);
		return 'No se pudo generar el análisis IA en este momento. Los datos del período están disponibles para revisión manual.';
	}
}
