/**
 * Firma electrónica XAdES-BES para comprobantes electrónicos del SRI Ecuador
 * Ficha Técnica SRI — Sección 6: Firma Electrónica
 * 
 * Estándar: XAdES-BES (http://uri.etsi.org/01903/v1.3.2#)
 * Algoritmo firma: RSA-SHA1
 * Algoritmo digest: SHA-1
 * Canonicalización: C14N 1.0
 * Tipo: ENVELOPED
 * Certificado: PKCS#12 (.p12)
 */
import forge from 'node-forge';
import crypto from 'crypto';

const NS_DS = 'http://www.w3.org/2000/09/xmldsig#';
const NS_ETSI = 'http://uri.etsi.org/01903/v1.3.2#';

/**
 * Firma un XML con certificado .p12 usando XAdES-BES enveloped
 * @param {string} xmlString - XML sin firmar
 * @param {Buffer|ArrayBuffer|Uint8Array} p12Buffer - Contenido del archivo .p12
 * @param {string} p12Password - Contraseña del .p12
 * @returns {string} XML firmado con XAdES-BES
 */
export function firmarXML(xmlString, p12Buffer, p12Password) {
	// 1. Extraer credenciales del PKCS#12
	const { certificate, privateKeyPem, certBase64 } = extraerCredenciales(p12Buffer, p12Password);

	// 2. Generar ID único para elementos de la firma
	const id = crypto.randomBytes(8).toString('hex');

	// 3. Preparar datos del certificado
	const certDer = forge.asn1.toDer(
		forge.pki.certificateToAsn1(certificate)
	).getBytes();
	const certSha1 = sha1Base64(Buffer.from(certDer, 'binary'));
	const issuerDN = formatX509IssuerDN(certificate.issuer);
	const serialNumber = hexToDecimal(certificate.serialNumber);
	const signingTime = new Date().toISOString();

	// 4. RSA public key values para KeyInfo
	const modulus = bigIntToBase64(certificate.publicKey.n);
	const exponent = bigIntToBase64(certificate.publicKey.e);

	// 5. Digest del documento (C14N del root element, sin XML declaration)
	const docDigest = computeDocumentDigest(xmlString);

	// 6. Construir SignedProperties en forma canónica (C14N 1.0)
	// Incluye xmlns:ds y xmlns:etsi heredados del elemento Signature padre
	const signedPropsC14n = buildSignedPropertiesC14n(
		id, signingTime, certSha1, issuerDN, serialNumber
	);
	const signedPropsDigest = sha1Base64(signedPropsC14n);

	// 7. Construir SignedInfo en forma canónica (C14N 1.0)
	// Incluye xmlns:ds y xmlns:etsi heredados del elemento Signature padre
	const signedInfoC14n = buildSignedInfoC14n(
		id, docDigest, signedPropsDigest
	);

	// 8. Firmar SignedInfo canonicalizado con RSA-SHA1
	const signer = crypto.createSign('RSA-SHA1');
	signer.update(signedInfoC14n, 'utf8');
	const signatureValue = signer.sign(privateKeyPem, 'base64');

	// 9. Ensamblar firma completa XAdES-BES
	const signatureXml = assembleSignatureXml({
		id,
		docDigest,
		signedPropsDigest,
		signatureValue,
		certBase64,
		certSha1,
		modulus,
		exponent,
		signingTime,
		issuerDN,
		serialNumber,
	});

	// 10. Insertar firma antes del cierre del root element
	return insertSignatureInDocument(xmlString, signatureXml);
}

// ==========================================================
// Construcción de elementos canónicos (C14N 1.0)
// ==========================================================

/**
 * Construye SignedProperties en forma canónica C14N 1.0
 * Incluye namespaces heredados del padre Signature
 */
function buildSignedPropertiesC14n(id, signingTime, certSha1, issuerDN, serialNumber) {
	return [
		`<etsi:SignedProperties xmlns:ds="${NS_DS}" xmlns:etsi="${NS_ETSI}" Id="SignedProperties-${id}">`,
		'<etsi:SignedSignatureProperties>',
		`<etsi:SigningTime>${signingTime}</etsi:SigningTime>`,
		'<etsi:SigningCertificate>',
		'<etsi:Cert>',
		'<etsi:CertDigest>',
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${certSha1}</ds:DigestValue>`,
		'</etsi:CertDigest>',
		'<etsi:IssuerSerial>',
		`<ds:X509IssuerName>${xmlEncode(issuerDN)}</ds:X509IssuerName>`,
		`<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>`,
		'</etsi:IssuerSerial>',
		'</etsi:Cert>',
		'</etsi:SigningCertificate>',
		'</etsi:SignedSignatureProperties>',
		'<etsi:SignedDataObjectProperties>',
		`<etsi:DataObjectFormat ObjectReference="#Reference-${id}">`,
		'<etsi:Description>comprobante</etsi:Description>',
		'<etsi:MimeType>text/xml</etsi:MimeType>',
		'</etsi:DataObjectFormat>',
		'</etsi:SignedDataObjectProperties>',
		'</etsi:SignedProperties>',
	].join('');
}

/**
 * Construye SignedInfo en forma canónica C14N 1.0
 * Incluye namespaces heredados del padre Signature
 */
function buildSignedInfoC14n(id, docDigest, signedPropsDigest) {
	return [
		`<ds:SignedInfo xmlns:ds="${NS_DS}" xmlns:etsi="${NS_ETSI}">`,
		'<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod>',
		`<ds:SignatureMethod Algorithm="${NS_DS}rsa-sha1"></ds:SignatureMethod>`,
		`<ds:Reference Id="Reference-${id}" URI="#comprobante">`,
		'<ds:Transforms>',
		`<ds:Transform Algorithm="${NS_DS}enveloped-signature"></ds:Transform>`,
		'</ds:Transforms>',
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${docDigest}</ds:DigestValue>`,
		'</ds:Reference>',
		`<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#SignedProperties-${id}">`,
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${signedPropsDigest}</ds:DigestValue>`,
		'</ds:Reference>',
		'</ds:SignedInfo>',
	].join('');
}

// ==========================================================
// Ensamblaje de firma XML
// ==========================================================

/**
 * Ensambla el XML completo de la firma XAdES-BES
 * Los elementos hijos heredan namespaces del Signature padre
 */
function assembleSignatureXml(params) {
	const {
		id, docDigest, signedPropsDigest, signatureValue,
		certBase64, certSha1, modulus, exponent,
		signingTime, issuerDN, serialNumber,
	} = params;

	return [
		// Signature root con declaraciones de namespace
		`<ds:Signature xmlns:ds="${NS_DS}" xmlns:etsi="${NS_ETSI}" Id="Signature-${id}">`,

		// SignedInfo (hereda xmlns:ds y xmlns:etsi)
		'<ds:SignedInfo>',
		'<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod>',
		`<ds:SignatureMethod Algorithm="${NS_DS}rsa-sha1"></ds:SignatureMethod>`,
		`<ds:Reference Id="Reference-${id}" URI="#comprobante">`,
		'<ds:Transforms>',
		`<ds:Transform Algorithm="${NS_DS}enveloped-signature"></ds:Transform>`,
		'</ds:Transforms>',
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${docDigest}</ds:DigestValue>`,
		'</ds:Reference>',
		`<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#SignedProperties-${id}">`,
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${signedPropsDigest}</ds:DigestValue>`,
		'</ds:Reference>',
		'</ds:SignedInfo>',

		// SignatureValue
		`<ds:SignatureValue>`,
		formatBase64Lines(signatureValue),
		`</ds:SignatureValue>`,

		// KeyInfo con X509Data y RSAKeyValue
		`<ds:KeyInfo Id="Certificate-${id}">`,
		'<ds:X509Data>',
		'<ds:X509Certificate>',
		formatBase64Lines(certBase64),
		'</ds:X509Certificate>',
		'</ds:X509Data>',
		'<ds:KeyValue>',
		'<ds:RSAKeyValue>',
		'<ds:Modulus>',
		formatBase64Lines(modulus),
		'</ds:Modulus>',
		`<ds:Exponent>${exponent}</ds:Exponent>`,
		'</ds:RSAKeyValue>',
		'</ds:KeyValue>',
		'</ds:KeyInfo>',

		// Object con QualifyingProperties (XAdES-BES)
		`<ds:Object Id="XadesObject-${id}">`,
		`<etsi:QualifyingProperties Target="#Signature-${id}">`,
		`<etsi:SignedProperties Id="SignedProperties-${id}">`,
		'<etsi:SignedSignatureProperties>',
		`<etsi:SigningTime>${signingTime}</etsi:SigningTime>`,
		'<etsi:SigningCertificate>',
		'<etsi:Cert>',
		'<etsi:CertDigest>',
		`<ds:DigestMethod Algorithm="${NS_DS}sha1"></ds:DigestMethod>`,
		`<ds:DigestValue>${certSha1}</ds:DigestValue>`,
		'</etsi:CertDigest>',
		'<etsi:IssuerSerial>',
		`<ds:X509IssuerName>${xmlEncode(issuerDN)}</ds:X509IssuerName>`,
		`<ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>`,
		'</etsi:IssuerSerial>',
		'</etsi:Cert>',
		'</etsi:SigningCertificate>',
		'</etsi:SignedSignatureProperties>',
		'<etsi:SignedDataObjectProperties>',
		`<etsi:DataObjectFormat ObjectReference="#Reference-${id}">`,
		'<etsi:Description>comprobante</etsi:Description>',
		'<etsi:MimeType>text/xml</etsi:MimeType>',
		'</etsi:DataObjectFormat>',
		'</etsi:SignedDataObjectProperties>',
		'</etsi:SignedProperties>',
		'</etsi:QualifyingProperties>',
		'</ds:Object>',

		'</ds:Signature>',
	].join('');
}

// ==========================================================
// Funciones de criptografía y utilidad
// ==========================================================

/**
 * Computa el digest SHA-1 del documento para la referencia enveloped
 * C14N del root element: sin XML declaration, self-closing tags expandidos
 */
function computeDocumentDigest(xmlString) {
	// Remover XML declaration
	let canonical = xmlString.replace(/<\?xml[^?]*\?>\s*/g, '').trim();
	// Expandir self-closing tags (requisito C14N)
	canonical = expandSelfClosingTags(canonical);
	return sha1Base64(canonical);
}

/**
 * Expande self-closing tags: <tag/> → <tag></tag>
 * Requisito de C14N 1.0
 */
function expandSelfClosingTags(xml) {
	return xml.replace(/<([a-zA-Z][a-zA-Z0-9:]*)((?:\s+[^>]*?)?)\s*\/>/g, '<$1$2></$1>');
}

/**
 * Computa SHA-1 y retorna en Base64
 */
function sha1Base64(data) {
	return crypto.createHash('sha1').update(data).digest('base64');
}

/**
 * Codifica caracteres especiales para XML
 */
function xmlEncode(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Formatea issuer DN en formato RFC 2253 para X509IssuerName
 * Orden: más específico a más general (leaf → root)
 */
function formatX509IssuerDN(issuer) {
	const attrs = issuer.attributes.slice().reverse();
	return attrs.map(attr => {
		const name = attr.shortName || attr.name;
		const value = attr.value
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/,/g, '\\,')
			.replace(/\+/g, '\\+')
			.replace(/</g, '\\<')
			.replace(/>/g, '\\>')
			.replace(/;/g, '\\;');
		return `${name}=${value}`;
	}).join(',');
}

/**
 * Convierte hex string a decimal string
 * Necesario para X509SerialNumber
 */
function hexToDecimal(hex) {
	hex = hex.replace(/^0x/i, '').replace(/\s+/g, '');
	return BigInt('0x' + hex).toString(10);
}

/**
 * Convierte un BigInteger de forge a Base64
 * Maneja correctamente el byte de signo
 */
function bigIntToBase64(bigInt) {
	let hex = bigInt.toString(16);
	// Asegurar longitud par
	if (hex.length % 2 !== 0) hex = '0' + hex;
	// Agregar byte 0x00 inicial si el high bit está activo (número positivo)
	if (parseInt(hex.substring(0, 2), 16) >= 128) hex = '00' + hex;
	return Buffer.from(hex, 'hex').toString('base64');
}

/**
 * Formatea base64 en líneas de 76 caracteres
 */
function formatBase64Lines(base64, lineLength = 76) {
	const lines = [];
	for (let i = 0; i < base64.length; i += lineLength) {
		lines.push(base64.substring(i, i + lineLength));
	}
	return lines.join('\n');
}

/**
 * Inserta la firma XML antes del cierre del root element
 */
function insertSignatureInDocument(xmlString, signatureXml) {
	const lastCloseIdx = xmlString.lastIndexOf('</');
	if (lastCloseIdx === -1) {
		throw new Error('No se encontró el cierre del elemento raíz');
	}
	return xmlString.substring(0, lastCloseIdx) + signatureXml + xmlString.substring(lastCloseIdx);
}

/**
 * Extrae certificado y clave privada del PKCS#12
 */
function extraerCredenciales(p12Buffer, password) {
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
	if (!keyBag) throw new Error('No se encontró clave privada en el .p12');

	// Buscar certificado
	const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
	const certBag = certBags[forge.pki.oids.certBag]?.[0];
	if (!certBag) throw new Error('No se encontró certificado en el .p12');

	// PEM de clave privada para crypto.createSign
	const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);

	// Certificado en Base64 (DER) para X509Certificate
	const certDer = forge.asn1.toDer(
		forge.pki.certificateToAsn1(certBag.cert)
	).getBytes();
	const certBase64 = forge.util.encode64(certDer);

	return {
		certificate: certBag.cert,
		privateKeyPem,
		certBase64,
	};
}
