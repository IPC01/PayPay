const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DocumentPage extends Model {}

DocumentPage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'DocumentPage',
    tableName: 'document_pages',
    timestamps: true
  }
);

module.exports = DocumentPage;
