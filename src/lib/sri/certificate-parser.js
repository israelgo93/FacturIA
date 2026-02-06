import forge from 'node-forge';

/**
 * Parsea un certificado PKCS#12 (.p12) y extrae sus metadatos
 * @param {ArrayBuffer} p12Buffer - Buffer del archivo .p12
 * @param {string} password - Contraseña del certificado
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export function parseCertificate(p12Buffer, password) {
	try {
		const p12Der = forge.util.createBuffer(new Uint8Array(p12Buffer));
		const p12Asn1 = forge.asn1.fromDer(p12Der);
		const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

		// Extraer certificados
		const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
		const certs = certBags[forge.pki.oids.certBag] || [];

		if (certs.length === 0) {
			return { success: false, error: 'No se encontraron certificados en el archivo' };
		}

		const cert = certs[0].cert;
		if (!cert) {
			return { success: false, error: 'Certificado inválido' };
		}

		// Extraer subject (propietario)
		const subject = cert.subject.attributes.reduce((acc, attr) => {
			acc[attr.shortName || attr.name] = attr.value;
			return acc;
		}, {});

		// Extraer issuer (emisor)
		const issuer = cert.issuer.attributes.reduce((acc, attr) => {
			acc[attr.shortName || attr.name] = attr.value;
			return acc;
		}, {});

		return {
			success: true,
			data: {
				propietario: subject.CN || subject.O || 'Desconocido',
				emisor: issuer.CN || issuer.O || 'Desconocido',
				serial: cert.serialNumber,
				valido_desde: cert.validity.notBefore,
				valido_hasta: cert.validity.notAfter,
				// Información adicional
				subject_o: subject.O || '',
				subject_ou: subject.OU || '',
				issuer_o: issuer.O || '',
			},
		};
	} catch (err) {
		if (err.message?.includes('Invalid password') || err.message?.includes('PKCS#12 MAC')) {
			return { success: false, error: 'Contraseña incorrecta' };
		}
		return { success: false, error: 'Archivo .p12 inválido o corrupto' };
	}
}
