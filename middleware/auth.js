const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'panic-kretan-crm-2026-secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch (err) { return res.status(403).json({ error: 'Invalid token.' }); }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
