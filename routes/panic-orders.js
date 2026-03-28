const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { company_id, status, page=1, limit=25 } = req.query;
  let list = db.all('panic_orders');
  if (company_id) list=list.filter(o=>o.company_id===parseInt(company_id));
  if (status) list=list.filter(o=>o.status===status);
  list.sort((a,b)=>(b.order_date||'').localeCompare(a.order_date||''));
  const total=list.length; const offset=(page-1)*limit;
  const orders = list.slice(offset,offset+parseInt(limit)).map(o=>{
    const c=db.find('panic_companies', o.company_id);
    const p=o.package_id?db.find('panic_packages',o.package_id):null;
    return {...o, company_name:c?.company_name, package_name:p?.name};
  });
  res.json({orders,total,page:parseInt(page),pages:Math.ceil(total/limit)});
});

router.post('/', (req, res) => {
  const f=req.body;
  if(!f.company_id||!f.items||!f.total_amount) return res.status(400).json({error:'Company, items, total required.'});
  const order = db.insert('panic_orders',{company_id:parseInt(f.company_id), package_id:f.package_id||null, order_date:f.order_date||new Date().toISOString(), delivery_date:f.delivery_date||null, items:typeof f.items==='string'?f.items:JSON.stringify(f.items), total_amount:f.total_amount, status:f.status||'pending', payment_status:f.payment_status||'unpaid', notes:f.notes||null, created_at:new Date().toISOString()});
  const comp=db.find('panic_companies',parseInt(f.company_id));
  if(comp) db.update('panic_companies',comp.id,{total_orders:(comp.total_orders||0)+1, total_revenue:(comp.total_revenue||0)+f.total_amount, updated_at:new Date().toISOString()});
  res.json({id:order.id,message:'Order created.'});
});

router.put('/:id', (req, res) => {
  db.update('panic_orders',parseInt(req.params.id),req.body);
  res.json({message:'Updated.'});
});

router.delete('/:id', (req, res) => { db.remove('panic_orders',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
