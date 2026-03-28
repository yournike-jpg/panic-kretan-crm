const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { customer_id, page=1, limit=25 } = req.query;
  let list = db.all('kretan_purchases');
  if (customer_id) list = list.filter(p => p.customer_id === parseInt(customer_id));
  list.sort((a,b) => (b.purchase_date||'').localeCompare(a.purchase_date||''));
  const total = list.length;
  const offset = (page-1)*limit;
  const purchases = list.slice(offset, offset+parseInt(limit)).map(p => {
    const c = db.find('kretan_customers', p.customer_id);
    return { ...p, first_name: c?.first_name, last_name: c?.last_name };
  });
  res.json({ purchases, total, page:parseInt(page), pages: Math.ceil(total/limit) });
});

router.post('/', (req, res) => {
  const { customer_id, items, total_amount, payment_method, notes, purchase_date } = req.body;
  if (!customer_id || !items || !total_amount) return res.status(400).json({ error: 'Customer, items, total required.' });
  const settings = db.settings();
  const pts = Math.floor(total_amount * (settings.points_per_euro || 1));
  const purchase = db.insert('kretan_purchases', { customer_id:parseInt(customer_id), purchase_date: purchase_date||new Date().toISOString(), items: typeof items==='string'?items:JSON.stringify(items), total_amount, points_earned:pts, payment_method:payment_method||'cash', notes:notes||null, created_at:new Date().toISOString() });
  const cust = db.find('kretan_customers', parseInt(customer_id));
  if (cust) db.update('kretan_customers', cust.id, { loyalty_points:(cust.loyalty_points||0)+pts, total_spent:(cust.total_spent||0)+total_amount, visit_count:(cust.visit_count||0)+1, updated_at:new Date().toISOString() });
  db.insert('kretan_rewards', { customer_id:parseInt(customer_id), type:'earned', points:pts, description:`Purchase #${purchase.id} - €${total_amount}`, purchase_id:purchase.id, created_at:new Date().toISOString() });
  res.json({ id:purchase.id, points_earned:pts, message:'Purchase recorded.' });
});

router.post('/redeem', (req, res) => {
  const { customer_id, points, description } = req.body;
  const cust = db.find('kretan_customers', parseInt(customer_id));
  if (!cust) return res.status(404).json({ error: 'Customer not found.' });
  const settings = db.settings();
  if (points < (settings.min_redeem_points||100)) return res.status(400).json({ error: `Minimum ${settings.min_redeem_points} points.` });
  if ((cust.loyalty_points||0) < points) return res.status(400).json({ error: 'Not enough points.' });
  const euroValue = points * (settings.redemption_rate||0.01);
  db.update('kretan_customers', cust.id, { loyalty_points: cust.loyalty_points - points });
  db.insert('kretan_rewards', { customer_id:cust.id, type:'redeemed', points:-points, description: description||`Redeemed ${points} pts (€${euroValue.toFixed(2)})`, created_at:new Date().toISOString() });
  res.json({ message:`Redeemed ${points} points (€${euroValue.toFixed(2)}).`, euro_value:euroValue });
});

module.exports = router;
