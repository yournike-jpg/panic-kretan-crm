const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/stats', (req, res) => {
  const activeContacts = db.where('contacts', c=>c.active!==false&&c.active!==0);
  const activeKretanContacts = activeContacts.filter(c => c.business === 'thekretan' || c.business === 'both');
  const activePanicContacts = activeContacts.filter(c => c.business === 'panicsweets' || c.business === 'both');
  const activePanicCompanies = activePanicContacts.filter(c => c.contact_type === 'company' || c.contact_type === 'both');

  res.json({
    thekretan: {
      customers: activeKretanContacts.length,
      revenue_total: db.all('kretan_purchases').reduce((s,p)=>s+(p.total_amount||0),0),
      revenue_month: db.all('kretan_purchases').filter(p=>{const d=new Date(p.purchase_date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,p)=>s+(p.total_amount||0),0),
      active_points: activeKretanContacts.reduce((s,c)=>s+(c.loyalty_points||0),0),
      top_customers: [...activeKretanContacts].sort((a,b)=>(b.total_spent||0)-(a.total_spent||0)).slice(0,5).map(c=>({id:c.id,first_name:c.first_name,last_name:c.last_name,total_spent:c.total_spent||0,loyalty_points:c.loyalty_points||0,visit_count:c.visit_count||0})),
      recent_purchases: db.all('kretan_purchases').sort((a,b)=>(b.purchase_date||'').localeCompare(a.purchase_date||'')).slice(0,5).map(p=>{const c=db.find('contacts',p.customer_id);return{...p,first_name:c?.first_name,last_name:c?.last_name};}),
    },
    panicsweets: {
      contacts: activePanicContacts.length,
      revenue_total: db.all('panic_orders').reduce((s,o)=>s+(o.total_amount||0),0),
      revenue_month: db.all('panic_orders').filter(o=>{const d=new Date(o.order_date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,o)=>s+(o.total_amount||0),0),
      pending_orders: db.where('panic_orders',o=>['pending','confirmed','in_production'].includes(o.status)).length,
      top_companies: [...activePanicCompanies].sort((a,b)=>(b.total_revenue||0)-(a.total_revenue||0)).slice(0,5).map(c=>({id:c.id,company_name:c.company_name,total_orders:c.total_orders||0,total_revenue:c.total_revenue||0})),
      recent_orders: db.all('panic_orders').sort((a,b)=>(b.order_date||'').localeCompare(a.order_date||'')).slice(0,5).map(o=>{const contactId=o.contact_id||o.company_id;const c=db.find('contacts',contactId);const displayName=c?(c.company_name||`${c.first_name} ${c.last_name}`.trim()):null;return{...o,company_name:displayName};}),
    },
    promotions: {
      sent: db.count('promotions',p=>p.status==='sent'),
      drafts: db.count('promotions',p=>p.status==='draft'),
    }
  });
});

module.exports = router;
