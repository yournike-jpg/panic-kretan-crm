const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  let list = db.all('panic_packages');
  if (req.query.type) list=list.filter(p=>p.package_type===req.query.type);
  res.json(list.sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
});

router.post('/', (req, res) => {
  const f=req.body;
  const p=db.insert('panic_packages',{...f, items:typeof f.items==='string'?f.items:JSON.stringify(f.items), active:true, created_at:new Date().toISOString()});
  res.json({id:p.id,message:'Package created.'});
});

router.put('/:id', (req, res) => {
  const f=req.body;
  db.update('panic_packages',parseInt(req.params.id),{...f, items:typeof f.items==='string'?f.items:JSON.stringify(f.items)});
  res.json({message:'Updated.'});
});

router.delete('/:id', (req, res) => { db.remove('panic_packages',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
