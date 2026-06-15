const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ApiKey extends Model {}

ApiKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    keyHash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ApiKey',
    tableName: 'api_keys'
  }
);

module.exports = ApiKey;