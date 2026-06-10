const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    action: {
      type: DataTypes.STRING,
      allowNull: false
    },

    entity: {
      type: DataTypes.STRING
    },

    entityId: {
      type: DataTypes.STRING
    },

    ip: {
      type: DataTypes.STRING
    },

    userAgent: {
      type: DataTypes.STRING
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs'
  }
);

module.exports = AuditLog;