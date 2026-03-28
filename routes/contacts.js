const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

// Helper to get display name for a contact
function getDisplayName(contact) {
  if (contact.contact_type === 'company' || (contact.contact_type === 'both' && contact.company_name)) {
    return contact.company_name;
  }
  return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
}

router.get('/', (req, res) => {
  const { search, page=1, limit=25, sort='created_at', order='DESC', contact_type, business } = req.query;
  let list = db.all('contacts').filter(c => c.active !== false && c.active !== 0);

  // Filter by contact_type
  if (contact_type) {
    list = list.filter(c => c.contact_type === contact_type);
  }

  // Filter by business
  if (business) {
    list = list.filter(c => {
      if (c.business === 'both') return true;
      return c.business === business;
    });
  }

  // Search across multiple fields
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c => {
      const displayName = getDisplayName(c);
      const searchStr = `${displayName} ${c.email||''} ${c.phone||''} ${c.mobile||''} ${c.company_name||''}`.toLowerCase();
      return searchStr.includes(s);
    });
  }

  // Sort
  list.sort((a,b) => {
    const av = a[sort] || '';
    const bv = b[sort] || '';
    const comparison = String(av).localeCompare(String(bv));
    return order === 'DESC' ? -comparison : comparison;
  });

  const total = list.length;
  const offset = (page-1)*limit;
  res.json({
    contacts: list.slice(offset, offset+parseInt(limit)),
    total,
    page: parseInt(page),
    pages: Math.ceil(total/limit)
  });
});

// Export endpoint - MUST be before /:id to avoid matching "export" as an ID
router.get('/export/list', (req, res) => {
  const { business, contact_type } = req.query;
  let list = db.where('contacts', c => c.active !== false && c.active !== 0);

  if (business && business !== 'all') {
    list = list.filter(c => c.business === business || c.business === 'both');
  }
  if (contact_type && contact_type !== 'all') {
    list = list.filter(c => c.contact_type === contact_type || c.contact_type === 'both');
  }

  const result = list.map(c => ({
    id: c.id,
    display_name: getDisplayName(c),
    contact_type: c.contact_type,
    business: c.business,
    email: c.email, phone: c.phone, mobile: c.mobile,
    first_name: c.first_name, last_name: c.last_name,
    company_name: c.company_name,
    loyalty_points: c.loyalty_points, total_spent: c.total_spent,
    total_orders: c.total_orders, total_revenue: c.total_revenue
  }));
  res.json(result);
});

router.get('/:id', (req, res) => {
  const contact = db.find('contacts', parseInt(req.params.id));
  if (!contact) return res.status(404).json({ error: 'Not found.' });

  const data = { contact };

  // Get purchases if contact has kretan business
  if (contact.business === 'thekretan' || contact.business === 'both') {
    const purchases = db.where('kretan_purchases', p => p.customer_id === contact.id)
      .sort((a,b) => (b.purchase_date||'').localeCompare(a.purchase_date||''))
      .slice(0,20);
    data.purchases = purchases;

    const rewards = db.where('kretan_rewards', r => r.customer_id === contact.id)
      .sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''))
      .slice(0,20);
    data.rewards = rewards;
  }

  // Get orders if contact has panicsweets business
  if (contact.business === 'panicsweets' || contact.business === 'both') {
    const orders = db.where('panic_orders', o => o.company_id === contact.id || o.contact_id === contact.id)
      .sort((a,b) => (b.order_date||'').localeCompare(a.order_date||''))
      .slice(0,20);
    data.orders = orders;
  }

  res.json(data);
});

router.post('/', (req, res) => {
  const f = req.body;

  // Validation
  if (f.contact_type === 'individual' || f.contact_type === 'both') {
    if (!f.first_name || !f.last_name) {
      return res.status(400).json({ error: 'First and last name required for individual contacts.' });
    }
  }
  if (f.contact_type === 'company' || f.contact_type === 'both') {
    if (!f.company_name) {
      return res.status(400).json({ error: 'Company name required for company contacts.' });
    }
  }

  const settings = db.settings();
  let pts = 0;

  // Award welcome bonus for thekretan business
  if (f.business === 'thekretan' || f.business === 'both') {
    pts = settings.welcome_bonus || 0;
  }

  const contact = db.insert('contacts', {
    ...f,
    loyalty_points: f.business === 'thekretan' || f.business === 'both' ? pts : undefined,
    total_spent: f.business === 'thekretan' || f.business === 'both' ? 0 : undefined,
    visit_count: f.business === 'thekretan' || f.business === 'both' ? 0 : undefined,
    total_orders: f.business === 'panicsweets' || f.business === 'both' ? 0 : undefined,
    total_revenue: f.business === 'panicsweets' || f.business === 'both' ? 0 : undefined,
    active: 1,
    consent_email: f.consent_email ? 1 : 0,
    consent_sms: f.consent_sms ? 1 : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Award welcome bonus points if applicable
  if (pts > 0) {
    db.insert('kretan_rewards', {
      customer_id: contact.id,
      type: 'earned',
      points: pts,
      description: 'Welcome bonus',
      created_at: new Date().toISOString()
    });
  }

  res.json({ id: contact.id, message: 'Contact created.' });
});

router.put('/:id', (req, res) => {
  const f = req.body;
  const updated = db.update('contacts', parseInt(req.params.id), {
    ...f,
    consent_email: f.consent_email ? 1 : 0,
    consent_sms: f.consent_sms ? 1 : 0,
    updated_at: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Not found.' });
  res.json({ message: 'Updated.' });
});

router.delete('/:id', (req, res) => {
  db.remove('contacts', parseInt(req.params.id));
  res.json({ message: 'Deleted.' });
});

module.exports = router;
