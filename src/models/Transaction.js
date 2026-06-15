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
    type: {
      type: DataTypes.STRING,
      defaultValue: 'payment'
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

    provider: {
      type: DataTypes.STRING,
      allowNull: true
    },

    providerReference: {
      type: DataTypes.STRING,
      allowNull: true
    },

    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    providerResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    providerResponseCode: {
      type: DataTypes.STRING,
      allowNull: true
    },

    providerResponseMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    systemErrorCode: {
      type: DataTypes.STRING,
      allowNull: true
    },

    systemErrorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    apiKeyId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions'
  }
);

module.exports = Transaction;