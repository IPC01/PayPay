const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {}

Notification.init(
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      defaultValue: 'info'
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  }
);

module.exports = Notification;
