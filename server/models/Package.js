const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Package extends Model {}

Package.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    promoPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    promoStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    promoEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissionsGranted: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissionsDenied: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Package',
    tableName: 'packages',
    timestamps: true
  }
);

module.exports = Package;
