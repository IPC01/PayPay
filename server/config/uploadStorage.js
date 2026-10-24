const path = require('path');

const defaultUploadsDir = path.resolve(__dirname, '../../../PayPay-data/uploads');

function getUploadsDir() {
  return path.resolve(process.env.UPLOADS_DIR || defaultUploadsDir);
}

module.exports = { getUploadsDir };
