const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { search, page=1, limit=25, sort='last_name', order='ASC' } = req.query;
  let list = db.all('kretan_customers').filter(c => c.active !== false && c.active !== 0);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c => `${c.first_name} ${c.last_name} ${c.email||''} ${c.phone||''} ${c.mobile||''}`.toLowerCase().includes(s));
  }
  list.sort((a,b) => { const av=a[sort]||'', bv=b[sort]||''; return order==='DESC' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv)); });
  const total = list.length;
  const offset = (page-1)*limit;
  res.json({ customers: list.slice(offset, offset+parseInt(limit)), total, page:parseInt(page), pages: Math.ceil(total/limit) });
});

router.get('/:id', (req, res) => {
  const customer = db.find('kretan_customers', parseInt(req.params.id));
  if (!customer) return res.status(404).json({ error: 'Not found.' });
  const purchases = db.where('kretan_purchases', p => p.customer_id === customer.id).sort((a,b) => (b.purchase_date||'').localeCompare(a.purchase_date||'')).slice(0,20);
  const rewards = db.where('kretan_rewards', r => r.customer_id === customer.id).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||'')).slice(0,20);
  const communications = db.where('kretan_communications', c => c.customer_id === customer.id).slice(0,20);
  res.json({ customer, purchases, rewards, communications });
});

router.post('/', (req, res) => {
  const f = req.body;
  if (!f.first_name || !f.last_name) return res.status(400).json({ error: 'Name required.' });
  const settings = db.settings();
  const pts = settings.welcome_bonus || 0;
  const customer = db.insert('kretan_customers', {
    ...f, loyalty_points: pts, total_spent:0, visit_count:0, active:1,
    consent_email: f.consent_email?1:0, consent_sms: f.consent_sms?1:0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  if (pts > 0) {
    db.insert('kretan_rewards', { customer_id:customer.id, type:'earned', points:pts, description:'Welcome bonus', created_at: new Date().toISOString() });
  }
  res.json({ id: customer.id, message: 'Customer created.' });
});

router.put('/:id', (req, res) => {
  const f = req.body;
  db.update('kretan_customers', parseInt(req.params.id), { ...f, consent_email:f.consent_email?1:0, consent_sms:f.consent_sms?1:0, updated_at: new Date().toISOString() });
  res.json({ message: 'Updated.' });
});

router.delete('/:id', (req, res) => {
  db.remove('kretan_customers', parseInt(req.params.id));
  res.json({ message: 'Deleted.' });
});

router.get('/export/contacts', (req, res) => {
  const { type='email' } = req.query;
  let list = db.where('kretan_customers', c => c.active !== false && c.active !== 0);
  if (type === 'email') list = list.filter(c => c.consent_email && c.email);
  if (type === 'sms') list = list.filter(c => c.consent_sms && (c.phone || c.mobile));
  res.json(list.map(c => ({ id:c.id, first_name:c.first_name, last_name:c.last_name, email:c.email, phone:c.phone, mobile:c.mobile, loyalty_points:c.loyalty_points, total_spent:c.total_spent })));
});

module.exports = router;
