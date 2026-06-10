const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class WalletType extends Model {}

WalletType.init(
  {
   id: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
},

    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    provider: {
      type: DataTypes.STRING,
      allowNull: true
    },

    isExternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'WalletType',
    tableName: 'wallet_types'
  }
);

module.exports = WalletType;