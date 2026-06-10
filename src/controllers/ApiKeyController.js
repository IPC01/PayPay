const { ApiKey, ApiKeyScope, Permission } = require('../models');
const crypto = require('crypto');

class ApiKeyController {

  async create(req, res) {
    try {
      const userId = req.user.userId;
      const { name, scopes = [], expiresAt } = req.body;

      const rawKey = crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      // 1. criar API key
      const apiKey = await ApiKey.create({
        userId,
        name,
        keyHash,
        expiresAt
      });

      // 2. validar e ligar scopes corretamente
      for (const scopeName of scopes) {

        // verificar se permission existe no catálogo
        const permission = await Permission.findOne({
          where: { name: scopeName }
        });

        if (!permission) {
          return res.status(400).json({
            error: `Invalid scope: ${scopeName}`
          });
        }

        // ligar scope à API key
        await ApiKeyScope.create({
          apiKeyId: apiKey.id,
          permission: permission.name
        });
      }

      return res.json({
        apiKey: rawKey
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ApiKeyController();