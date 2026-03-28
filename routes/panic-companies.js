const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { search, page=1, limit=25, sort='company_name', order='ASC' } = req.query;
  let list = db.where('panic_companies', c => c.active !== false && c.active !== 0);
  if (search) { const s=search.toLowerCase(); list=list.filter(c=>`${c.company_name} ${c.contact_person||''} ${c.email||''}`.toLowerCase().includes(s)); }
  list.sort((a,b)=>{ const av=a[sort]||'',bv=b[sort]||''; return order==='DESC'?String(bv).localeCompare(String(av)):String(av).localeCompare(String(bv)); });
  const total=list.length; const offset=(page-1)*limit;
  res.json({ companies:list.slice(offset,offset+parseInt(limit)), total, page:parseInt(page), pages:Math.ceil(total/limit) });
});

router.get('/:id', (req, res) => {
  const company = db.find('panic_companies', parseInt(req.params.id));
  if (!company) return res.status(404).json({ error:'Not found.' });
  const orders = db.where('panic_orders', o=>o.company_id===company.id).sort((a,b)=>(b.order_date||'').localeCompare(a.order_date||'')).slice(0,20);
  res.json({ company, orders });
});

router.post('/', (req, res) => {
  const f=req.body;
  if (!f.company_name) return res.status(400).json({error:'Company name required.'});
  const company = db.insert('panic_companies', {...f, total_orders:0, total_revenue:0, active:1, consent_email:f.consent_email?1:0, consent_sms:f.consent_sms?1:0, created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
  res.json({id:company.id, message:'Company created.'});
});

router.put('/:id', (req, res) => {
  const f=req.body;
  db.update('panic_companies', parseInt(req.params.id), {...f, consent_email:f.consent_email?1:0, consent_sms:f.consent_sms?1:0, updated_at:new Date().toISOString()});
  res.json({message:'Updated.'});
});

router.delete('/:id', (req, res) => { db.remove('panic_companies',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
