const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  ApiKey,
  ApiKeyScope,
  ApiKeyWallet,
  Permission,
  Wallet
} = require('../models');
const { hasApprovedKyc } = require('../helpers/kycHelper');
const { hasActivePackage, getAllowedScopesForUser } = require('../helpers/subscriptionHelper');

class ApiKeyController {

  async create(req, res) {
    try {

      const userId = req.user.userId;

      if (!(await hasApprovedKyc(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'KYC deve ser aprovado para criar chaves de API' });
      }

      if (!(await hasActivePackage(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'Deve subscrever um pacote para poder criar chaves de API' });
      }

      const {
        name,
        scopes = [],
        expiresAt,
        walletIds = []
      } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Name is required'
        });
      }

      const allowedScopes = await getAllowedScopesForUser(userId, req.user.roleId);
      if (allowedScopes) {
        const disallowed = scopes.filter((scope) => !allowedScopes.includes(scope));
        if (disallowed.length > 0) {
          return res.status(403).json({
            error: `O seu pacote não permite os seguintes escopos: ${disallowed.join(', ')}`
          });
        }
      }

      if (!Array.isArray(walletIds) || walletIds.length === 0) {
        return res.status(400).json({
          error: 'Selecione pelo menos uma carteira para associar à chave'
        });
      }

      const wallets = await Wallet.findAll({
        where: { id: walletIds, userId }
      });

      if (wallets.length !== walletIds.length) {
        return res.status(400).json({
          error: 'Uma ou mais carteiras selecionadas não pertencem ao utilizador'
        });
      }

      const payload = {
        userId,
        name,
        scopes,
        walletIds
      };

      const options = {};
      if (expiresAt) {
        const expiresInSeconds = Math.max(1, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
        options.expiresIn = expiresInSeconds;
      }

      const rawKey = jwt.sign(payload, process.env.JWT_SECRET, options);
      const keyHash = crypto
        .createHash('sha256')
        .update(rawKey)
        .digest('hex');

      const apiKey = await ApiKey.create({
        userId,
        name,
        expiresAt,
        keyHash
      });

      for (const scopeName of scopes) {

        const permission =
          await Permission.findOne({
            where: {
              name: scopeName
            }
          });

        if (!permission) {

          await apiKey.destroy();

          return res.status(400).json({
            error: `Invalid scope: ${scopeName}`
          });
        }

        await ApiKeyScope.create({
          apiKeyId: apiKey.id,
          permission: permission.name
        });
      }

      for (const wallet of wallets) {
        await ApiKeyWallet.create({
          apiKeyId: apiKey.id,
          walletId: wallet.id
        });
      }

      return res.status(201).json({
        message: 'API Key created successfully',

        tokenType: 'Bearer',

        token: rawKey,
        bearerToken: rawKey,

        authorizationHeader:
          `Bearer ${rawKey}`,

        expiresAt: apiKey.expiresAt
      });

    } catch (error) {

      return res.status(500).json({
        error: error.message
      });

    }
  }

  async list(req, res) {
    try {

      const userId = req.user.userId;

      const apiKeys = await ApiKey.findAll({
        where: { userId },

        attributes: [
          'id',
          'name',
          'expiresAt',
          'isActive',
          'lastUsedAt',
          'createdAt'
        ],

        include: [
          {
            model: Wallet,
            attributes: ['id', 'walletCode', 'walletName'],
            through: { attributes: [] }
          }
        ]
      });

      return res.json({
        apiKeys
      });

    } catch (error) {

      return res.status(500).json({
        error: error.message
      });

    }
  }

  async update(req, res) {
    try {

      const userId = req.user.userId;
      const { id } = req.params;

      const {
        isActive,
        expiresAt,
        action
      } = req.body;

      const apiKey =
        await ApiKey.findOne({
          where: {
            id,
            userId
          }
        });

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found'
        });
      }

      if (
        typeof isActive !== 'undefined'
      ) {
        apiKey.isActive = Boolean(isActive);
      }

      if (action === 'renew') {

        apiKey.expiresAt = new Date(
          Date.now() +
          (30 * 24 * 60 * 60 * 1000)
        );

      } else if (expiresAt) {

        const parsed =
          new Date(expiresAt);

        if (
          Number.isNaN(
            parsed.getTime()
          )
        ) {
          return res.status(400).json({
            error: 'Invalid expiresAt date'
          });
        }

        apiKey.expiresAt = parsed;
      }

      await apiKey.save();

      return res.json({
        apiKey
      });

    } catch (error) {

      return res.status(500).json({
        error: error.message
      });

    }
  }

  async delete(req, res) {
    try {

      const userId = req.user.userId;
      const { id } = req.params;

      const apiKey =
        await ApiKey.findOne({
          where: {
            id,
            userId
          }
        });

      if (!apiKey) {
        return res.status(404).json({
          error: 'API key not found'
        });
      }

      await apiKey.destroy();

      return res.json({
        success: true
      });

    } catch (error) {

      return res.status(500).json({
        error: error.message
      });

    }
  }
}

module.exports = new ApiKeyController();