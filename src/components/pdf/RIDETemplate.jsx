/**
 * RIDE — Representacion Impresa de Documento Electronico (Factura)
 * Formato conforme a la Ficha Tecnica SRI Offline v2.32
 * Tablas con bordes completos en celdas, codigo de barras, info adicional y pagos.
 */
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { FORMAS_PAGO, TARIFAS_IVA } from '@/lib/utils/sri-catalogs';

/* ─── Helpers ─── */

function fmt(val, decimals = 2) {
	return Number(val || 0).toFixed(decimals);
}

function fmtDate(date) {
	if (!date) return '';
	if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
		const [y, m, d] = date.substring(0, 10).split('-');
		return `${d}/${m}/${y}`;
	}
	const d = new Date(date);
	return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function fmtDateTime(date) {
	if (!date) return '';
	const d = new Date(date);
	const dd = String(d.getUTCDate()).padStart(2, '0');
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	const yyyy = d.getUTCFullYear();
	const hh = String(d.getUTCHours()).padStart(2, '0');
	const mi = String(d.getUTCMinutes()).padStart(2, '0');
	const ss = String(d.getUTCSeconds()).padStart(2, '0');
	return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function getFormaPagoLabel(codigo) {
	const fp = FORMAS_PAGO.find((f) => f.value === codigo);
	return fp ? fp.label.toUpperCase() : codigo;
}

function getIVARate(detalles) {
	for (const det of detalles || []) {
		const impuestos = Array.isArray(det.impuestos) ? det.impuestos : [];
		for (const imp of impuestos) {
			if (String(imp.codigo) === '2' && Number(imp.tarifa) > 0) {
				return Number(imp.tarifa);
			}
		}
	}
	const tarifa15 = TARIFAS_IVA.find((t) => t.value === '4');
	return tarifa15 ? tarifa15.tarifa : 15;
}

/* ─── Constantes de borde ─── */

const B = '1 solid #000';
const BT = '0.5 solid #000';

/* ─── Estilos ─── */

const s = StyleSheet.create({
	page: { padding: 20, fontSize: 7, fontFamily: 'Helvetica' },

	/* Cabecera */
	header: { flexDirection: 'row', marginBottom: 8 },
	hLeft: { width: '44%', border: B, padding: 8, marginRight: 4, justifyContent: 'center' },
	hRight: { width: '56%', border: B, padding: 8 },
	noLogo: { fontSize: 14, fontWeight: 'bold', color: '#cc0000', marginBottom: 6, textAlign: 'center' },
	logo: { width: 120, height: 60, marginBottom: 6, objectFit: 'contain' },
	companyName: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
	companyLine: { fontSize: 7, marginBottom: 2 },
	rucLine: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
	docType: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
	docNum: { fontSize: 8, fontWeight: 'bold', marginBottom: 6 },
	labelBold: { fontSize: 7, fontWeight: 'bold' },
	authNum: { fontSize: 6.5, fontFamily: 'Courier', marginBottom: 4 },
	hInfoRow: { flexDirection: 'row', marginBottom: 2 },
	hInfoLabel: { fontSize: 7, fontWeight: 'bold', width: 105 },
	hInfoVal: { fontSize: 7, flex: 1 },
	barcode: { width: '100%', height: 35, marginTop: 4, objectFit: 'contain' },
	barcodeText: { fontSize: 5.5, fontFamily: 'Courier', textAlign: 'center', marginTop: 1 },

	/* Comprador */
	buyer: { border: B, marginBottom: 8 },
	buyerRow: { flexDirection: 'row', borderBottom: BT },
	buyerLabel: { fontSize: 7, fontWeight: 'bold', padding: 3 },
	buyerVal: { fontSize: 7, padding: 3, flex: 1 },
	buyerCellBorder: { borderRight: BT },

	/* Tabla detalles — celdas con bordes */
	table: { marginBottom: 8 },
	tRow: { flexDirection: 'row' },
	cell: { borderBottom: BT, borderRight: BT, borderLeft: BT, paddingVertical: 2, paddingHorizontal: 2 },
	cellFirst: { borderLeft: B },
	cellLast: { borderRight: B },
	cellHead: { backgroundColor: '#f0f0f0', borderBottom: B, borderTop: B },
	thText: { fontSize: 6, fontWeight: 'bold', textAlign: 'center' },
	tdText: { fontSize: 6.5 },
	tdRight: { fontSize: 6.5, textAlign: 'right' },
	tdCenter: { fontSize: 6.5, textAlign: 'center' },

	/* Anchos de columna detalle */
	wCodP: { width: '8%' },
	wCodA: { width: '10%' },
	wCant: { width: '7%' },
	wDesc: { width: '35%' },
	wPU: { width: '11%' },
	wDto: { width: '9%' },
	wPT: { width: '10%' },

	/* Bottom */
	bottom: { flexDirection: 'row' },
	bottomLeft: { width: '55%', marginRight: 4 },
	bottomRight: { width: '45%' },

	/* Info adicional (tabla con bordes) */
	iaTable: { marginBottom: 6 },
	iaTitle: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f0f0', border: B, paddingVertical: 3 },
	iaRow: { flexDirection: 'row' },
	iaLabel: { width: '28%', fontSize: 6.5, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 4, borderBottom: BT, borderLeft: B, borderRight: BT },
	iaVal: { width: '72%', fontSize: 6.5, paddingVertical: 2, paddingHorizontal: 4, borderBottom: BT, borderRight: B },

	/* Formas de pago (tabla con bordes) */
	payTable: { marginBottom: 6 },

	/* Totales (tabla con bordes) */
	totTable: {},
	totRow: { flexDirection: 'row' },
	totLabel: { flex: 1, fontSize: 7, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 4, borderBottom: BT, borderLeft: B, borderRight: BT },
	totVal: { width: 55, fontSize: 7, textAlign: 'right', paddingVertical: 2, paddingHorizontal: 4, borderBottom: BT, borderRight: B },
	totRowFinal: { flexDirection: 'row', backgroundColor: '#f0f0f0' },
	totLabelFinal: { flex: 1, fontSize: 8, fontWeight: 'bold', paddingVertical: 3, paddingHorizontal: 4, borderBottom: B, borderLeft: B, borderRight: BT, borderTop: B },
	totValFinal: { width: 55, fontSize: 8, fontWeight: 'bold', textAlign: 'right', paddingVertical: 3, paddingHorizontal: 4, borderBottom: B, borderRight: B, borderTop: B },

	/* Footer */
	footer: { position: 'absolute', bottom: 12, left: 20, right: 20, textAlign: 'center', fontSize: 5.5, color: '#999' },
});

/* ─── Componente principal ─── */

export default function RIDETemplate({ comprobante, barcodeDataUri }) {
	const comp = comprobante;
	const emp = comp.empresa || {};
	const est = comp.establecimiento || {};
	const detalles = comp.detalles || [];
	const pagos = comp.pagos || [];
	const ivaRate = getIVARate(detalles);

	const infoAdicItems = buildInfoAdicItems(comp);

	return (
		<Document>
			<Page size="A4" style={s.page}>

				{/* ═══ CABECERA ═══ */}
				<View style={s.header}>
					<View style={s.hLeft}>
						{emp.logo_url ? (
							<Image src={emp.logo_url} style={s.logo} />
						) : (
							<Text style={s.noLogo}>NO TIENE LOGO</Text>
						)}
						<Text style={s.companyName}>{emp.razon_social || ''}</Text>
						{emp.nombre_comercial && <Text style={s.companyLine}>{emp.nombre_comercial}</Text>}
						<Text style={{ fontSize: 7, fontWeight: 'bold', marginTop: 2 }}>
							RUC: {emp.ruc || ''}
						</Text>
						<View style={{ marginTop: 4 }}>
							<Text style={{ fontSize: 6.5, marginBottom: 2 }}>
								Direccion Matriz: {emp.direccion_matriz || ''}
							</Text>
							{est.direccion && (
								<Text style={{ fontSize: 6.5, marginBottom: 2 }}>
									Dir Sucursal: {est.direccion}
								</Text>
							)}
						</View>
						<Text style={{ fontSize: 7, fontWeight: 'bold', marginTop: 4 }}>
							OBLIGADO A LLEVAR CONTABILIDAD: {emp.obligado_contabilidad ? 'SI' : 'NO'}
						</Text>
						{emp.contribuyente_especial && (
							<Text style={{ fontSize: 7, fontWeight: 'bold', marginTop: 2 }}>
								Contribuyente Especial Nro: {emp.contribuyente_especial}
							</Text>
						)}
					</View>

					<View style={s.hRight}>
						<Text style={s.docType}>FACTURA</Text>
						<Text style={s.docNum}>No.  {comp.numero_completo || ''}</Text>
						<View style={s.hInfoRow}>
							<Text style={s.hInfoLabel}>AMBIENTE:</Text>
							<Text style={s.hInfoVal}>{String(comp.ambiente) === '1' ? 'PRUEBAS' : 'PRODUCCION'}</Text>
						</View>
						<View style={s.hInfoRow}>
							<Text style={s.hInfoLabel}>EMISION:</Text>
							<Text style={s.hInfoVal}>NORMAL</Text>
						</View>
						{comp.fecha_autorizacion && (
							<View style={s.hInfoRow}>
								<Text style={s.hInfoLabel}>FECHA DE AUTORIZACION:</Text>
								<Text style={s.hInfoVal}>{fmtDateTime(comp.fecha_autorizacion)}</Text>
							</View>
						)}
						<View style={{ marginTop: 6 }}>
							<Text style={s.labelBold}>CLAVE DE ACCESO / N° DE AUTORIZACION</Text>
							{barcodeDataUri && <Image src={barcodeDataUri} style={s.barcode} />}
							<Text style={s.barcodeText}>{comp.clave_acceso || comp.numero_autorizacion || ''}</Text>
						</View>
					</View>
				</View>

				{/* ═══ DATOS DEL COMPRADOR ═══ */}
				<View style={s.buyer}>
					<View style={s.buyerRow}>
						<View style={[s.buyerCellBorder, { flex: 3, flexDirection: 'row' }]}>
							<Text style={s.buyerLabel}>Razon Social / Nombres y Apellidos:</Text>
							<Text style={s.buyerVal}>{comp.razon_social_comprador || ''}</Text>
						</View>
						<View style={{ flex: 2, flexDirection: 'row' }}>
							<Text style={s.buyerLabel}>Fecha Emision:</Text>
							<Text style={s.buyerVal}>{fmtDate(comp.fecha_emision)}</Text>
						</View>
					</View>
					<View style={[s.buyerRow, { borderBottom: 0 }]}>
						<View style={[s.buyerCellBorder, { flex: 3, flexDirection: 'row' }]}>
							<Text style={s.buyerLabel}>RUC / CI:</Text>
							<Text style={s.buyerVal}>{comp.identificacion_comprador || ''}</Text>
						</View>
						{comp.direccion_comprador ? (
							<View style={{ flex: 2, flexDirection: 'row' }}>
								<Text style={s.buyerLabel}>Direccion:</Text>
								<Text style={s.buyerVal}>{comp.direccion_comprador}</Text>
							</View>
						) : (
							<View style={{ flex: 2 }} />
						)}
					</View>
				</View>

				{/* ═══ TABLA DE DETALLES (celdas con bordes) ═══ */}
				<View style={s.table}>
					{/* Header */}
					<View style={s.tRow}>
						<Cell w="8%" head first>Cod.{'\n'}Principal</Cell>
						<Cell w="10%" head>Cod.{'\n'}Auxiliar</Cell>
						<Cell w="7%" head>Cant.</Cell>
						<Cell w="35%" head>Descripcion</Cell>
						<Cell w="11%" head>Precio{'\n'}Unit.</Cell>
						<Cell w="9%" head>Desc.</Cell>
						<Cell w="10%" head last>Precio{'\n'}Total</Cell>
					</View>
					{/* Filas */}
					{detalles.map((det, i) => (
						<View key={i} style={s.tRow}>
							<Cell w="8%" first>{det.codigo_principal || ''}</Cell>
							<Cell w="10%" center>{det.codigo_auxiliar || ''}</Cell>
							<Cell w="7%" right>{fmt(det.cantidad)}</Cell>
							<Cell w="35%">{det.descripcion}</Cell>
							<Cell w="11%" right>{fmt(det.precio_unitario)}</Cell>
							<Cell w="9%" right>{fmt(det.descuento)}</Cell>
							<Cell w="10%" right last>{fmt(det.precio_total_sin_impuesto)}</Cell>
						</View>
					))}
				</View>

				{/* ═══ SECCION INFERIOR ═══ */}
				<View style={s.bottom}>
					{/* --- Izquierda: Info adicional + Pagos --- */}
					<View style={s.bottomLeft}>
						{/* Info adicional */}
						{infoAdicItems.length > 0 && (
							<View style={s.iaTable}>
								<Text style={s.iaTitle}>Informacion Adicional</Text>
								{infoAdicItems.map((item, i) => (
									<View key={i} style={s.iaRow}>
										<Text style={s.iaLabel}>{item.nombre}</Text>
										<Text style={s.iaVal}>{item.valor}</Text>
									</View>
								))}
							</View>
						)}

						{/* Formas de pago */}
						{pagos.length > 0 && (
							<View style={s.payTable}>
								{/* Header */}
								<View style={s.tRow}>
									<Cell w="52%" head first>Forma de pago</Cell>
									<Cell w="20%" head>Valor</Cell>
									<Cell w="14%" head>Plazo</Cell>
									<Cell w="14%" head last>Tiempo</Cell>
								</View>
								{pagos.map((pago, i) => (
									<View key={i} style={s.tRow}>
										<Cell w="52%" first>{getFormaPagoLabel(pago.forma_pago)}</Cell>
										<Cell w="20%" right>{fmt(pago.total)}</Cell>
										<Cell w="14%" center>{pago.plazo || '-'}</Cell>
										<Cell w="14%" center last>{pago.unidad_tiempo || '-'}</Cell>
									</View>
								))}
							</View>
						)}
					</View>

					{/* --- Derecha: Totales --- */}
					<View style={s.bottomRight}>
						<View style={s.totTable}>
							<TotRow label={`SUBTOTAL IVA`} value={comp.subtotal_iva} />
							<TotRow label="SUBTOTAL 0%" value={comp.subtotal_iva_0} />
							<TotRow label="SUBTOTAL NO OBJETO IVA" value={comp.subtotal_no_objeto} />
							<TotRow label="SUBTOTAL EXENTO IVA" value={comp.subtotal_exento} />
							<TotRow label="SUBTOTAL SIN IMPUESTOS" value={comp.subtotal_sin_impuestos} />
							<TotRow label="TOTAL DESCUENTO" value={comp.total_descuento} />
							<TotRow label="ICE" value={comp.valor_ice} />
							<TotRow label={`IVA ${ivaRate}%`} value={comp.valor_iva} />
							<TotRow label="IRBPNR" value={comp.valor_irbpnr} />
							<TotRow label="PROPINA" value={comp.propina} />
							<View style={s.totRowFinal}>
								<Text style={s.totLabelFinal}>VALOR TOTAL</Text>
								<Text style={s.totValFinal}>{fmt(comp.importe_total)}</Text>
							</View>
						</View>
					</View>
				</View>

				<Text style={s.footer}>Documento generado por facturIA</Text>
			</Page>
		</Document>
	);
}

/* ─── Componente celda con bordes ─── */

function Cell({ children, w, head, first, last, right, center }) {
	const cellStyle = [
		s.cell,
		{ width: w },
		first && s.cellFirst,
		last && s.cellLast,
		head && s.cellHead,
	].filter(Boolean);

	let textStyle = s.tdText;
	if (head) textStyle = s.thText;
	else if (right) textStyle = s.tdRight;
	else if (center) textStyle = s.tdCenter;

	return (
		<View style={cellStyle}>
			<Text style={textStyle}>{children}</Text>
		</View>
	);
}

/* ─── Fila de totales con bordes ─── */

function TotRow({ label, value }) {
	return (
		<View style={s.totRow}>
			<Text style={s.totLabel}>{label}</Text>
			<Text style={s.totVal}>{fmt(value)}</Text>
		</View>
	);
}

/* ─── Construir items de info adicional incluyendo datos del comprador ─── */

function buildInfoAdicItems(comp) {
	const items = [];

	if (comp.email_comprador) {
		items.push({ nombre: 'Correo', valor: comp.email_comprador });
	}
	if (comp.telefono_comprador) {
		items.push({ nombre: 'Telefono', valor: comp.telefono_comprador });
	}
	if (comp.direccion_comprador) {
		items.push({ nombre: 'Direccion', valor: comp.direccion_comprador });
	}

	const raw = comp.info_adicional;
	if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
		for (const [k, v] of Object.entries(raw)) {
			if (v !== null && v !== undefined && v !== '') {
				items.push({ nombre: k.charAt(0).toUpperCase() + k.slice(1), valor: String(v) });
			}
		}
	} else if (Array.isArray(raw)) {
		for (const item of raw) {
			if (item.nombre && item.valor) {
				items.push(item);
			}
		}
	}

	const emp = comp.empresa || {};
	if (emp.contribuyente_especial) {
		items.push({ nombre: 'Contribuyente Especial', valor: `Nro. ${emp.contribuyente_especial}` });
	}

	return items;
}
