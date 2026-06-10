const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Role extends Model {}

Role.init(
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
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles'
  }
);

module.exports = Role;