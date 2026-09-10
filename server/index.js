require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { DataTypes } = require('sequelize');

const sequelize = require('./config/database');
require('./models');
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

app.use('/api/v1/mpesa/', PaymentRoutes);
app.use('/api/emolar', PaymentRoutes);
app.use('/api/payments', paymentsRoutes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Mobile Money API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

async function ensureSettingsColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const table = await queryInterface.describeTable('settings').catch(() => null);
    if (!table) {
      return;
    }

    const columns = [
      {
        name: 'withdrawalFeePercent',
        attributes: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0.0
        }
      },
      {
        name: 'withdrawalMinValue',
        attributes: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.0
        }
      },
      {
        name: 'withdrawalMaxValue',
        attributes: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.0
        }
      }
    ];

    for (const column of columns) {
      if (!table[column.name]) {
        console.log(`🔧 Adding missing settings column: ${column.name}`);
        await queryInterface.addColumn('settings', column.name, column.attributes);
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not verify settings columns:', error.message);
  }
}

async function startServer() {
  const port = process.env.PORT || 3005;

  try {
    console.log('🔌 Connecting to database...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    const syncOptions = {};
    const enableAlter = String(process.env.DB_SYNC_ALTER).toLowerCase() === 'true';
    if (enableAlter) {
      syncOptions.alter = true;
      console.log('🔧 Sequelize sync alter enabled');
    } else {
      console.log('🔧 Sequelize sync alter disabled');
    }

    await sequelize.sync(syncOptions);
    await ensureSettingsColumns();

    console.log('📦 Models synced');

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Server error:', error);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;