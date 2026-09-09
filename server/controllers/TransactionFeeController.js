const { TransactionFee, WalletType } = require('../models');

class TransactionFeeController {
  async getFees(req, res) {
    try {
      const fees = await TransactionFee.findAll({
        include: [{ model: WalletType, attributes: ['id', 'code', 'name'] }],
        order: [['walletTypeId', 'ASC'], ['type', 'ASC']]
      });
      return res.json(fees);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async saveFees(req, res) {
    try {
      const { fees } = req.body;
      if (!Array.isArray(fees)) {
        return res.status(400).json({ error: 'Fees must be an array' });
      }

      const saved = [];
      for (const feeData of fees) {
        const { id, walletTypeId, type, feePercent } = feeData;
        if (!walletTypeId || !type || typeof feePercent === 'undefined') {
          continue;
        }

        const data = {
          walletTypeId,
          type,
          feePercent: parseFloat(feePercent) || 0.0
        };

        if (id) {
          const existing = await TransactionFee.findByPk(id);
          if (existing) {
            await existing.update(data);
            saved.push(existing);
            continue;
          }
        }

        const created = await TransactionFee.create(data);
        saved.push(created);
      }

      return res.json(saved);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteFee(req, res) {
    try {
      const { id } = req.params;
      const fee = await TransactionFee.findByPk(id);
      if (!fee) {
        return res.status(404).json({ error: 'Taxa não encontrada' });
      }
      await fee.destroy();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionFeeController();
