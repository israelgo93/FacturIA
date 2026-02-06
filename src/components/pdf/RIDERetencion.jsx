import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
	page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica' },
	header: { flexDirection: 'row', marginBottom: 15, borderBottom: '1 solid #333', paddingBottom: 10 },
	headerLeft: { flex: 1 },
	headerRight: { flex: 1, paddingLeft: 15, borderLeft: '1 solid #333' },
	title: { fontSize: 10, fontWeight: 'bold', marginBottom: 3 },
	subtitle: { fontSize: 7, color: '#666', marginBottom: 2 },
	label: { fontSize: 7, color: '#666', fontWeight: 'bold' },
	value: { fontSize: 8, marginBottom: 2 },
	row: { flexDirection: 'row', marginBottom: 2 },
	section: { marginBottom: 10 },
	sectionTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 5, backgroundColor: '#f0f0f0', padding: 3 },
	tableHeader: { flexDirection: 'row', borderBottom: '1 solid #999', paddingBottom: 3, marginBottom: 3, fontWeight: 'bold', fontSize: 6 },
	tableRow: { flexDirection: 'row', paddingVertical: 2, borderBottom: '0.5 solid #eee' },
	colImp: { width: '12%' },
	colCod: { width: '10%' },
	colBase: { width: '22%', textAlign: 'right' },
	colPorc: { width: '15%', textAlign: 'right' },
	colRet: { width: '20%', textAlign: 'right' },
	colDoc: { width: '21%' },
	totalesSection: { marginTop: 10, alignItems: 'flex-end' },
	totalFinal: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3, borderTop: '1 solid #333', marginTop: 3 },
	totalFinalLabel: { fontSize: 10, fontWeight: 'bold' },
	totalFinalValue: { fontSize: 10, fontWeight: 'bold', textAlign: 'right' },
	claveAcceso: { fontSize: 7, fontFamily: 'Courier', marginTop: 3, wordBreak: 'break-all' },
	infoBox: { backgroundColor: '#e7f3ff', padding: 5, marginBottom: 10, borderRadius: 2 },
	footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 6, color: '#999' },
});

const TIPO_IMPUESTO = { '1': 'RENTA', '2': 'IVA', '6': 'ISD' };

export default function RIDERetencion({ comprobante }) {
	const comp = comprobante;
	const detalles = comp.retencion_detalles || [];

	// Calcular total retenido
	const totalRetenido = detalles.reduce((sum, d) => sum + Number(d.valor_retenido || 0), 0);

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.headerLeft}>
						<Text style={styles.title}>{comp.empresa?.razon_social || ''}</Text>
						{comp.empresa?.nombre_comercial && (
							<Text style={styles.subtitle}>{comp.empresa.nombre_comercial}</Text>
						)}
						<Text style={styles.value}>RUC: {comp.empresa?.ruc || ''}</Text>
						<Text style={styles.subtitle}>Dir. Matriz: {comp.empresa?.direccion_matriz || ''}</Text>
						{comp.establecimiento?.direccion && (
							<Text style={styles.subtitle}>Dir. Sucursal: {comp.establecimiento.direccion}</Text>
						)}
					</View>
					<View style={styles.headerRight}>
						<Text style={styles.title}>COMPROBANTE DE RETENCIÓN</Text>
						<Text style={styles.value}>No. {comp.numero_completo || ''}</Text>
						<View style={styles.row}>
							<Text style={styles.label}>NÚMERO DE AUTORIZACIÓN</Text>
						</View>
						<Text style={styles.claveAcceso}>{comp.numero_autorizacion || comp.clave_acceso || ''}</Text>
						<View style={[styles.row, { marginTop: 5 }]}>
							<Text style={styles.label}>FECHA: </Text>
							<Text style={styles.value}>{comp.fecha_emision}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>AMBIENTE: </Text>
							<Text style={styles.value}>{comp.ambiente === 1 || comp.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>CLAVE DE ACCESO</Text>
						</View>
						<Text style={styles.claveAcceso}>{comp.clave_acceso || ''}</Text>
					</View>
				</View>

				{/* Sujeto Retenido */}
				<View style={styles.section}>
					<View style={styles.row}>
						<Text style={styles.label}>Razón Social / Nombres: </Text>
						<Text style={styles.value}>{comp.razon_social_comprador || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Identificación: </Text>
						<Text style={styles.value}>{comp.identificacion_comprador || ''}</Text>
					</View>
				</View>

				{/* Periodo Fiscal */}
				<View style={styles.infoBox}>
					<View style={styles.row}>
						<Text style={styles.label}>PERÍODO FISCAL: </Text>
						<Text style={styles.value}>{comp.periodo_fiscal || ''}</Text>
					</View>
				</View>

				{/* Documento Sustento */}
				{comp.doc_sustento_numero && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>DOCUMENTO SUSTENTO</Text>
						<View style={styles.row}>
							<Text style={styles.label}>Tipo: </Text>
							<Text style={styles.value}>{comp.doc_sustento_tipo === '01' ? 'FACTURA' : comp.doc_sustento_tipo}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Número: </Text>
							<Text style={styles.value}>{comp.doc_sustento_numero}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Fecha: </Text>
							<Text style={styles.value}>{comp.doc_sustento_fecha || ''}</Text>
						</View>
					</View>
				)}

				{/* Tabla de retenciones */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>RETENCIONES</Text>
					<View style={styles.tableHeader}>
						<Text style={styles.colImp}>Impuesto</Text>
						<Text style={styles.colCod}>Código</Text>
						<Text style={styles.colBase}>Base Imponible</Text>
						<Text style={styles.colPorc}>% Ret.</Text>
						<Text style={styles.colRet}>Valor Retenido</Text>
					</View>
					{detalles.map((det, i) => (
						<View key={i} style={styles.tableRow}>
							<Text style={styles.colImp}>{TIPO_IMPUESTO[det.tipo_impuesto] || det.tipo_impuesto}</Text>
							<Text style={styles.colCod}>{det.codigo_retencion}</Text>
							<Text style={styles.colBase}>{Number(det.base_imponible || 0).toFixed(2)}</Text>
							<Text style={styles.colPorc}>{Number(det.porcentaje_retener || 0).toFixed(2)}%</Text>
							<Text style={styles.colRet}>{Number(det.valor_retenido || 0).toFixed(2)}</Text>
						</View>
					))}
				</View>

				{/* Total Retenido */}
				<View style={styles.totalesSection}>
					<View style={styles.totalFinal}>
						<Text style={styles.totalFinalLabel}>TOTAL RETENIDO</Text>
						<Text style={styles.totalFinalValue}>{totalRetenido.toFixed(2)}</Text>
					</View>
				</View>

				{/* Footer */}
				<Text style={styles.footer}>
					Documento generado por facturIA — facturia.app
				</Text>
			</Page>
		</Document>
	);
}
