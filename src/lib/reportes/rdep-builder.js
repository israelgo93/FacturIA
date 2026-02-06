/**
 * Constructor XML del RDEP compatible con esquema RDEP.xsd del SRI
 * Genera el XML de la Relación de Dependencia anual
 */

/**
 * Construye el XML del RDEP
 * @param {Object} supabase - Cliente Supabase
 * @param {string} empresaId - UUID empresa
 * @param {number} anio - Año fiscal
 * @returns {string} XML del RDEP
 */
export async function construirXMLRDEP(supabase, empresaId, anio) {
	// Obtener empresa
	const { data: empresa } = await supabase
		.from('empresas')
		.select('ruc, razon_social')
		.eq('id', empresaId)
		.single();

	if (!empresa) throw new Error('Empresa no encontrada');

	// Obtener empleados con sus ingresos del año
	const { data: empleados } = await supabase
		.from('empleados')
		.select('*, empleados_ingresos_anuales(*)')
		.eq('empresa_id', empresaId)
		.eq('activo', true);

	let xml = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
	xml += '<rdep>\n';
	xml += `  <anioFiscal>${anio}</anioFiscal>\n`;
	xml += `  <rucAgente>${empresa.ruc}</rucAgente>\n`;

	for (const emp of (empleados || [])) {
		const ingresos = (emp.empleados_ingresos_anuales || [])
			.find((i) => i.anio === anio);

		if (!ingresos) continue;

		xml += '  <empleado>\n';
		xml += `    <tipoIdentificacion>${emp.tipo_identificacion}</tipoIdentificacion>\n`;
		xml += `    <identificacion>${emp.identificacion}</identificacion>\n`;
		xml += `    <apellidos>${escapeXml(emp.apellidos.toUpperCase())}</apellidos>\n`;
		xml += `    <nombres>${escapeXml(emp.nombres.toUpperCase())}</nombres>\n`;
		xml += `    <esSistemaSalarioNeto>${ingresos.sistema_salario_neto ? 'SI' : 'NO'}</esSistemaSalarioNeto>\n`;

		// Período de trabajo (un solo registro anual simplificado)
		xml += '    <periodoTrabajo>\n';
		xml += '      <mes>01</mes>\n';
		xml += `      <sueldoSalario>${formatDecimal(ingresos.sueldo_salario)}</sueldoSalario>\n`;
		xml += `      <sobresueldoComisionesBonosOtros>${formatDecimal(ingresos.sobresueldos)}</sobresueldoComisionesBonosOtros>\n`;
		xml += `      <participacionUtilidades>${formatDecimal(ingresos.participacion_utilidades)}</participacionUtilidades>\n`;
		xml += `      <ingresosGravados>${formatDecimal(ingresos.ingresos_gravados)}</ingresosGravados>\n`;
		xml += `      <decimoTercero>${formatDecimal(ingresos.decimo_tercero)}</decimoTercero>\n`;
		xml += `      <decimoCuarto>${formatDecimal(ingresos.decimo_cuarto)}</decimoCuarto>\n`;
		xml += `      <fondoReserva>${formatDecimal(ingresos.fondos_reserva)}</fondoReserva>\n`;
		xml += `      <otrosIngresosEnRelDependencia>${formatDecimal(ingresos.otros_ingresos_gravados)}</otrosIngresosEnRelDependencia>\n`;
		xml += `      <ingresosGravadosConEsteEmpleador>${formatDecimal(ingresos.ingresos_gravados_empleador)}</ingresosGravadosConEsteEmpleador>\n`;
		xml += `      <aporteIESSConEsteEmpleador>${formatDecimal(ingresos.aporte_iess_personal)}</aporteIESSConEsteEmpleador>\n`;
		xml += `      <impuestoRentaCausado>${formatDecimal(ingresos.impuesto_renta_causado)}</impuestoRentaCausado>\n`;
		xml += `      <valorRetenidoMensual>${formatDecimal(ingresos.valor_retenido)}</valorRetenidoMensual>\n`;
		xml += '    </periodoTrabajo>\n';

		// Gastos personales
		xml += '    <gastosPersonales>\n';
		xml += `      <vivienda>${formatDecimal(ingresos.gastos_vivienda)}</vivienda>\n`;
		xml += `      <salud>${formatDecimal(ingresos.gastos_salud)}</salud>\n`;
		xml += `      <educacion>${formatDecimal(ingresos.gastos_educacion)}</educacion>\n`;
		xml += `      <alimentacion>${formatDecimal(ingresos.gastos_alimentacion)}</alimentacion>\n`;
		xml += `      <vestimenta>${formatDecimal(ingresos.gastos_vestimenta)}</vestimenta>\n`;
		xml += `      <turismo>${formatDecimal(ingresos.gastos_turismo)}</turismo>\n`;
		xml += '    </gastosPersonales>\n';

		xml += '  </empleado>\n';
	}

	xml += '</rdep>';
	return xml;
}

function formatDecimal(value) {
	return parseFloat(value || 0).toFixed(2);
}

function escapeXml(str) {
	return (str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
