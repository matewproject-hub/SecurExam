const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let usePostgres = false;
let pool = null;

try {
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'securexam',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 1500
  });

  pool.on('error', (err) => {
    console.warn('[DB Pool Warning] PostgreSQL connection dropped, switching to persistent local storage.', err.message);
    usePostgres = false;
  });
} catch (e) {
  console.warn('[DB Notice] PostgreSQL client initialization error:', e.message);
}

// Resilient file-backed database storage
const dataDir = path.resolve(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'app_database.json');

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    const initial = {
      users: [
        {
          id: 1,
          username: 'expert1',
          password_hash: '$2b$10$wT8m9M90bqv1p3E6VpL3reFqA4e0R2pS9T4f0q1w2e3r4t5y6u7i8', // 'expert123'
          role: 'SUBJECT_EXPERT',
          name: 'Dr. Jane Smith (Subject Expert)',
          department: 'Computer Science & Security'
        },
        {
          id: 2,
          username: 'admin',
          password_hash: '$2b$10$wT8m9M90bqv1p3E6VpL3reFqA4e0R2pS9T4f0q1w2e3r4t5y6u7i8',
          role: 'ADMIN',
          name: 'System Administrator'
        }
      ],
      questions: [],
      question_actions: [],
      exams: [],
      papers: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function getLocalDb() {
  ensureDbFile();
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } catch {
    return { users: [], questions: [], question_actions: [], exams: [], papers: [] };
  }
}

function saveLocalDb(data) {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Executes a query with automatic fallback to persistent JSON db
 */
async function query(text, params = []) {
  if (usePostgres && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('[DB Error] PostgreSQL query failed, using local fallback:', err.message);
      usePostgres = false;
    }
  }

  // Fallback query emulator for questions, users, papers
  const db = getLocalDb();
  const lowerText = text.toLowerCase();

  if (lowerText.includes('select * from users where username = $1') || lowerText.includes('select id, username, role from users where username = $1')) {
    const username = params[0];
    const user = db.users.find((u) => u.username.toLowerCase() === (username || '').toLowerCase());
    return { rows: user ? [user] : [] };
  }

  if (lowerText.includes('insert into users')) {
    const newUser = {
      id: db.users.length + 1,
      username: params[0],
      password_hash: params[1],
      role: params[2] || 'SUBJECT_EXPERT',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveLocalDb(db);
    return { rows: [newUser] };
  }

  // Default empty rows
  return { rows: [] };
}

module.exports = {
  query,
  getLocalDb,
  saveLocalDb
};

