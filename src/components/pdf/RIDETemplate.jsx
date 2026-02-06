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
	tableHeader: { flexDirection: 'row', borderBottom: '1 solid #999', paddingBottom: 3, marginBottom: 3, fontWeight: 'bold', fontSize: 7 },
	tableRow: { flexDirection: 'row', paddingVertical: 2, borderBottom: '0.5 solid #eee' },
	colCod: { width: '12%' },
	colDesc: { width: '35%' },
	colCant: { width: '10%', textAlign: 'right' },
	colPrecio: { width: '15%', textAlign: 'right' },
	colDesc2: { width: '10%', textAlign: 'right' },
	colTotal: { width: '18%', textAlign: 'right' },
	totalesSection: { marginTop: 10, alignItems: 'flex-end' },
	totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 1 },
	totalLabel: { fontSize: 8 },
	totalValue: { fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
	totalFinal: { flexDirection: 'row', width: 200, justifyContent: 'space-between', paddingVertical: 3, borderTop: '1 solid #333', marginTop: 3 },
	totalFinalLabel: { fontSize: 10, fontWeight: 'bold' },
	totalFinalValue: { fontSize: 10, fontWeight: 'bold', textAlign: 'right' },
	claveAcceso: { fontSize: 7, fontFamily: 'Courier', marginTop: 3, wordBreak: 'break-all' },
	footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 6, color: '#999' },
});

export default function RIDETemplate({ comprobante }) {
	const comp = comprobante;
	const detalles = comp.detalles || [];
	const pagos = comp.pagos || [];

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
						<Text style={styles.title}>FACTURA</Text>
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

				{/* Comprador */}
				<View style={styles.section}>
					<View style={styles.row}>
						<Text style={styles.label}>Razón Social / Nombres: </Text>
						<Text style={styles.value}>{comp.razon_social_comprador || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Identificación: </Text>
						<Text style={styles.value}>{comp.identificacion_comprador || ''}</Text>
					</View>
					{comp.direccion_comprador && (
						<View style={styles.row}>
							<Text style={styles.label}>Dirección: </Text>
							<Text style={styles.value}>{comp.direccion_comprador}</Text>
						</View>
					)}
				</View>

				{/* Tabla de detalles */}
				<View style={styles.section}>
					<View style={styles.tableHeader}>
						<Text style={styles.colCod}>Cod.</Text>
						<Text style={styles.colDesc}>Descripción</Text>
						<Text style={styles.colCant}>Cant.</Text>
						<Text style={styles.colPrecio}>P. Unit.</Text>
						<Text style={styles.colDesc2}>Desc.</Text>
						<Text style={styles.colTotal}>Total</Text>
					</View>
					{detalles.map((det, i) => (
						<View key={i} style={styles.tableRow}>
							<Text style={styles.colCod}>{det.codigo_principal}</Text>
							<Text style={styles.colDesc}>{det.descripcion}</Text>
							<Text style={styles.colCant}>{Number(det.cantidad)}</Text>
							<Text style={styles.colPrecio}>{Number(det.precio_unitario).toFixed(2)}</Text>
							<Text style={styles.colDesc2}>{Number(det.descuento || 0).toFixed(2)}</Text>
							<Text style={styles.colTotal}>{Number(det.precio_total_sin_impuesto).toFixed(2)}</Text>
						</View>
					))}
				</View>

				{/* Totales */}
				<View style={styles.totalesSection}>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>SUBTOTAL SIN IMPUESTOS</Text>
						<Text style={styles.totalValue}>{Number(comp.subtotal_sin_impuestos).toFixed(2)}</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>DESCUENTO</Text>
						<Text style={styles.totalValue}>{Number(comp.total_descuento).toFixed(2)}</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>IVA</Text>
						<Text style={styles.totalValue}>{Number(comp.valor_iva).toFixed(2)}</Text>
					</View>
					<View style={styles.totalFinal}>
						<Text style={styles.totalFinalLabel}>VALOR TOTAL</Text>
						<Text style={styles.totalFinalValue}>{Number(comp.importe_total).toFixed(2)}</Text>
					</View>
				</View>

				{/* Formas de pago */}
				{pagos.length > 0 && (
					<View style={[styles.section, { marginTop: 10 }]}>
						<Text style={styles.sectionTitle}>Forma de Pago</Text>
						{pagos.map((pago, i) => (
							<View key={i} style={styles.row}>
								<Text style={styles.value}>{pago.forma_pago} - ${Number(pago.total).toFixed(2)}</Text>
							</View>
						))}
					</View>
				)}

				{/* Footer */}
				<Text style={styles.footer}>
					Documento generado por facturIA — facturia.app
				</Text>
			</Page>
		</Document>
	);
}
