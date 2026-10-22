const express = require('express');
const { verifyToken } = require('../auth/jwt');
const { requireRole, ROLES } = require('../auth/rbac');
const { fetchAllRecords } = require('../blockchain/ethereumClient');

const router = express.Router();

// Get audit logs (Auditor or Admin only)
router.get('/', verifyToken, requireRole([ROLES.AUDITOR, ROLES.ADMIN]), async (req, res) => {
    try {
        const records = await fetchAllRecords();
        res.json(records);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit records from blockchain' });
    }
});

module.exports = router;
