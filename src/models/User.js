const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init(
  {
   id: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
},
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },

    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  }
);

module.exports = User;