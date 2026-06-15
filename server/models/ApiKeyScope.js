const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ApiKeyScope extends Model {}

ApiKeyScope.init(
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

    permission: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'ApiKeyScope',
    tableName: 'api_key_scopes'
  }
);

module.exports = ApiKeyScope;