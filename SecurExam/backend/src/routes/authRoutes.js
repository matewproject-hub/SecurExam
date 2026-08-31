const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { generateToken } = require('../auth/jwt');
const { generateOTP, verifyOTP } = require('../auth/otp');

const router = express.Router();

// Mock in-memory OTP store (username -> secret)
// In production, this goes to Redis or the DB with an expiration
const otpStore = new Map();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate OTP
        const { secret, token } = generateOTP(user.username);
        otpStore.set(user.username, secret);

        return res.json({ 
            message: 'OTP generated and sent to your registered communication channel.',
            username: user.username
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { username, otp } = req.body;

    if (!username || !otp) {
        return res.status(400).json({ error: 'Username and OTP required' });
    }

    const secret = otpStore.get(username);
    if (!secret) {
        return res.status(400).json({ error: 'OTP expired or not requested' });
    }

    const isValid = verifyOTP(otp, secret);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP used, remove from store
    otpStore.delete(username);

    try {
        const { rows } = await db.query('SELECT id, username, role FROM users WHERE username = $1', [username]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = rows[0];
        const token = generateToken(user);
        
        return res.json({
            message: 'Login successful',
            token,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper route to register a user (for initial setup/demo purposes)
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            [username, hash, role || 'EXAM_CENTRE']
        );
        res.json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user (maybe username already exists)' });
    }
});

module.exports = router;
