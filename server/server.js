require('dotenv').config();

const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');
require('./models');

const app = require('./app');

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

const PORT = process.env.PORT || 3000;





async function startServer() {
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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server error:', error);
  }
}

startServer();