const { AuditLog } = require('../models');

class AuditLogController {

  async list(req, res) {
    try {
      const logs = await AuditLog.findAll();

      return res.json(logs);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditLogController();