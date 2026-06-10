const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Wallet extends Model {}

Wallet.init(
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

    walletCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
     walletName: {
      type: DataTypes.STRING,
      allowNull: false,
     
    },
    walletTypeId: {
  type: DataTypes.INTEGER,
  allowNull: false
},

    balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },

    currency: {
      type: DataTypes.STRING,
      defaultValue: 'MZN'
    },

    status: {
      type: DataTypes.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
      defaultValue: 'ACTIVE'
    }
  },
  {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    timestamps: true
  }
);

module.exports = Wallet;