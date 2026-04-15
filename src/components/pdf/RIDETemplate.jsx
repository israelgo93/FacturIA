/**
 * RIDE — Representación Impresa de Documento Electrónico (Factura)
 * Formato conforme a la Ficha Técnica SRI Offline v2.32
 * Incluye: cabecera con logo/RUC, datos comprador, detalle,
 * desglose de impuestos, info adicional, formas de pago y código de barras.
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
	return fp ? `${codigo} - ${fp.label.toUpperCase()}` : codigo;
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

function parseDetallesAdicionales(raw) {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === 'object') {
		return Object.entries(raw).map(([nombre, valor]) => ({ nombre, valor }));
	}
	return [];
}

/* ─── Estilos ─── */

const B = '1 solid #000';
const BL = '0.5 solid #000';

const s = StyleSheet.create({
	page: { padding: 20, fontSize: 7, fontFamily: 'Helvetica' },

	/* Header */
	header: { flexDirection: 'row', marginBottom: 8 },
	hLeft: { width: '44%', border: B, padding: 8, marginRight: 4, justifyContent: 'center' },
	hRight: { width: '56%', border: B, padding: 8 },
	noLogo: { fontSize: 14, fontWeight: 'bold', color: '#cc0000', marginBottom: 6, textAlign: 'center' },
	logo: { width: 120, height: 60, marginBottom: 6, objectFit: 'contain' },
	companyName: { fontSize: 9, fontWeight: 'bold', marginBottom: 2 },
	companyLine: { fontSize: 7, marginBottom: 2 },
	rucLine: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
	docType: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
	docNum: { fontSize: 8, marginBottom: 6 },
	labelBold: { fontSize: 7, fontWeight: 'bold' },
	authNum: { fontSize: 6.5, fontFamily: 'Courier', marginBottom: 4, wordBreak: 'break-all' },
	infoRow: { flexDirection: 'row', marginBottom: 2 },
	infoLabel: { fontSize: 7, fontWeight: 'bold', width: 100 },
	infoVal: { fontSize: 7, flex: 1 },
	barcode: { width: '100%', height: 35, marginTop: 4, objectFit: 'contain' },
	barcodeText: { fontSize: 5.5, fontFamily: 'Courier', textAlign: 'center', marginTop: 1 },

	/* Comprador */
	buyer: { border: B, padding: 6, marginBottom: 8 },
	buyerRow: { flexDirection: 'row', marginBottom: 2 },
	buyerLabel: { fontSize: 7, fontWeight: 'bold' },
	buyerVal: { fontSize: 7, flex: 1 },
	buyerGrid: { flexDirection: 'row', marginBottom: 2 },
	buyerCell: { flex: 1, flexDirection: 'row' },

	/* Tabla detalles */
	table: { border: B, marginBottom: 8 },
	tHead: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: B, paddingVertical: 3, paddingHorizontal: 2 },
	tRow: { flexDirection: 'row', borderBottom: BL, paddingVertical: 2, paddingHorizontal: 2, minHeight: 14 },
	th: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
	td: { fontSize: 6.5 },
	tdR: { fontSize: 6.5, textAlign: 'right' },
	tdC: { fontSize: 6.5, textAlign: 'center' },
	colCodP: { width: '6.5%' },
	colCodA: { width: '6.5%' },
	colCant: { width: '6%' },
	colDesc: { width: '22%' },
	colDetAd: { width: '15%' },
	colPU: { width: '9%' },
	colSub: { width: '7%' },
	colPSS: { width: '9%' },
	colDto: { width: '8%' },
	colPT: { width: '11%' },

	/* Bottom: info adicional + totales */
	bottom: { flexDirection: 'row' },
	bottomLeft: { width: '50%', marginRight: 4 },
	bottomRight: { width: '50%' },

	/* Información adicional */
	infoAdic: { border: B, marginBottom: 6 },
	infoAdicTitle: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f0f0', paddingVertical: 3, borderBottom: BL },
	infoAdicRow: { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 4, borderBottom: BL },
	infoAdicLabel: { fontSize: 6.5, fontWeight: 'bold', width: '30%' },
	infoAdicVal: { fontSize: 6.5, width: '70%' },

	/* Formas de pago */
	payTable: { border: B },
	payTitle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: BL, paddingVertical: 3 },
	payTh: { fontSize: 6.5, fontWeight: 'bold', textAlign: 'center' },
	payRow: { flexDirection: 'row', paddingVertical: 2, borderBottom: BL },
	payDesc: { width: '70%', fontSize: 6.5, paddingLeft: 4 },
	payVal: { width: '30%', fontSize: 6.5, textAlign: 'right', paddingRight: 4 },

	/* Totales */
	totals: { border: B },
	totRow: { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 4, borderBottom: BL },
	totLabel: { fontSize: 7, flex: 1 },
	totVal: { fontSize: 7, fontWeight: 'bold', textAlign: 'right', width: 60 },
	totRowFinal: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, backgroundColor: '#f0f0f0' },
	totLabelFinal: { fontSize: 8, fontWeight: 'bold', flex: 1 },
	totValFinal: { fontSize: 8, fontWeight: 'bold', textAlign: 'right', width: 60 },
	totSep: { borderBottom: '1.5 solid #000', marginVertical: 2, marginHorizontal: 4 },
	totRowSub: { flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 4 },

	/* Footer */
	footer: { position: 'absolute', bottom: 12, left: 20, right: 20, textAlign: 'center', fontSize: 5.5, color: '#999' },
});

/* ─── Componente ─── */

export default function RIDETemplate({ comprobante, barcodeDataUri }) {
	const comp = comprobante;
	const emp = comp.empresa || {};
	const est = comp.establecimiento || {};
	const detalles = comp.detalles || [];
	const pagos = comp.pagos || [];
	const ivaRate = getIVARate(detalles);

	const infoAdicItems = parseInfoAdicional(comp.info_adicional);

	return (
		<Document>
			<Page size="A4" style={s.page}>

				{/* ═══ CABECERA ═══ */}
				<View style={s.header}>
					{/* --- Lado izquierdo: Logo + datos emisor --- */}
					<View style={s.hLeft}>
						{emp.logo_url ? (
							<Image src={emp.logo_url} style={s.logo} />
						) : (
							<Text style={s.noLogo}>NO TIENE LOGO</Text>
						)}
						<Text style={s.companyName}>{emp.razon_social || ''}</Text>
						{emp.nombre_comercial && (
							<Text style={s.companyLine}>{emp.nombre_comercial}</Text>
						)}
						<View style={{ marginTop: 4 }}>
							<View style={s.infoRow}>
								<Text style={{ fontSize: 7, fontWeight: 'bold' }}>Dirección{'\n'}Matriz:</Text>
								<Text style={{ fontSize: 7, marginLeft: 8, flex: 1 }}>{emp.direccion_matriz || ''}</Text>
							</View>
							{est.direccion && (
								<View style={s.infoRow}>
									<Text style={{ fontSize: 7, fontWeight: 'bold' }}>Dirección{'\n'}Sucursal:</Text>
									<Text style={{ fontSize: 7, marginLeft: 8, flex: 1 }}>{est.direccion}</Text>
								</View>
							)}
						</View>
						<View style={{ flexDirection: 'row', marginTop: 6 }}>
							<Text style={{ fontSize: 7, fontWeight: 'bold' }}>OBLIGADO A LLEVAR CONTABILIDAD</Text>
							<Text style={{ fontSize: 7, marginLeft: 20, fontWeight: 'bold' }}>
								{emp.obligado_contabilidad ? 'SI' : 'NO'}
							</Text>
						</View>
					</View>

					{/* --- Lado derecho: RUC, tipo doc, autorización, barcode --- */}
					<View style={s.hRight}>
						<View style={{ flexDirection: 'row', marginBottom: 2 }}>
							<Text style={{ fontSize: 8, fontWeight: 'bold' }}>R.U.C.:     </Text>
							<Text style={s.rucLine}>{emp.ruc || ''}</Text>
						</View>
						<Text style={s.docType}>FACTURA</Text>
						<Text style={s.docNum}>No.     {comp.numero_completo || ''}</Text>

						<Text style={[s.labelBold, { marginTop: 4 }]}>NÚMERO DE AUTORIZACIÓN</Text>
						<Text style={s.authNum}>
							{comp.numero_autorizacion || comp.clave_acceso || ''}
						</Text>

						{comp.fecha_autorizacion && (
							<View style={s.infoRow}>
								<Text style={s.infoLabel}>FECHA Y HORA DE{'\n'}AUTORIZACIÓN:</Text>
								<Text style={s.infoVal}>{fmtDateTime(comp.fecha_autorizacion)}</Text>
							</View>
						)}
						<View style={s.infoRow}>
							<Text style={s.infoLabel}>AMBIENTE:</Text>
							<Text style={s.infoVal}>
								{String(comp.ambiente) === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}
							</Text>
						</View>
						<View style={s.infoRow}>
							<Text style={s.infoLabel}>EMISIÓN:</Text>
							<Text style={s.infoVal}>NORMAL</Text>
						</View>

						<Text style={[s.labelBold, { marginTop: 4 }]}>CLAVE DE ACCESO</Text>
						{barcodeDataUri ? (
							<Image src={barcodeDataUri} style={s.barcode} />
						) : null}
						<Text style={s.barcodeText}>{comp.clave_acceso || ''}</Text>
					</View>
				</View>

				{/* ═══ DATOS COMPRADOR ═══ */}
				<View style={s.buyer}>
					<View style={s.buyerRow}>
						<Text style={s.buyerLabel}>Razón Social / Nombres y Apellidos:          </Text>
						<Text style={s.buyerVal}>{comp.razon_social_comprador || ''}</Text>
					</View>
					<View style={s.buyerGrid}>
						<View style={[s.buyerCell, { flex: 2 }]}>
							<Text style={s.buyerLabel}>Identificación     </Text>
							<Text style={s.buyerVal}>{comp.identificacion_comprador || ''}</Text>
						</View>
						<View style={s.buyerCell}>
							<Text style={s.buyerLabel}>Fecha     </Text>
							<Text style={s.buyerVal}>{fmtDate(comp.fecha_emision)}</Text>
						</View>
					</View>
					{comp.direccion_comprador && (
						<View style={s.buyerRow}>
							<Text style={s.buyerLabel}>Direccion:          </Text>
							<Text style={s.buyerVal}>{comp.direccion_comprador}</Text>
						</View>
					)}
				</View>

				{/* ═══ TABLA DE DETALLES ═══ */}
				<View style={s.table}>
					<View style={s.tHead}>
						<Text style={[s.th, s.colCodP]}>Cod.{'\n'}Principal</Text>
						<Text style={[s.th, s.colCodA]}>Cod.{'\n'}Auxiliar</Text>
						<Text style={[s.th, s.colCant]}>Cantidad</Text>
						<Text style={[s.th, s.colDesc]}>Descripción</Text>
						<Text style={[s.th, s.colDetAd]}>Detalle Adicional</Text>
						<Text style={[s.th, s.colPU]}>Precio Unitario</Text>
						<Text style={[s.th, s.colSub]}>Subsidio</Text>
						<Text style={[s.th, s.colPSS]}>Precio sin{'\n'}Subsidio</Text>
						<Text style={[s.th, s.colDto]}>Descuento</Text>
						<Text style={[s.th, s.colPT]}>Precio Total</Text>
					</View>
					{detalles.map((det, i) => {
						const detAd = parseDetallesAdicionales(det.detalles_adicionales);
						const detAdText = detAd.map((d) => d.valor || `${d.nombre}: ${d.valor}`).join('\n');
						return (
							<View key={i} style={s.tRow}>
								<Text style={[s.td, s.colCodP]}>{det.codigo_principal || ''}</Text>
								<Text style={[s.tdC, s.colCodA]}>{det.codigo_auxiliar || ''}</Text>
								<Text style={[s.tdR, s.colCant]}>{fmt(det.cantidad)}</Text>
								<Text style={[s.td, s.colDesc]}>{det.descripcion}</Text>
								<Text style={[s.td, s.colDetAd, { fontSize: 5.5 }]}>{detAdText}</Text>
								<Text style={[s.tdR, s.colPU]}>{fmt(det.precio_unitario)}</Text>
								<Text style={[s.tdR, s.colSub]}>{fmt(0)}</Text>
								<Text style={[s.tdR, s.colPSS]}>{fmt(0)}</Text>
								<Text style={[s.tdR, s.colDto]}>{fmt(det.descuento)}</Text>
								<Text style={[s.tdR, s.colPT]}>{fmt(det.precio_total_sin_impuesto)}</Text>
							</View>
						);
					})}
				</View>

				{/* ═══ SECCIÓN INFERIOR: Info adicional + Pagos | Totales ═══ */}
				<View style={s.bottom}>
					{/* --- Lado izquierdo --- */}
					<View style={s.bottomLeft}>
						{/* Información adicional */}
						{infoAdicItems.length > 0 && (
							<View style={s.infoAdic}>
								<View style={s.infoAdicTitle}>
									<Text>Información Adicional</Text>
								</View>
								{infoAdicItems.map((item, i) => (
									<View key={i} style={s.infoAdicRow}>
										<Text style={s.infoAdicLabel}>{item.nombre}:</Text>
										<Text style={s.infoAdicVal}>{item.valor}</Text>
									</View>
								))}
							</View>
						)}

						{/* Formas de pago */}
						{pagos.length > 0 && (
							<View style={s.payTable}>
								<View style={s.payTitle}>
									<Text style={[s.payTh, { width: '70%' }]}>Forma de pago</Text>
									<Text style={[s.payTh, { width: '30%' }]}>Valor</Text>
								</View>
								{pagos.map((pago, i) => (
									<View key={i} style={s.payRow}>
										<Text style={s.payDesc}>{getFormaPagoLabel(pago.forma_pago)}</Text>
										<Text style={s.payVal}>{fmt(pago.total)}</Text>
									</View>
								))}
							</View>
						)}
					</View>

					{/* --- Lado derecho: Totales --- */}
					<View style={s.bottomRight}>
						<View style={s.totals}>
							<TotalRow label={`SUBTOTAL ${ivaRate}%`} value={comp.subtotal_iva} />
							<TotalRow label="SUBTOTAL 0%" value={comp.subtotal_iva_0} />
							<TotalRow label="SUBTOTAL NO OBJETO DE IVA" value={comp.subtotal_no_objeto} />
							<TotalRow label="SUBTOTAL EXENTO DE IVA" value={comp.subtotal_exento} />
							<TotalRow label="SUBTOTAL SIN IMPUESTOS" value={comp.subtotal_sin_impuestos} />
							<TotalRow label="TOTAL DESCUENTO" value={comp.total_descuento} />
							<TotalRow label="ICE" value={comp.valor_ice} />
							<TotalRow label={`IVA ${ivaRate}%`} value={comp.valor_iva} />
							<TotalRow label="TOTAL DEVOLUCIÓN IVA" value={0} />
							<TotalRow label="IRBPNR" value={comp.valor_irbpnr} />
							<TotalRow label="PROPINA" value={comp.propina} />

							<View style={s.totRowFinal}>
								<Text style={s.totLabelFinal}>VALOR TOTAL</Text>
								<Text style={s.totValFinal}>{fmt(comp.importe_total)}</Text>
							</View>

							<View style={s.totSep} />

							<View style={s.totRowSub}>
								<Text style={s.totLabel}>VALOR TOTAL SIN SUBSIDIO</Text>
								<Text style={s.totVal}>{fmt(0)}</Text>
							</View>
							<View style={s.totRowSub}>
								<Text style={s.totLabel}>AHORRO POR SUBSIDIO:{'\n'}(Incluye IVA cuando corresponda)</Text>
								<Text style={s.totVal}>{fmt(0)}</Text>
							</View>
						</View>
					</View>
				</View>

				<Text style={s.footer}>
					Documento generado por facturIA — facturia.app
				</Text>
			</Page>
		</Document>
	);
}

/* ─── Componentes auxiliares ─── */

function TotalRow({ label, value }) {
	return (
		<View style={s.totRow}>
			<Text style={s.totLabel}>{label}</Text>
			<Text style={s.totVal}>{fmt(value)}</Text>
		</View>
	);
}

function parseInfoAdicional(raw) {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw;
	if (typeof raw === 'object') {
		return Object.entries(raw)
			.filter(([, v]) => v !== null && v !== undefined && v !== '')
			.map(([nombre, valor]) => ({ nombre: capitalize(nombre), valor: String(valor) }));
	}
	return [];
}

function capitalize(str) {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1);
}
