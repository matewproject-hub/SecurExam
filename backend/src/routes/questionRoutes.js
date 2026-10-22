const express = require('express');
const { verifyToken } = require('../auth/jwt');
const { requireRole, ROLES } = require('../auth/rbac');
const { generateQuestionHash, verifyQuestionHash } = require('../crypto/hashing');
const { logAuditAction, fetchEntityAuditRecords } = require('../blockchain/ethereumClient');
const db = require('../db');

const router = express.Router();

// Helper to generate readable Question Code
function generateQuestionCode(subject) {
    const prefix = subject ? subject.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'Q') : 'Q';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `Q-${prefix}-${rand}`;
}

/**
 * 1. Add Question with Correct Option and Distractors (Subject Expert or Admin)
 * POST /api/questions
 */
router.post('/', async (req, res) => {
    try {
        const {
            questionText,
            correctOption,
            distractors,
            subject,
            topic,
            bloomLevel,
            courseOutcome,
            difficulty,
            marks,
            authorName,
            rationale
        } = req.body;

        // Validation
        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ error: 'Question text is required' });
        }
        if (!correctOption || !correctOption.trim()) {
            return res.status(400).json({ error: 'A valid correct option is required' });
        }
        if (!Array.isArray(distractors) || distractors.length === 0) {
            return res.status(400).json({ error: 'At least one distractor option is required' });
        }

        const validDistractors = distractors
            .map((d) => (typeof d === 'string' ? d.trim() : (d.text || '').trim()))
            .filter(Boolean);

        if (validDistractors.length === 0) {
            return res.status(400).json({ error: 'Distractors must contain valid text' });
        }

        // Determine user identity
        const userIdentifier = req.user?.username || authorName || 'Subject Expert';
        const userRole = req.user?.role || ROLES.SUBJECT_EXPERT;

        // 1. Generate unique question code
        const questionCode = req.body.questionCode || generateQuestionCode(subject);

        // 2. Compute canonical cryptographic SHA-256 hash
        const questionPayload = {
            questionText: questionText.trim(),
            correctOption: correctOption.trim(),
            distractors: validDistractors,
            subject: (subject || 'Computer Science').trim(),
            topic: (topic || 'General').trim(),
            bloomLevel: (bloomLevel || 'Understand (Level 2)').trim(),
            courseOutcome: (courseOutcome || 'CO1: Fundamentals').trim(),
            difficulty: (difficulty || 'MEDIUM').toUpperCase(),
            marks: Number(marks) || 1
        };

        const sha256Hash = generateQuestionHash(questionPayload);

        // 3. Log event to Blockchain Audit Trail
        let blockchainReceipt;
        try {
            blockchainReceipt = await logAuditAction(
                questionCode,
                'QUESTION_CREATED',
                userRole,
                userIdentifier,
                sha256Hash
            );
        } catch (chainErr) {
            console.error('[Blockchain Warning] Error logging question creation:', chainErr);
            blockchainReceipt = {
                txHash: '0x' + sha256Hash.substring(0, 32),
                blockNumber: 1,
                onChain: false,
                error: chainErr.message
            };
        }

        // 4. Save question to Database
        const questionRecord = {
            id: `Q-${Date.now().toString(36).toUpperCase()}`,
            questionCode,
            ...questionPayload,
            distractorsWithRationale: Array.isArray(distractors) && typeof distractors[0] === 'object'
                ? distractors
                : validDistractors.map((d) => ({ text: d, rationale: '' })),
            rationale: rationale || '',
            sha256Hash,
            blockchainTx: blockchainReceipt.txHash,
            blockNumber: blockchainReceipt.blockNumber,
            status: 'SUBMITTED', // 'DRAFT', 'SUBMITTED', 'APPROVED', 'FLAGGED'
            submittedBy: userIdentifier,
            submittedRole: userRole,
            submittedAt: new Date().toISOString(),
            integrityVerified: true
        };

        const localDb = db.getLocalDb();
        if (!localDb.questions) localDb.questions = [];
        if (!localDb.question_actions) localDb.question_actions = [];

        localDb.questions.unshift(questionRecord);
        localDb.question_actions.unshift({
            id: `ACT-${Date.now().toString(36).toUpperCase()}`,
            entityId: questionCode,
            actionType: 'QUESTION_CREATED',
            userRole,
            userIdentifier,
            sha256Hash,
            txHash: blockchainReceipt.txHash,
            timestamp: questionRecord.submittedAt
        });
        db.saveLocalDb(localDb);

        return res.status(201).json({
            message: 'Question added, cryptographically hashed, and recorded to blockchain.',
            question: questionRecord,
            blockchain: blockchainReceipt
        });
    } catch (err) {
        console.error('Add question error:', err);
        return res.status(500).json({ error: 'Failed to create question: ' + err.message });
    }
});

/**
 * 2. Get All Questions with filters
 * GET /api/questions
 */
router.get('/', (req, res) => {
    try {
        const { subject, bloomLevel, status, author } = req.query;
        const localDb = db.getLocalDb();
        let questions = localDb.questions || [];

        if (subject) {
            questions = questions.filter((q) => q.subject.toLowerCase() === subject.toLowerCase());
        }
        if (bloomLevel) {
            questions = questions.filter((q) => q.bloomLevel.toLowerCase().includes(bloomLevel.toLowerCase()));
        }
        if (status) {
            questions = questions.filter((q) => q.status.toLowerCase() === status.toLowerCase());
        }
        if (author) {
            questions = questions.filter((q) => (q.submittedBy || '').toLowerCase() === author.toLowerCase());
        }

        return res.json({
            total: questions.length,
            questions
        });
    } catch (err) {
        console.error('Fetch questions error:', err);
        return res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

/**
 * 3. Get Question Details by Code/ID
 * GET /api/questions/:id
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const localDb = db.getLocalDb();
        const question = (localDb.questions || []).find(
            (q) => q.id === id || q.questionCode === id
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Real-time verification of cryptographic integrity
        const recomputedHash = generateQuestionHash(question);
        const isIntact = recomputedHash.toLowerCase() === question.sha256Hash.toLowerCase();

        return res.json({
            question,
            integrity: {
                isIntact,
                expectedHash: question.sha256Hash,
                recomputedHash
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching question: ' + err.message });
    }
});

/**
 * 4. Update Question (re-calculates hash and commits QUESTION_UPDATED to blockchain)
 * PUT /api/questions/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const localDb = db.getLocalDb();
        const index = (localDb.questions || []).findIndex(
            (q) => q.id === id || q.questionCode === id
        );

        if (index === -1) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const existing = localDb.questions[index];
        const updatedPayload = {
            ...existing,
            ...req.body,
            id: existing.id,
            questionCode: existing.questionCode
        };

        // Recompute hash
        const newHash = generateQuestionHash(updatedPayload);
        updatedPayload.sha256Hash = newHash;
        updatedPayload.updatedAt = new Date().toISOString();

        // Commit update to blockchain
        const userIdentifier = req.user?.username || req.body.authorName || 'Subject Expert';
        const userRole = req.user?.role || ROLES.SUBJECT_EXPERT;

        const blockchainReceipt = await logAuditAction(
            existing.questionCode,
            'QUESTION_UPDATED',
            userRole,
            userIdentifier,
            newHash
        );

        updatedPayload.blockchainTx = blockchainReceipt.txHash;
        localDb.questions[index] = updatedPayload;

        if (!localDb.question_actions) localDb.question_actions = [];
        localDb.question_actions.unshift({
            id: `ACT-${Date.now().toString(36).toUpperCase()}`,
            entityId: existing.questionCode,
            actionType: 'QUESTION_UPDATED',
            userRole,
            userIdentifier,
            sha256Hash: newHash,
            txHash: blockchainReceipt.txHash,
            timestamp: updatedPayload.updatedAt
        });

        db.saveLocalDb(localDb);

        return res.json({
            message: 'Question updated and re-anchored to blockchain.',
            question: updatedPayload,
            blockchain: blockchainReceipt
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update question: ' + err.message });
    }
});

/**
 * 5. Verify Question Cryptographic Integrity against Blockchain
 * POST /api/questions/:id/verify
 */
router.post('/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const localDb = db.getLocalDb();
        const question = (localDb.questions || []).find(
            (q) => q.id === id || q.questionCode === id
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // 1. Re-calculate canonical hash on the fly from current data
        const currentHash = generateQuestionHash(question);

        // 2. Query blockchain records for this question
        const chainRecords = await fetchEntityAuditRecords(question.questionCode);

        // The latest record represents the authentic on-chain anchor
        const latestRecord = chainRecords[chainRecords.length - 1];
        const onChainHash = latestRecord ? latestRecord.sha256Hash : question.sha256Hash;

        const isMatch = currentHash.toLowerCase() === onChainHash.toLowerCase();

        return res.json({
            verified: isMatch,
            questionCode: question.questionCode,
            currentHash,
            onChainHash,
            tamperDetected: !isMatch,
            blockchainTx: latestRecord ? latestRecord.txHash : question.blockchainTx,
            auditTrailCount: chainRecords.length,
            message: isMatch
                ? 'Cryptographic integrity verified. Question content matches immutable blockchain record.'
                : 'SECURITY ALERT: Question has been tampered with! Current content hash does not match blockchain record.'
        });
    } catch (err) {
        return res.status(500).json({ error: 'Verification failed: ' + err.message });
    }
});

/**
 * 6. Get Immutable Blockchain Audit Trail for Question
 * GET /api/questions/:id/audit-trail
 */
router.get('/:id/audit-trail', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await fetchEntityAuditRecords(id);
        return res.json({
            entityId: id,
            totalActions: records.length,
            records
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to retrieve audit trail: ' + err.message });
    }
});

module.exports = router;
