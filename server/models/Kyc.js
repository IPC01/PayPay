const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Kyc extends Model {}

Kyc.init(
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
    type: {
      type: DataTypes.ENUM('INDIVIDUAL', 'BUSINESS'),
      allowNull: false,
      defaultValue: 'INDIVIDUAL'
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'DRAFT'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phonePrimary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneSecondary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    neighborhood: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true
    },
    houseNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sourceOfFunds: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accountPurpose: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    monthlyVolume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    annualVolume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    originOfFunds: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mainOperationCountry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    termsAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otherNames: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documentType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documentNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    documentIssuedAt: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    documentExpiresAt: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    documentIssuer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nuit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    employer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    selfieValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    documentValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    addressValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tradeName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyNuit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    legalForm: {
      type: DataTypes.STRING,
      allowNull: true
    },
    economicSector: {
      type: DataTypes.STRING,
      allowNull: true
    },
    activityDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    socialLinks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    businessEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    businessPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    iban: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyMonthlyVolume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyAnnualVolume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    beneficialOwnerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    beneficialOwnerNationality: {
      type: DataTypes.STRING,
      allowNull: true
    },
    beneficialOwnerDob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    beneficialOwnerDocumentNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    beneficialOwnerShare: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Kyc',
    tableName: 'kycs',
    timestamps: true
  }
);

module.exports = Kyc;
