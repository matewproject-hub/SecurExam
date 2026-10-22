const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { verifyToken } = require('../auth/jwt');
const { requireRole, ROLES } = require('../auth/rbac');
const { encryptBuffer, decryptBuffer } = require('../crypto/encryption');
const { generateHash } = require('../crypto/hashing');
const { logAuditAction } = require('../blockchain/ethereumClient');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Upload Question Paper (Admin Only)
router.post('/upload', verifyToken, requireRole([ROLES.ADMIN]), upload.single('paper'), async (req, res) => {
    try {
        const { exam_id } = req.body;
        const file = req.file;

        if (!exam_id || !file) {
            return res.status(400).json({ error: 'Exam ID and file are required' });
        }

        // 1. Generate SHA-256 hash of original file for integrity
        const sha256Hash = generateHash(file.buffer);

        // 2. Encrypt the file
        const encryptedBuffer = encryptBuffer(file.buffer);

        // 3. Save to filesystem
        const filename = `paper_${exam_id}_${Date.now()}.enc`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, encryptedBuffer);

        // 4. Store metadata in database
        const { rows } = await db.query(
            'INSERT INTO papers (exam_id, encrypted_file_path, sha256_hash, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING id',
            [exam_id, filepath, sha256Hash, req.user.id]
        );
        const paperId = rows[0].id;

        // 5. Blockchain Audit Log
        try {
            await logAuditAction(
                paperId.toString(),
                'PAPER_UPLOADED',
                req.user.role,
                req.user.username,
                sha256Hash
            );
        } catch (chainErr) {
            console.error("Failed to log upload to blockchain. Continuing...", chainErr);
            // Depending on strictness, we might want to fail the request if blockchain logging fails.
        }

        res.status(201).json({
            message: 'Paper uploaded and encrypted securely',
            paperId,
            hash: sha256Hash
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload paper' });
    }
});

// 2. Access Question Paper (Exam Centre or Admin)
router.get('/access/:paperId', verifyToken, requireRole([ROLES.EXAM_CENTRE, ROLES.ADMIN]), async (req, res) => {
    try {
        const { paperId } = req.params;

        // Fetch paper and exam details
        const paperQuery = await db.query(
            `SELECT p.encrypted_file_path, p.sha256_hash, e.scheduled_time, e.name as exam_name 
             FROM papers p 
             JOIN exams e ON p.exam_id = e.id 
             WHERE p.id = $1`,
            [paperId]
        );

        if (paperQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        const paperInfo = paperQuery.rows[0];

        // Access Control based on Time
        const currentTime = new Date();
        const scheduledTime = new Date(paperInfo.scheduled_time);

        if (req.user.role !== ROLES.ADMIN && currentTime < scheduledTime) {
            // Log denied access attempt
            try {
                await logAuditAction(
                    paperId.toString(),
                    'ACCESS_DENIED_EARLY',
                    req.user.role,
                    req.user.username,
                    paperInfo.sha256_hash
                );
            } catch(e) {}
            
            return res.status(403).json({ 
                error: 'Access denied. The scheduled exam time has not started.',
                scheduledTime
            });
        }

        // Read encrypted file
        if (!fs.existsSync(paperInfo.encrypted_file_path)) {
             return res.status(500).json({ error: 'Encrypted file is missing from storage' });
        }
        
        const encryptedBuffer = fs.readFileSync(paperInfo.encrypted_file_path);

        // Decrypt file
        const decryptedBuffer = decryptBuffer(encryptedBuffer);

        // Verify Integrity
        const currentHash = generateHash(decryptedBuffer);
        if (currentHash !== paperInfo.sha256_hash) {
            return res.status(500).json({ error: 'Integrity check failed. The file has been tampered with.' });
        }

        // Log successful access
        try {
            await logAuditAction(
                paperId.toString(),
                'ACCESS_GRANTED',
                req.user.role,
                req.user.username,
                paperInfo.sha256_hash
            );
        } catch (chainErr) {
            console.error("Blockchain log failed", chainErr);
        }

        // Send decrypted file
        res.setHeader('Content-Disposition', `attachment; filename="${paperInfo.exam_name}_Paper.pdf"`);
        res.setHeader('Content-Type', 'application/pdf'); // Assuming PDF for now
        res.send(decryptedBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to access paper' });
    }
});

module.exports = router;
