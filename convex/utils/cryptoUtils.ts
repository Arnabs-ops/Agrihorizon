import CryptoJS from "crypto-js";

/**
 * Derives a 256-bit key from a secret and salt using PBKDF2.
 */
export function deriveKey(secret: string, salt: string): string {
    return CryptoJS.PBKDF2(secret, salt, {
        keySize: 256 / 32,
        iterations: 1000
    }).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypt data using AES-256 with a provided derived key.
 * @param data The string to encrypt
 * @param derivedKey The hex-encoded derived key
 * @returns Hex string formatted as "iv:encryptedData"
 */
export function encryptWithKey(data: string, derivedKey: string): string {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(derivedKey), {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
}

/**
 * Decrypt data using AES-256 with a provided derived key.
 * @param encryptedData Hex string formatted as "iv:encryptedData"
 * @param derivedKey The hex-encoded derived key
 * @returns The decrypted string
 */
export function decryptWithKey(encryptedData: string, derivedKey: string): string {
    if (!encryptedData || !encryptedData.includes(":")) return encryptedData;

    try {
        const parts = encryptedData.split(":");
        if (parts.length !== 2) return encryptedData;

        const iv = CryptoJS.enc.Hex.parse(parts[0]);
        const ciphertext = parts[1];
        const decrypted = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Hex.parse(derivedKey), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error("Decryption failed:", e);
        return encryptedData;
    }
}
