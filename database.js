const fs = require('fs');
const path = require('path');
const { hashPassword } = require('./utils/password');

const DB_PATH = path.resolve(__dirname, 'crm-data.json');
let _data = null;

function loadData() {
  if (_data) return _data;
  try {
    if (fs.existsSync(DB_PATH)) {
      _data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return _data;
    }
  } catch (e) { console.error('Error loading data:', e.message); }
  _data = {
    users: [], contacts: [], kretan_purchases: [], kretan_rewards: [], kretan_communications: [],
    panic_products: [], panic_packages: [], panic_orders: [],
    promotions: [],
    rewards_settings: { id:1, points_per_euro:1, redemption_rate:0.01, welcome_bonus:50, birthday_bonus:100, min_redeem_points:100 },
    _next_id: 1000
  };
  return _data;
}

function save() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(_data, null, 2), 'utf-8'); }
  catch (e) { console.error('Save error:', e.message); }
}

function nextId() { const d = loadData(); const id = d._next_id; d._next_id = id + 1; save(); return id; }

const db = {
  all(col) { return loadData()[col] || []; },
  find(col, id) { return (loadData()[col] || []).find(r => r.id === id); },
  where(col, fn) { return (loadData()[col] || []).filter(fn); },
  count(col, fn) { const a = loadData()[col] || []; return fn ? a.filter(fn).length : a.length; },
  sum(col, field, fn) { const a = fn ? (loadData()[col]||[]).filter(fn) : (loadData()[col]||[]); return a.reduce((s,r) => s + (r[field]||0), 0); },
  insert(col, item) { const d = loadData(); if (!item.id) item.id = nextId(); if (!d[col]) d[col] = []; d[col].push(item); save(); return item; },
  update(col, id, upd) { const d = loadData(); const a = d[col]||[]; const i = a.findIndex(r=>r.id===id); if(i===-1) return null; a[i]={...a[i],...upd}; save(); return a[i]; },
  remove(col, id) { const d = loadData(); d[col] = (d[col]||[]).filter(r=>r.id!==id); save(); },
  settings() { return loadData().rewards_settings; },
  updateSettings(upd) { const d = loadData(); d.rewards_settings = {...d.rewards_settings,...upd}; save(); return d.rewards_settings; },
  save, nextId
};

function initializeDatabase() {
  const data = loadData();
  if (data.users.length === 0) {
    db.insert('users', { username:'admin', password_hash: hashPassword('admin123'), full_name:'Administrator', role:'admin', business:'both', active:1, created_at: new Date().toISOString() });
    console.log('Default admin created: admin / admin123');
  }
  console.log(`Database: ${data.users.length} users, ${data.contacts.length} contacts`);
}

module.exports = { db, initializeDatabase };
