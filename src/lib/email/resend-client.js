/**
 * Cliente de email usando Resend
 * Envía comprobantes autorizados con XML y RIDE PDF adjuntos
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía email con comprobante autorizado
 * @param {Object} params
 * @param {string} params.to - Email del destinatario
 * @param {string} params.subject - Asunto del email
 * @param {string} params.razonSocialEmisor - Razón social del emisor
 * @param {string} params.numeroComprobante - Número del comprobante
 * @param {string} params.claveAcceso - Clave de acceso
 * @param {string} params.xmlAutorizado - XML autorizado como string
 * @param {Buffer} params.ridePDF - RIDE PDF como Buffer
 * @returns {Promise<Object>} Resultado del envío
 */
export async function enviarComprobanteEmail({
	to,
	razonSocialEmisor,
	numeroComprobante,
	claveAcceso,
	xmlAutorizado,
	ridePDF,
}) {
	if (!process.env.RESEND_API_KEY) {
		return { error: 'RESEND_API_KEY no configurada' };
	}

	const subject = `Comprobante Electrónico - Factura ${numeroComprobante}`;

	const attachments = [];

	if (xmlAutorizado) {
		attachments.push({
			filename: `${claveAcceso}.xml`,
			content: Buffer.from(xmlAutorizado, 'utf-8'),
		});
	}

	if (ridePDF) {
		attachments.push({
			filename: `RIDE_${numeroComprobante.replace(/-/g, '')}.pdf`,
			content: ridePDF,
		});
	}

	try {
		const { data, error } = await resend.emails.send({
			from: `${razonSocialEmisor} <no-reply@facturia.app>`,
			to: [to],
			subject,
			html: buildEmailHTML({ razonSocialEmisor, numeroComprobante, claveAcceso }),
			attachments,
		});

		if (error) return { error: error.message };
		return { data: { emailId: data.id } };
	} catch (error) {
		return { error: error.message };
	}
}

function buildEmailHTML({ razonSocialEmisor, numeroComprobante, claveAcceso }) {
	return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
	<div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #eee;">
		<h2 style="margin: 0; color: #111;">${razonSocialEmisor}</h2>
		<p style="margin: 5px 0 0; color: #666; font-size: 14px;">Comprobante Electrónico</p>
	</div>
	
	<div style="padding: 20px 0;">
		<p>Estimado cliente,</p>
		<p>Adjunto encontrará su comprobante electrónico autorizado por el SRI:</p>
		
		<div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 15px 0;">
			<p style="margin: 0 0 5px;"><strong>Factura:</strong> ${numeroComprobante}</p>
			<p style="margin: 0; font-size: 11px; color: #666; word-break: break-all;">
				<strong>Clave de acceso:</strong> ${claveAcceso}
			</p>
		</div>
		
		<p style="font-size: 13px; color: #666;">
			Se adjuntan el XML autorizado y la Representación Impresa (RIDE) en formato PDF.
		</p>
	</div>
	
	<div style="text-align: center; padding: 15px 0; border-top: 1px solid #eee; font-size: 11px; color: #999;">
		<p>Generado por <strong>facturIA</strong> — facturia.app</p>
	</div>
</body>
</html>`;
}
