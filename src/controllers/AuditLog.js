const { AuditLog } = require('../models');

class AuditLogController {

  async list(req, res) {
    try {
      const logs = await AuditLog.findAll({
        order: [['createdAt', 'DESC']]
      });

      return res.json(logs);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { action, entity, entityId } = req.body;
      const audit = await AuditLog.create({
        userId: req.user?.userId || null,
        action,
        entity,
        entityId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json(audit);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditLogController();