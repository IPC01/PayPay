const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.query('ALTER TABLE packages ADD COLUMN isFree TINYINT(1) NOT NULL DEFAULT 0');
    console.log('OK');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
