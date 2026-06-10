const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Ledger extends Model {}

Ledger.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    transactionId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    walletId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    type: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false
    },

    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    balanceBefore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    balanceAfter: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Ledger',
    tableName: 'ledger'
  }
);

module.exports = Ledger;