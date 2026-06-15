const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class TicketMessage extends Model {}

TicketMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ticketId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'TicketMessage',
    tableName: 'ticket_messages'
  }
);

module.exports = TicketMessage;
