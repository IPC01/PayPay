const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const WalletType = require('./WalletType');
const Wallet = require('./Wallet');
const ApiKey = require('./ApiKey');
const ApiKeyScope = require('./ApiKeyScope');
const AuditLog = require('./AuditLog');
const Ledger = require('./Ledger');
const Transaction = require('./Transaction');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');
const WithdrawalRequest = require('./WithdrawalRequest');
const Notification = require('./Notification');
const Kyc = require('./Kyc');
const KycDocument = require('./KycDocument');
const Setting = require('./Setting');
const DocumentPage = require('./DocumentPage');
const TransactionFee = require('./TransactionFee');
const Package = require('./Package');
const Subscription = require('./Subscription');


// RELAÇÕES

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId'
});
WalletType.hasMany(Wallet, {
  foreignKey: 'walletTypeId'
});

Wallet.belongsTo(WalletType, {
  foreignKey: 'walletTypeId'
});

User.hasMany(Wallet, {
  foreignKey: 'userId'
});

Wallet.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Ticket, {
  foreignKey: 'userId'
});

Ticket.belongsTo(User, {
  foreignKey: 'userId'
});

Ticket.hasMany(TicketMessage, {
  foreignKey: 'ticketId'
});

TicketMessage.belongsTo(Ticket, {
  foreignKey: 'ticketId'
});

TicketMessage.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Kyc, {
  foreignKey: 'userId'
});

Kyc.belongsTo(User, {
  foreignKey: 'userId'
});

Kyc.hasMany(KycDocument, {
  foreignKey: 'kycId'
});

KycDocument.belongsTo(Kyc, {
  foreignKey: 'kycId'
});

User.hasMany(WithdrawalRequest, {
  foreignKey: 'userId'
});

WithdrawalRequest.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(WithdrawalRequest, {
  foreignKey: 'adminId',
  as: 'AdminProcessedWithdrawals'
});

WithdrawalRequest.belongsTo(User, {
  foreignKey: 'adminId',
  as: 'Admin'
});

Wallet.hasMany(WithdrawalRequest, {
  foreignKey: 'walletId'
});

WithdrawalRequest.belongsTo(Wallet, {
  foreignKey: 'walletId'
});

User.hasMany(Notification, {
  foreignKey: 'userId'
});

Notification.belongsTo(User, {
  foreignKey: 'userId'
});

WalletType.hasMany(TransactionFee, {
  foreignKey: 'walletTypeId'
});

TransactionFee.belongsTo(WalletType, {
  foreignKey: 'walletTypeId'
});

Package.hasMany(Subscription, {
  foreignKey: 'packageId'
});

Subscription.belongsTo(Package, {
  foreignKey: 'packageId'
});

User.hasMany(Subscription, {
  foreignKey: 'userId'
});

Subscription.belongsTo(User, {
  foreignKey: 'userId'
});

module.exports = {
  User,
  Role,
  Permission,
  RolePermission,
  WalletType,
  Wallet,
  ApiKey,
  ApiKeyScope,
  AuditLog,
  Ledger,
  Transaction,
  Ticket,
  TicketMessage,
  WithdrawalRequest,
  Notification,
  Kyc,
  KycDocument,
  Setting,
  DocumentPage,
  TransactionFee,
  Package,
  Subscription
};