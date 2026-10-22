const crypto = require('crypto');
const fs = require('fs');

const ALGORITHM = 'aes-256-gcm';
// Generate a secure key, ideally store in ENV
// The key must be 32 bytes (256 bits)
const SECRET_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); 

/**
 * Encrypt a buffer using AES-256-GCM
 * @param {Buffer} buffer - The file buffer to encrypt
 * @returns {Object} Encrypted buffer and auth tag
 */
function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(16);
    // ensure key is 32 bytes
    const key = Buffer.isBuffer(SECRET_KEY) ? SECRET_KEY : Buffer.from(SECRET_KEY, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Prepend IV and AuthTag to the encrypted buffer so we only have to store one file
    return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt a buffer using AES-256-GCM
 * @param {Buffer} encryptedBuffer - The encrypted file buffer containing IV, AuthTag, and Data
 * @returns {Buffer} Decrypted original buffer
 */
function decryptBuffer(encryptedBuffer) {
    const iv = encryptedBuffer.subarray(0, 16);
    const authTag = encryptedBuffer.subarray(16, 32);
    const encryptedData = encryptedBuffer.subarray(32);

    const key = Buffer.isBuffer(SECRET_KEY) ? SECRET_KEY : Buffer.from(SECRET_KEY, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
}

module.exports = {
    encryptBuffer,
    decryptBuffer
};
