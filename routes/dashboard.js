const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/stats', (req, res) => {
  const activeKretanCustomers = db.where('kretan_customers', c=>c.active!==false&&c.active!==0);
  const activePanicCompanies = db.where('panic_companies', c=>c.active!==false&&c.active!==0);

  res.json({
    thekretan: {
      customers: activeKretanCustomers.length,
      revenue_total: db.all('kretan_purchases').reduce((s,p)=>s+(p.total_amount||0),0),
      revenue_month: db.all('kretan_purchases').filter(p=>{const d=new Date(p.purchase_date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,p)=>s+(p.total_amount||0),0),
      active_points: activeKretanCustomers.reduce((s,c)=>s+(c.loyalty_points||0),0),
      top_customers: [...activeKretanCustomers].sort((a,b)=>(b.total_spent||0)-(a.total_spent||0)).slice(0,5).map(c=>({id:c.id,first_name:c.first_name,last_name:c.last_name,total_spent:c.total_spent||0,loyalty_points:c.loyalty_points||0,visit_count:c.visit_count||0})),
      recent_purchases: db.all('kretan_purchases').sort((a,b)=>(b.purchase_date||'').localeCompare(a.purchase_date||'')).slice(0,5).map(p=>{const c=db.find('kretan_customers',p.customer_id);return{...p,first_name:c?.first_name,last_name:c?.last_name};}),
    },
    panicsweets: {
      companies: activePanicCompanies.length,
      revenue_total: db.all('panic_orders').reduce((s,o)=>s+(o.total_amount||0),0),
      revenue_month: db.all('panic_orders').filter(o=>{const d=new Date(o.order_date);const n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();}).reduce((s,o)=>s+(o.total_amount||0),0),
      pending_orders: db.where('panic_orders',o=>['pending','confirmed','in_production'].includes(o.status)).length,
      top_companies: [...activePanicCompanies].sort((a,b)=>(b.total_revenue||0)-(a.total_revenue||0)).slice(0,5).map(c=>({id:c.id,company_name:c.company_name,total_orders:c.total_orders||0,total_revenue:c.total_revenue||0})),
      recent_orders: db.all('panic_orders').sort((a,b)=>(b.order_date||'').localeCompare(a.order_date||'')).slice(0,5).map(o=>{const c=db.find('panic_companies',o.company_id);const displayName=c?.company_name;return{...o,company_name:displayName};}),
    },
    promotions: {
      sent: db.count('promotions',p=>p.status==='sent'),
      drafts: db.count('promotions',p=>p.status==='draft'),
    }
  });
});

module.exports = router;
