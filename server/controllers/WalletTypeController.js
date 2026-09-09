const { WalletType } = require('../models');
const { saveBase64Image } = require('../helpers/imageStorage');

class WalletTypeController {

  // CREATE WALLET TYPE (admin only)
  async create(req, res) {
    try {
      const { code, name, provider, isExternal } = req.body;

      const exists = await WalletType.findOne({
        where: { code }
      });

      if (exists) {
        return res.status(400).json({
          error: 'Wallet type already exists'
        });
      }

      const type = await WalletType.create({
        code,
        name,
        provider,
        isExternal: isExternal || false,
        status: true
      });

      return res.status(201).json(type);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // LIST ALL TYPES
  async getAll(req, res) {
    try {
      const types = await WalletType.findAll();

      return res.json(types);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // UPDATE TYPE STATUS
  async update(req, res) {
    try {
      const { id } = req.params;
      const { status, name, provider, imageBase64 } = req.body;

      const type = await WalletType.findByPk(id);

      if (!type) {
        return res.status(404).json({
          error: 'Wallet type not found'
        });
      }

      if (typeof status !== 'undefined') {
        type.status = Boolean(status);
      }
      if (name) type.name = name;
      if (provider) type.provider = provider;

      if (imageBase64) {
        try {
          const imageUrl = await saveBase64Image(imageBase64, 'wallet-types', `wallet-type-${type.id}`);
          type.imageUrl = imageUrl;
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      }

      await type.save();

      return res.json({
        message: 'Wallet type updated',
        type
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new WalletTypeController();