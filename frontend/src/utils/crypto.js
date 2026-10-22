/**
 * SecurExam Cryptographic Utilities
 * Uses Web Crypto API (crypto.subtle) available natively in all modern browsers and Node 18+
 */

export async function sha256(str) {
  if (!str) return '';
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes question contents into canonical JSON string
 */
export function getCanonicalQuestionPayload(questionData) {
  if (!questionData) return '';

  const rawDistractors = Array.isArray(questionData.distractors) ? questionData.distractors : [];
  const normalizedDistractors = rawDistractors
    .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
    .filter(Boolean)
    .sort();

  return JSON.stringify({
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
}

/**
 * Computes canonical SHA-256 hash for question
 */
export async function generateQuestionHash(questionData) {
  const payload = getCanonicalQuestionPayload(questionData);
  return await sha256(payload);
}

/**
 * Generate simulated deterministic blockchain transaction hash
 */
export async function generateBlockchainTxHash(previousHash, blockNumber, entityId, payloadHash) {
  const seed = `${previousHash || '0x0'}:${blockNumber}:${entityId}:${payloadHash}:${Date.now()}`;
  const hash = await sha256(seed);
  return '0x' + hash.substring(0, 40);
}
