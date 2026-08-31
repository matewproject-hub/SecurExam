const crypto = require('crypto');

/**
 * Generate SHA-256 hash of a buffer
 * @param {Buffer} buffer - The data to hash
 * @returns {string} Hex representation of the SHA-256 hash
 */
function generateHash(buffer) {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
}

module.exports = {
    generateHash
};
