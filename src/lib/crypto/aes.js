import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'facturia-default-key-change-me!!';

/**
 * Cifra un texto con AES-256
 * @param {string} plaintext - Texto a cifrar
 * @returns {string} Texto cifrado en formato Base64
 */
export function encrypt(plaintext) {
	const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY);
	return encrypted.toString();
}

/**
 * Descifra un texto cifrado con AES-256
 * @param {string} ciphertext - Texto cifrado en Base64
 * @returns {string} Texto descifrado
 */
export function decrypt(ciphertext) {
	const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}
