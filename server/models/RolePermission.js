const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RolePermission extends Model {}

RolePermission.init(
  {
   id: {
  type: DataTypes.INTEGER,
  autoIncrement: true,
  primaryKey: true
},

    roleId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    permissionId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions'
  }
);

module.exports = RolePermission;