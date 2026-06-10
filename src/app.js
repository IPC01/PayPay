const express = require('express');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

const app = express();

app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/keys', apiKeyRoutes);

// payment routes v1
app.use('/api/v1/mpesa/', PaymentRoutes);

// Swagger docs 👇 (FALTAVA ISTO)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = app;