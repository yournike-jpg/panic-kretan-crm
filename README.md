# CRM System — The Kretan & Panic Sweets

A full-stack CRM application for managing customers, companies, orders, rewards, and promotional campaigns.

## Features

### The Kretan (B2C)
- Customer database with personal & family details
- Purchase history tracking
- Points-based loyalty rewards system (configurable)
- Welcome & birthday bonus points
- Customer segmentation & tags

### Panic Sweets (B2B)
- Company/partner management
- Product catalog with categories (brownies, energy bars, chocolates, etc.)
- Standard & custom product packages
- Order management with status tracking (pending → delivered)
- Payment tracking

### Shared
- Promotional campaigns (email & SMS) for both businesses
- Dashboard with analytics & KPIs
- Multi-user access with JWT authentication (admin/user roles)
- Contact export for marketing platforms

## Quick Start

### Requirements
- Node.js 18+ (https://nodejs.org)
- npm (comes with Node.js)

### Installation

```bash
# 1. Navigate to the project folder
cd crm-system

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The app will be running at **http://localhost:3000**

### Default Login
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change the admin password and JWT_SECRET in `.env` before deploying to production!

## Configuration

Edit the `.env` file:

```
PORT=3000                              # Server port
JWT_SECRET=your-secret-key-here        # Change this!
DB_PATH=./crm.db                       # SQLite database file path
```

## Free Hosting Options

### Option 1: Railway.app (Recommended)
1. Create account at https://railway.app
2. Connect your GitHub repo or upload the project
3. Railway auto-detects Node.js and deploys
4. Free tier includes 500 hours/month

### Option 2: Render.com
1. Create account at https://render.com
2. Create a new "Web Service"
3. Connect repo or upload
4. Set start command: `npm start`

### Option 3: Run on your computer
Just run `npm start` and access from any device on the same network using your computer's IP address.

## Project Structure

```
crm-system/
├── server.js              # Express server & app entry point
├── database.js            # SQLite schema & initialization
├── package.json
├── .env                   # Configuration
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── routes/
│   ├── auth.js            # Login, user management
│   ├── kretan-customers.js # Customer CRUD + search
│   ├── kretan-purchases.js # Purchases + points system
│   ├── panic-companies.js  # Company CRUD + search
│   ├── panic-products.js   # Product catalog
│   ├── panic-packages.js   # Product packages
│   ├── panic-orders.js     # Order management
│   ├── promotions.js       # Campaign management
│   ├── dashboard.js        # Analytics & stats
│   └── rewards.js          # Rewards settings
├── utils/
│   └── password.js         # Password hashing (crypto)
└── public/
    └── index.html          # Complete React SPA frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `GET /api/auth/users` - List users (admin)
- `POST /api/auth/users` - Create user (admin)

### The Kretan
- `GET/POST /api/kretan/customers` - List/Create customers
- `GET/PUT/DELETE /api/kretan/customers/:id` - Customer CRUD
- `GET/POST /api/kretan/purchases` - Purchases
- `POST /api/kretan/purchases/redeem` - Redeem points

### Panic Sweets
- `GET/POST /api/panic/companies` - Companies
- `GET/POST /api/panic/products` - Products
- `GET/POST /api/panic/packages` - Packages
- `GET/POST /api/panic/orders` - Orders

### Shared
- `GET/POST /api/promotions` - Campaigns
- `POST /api/promotions/:id/send` - Mark as sent
- `GET /api/dashboard/stats` - Dashboard data
- `GET/PUT /api/rewards/settings` - Rewards config

## Email/SMS Integration

The CRM is designed to connect with external services for sending promotions. When you're ready:

**For Email:** Connect with Mailchimp, Brevo (Sendinblue), or any SMTP service. Use the `/api/kretan/customers/export/contacts` and `/api/panic/companies/export/contacts` endpoints to get recipient lists.

**For SMS:** Connect with Twilio, MessageBird, or a local SMS provider. The same export endpoints provide phone numbers.

## Adding New Users

Login as admin, then use the API:
```bash
curl -X POST http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"maria","password":"secure123","full_name":"Maria K.","role":"user","business":"both"}'
```

## Database

The app uses SQLite — a single file (`crm.db`) that contains all your data. Back it up regularly by copying this file.
