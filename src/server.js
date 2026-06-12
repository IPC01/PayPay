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

    await sequelize.sync({ alter: true });

    console.log('📦 Models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server error:', error);
  }
}

startServer();