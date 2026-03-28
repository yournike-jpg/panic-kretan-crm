const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/settings', (req, res) => { res.json(db.settings()); });

router.put('/settings', requireAdmin, (req, res) => {
  db.updateSettings(req.body);
  res.json({ message: 'Settings saved.' });
});

router.get('/history/:customer_id', (req, res) => {
  res.json(db.where('kretan_rewards', r => r.customer_id === parseInt(req.params.customer_id)).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||'')));
});

module.exports = router;
