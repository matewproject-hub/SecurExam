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

/**
 * Generate canonical SHA-256 hash for a question and its options.
 * Ensures consistent canonical key ordering so identical questions always produce identical hashes.
 * @param {Object} questionData
 * @returns {string} Hex representation of the SHA-256 hash
 */
function generateQuestionHash(questionData) {
    if (!questionData) return '';

    // Normalize distractors into sorted array of trimmed strings
    const rawDistractors = Array.isArray(questionData.distractors) ? questionData.distractors : [];
    const normalizedDistractors = rawDistractors
        .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
        .filter(Boolean)
        .sort();

    const canonicalPayload = JSON.stringify({
        bloomLevel: (questionData.bloomLevel || questionData.bloom_level || '').trim(),
        correctOption: (questionData.correctOption || questionData.correct_option || '').trim(),
        courseOutcome: (questionData.courseOutcome || questionData.course_outcome || '').trim(),
        difficulty: (questionData.difficulty || 'MEDIUM').toUpperCase().trim(),
        distractors: normalizedDistractors,
        marks: Number(questionData.marks) || 1,
        questionText: (questionData.questionText || questionData.question_text || questionData.text || '').trim(),
        subject: (questionData.subject || '').trim(),
        topic: (questionData.topic || '').trim()
    });

    return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

/**
 * Verify whether a question's current content matches an expected hash
 * @param {Object} questionData 
 * @param {string} expectedHash 
 * @returns {boolean}
 */
function verifyQuestionHash(questionData, expectedHash) {
    if (!expectedHash) return false;
    const computed = generateQuestionHash(questionData);
    return computed.toLowerCase() === expectedHash.toLowerCase();
}

module.exports = {
    generateHash,
    generateQuestionHash,
    verifyQuestionHash
};

