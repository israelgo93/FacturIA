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
	colCod: { width: '15%' },
	colDesc: { width: '60%' },
	colCant: { width: '25%', textAlign: 'right' },
	claveAcceso: { fontSize: 7, fontFamily: 'Courier', marginTop: 3, wordBreak: 'break-all' },
	infoBox: { backgroundColor: '#e7f3ff', padding: 5, marginBottom: 10, borderRadius: 2 },
	transporteBox: { backgroundColor: '#f0f0f0', padding: 5, marginBottom: 10, borderRadius: 2 },
	destinatarioBox: { backgroundColor: '#fff', padding: 8, marginBottom: 8, border: '1 solid #ddd', borderRadius: 2 },
	footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 6, color: '#999' },
});

export default function RIDEGuiaRemision({ comprobante }) {
	const comp = comprobante;
	const destinatarios = comp.destinatarios || [];

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
					</View>
					<View style={styles.headerRight}>
						<Text style={styles.title}>GUÍA DE REMISIÓN</Text>
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

				{/* Datos de Transporte */}
				<View style={styles.transporteBox}>
					<Text style={styles.sectionTitle}>DATOS DEL TRANSPORTE</Text>
					<View style={styles.row}>
						<Text style={styles.label}>Dirección Partida: </Text>
						<Text style={styles.value}>{comp.dir_partida || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Transportista: </Text>
						<Text style={styles.value}>{comp.razon_social_transportista || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>RUC Transportista: </Text>
						<Text style={styles.value}>{comp.ruc_transportista || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Placa: </Text>
						<Text style={styles.value}>{comp.placa || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Fecha Inicio: </Text>
						<Text style={styles.value}>{comp.fecha_inicio_transporte || ''}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Fecha Fin: </Text>
						<Text style={styles.value}>{comp.fecha_fin_transporte || ''}</Text>
					</View>
				</View>

				{/* Destinatarios */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>DESTINATARIOS</Text>
					{destinatarios.map((dest, di) => (
						<View key={di} style={styles.destinatarioBox}>
							<View style={styles.row}>
								<Text style={styles.label}>Destinatario: </Text>
								<Text style={styles.value}>{dest.razon_social_destinatario || dest.razon_social || ''}</Text>
							</View>
							<View style={styles.row}>
								<Text style={styles.label}>Identificación: </Text>
								<Text style={styles.value}>{dest.identificacion_destinatario || dest.identificacion || ''}</Text>
							</View>
							<View style={styles.row}>
								<Text style={styles.label}>Dirección: </Text>
								<Text style={styles.value}>{dest.direccion_destinatario || dest.dir_destinatario || ''}</Text>
							</View>
							<View style={styles.row}>
								<Text style={styles.label}>Motivo Traslado: </Text>
								<Text style={styles.value}>{dest.motivo_traslado || ''}</Text>
							</View>

							{/* Items del destinatario */}
							{dest.detalles && dest.detalles.length > 0 && (
								<View style={{ marginTop: 5 }}>
									<View style={styles.tableHeader}>
										<Text style={styles.colCod}>Código</Text>
										<Text style={styles.colDesc}>Descripción</Text>
										<Text style={styles.colCant}>Cantidad</Text>
									</View>
									{dest.detalles.map((det, i) => (
										<View key={i} style={styles.tableRow}>
											<Text style={styles.colCod}>{det.codigo_interno || det.codigo_principal || ''}</Text>
											<Text style={styles.colDesc}>{det.descripcion || ''}</Text>
											<Text style={styles.colCant}>{Number(det.cantidad || 0)}</Text>
										</View>
									))}
								</View>
							)}
						</View>
					))}
				</View>

				{/* Footer */}
				<Text style={styles.footer}>
					Documento generado por facturIA — facturia.app
				</Text>
			</Page>
		</Document>
	);
}
