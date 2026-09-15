const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ApiKeyWallet extends Model {}

ApiKeyWallet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    apiKeyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    walletId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'ApiKeyWallet',
    tableName: 'api_key_wallets'
  }
);

module.exports = ApiKeyWallet;
