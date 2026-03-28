const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { company_id, contact_id, status, page=1, limit=25 } = req.query;
  let list = db.all('panic_orders');
  // Accept both company_id and contact_id for backward compatibility
  const id = company_id || contact_id;
  if (id) list=list.filter(o=>(o.company_id===parseInt(id) || o.contact_id===parseInt(id)));
  if (status) list=list.filter(o=>o.status===status);
  list.sort((a,b)=>(b.order_date||'').localeCompare(a.order_date||''));
  const total=list.length; const offset=(page-1)*limit;
  const orders = list.slice(offset,offset+parseInt(limit)).map(o=>{
    const contactId = o.contact_id || o.company_id;
    const c=db.find('contacts', contactId);
    const p=o.package_id?db.find('panic_packages',o.package_id):null;
    const displayName = c ? (c.company_name || `${c.first_name} ${c.last_name}`.trim()) : null;
    return {...o, company_name:displayName, package_name:p?.name};
  });
  res.json({orders,total,page:parseInt(page),pages:Math.ceil(total/limit)});
});

router.post('/', (req, res) => {
  const f=req.body;
  const contactId = f.contact_id || f.company_id;
  if(!contactId||!f.items||!f.total_amount) return res.status(400).json({error:'Contact, items, total required.'});
  const order = db.insert('panic_orders',{contact_id:parseInt(contactId), company_id:parseInt(contactId), package_id:f.package_id||null, order_date:f.order_date||new Date().toISOString(), delivery_date:f.delivery_date||null, items:typeof f.items==='string'?f.items:JSON.stringify(f.items), total_amount:f.total_amount, status:f.status||'pending', payment_status:f.payment_status||'unpaid', notes:f.notes||null, created_at:new Date().toISOString()});
  const comp=db.find('contacts',parseInt(contactId));
  if(comp) db.update('contacts',comp.id,{total_orders:(comp.total_orders||0)+1, total_revenue:(comp.total_revenue||0)+f.total_amount, updated_at:new Date().toISOString()});
  res.json({id:order.id,message:'Order created.'});
});

router.put('/:id', (req, res) => {
  db.update('panic_orders',parseInt(req.params.id),req.body);
  res.json({message:'Updated.'});
});

router.delete('/:id', (req, res) => { db.remove('panic_orders',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
