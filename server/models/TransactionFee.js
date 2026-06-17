const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TransactionFee extends Model {}

TransactionFee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    walletTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('c2b', 'b2c'),
      allowNull: false
    },
    feePercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0
    }
  },
  {
    sequelize,
    modelName: 'TransactionFee',
    tableName: 'transaction_fees',
    timestamps: true
  }
);

module.exports = TransactionFee;
