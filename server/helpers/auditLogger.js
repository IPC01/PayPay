const { AuditLog } = require('../models');

async function createAuditLog({ userId, action, entity = null, entityId = null, ip = null, userAgent = null }) {
  return AuditLog.create({
    userId,
    action,
    entity,
    entityId,
    ip,
    userAgent
  });
}

module.exports = {
  createAuditLog
};
