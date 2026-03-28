const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
router.use(authenticateToken);

router.get('/', (req, res) => {
  let list = db.all('panic_products');
  if (req.query.category) list = list.filter(p=>p.category===req.query.category);
  if (req.query.active !== undefined) list = list.filter(p=>p.active!=false);
  res.json(list.sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
});

router.post('/', (req, res) => {
  const f=req.body;
  if(!f.name) return res.status(400).json({error:'Name required.'});
  const p=db.insert('panic_products',{...f,active:true,created_at:new Date().toISOString()});
  res.json({id:p.id,message:'Product created.'});
});

router.put('/:id', (req, res) => {
  db.update('panic_products',parseInt(req.params.id),req.body);
  res.json({message:'Updated.'});
});

router.delete('/:id', (req, res) => { db.remove('panic_products',parseInt(req.params.id)); res.json({message:'Deleted.'}); });

module.exports = router;
