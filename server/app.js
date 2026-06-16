const express = require('express');
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const walletTypeRoutes = require('./routes/walletTypeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');const withdrawRoutes = require('./routes/withdrawRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const kycRoutes = require('./routes/kycRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-api-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/wallet-types', walletTypeRoutes);
app.use('/api/transactions', transactionRoutes);app.use('/api/withdrawals', withdrawRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// payment routes v1
app.use('/api/v1/mpesa/', PaymentRoutes);

// Swagger docs 👇 (FALTAVA ISTO)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Mobile Money API' });
});

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = app;