const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    fromWalletId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    toWalletId: {
      type: DataTypes.UUID,
      allowNull: true
    },

    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    walletCode: {
      type: DataTypes.STRING,
      allowNull: false
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },

    reference: {
      type: DataTypes.STRING,
      unique: true
    },

    apiKeyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions'
  }
);

module.exports = Transaction;