const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

initializeDatabase();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/kretan/purchases', require('./routes/kretan-purchases'));
app.use('/api/panic/products', require('./routes/panic-products'));
app.use('/api/panic/packages', require('./routes/panic-packages'));
app.use('/api/panic/orders', require('./routes/panic-orders'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/rewards', require('./routes/rewards'));

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

app.listen(PORT, () => {
  console.log(`\nCRM System running at http://localhost:${PORT}`);
  console.log(`Default login: admin / admin123\n`);
});
