const { Wallet, WalletType } = require('../models');
const generateUniqueCode = require('../helpers/generateCode');

class WalletController {

  // CREATE WALLET
  async create(req, res) {
    try {
      const userId = req.user.userId;
      const { walletName,walletTypeId, currency } = req.body;

      // validar wallet type
      const walletType = await WalletType.findByPk(walletTypeId);

      if (!walletType || !walletType.status) {
        return res.status(400).json({
          error: 'Invalid wallet type'
        });
      }

      // gerar wallet code único usando o helper
      let walletCode;
      try {
        walletCode = await generateUniqueCode();
      } catch (codeError) {
        return res.status(500).json({
          error: 'Unable to generate unique wallet code: ' + codeError.message
        });
      }

      const wallet = await Wallet.create({
        userId,
        walletTypeId,
        walletCode,
        walletName,
        currency: currency || 'MZN',
        balance: 0.00,
        status: 'ACTIVE'
      });

      return res.status(201).json({
        message: 'Wallet created successfully',
        wallet
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // LIST USER WALLETS
  async getUserWallets(req, res) {
    try {
      const userId = req.user.userId;

      const wallets = await Wallet.findAll({
        where: { userId },
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.json(wallets);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // GET WALLET BY CODE
  async getByCode(req, res) {
    try {
      const { code } = req.params;

      const wallet = await Wallet.findOne({
        where: { walletCode: code },
        include: [
          {
            model: WalletType
          }
        ]
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Wallet not found'
        });
      }

      return res.json(wallet);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // UPDATE STATUS (admin/ops)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const wallet = await Wallet.findByPk(id);

      if (!wallet) {
        return res.status(404).json({
          error: 'Wallet not found'
        });
      }

      // Validar status
      const validStatuses = ['ACTIVE', 'FROZEN', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status. Must be ACTIVE, FROZEN, or CLOSED'
        });
      }

      wallet.status = status;
      await wallet.save();

      return res.json({
        message: 'Wallet status updated',
        wallet
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new WalletController();