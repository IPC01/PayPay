const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Ticket extends Model {}

Ticket.init(
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'normal'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets'
  }
);

module.exports = Ticket;
