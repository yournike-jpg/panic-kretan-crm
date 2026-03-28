const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('../utils/password');
const { db } = require('../database');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  const user = db.all('users').find(u => u.username === username && u.active);
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials.' });
  const token = jwt.sign({ id:user.id, username:user.username, role:user.role, business:user.business, full_name:user.full_name }, JWT_SECRET, { expiresIn:'24h' });
  res.json({ token, user: { id:user.id, username:user.username, role:user.role, business:user.business, full_name:user.full_name } });
});

router.get('/me', authenticateToken, (req, res) => { res.json({ user: req.user }); });

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.all('users').map(u => ({ id:u.id, username:u.username, full_name:u.full_name, role:u.role, business:u.business, active:u.active, created_at:u.created_at })));
});

router.post('/users', authenticateToken, requireAdmin, (req, res) => {
  const { username, password, full_name, role, business } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'Required fields missing.' });
  if (db.all('users').find(u => u.username === username)) return res.status(400).json({ error: 'Username exists.' });
  const user = db.insert('users', { username, password_hash: hashPassword(password), full_name, role: role||'user', business: business||'both', active:1, created_at: new Date().toISOString() });
  res.json({ id: user.id, message: 'User created.' });
});

router.put('/change-password', authenticateToken, (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.find('users', req.user.id);
  if (!verifyPassword(current_password, user.password_hash)) return res.status(401).json({ error: 'Wrong current password.' });
  db.update('users', req.user.id, { password_hash: hashPassword(new_password) });
  res.json({ message: 'Password changed.' });
});

module.exports = router;
