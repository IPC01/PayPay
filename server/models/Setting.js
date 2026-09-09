const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Setting extends Model {}

Setting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    platformName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'SAMPAY'
    },
    logoImg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contacts: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    additionalInfo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    withdrawalFeePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    withdrawalMinValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    withdrawalMaxValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0
    }
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings'
  }
);

module.exports = Setting;
