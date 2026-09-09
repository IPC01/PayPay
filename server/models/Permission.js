const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Permission extends Model {}

Permission.init(
  {
    id: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
},
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions'
  }
);

module.exports = Permission;