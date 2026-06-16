const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class KycDocument extends Model {}

KycDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    kycId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    internalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    extension: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    adminApprover: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'KycDocument',
    tableName: 'kyc_documents',
    timestamps: false
  }
);

module.exports = KycDocument;
