const express = require('express');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const walletTypeRoutes = require('./routes/walletTypeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
app.use('/api/transactions', transactionRoutes);
app.use('/api/keys', apiKeyRoutes);

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