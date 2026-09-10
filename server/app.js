const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const walletTypeRoutes = require('./routes/walletTypeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const kycRoutes = require('./routes/kycRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const legalPageRoutes = require('./routes/legalPageRoutes');
const packageRoutes = require('./routes/packageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const mpesaServiceTestRoutes = require('./routes/mpesaServiceTestRoutes');

const app = express();

// ================= CORS =================
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/wallet-types', walletTypeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdrawals', withdrawRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/legal-pages', legalPageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mpesa-service-test', mpesaServiceTestRoutes);

// payment routes v1
app.use('/api/v1/mpesa/', PaymentRoutes);
app.use('/api/emolar', PaymentRoutes);
app.use('/api/payments', paymentsRoutes);

// Swagger docs 👇 (FALTAVA ISTO)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Mobile Money API' });
});

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = app;