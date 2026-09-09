const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ApiKey } = require('../models');

module.exports = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization must use Bearer token'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({
        error: 'Bearer token missing'
      });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      return res.status(401).json({
        error: 'Invalid API key token'
      });
    }

    const keyHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const apiKey = await ApiKey.findOne({
      where: {
        keyHash,
        isActive: true
      }
    });

    if (!apiKey) {
      return res.status(401).json({
        error: 'Invalid API key'
      });
    }

    if (
      apiKey.expiresAt &&
      new Date() > apiKey.expiresAt
    ) {
      return res.status(401).json({
        error: 'API key expired'
      });
    }

    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    req.apiKey = apiKey;

    next();

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};