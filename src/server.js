require('dotenv').config();

const sequelize = require('./config/database');
require('./models');

const app = require('./app');

const PORT = process.env.PORT || 3000;





async function startServer() {
  try {

    console.log('🔌 Connecting to database...');

    await sequelize.authenticate();
    console.log('✅ Database connected');

    const syncOptions = {};
    if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC_ALTER === 'true') {
      syncOptions.alter = true;
    }

    await sequelize.sync(syncOptions);

    console.log('📦 Models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server error:', error);
  }
}

startServer();