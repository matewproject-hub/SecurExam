const { authenticator } = require('otplib');

// Configure authenticator
authenticator.options = { step: 300 }; // 5 minutes validity

/**
 * Generate an OTP and secret for a user
 * @param {string} username 
 * @returns {Object} secret and token
 */
function generateOTP(username) {
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);
    
    // In a real system, you would save this secret to the DB or cache (e.g., Redis)
    // For this demonstration, we'll log it to console to simulate sending via email/SMS
    console.log(`[Mock Email Service] OTP for ${username}: ${token}`);
    
    return { secret, token };
}

/**
 * Verify an OTP
 * @param {string} token 
 * @param {string} secret 
 * @returns {boolean} isValid
 */
function verifyOTP(token, secret) {
    try {
        return authenticator.check(token, secret);
    } catch (err) {
        return false;
    }
}

module.exports = {
    generateOTP,
    verifyOTP
};
