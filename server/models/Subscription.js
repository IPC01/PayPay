const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Subscription extends Model {}

Subscription.init(
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
    packageId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled'),
      defaultValue: 'pending'
    },
    pricePaid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true
  }
);

module.exports = Subscription;
