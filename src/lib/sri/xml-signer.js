/**
 * Firma electrónica XAdES-BES para comprobantes electrónicos
 * Ficha Técnica SRI — Sección 6: Firma Electrónica
 * 
 * Estándar: XAdES-BES (http://uri.etsi.org/01903/v1.3.2#)
 * Algoritmo: RSA-SHA1
 * Tipo: ENVELOPED
 * Certificado: PKCS#12 (.p12)
 */
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';

/**
 * Firma un XML con certificado .p12
 * @param {string} xmlString - XML sin firmar
 * @param {Buffer|ArrayBuffer|Uint8Array} p12Buffer - Contenido del archivo .p12
 * @param {string} p12Password - Contraseña del .p12
 * @returns {string} XML firmado con XAdES-BES
 */
export function firmarXML(xmlString, p12Buffer, p12Password) {
	// 1. Extraer certificado y clave privada del .p12
	const { certificate, privateKeyPem, certBase64 } = extraerCredenciales(p12Buffer, p12Password);

	// 2. Crear firma XAdES-BES ENVELOPED
	const sig = new SignedXml({
		privateKey: privateKeyPem,
		canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
		signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
	});

	// Referencia al documento completo (enveloped)
	sig.addReference({
		uri: '#comprobante',
		digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
		transforms: [
			'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
		],
	});

	// KeyInfo con certificado X.509
	sig.keyInfoProvider = {
		getKeyInfo: () => {
			return `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`;
		},
	};

	// Computar firma
	sig.computeSignature(xmlString, {
		location: { reference: '/*', action: 'append' },
	});

	return sig.getSignedXml();
}

/**
 * Extrae certificado y clave privada de un archivo .p12
 * @param {Buffer|ArrayBuffer|Uint8Array} p12Buffer
 * @param {string} password
 * @returns {{ certificate: Object, privateKeyPem: string, certBase64: string }}
 */
function extraerCredenciales(p12Buffer, password) {
	// Convertir a formato que node-forge entiende
	let derBuffer;
	if (p12Buffer instanceof ArrayBuffer) {
		derBuffer = new Uint8Array(p12Buffer);
	} else if (p12Buffer instanceof Uint8Array) {
		derBuffer = p12Buffer;
	} else if (Buffer.isBuffer(p12Buffer)) {
		derBuffer = new Uint8Array(p12Buffer);
	} else {
		throw new Error('p12Buffer debe ser Buffer, ArrayBuffer o Uint8Array');
	}

	const p12Der = forge.util.createBuffer(derBuffer);
	const p12Asn1 = forge.asn1.fromDer(p12Der);
	const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

	// Buscar clave privada
	const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
	const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
	if (!keyBag) {
		throw new Error('No se encontró clave privada en el .p12');
	}

	// Buscar certificado
	const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
	const certBag = certBags[forge.pki.oids.certBag]?.[0];
	if (!certBag) {
		throw new Error('No se encontró certificado en el .p12');
	}

	// Convertir clave privada a PEM para xml-crypto
	const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

	// Certificado en Base64 para KeyInfo
	const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certBag.cert)).getBytes();
	const certBase64 = forge.util.encode64(certDer);

	return {
		certificate: certBag.cert,
		privateKeyPem,
		certBase64,
	};
}
