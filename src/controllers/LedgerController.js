const { Ledger } = require('../models');

class LedgerController {

  async list(req, res) {
    try {
      const logs = await Ledger.findAll();

      return res.json(logs);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new LedgerController();