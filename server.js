// ═══════════════════════════════════════════════════
// PhantomWatt — Backend Server (Standalone)
// ═══════════════════════════════════════════════════
// 
// To run:   node server.js
// Install:  npm init -y && npm install express cors bcryptjs
//
// This is a standalone backend — connect it to your frontend
// by changing API_BASE in the frontend connector file.
// ═══════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Simple File-Based Database ───
// Stores data in a JSON file so it persists across restarts
// Replace with MongoDB/PostgreSQL for production
const DB_PATH = path.join(__dirname, 'phantomwatt_db.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) { console.error('DB load error:', e); }
  return { users: {}, sessions: {} };
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) { console.error('DB save error:', e); }
}

let db = loadDB();

// ─── Helper: Hash Password ───
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ─── Helper: Generate Session Token ───
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Helper: Auth Middleware ───
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !db.sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  req.userEmail = db.sessions[token].email;
  req.user = db.users[req.userEmail];
  next();
}

// ═══════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════

// ─── POST /api/auth/signup ───
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }
  if (db.users[email]) {
    return res.status(409).json({ error: 'Account already exists. Try logging in.' });
  }

  // Create user
  db.users[email] = {
    name,
    email,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    devices: {},
    bills: [],
    reminders: [
      { id: 'r1', title: 'Bedtime Power Check', desc: 'Turn off TV standby, router, and set-top box before sleeping', time: '23:00', enabled: true, icon: '🌙' },
      { id: 'r2', title: 'Morning Charger Reminder', desc: 'Unplug phone and laptop chargers after charging', time: '08:00', enabled: true, icon: '🔌' },
      { id: 'r3', title: 'Leaving Home Check', desc: 'Make sure all standby devices are switched off', time: '09:30', enabled: false, icon: '🚪' },
    ],
    tariff: 7,
    settings: {},
  };

  // Create session
  const token = generateToken();
  db.sessions[token] = { email, createdAt: Date.now() };
  saveDB(db);

  res.json({
    success: true,
    token,
    user: { name, email },
    message: 'Account created successfully!',
  });
});

// ─── POST /api/auth/login ───
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users[email];
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Create session
  const token = generateToken();
  db.sessions[token] = { email, createdAt: Date.now() };
  saveDB(db);

  res.json({
    success: true,
    token,
    user: { name: user.name, email: user.email },
  });
});

// ─── POST /api/auth/logout ───
app.post('/api/auth/logout', authenticate, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  delete db.sessions[token];
  saveDB(db);
  res.json({ success: true, message: 'Logged out.' });
});

// ─── GET /api/auth/me ───
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = req.user;
  res.json({
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

// ═══════════════════════════════════════════════════
// USER DATA ROUTES
// ═══════════════════════════════════════════════════

// ─── GET /api/user/devices ───
app.get('/api/user/devices', authenticate, (req, res) => {
  res.json({ devices: req.user.devices || {} });
});

// ─── PUT /api/user/devices ───
app.put('/api/user/devices', authenticate, (req, res) => {
  const { devices } = req.body;
  db.users[req.userEmail].devices = devices || {};
  saveDB(db);
  res.json({ success: true, message: 'Devices saved.' });
});

// ─── GET /api/user/bills ───
app.get('/api/user/bills', authenticate, (req, res) => {
  res.json({ bills: req.user.bills || [] });
});

// ─── POST /api/user/bills ───
app.post('/api/user/bills', authenticate, (req, res) => {
  const { month, year, units, cost } = req.body;
  if (units == null || cost == null) {
    return res.status(400).json({ error: 'Units and cost are required.' });
  }

  const bills = db.users[req.userEmail].bills || [];
  // Remove existing bill for same month/year
  const filtered = bills.filter(b => !(b.month === month && b.year === year));
  filtered.push({
    month, year, units, cost,
    date: new Date(year, month).toISOString(),
    addedAt: new Date().toISOString(),
  });
  db.users[req.userEmail].bills = filtered;
  saveDB(db);
  res.json({ success: true, message: 'Bill saved.', bills: filtered });
});

// ─── DELETE /api/user/bills/:month/:year ───
app.delete('/api/user/bills/:month/:year', authenticate, (req, res) => {
  const month = parseInt(req.params.month);
  const year = parseInt(req.params.year);
  const bills = db.users[req.userEmail].bills || [];
  db.users[req.userEmail].bills = bills.filter(b => !(b.month === month && b.year === year));
  saveDB(db);
  res.json({ success: true, message: 'Bill deleted.' });
});

// ─── GET /api/user/reminders ───
app.get('/api/user/reminders', authenticate, (req, res) => {
  res.json({ reminders: req.user.reminders || [] });
});

// ─── PUT /api/user/reminders ───
app.put('/api/user/reminders', authenticate, (req, res) => {
  const { reminders } = req.body;
  db.users[req.userEmail].reminders = reminders || [];
  saveDB(db);
  res.json({ success: true, message: 'Reminders saved.' });
});

// ─── GET /api/user/tariff ───
app.get('/api/user/tariff', authenticate, (req, res) => {
  res.json({ tariff: req.user.tariff || 7 });
});

// ─── PUT /api/user/tariff ───
app.put('/api/user/tariff', authenticate, (req, res) => {
  const { tariff } = req.body;
  db.users[req.userEmail].tariff = parseFloat(tariff) || 7;
  saveDB(db);
  res.json({ success: true, message: 'Tariff saved.' });
});

// ─── GET /api/user/settings ───
app.get('/api/user/settings', authenticate, (req, res) => {
  res.json({ settings: req.user.settings || {} });
});

// ─── PUT /api/user/settings ───
app.put('/api/user/settings', authenticate, (req, res) => {
  const { settings } = req.body;
  db.users[req.userEmail].settings = settings || {};
  saveDB(db);
  res.json({ success: true, message: 'Settings saved.' });
});

// ─── GET /api/user/all-data (export all user data) ───
app.get('/api/user/all-data', authenticate, (req, res) => {
  const user = req.user;
  res.json({
    name: user.name,
    email: user.email,
    devices: user.devices,
    bills: user.bills,
    reminders: user.reminders,
    tariff: user.tariff,
    settings: user.settings,
    createdAt: user.createdAt,
  });
});

// ═══════════════════════════════════════════════════
// HEALTH & INFO
// ═══════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'PhantomWatt Backend',
    version: '1.0.0',
    uptime: process.uptime(),
    users: Object.keys(db.users).length,
  });
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`\n⚡ PhantomWatt Backend running on http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   POST /api/auth/signup    - Create account`);
  console.log(`   POST /api/auth/login     - Log in`);
  console.log(`   POST /api/auth/logout    - Log out`);
  console.log(`   GET  /api/auth/me        - Get current user`);
  console.log(`   GET  /api/user/devices   - Get devices`);
  console.log(`   PUT  /api/user/devices   - Save devices`);
  console.log(`   GET  /api/user/bills     - Get bills`);
  console.log(`   POST /api/user/bills     - Add bill`);
  console.log(`   GET  /api/user/reminders - Get reminders`);
  console.log(`   PUT  /api/user/reminders - Save reminders`);
  console.log(`   GET  /api/user/tariff    - Get tariff`);
  console.log(`   PUT  /api/user/tariff    - Save tariff`);
  console.log(`   GET  /api/health         - Server health\n`);
});
