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
      defaultValue: ''
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
    transactionType: {
      type: DataTypes.ENUM('C2B', 'B2C'),
      allowNull: false,
      defaultValue: 'C2B'
    }
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings'
  }
);

module.exports = Setting;
