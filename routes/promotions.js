const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { business, status, page=1, limit=25 } = req.query;
  let list = db.all('promotions');
  if (business) list=list.filter(p=>p.business===business);
  if (status) list=list.filter(p=>p.status===status);
  list.sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
  const total=list.length; const offset=(page-1)*limit;
  res.json({promotions:list.slice(offset,offset+parseInt(limit)),total,page:parseInt(page),pages:Math.ceil(total/limit)});
});

router.get('/:id', (req, res) => {
  const p=db.find('promotions',parseInt(req.params.id));
  if(!p) return res.status(404).json({error:'Not found.'});
  res.json(p);
});

router.post('/', (req, res) => {
  const f=req.body;
  const p=db.insert('promotions',{...f, target_filter:f.target_filter?JSON.stringify(f.target_filter):null, recipients_count:0, created_by:req.user.id, created_at:new Date().toISOString()});
  res.json({id:p.id,message:'Promotion created.'});
});

router.put('/:id', (req, res) => {
  db.update('promotions',parseInt(req.params.id),req.body);
  res.json({message:'Updated.'});
});

router.post('/:id/send', (req, res) => {
  const p=db.find('promotions',parseInt(req.params.id));
  if(!p) return res.status(404).json({error:'Not found.'});
  let count=0;
  if(p.business==='thekretan') {
    count=db.where('kretan_customers',c=>
      c.active!==false&&c.active!==0&&
      (p.type==='email'?(c.consent_email&&c.email):(c.consent_sms&&c.mobile))
    ).length;
  } else if(p.business==='panicsweets') {
    count=db.where('panic_companies',c=>
      c.active!==false&&c.active!==0&&
      (p.type==='email'?(c.consent_email&&c.email):(c.consent_sms&&c.mobile))
    ).length;
  }
  db.update('promotions',p.id,{status:'sent',sent_date:new Date().toISOString(),recipients_count:count});
  res.json({message:`Sent to ${count} recipients.`,recipients_count:count});
});

router.delete('/:id', (req, res) => { db.remove('promotions',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
