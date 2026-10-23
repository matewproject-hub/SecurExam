# SecurExam - Fix Workflow

## Phase 1: Critical Security Fixes (Week 1)

### Step 1: Remove Hardcoded Defaults
**Files to Update:**
- `backend/src/auth/jwt.js` - Remove default JWT_SECRET
- `backend/src/crypto/encryption.js` - Remove default ENCRYPTION_KEY
- `backend/src/blockchain/ethereumClient.js` - Remove default SYSTEM_PRIVATE_KEY & RPC_URL

**Action:**
```javascript
// BEFORE: const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
// AFTER:
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
```

**Deliverable:** All hardcoded defaults removed, app fails fast if env vars missing

---

### Step 2: Fix OTP Storage (In-Memory → Redis)
**File:** `backend/src/routes/authRoutes.js`

**Action:**
1. Add redis dependency: `npm install redis`
2. Replace `const otpStore = new Map()` with Redis client
3. Update `generateOTP` to call `redis.setEx('otp:username', 300, secret)`
4. Update `verifyOTP` to call `redis.get('otp:username')`

**Deliverable:** OTP persists across server restarts

---

### Step 3: Standardize Roles
**Files:**
- `backend/src/auth/rbac.js`
- `backend/src/db/schema.sql`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/App.jsx`

**Action:**
```javascript
// Use consistent names everywhere
const ROLES = {
    ADMIN: 'ADMIN',
    EXAM_CENTRE: 'EXAM_CENTRE',
    AUDITOR: 'AUDITOR',
    SUPERVISOR: 'SUPERVISOR',
    STUDENT: 'STUDENT',
    SCRUTINY_OFFICER: 'SCRUTINY_OFFICER'
};
```

**Deliverable:** All roles match across backend, frontend, database

---

### Step 4: Fix Smart Contract Access Control
**File:** `blockchain/contracts/AuditTrail.sol`

**Action:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuditTrail is Ownable {
    function addRecord(...) public onlyOwner {
        // Only owner can add records
    }
}
```

**Deliverable:** Only authorized users can add audit records

---

### Step 5: Fix CORS Configuration
**File:** `backend/server.js`

**Action:**
```javascript
// BEFORE: app.use(cors());
// AFTER:
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
```

**Deliverable:** CORS restricted to specific origin

---

## Phase 2: Input Validation & Rate Limiting (Week 1-2)

### Step 6: Add Input Validation
**Install:** `npm install zod express-validator`

**Files to Update:**
- `backend/src/routes/authRoutes.js`
- `backend/src/routes/paperRoutes.js`

**Action:**
```javascript
const z = require('zod');

const loginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(128)
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        // proceed
    } catch (err) {
        return res.status(400).json({ error: 'Invalid input' });
    }
});
```

**Deliverable:** All routes validate input with Zod

---

### Step 7: Add Rate Limiting
**Install:** `npm install express-rate-limit`

**File:** `backend/server.js`

**Action:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    keyGenerator: (req) => req.ip
});

app.post('/api/auth/login', loginLimiter, authRoutes);
```

**Deliverable:** Login endpoints protected from brute force

---

## Phase 3: Database & Performance (Week 2)

### Step 8: Add Database Indexes
**File:** `backend/src/db/schema.sql`

**Action:**
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_papers_exam_id ON papers(exam_id);
CREATE INDEX idx_papers_uploaded_by ON papers(uploaded_by);
CREATE INDEX idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX idx_papers_created_at ON papers(created_at DESC);
```

**Deliverable:** Database queries optimized

---

### Step 9: Add Audit Columns to Schema
**Action:**
```sql
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE papers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE papers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

**Deliverable:** Soft delete support and audit trail in DB

---

## Phase 4: Error Handling & Logging (Week 2)

### Step 10: Implement Structured Logging
**Install:** `npm install winston`

**File:** Create `backend/src/config/logger.js`

**Action:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

module.exports = logger;
```

**Deliverable:** All security events logged

---

### Step 11: Fix Silent Blockchain Failures
**File:** `backend/src/routes/paperRoutes.js`

**Action:**
```javascript
try {
    const txHash = await logAuditAction(...);
    res.status(201).json({ 
        paperId, 
        hash: sha256Hash,
        blockchainTx: txHash // Include TX hash in response
    });
} catch (chainErr) {
    logger.warn('Blockchain audit failed', { paperId, error: chainErr.message });
    res.status(201).json({
        paperId,
        hash: sha256Hash,
        warning: 'Paper uploaded but blockchain audit failed'
    });
}
```

**Deliverable:** Blockchain failures reported to client

---

### Step 12: Improve Error Messages
**File:** `backend/server.js`

**Action:**
```javascript
app.use((err, req, res, next) => {
    const errorId = generateErrorId();
    logger.error('Server error', { errorId, error: err });
    res.status(500).json({ 
        error: 'Internal server error',
        errorId: errorId // For support reference
    });
});
```

**Deliverable:** Error tracking enabled for debugging

---

## Phase 5: Frontend Authentication (Week 2-3)

### Step 13: Persist Auth Token
**File:** `frontend/src/context/AuthContext.jsx`

**Action:**
```javascript
useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        // Validate token and restore session
        validateToken(savedToken);
    }
}, []);

const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
};
```

**Deliverable:** Auth persists across page refreshes

---

### Step 14: Integrate with Backend API
**File:** `frontend/src/context/AuthContext.jsx`

**Action:**
```javascript
const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    // Handle OTP verification, token storage
};
```

**Deliverable:** Frontend connected to backend authentication

---

## Phase 6: Testing & Documentation (Week 3)

### Step 15: Add Tests
**Install:** `npm install --save-dev jest supertest`

**Files to Create:**
- `backend/tests/auth.test.js`
- `backend/tests/papers.test.js`
- `backend/tests/validation.test.js`

**Action:** Write tests for critical paths

**Deliverable:** 80%+ code coverage

---

### Step 16: Add API Documentation
**Install:** `npm install swagger-ui-express swagger-jsdoc`

**File:** Create `backend/swagger.js`

**Action:**
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

**Deliverable:** API documentation at `/api-docs`

---

### Step 17: Create Environment Template
**File:** `.env.example`

**Action:**
```
# Authentication
JWT_SECRET=<your-secure-secret-min-32-chars>
SYSTEM_PRIVATE_KEY=<your-ethereum-private-key>

# Database
DB_USER=postgres
DB_PASSWORD=<your-secure-password>
DB_HOST=localhost
DB_NAME=securexam

# Blockchain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<deployed-contract-address>

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:5173

# Port
PORT=5000
```

**Deliverable:** Clear setup instructions

---

## Timeline Summary

| Phase | Timeline | Status |
|-------|----------|--------|
| Phase 1: Critical Fixes | Week 1 | 🔴 Must Do |
| Phase 2: Validation | Week 1-2 | 🔴 Must Do |
| Phase 3: Database | Week 2 | 🟠 Important |
| Phase 4: Logging | Week 2 | 🟠 Important |
| Phase 5: Frontend | Week 2-3 | 🟠 Important |
| Phase 6: Testing | Week 3 | 🟡 Nice to Have |

---

## Deployment Checklist

- [ ] Phase 1 complete (no hardcoded secrets)
- [ ] Phase 2 complete (validation & rate limiting)
- [ ] Phase 3 complete (database optimized)
- [ ] Phase 4 complete (logging working)
- [ ] All environment variables documented
- [ ] Redis instance running
- [ ] Blockchain deployed and configured
- [ ] Database backups configured
- [ ] HTTPS/TLS configured
- [ ] Monitoring setup (Sentry, DataDog)
- [ ] Security scan passed (OWASP Top 10)
- [ ] Load testing passed
- [ ] 24/7 support plan in place

---

## Quick Start Commands

```bash
# Install dependencies
npm install redis express-rate-limit zod winston swagger-ui-express swagger-jsdoc

# Create .env from template
cp .env.example .env

# Start Redis locally (macOS)
brew install redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis

# Run database migrations
psql -U postgres -d securexam -f backend/src/db/schema.sql

# Deploy smart contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Start backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

---

## Support & Troubleshooting

**Issue:** "JWT_SECRET is required"  
**Fix:** Add `JWT_SECRET` to `.env` file

**Issue:** "Contract not initialized"  
**Fix:** Ensure `CONTRACT_ADDRESS` is set in `.env`

**Issue:** "Redis connection error"  
**Fix:** Ensure Redis is running on port 6379

**Issue:** "Role mismatch"  
**Fix:** Use ROLES constant from `backend/src/auth/rbac.js` everywhere

---

## Questions?
Refer to `ANALYSIS_REVIEW.md` for detailed explanations of each fix.
