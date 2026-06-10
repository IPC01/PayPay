const crypto = require('crypto');
const { ApiKey } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const key = req.headers['x-api-key'];

    if (!key) {
      return res.status(401).json({ error: 'API key missing' });
    }

    const keyHash = crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');

    const apiKey = await ApiKey.findOne({
      where: { keyHash, isActive: true }
    });

    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // attach to request
    req.apiKey = apiKey;

    next();

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};