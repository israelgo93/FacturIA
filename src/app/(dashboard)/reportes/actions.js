'use server';

import { createClient } from '@/lib/supabase/server';
import { consolidarDatosATS } from '@/lib/reportes/ats-consolidator';
import { construirXMLATS } from '@/lib/reportes/ats-builder';
import { construirXMLRDEP } from '@/lib/reportes/rdep-builder';
import { consolidarForm104 } from '@/lib/reportes/form104-consolidator';
import { consolidarForm103 } from '@/lib/reportes/form103-consolidator';
import { generarReporteVentas } from '@/lib/reportes/ventas-report';
import { exportarATSExcel, exportarForm104Excel, exportarForm103Excel, exportarVentasExcel } from '@/lib/reportes/excel-exporter';

async function obtenerEmpresaCompleta() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('*, establecimientos(*)')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };
	return { empresa, supabase, userId: user.id };
}

/**
 * Genera el ATS de un período
 */
export async function generarATS(anio, mes, esSemestral = false) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase, userId } = result;

	try {
		const datos = await consolidarDatosATS(supabase, empresa.id, anio, mes, esSemestral);
		const xml = construirXMLATS(datos);

		// Guardar en reportes_sri
		await supabase.from('reportes_sri').insert({
			empresa_id: empresa.id,
			user_id: userId,
			tipo_reporte: 'ATS',
			anio,
			mes,
			semestre: esSemestral ? (mes <= 6 ? 1 : 2) : null,
			periodicidad: esSemestral ? 'SEMESTRAL' : 'MENSUAL',
			estado: 'GENERADO',
			generado_por_ia: true,
			total_compras: datos.resumen?.totalBaseCompras || 0,
			total_ventas: parseFloat(datos.cabecera.totalVentas),
			num_registros_compras: datos.compras.length,
			total_registros: datos.compras.length,
		});

		return { data: { xml, resumen: datos.resumen, cabecera: datos.cabecera }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Genera el ATS en formato Excel
 */
export async function generarATSExcel(anio, mes, esSemestral = false) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await consolidarDatosATS(supabase, empresa.id, anio, mes, esSemestral);
		const buffer = exportarATSExcel(datos);
		const base64 = Buffer.from(buffer).toString('base64');
		return { data: { base64, filename: `ATS_${empresa.ruc}_${anio}_${String(mes).padStart(2, '0')}.xlsx` }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Genera el RDEP de un año
 */
export async function generarRDEP(anio) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase, userId } = result;

	try {
		const xml = await construirXMLRDEP(supabase, empresa.id, anio);

		await supabase.from('reportes_sri').insert({
			empresa_id: empresa.id,
			user_id: userId,
			tipo_reporte: 'RDEP',
			anio,
			periodicidad: 'ANUAL',
			estado: 'GENERADO',
			generado_por_ia: true,
		});

		return { data: { xml }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Consolida datos del Form 104
 */
export async function obtenerForm104(anio, mes, esSemestral = false) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await consolidarForm104(supabase, empresa.id, anio, mes, esSemestral);
		return { data: datos, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Exporta Form 104 a Excel
 */
export async function exportarForm104(anio, mes, esSemestral = false) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await consolidarForm104(supabase, empresa.id, anio, mes, esSemestral);
		const buffer = exportarForm104Excel(datos);
		const base64 = Buffer.from(buffer).toString('base64');
		return { data: { base64, filename: `Form104_${empresa.ruc}_${anio}_${String(mes).padStart(2, '0')}.xlsx` }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Consolida datos del Form 103
 */
export async function obtenerForm103(anio, mes) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await consolidarForm103(supabase, empresa.id, anio, mes);
		return { data: datos, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Exporta Form 103 a Excel
 */
export async function exportarForm103Xlsx(anio, mes) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await consolidarForm103(supabase, empresa.id, anio, mes);
		const buffer = exportarForm103Excel(datos);
		const base64 = Buffer.from(buffer).toString('base64');
		return { data: { base64, filename: `Form103_${empresa.ruc}_${anio}_${String(mes).padStart(2, '0')}.xlsx` }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Genera reporte de ventas
 */
export async function obtenerReporteVentas(anio, mes) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await generarReporteVentas(supabase, empresa.id, anio, mes);
		return { data: datos, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Exporta ventas a Excel
 */
export async function exportarVentasXlsx(anio, mes) {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	const { empresa, supabase } = result;

	try {
		const datos = await generarReporteVentas(supabase, empresa.id, anio, mes);
		const buffer = exportarVentasExcel(datos);
		const base64 = Buffer.from(buffer).toString('base64');
		return { data: { base64, filename: `Ventas_${empresa.ruc}_${anio}_${String(mes).padStart(2, '0')}.xlsx` }, success: true };
	} catch (error) {
		return { error: error.message };
	}
}

/**
 * Obtiene información de la empresa para contexto IA
 */
export async function obtenerContextoEmpresa() {
	const result = await obtenerEmpresaCompleta();
	if (result.error) return result;
	return { data: { ruc: result.empresa.ruc, razon_social: result.empresa.razon_social, regimen_fiscal: result.empresa.regimen_fiscal, obligado_contabilidad: result.empresa.obligado_contabilidad, id: result.empresa.id } };
}
