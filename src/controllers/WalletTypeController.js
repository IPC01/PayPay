const { WalletType } = require('../models');

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
      const { status } = req.body;

      const type = await WalletType.findByPk(id);

      if (!type) {
        return res.status(404).json({
          error: 'Wallet type not found'
        });
      }

      type.status = status;
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