const { WithdrawalRequest, Wallet, Transaction, Ledger, Notification, User, Setting, WalletType } = require('../models');
const sequelize = require('../config/database');
const { createAuditLog } = require('../helpers/auditLogger');
const { hasApprovedKyc } = require('../helpers/kycHelper');

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function getLocalPhone(phone) {
  let digits = normalizePhone(phone);
  if (digits.startsWith('258')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

function validateWithdrawalPhone(phone, walletTypeCode) {
  const cleaned = getLocalPhone(phone);
  if (cleaned.length !== 9) {
    return false;
  }

  const typeCode = String(walletTypeCode || '').toLowerCase();
  if (typeCode.includes('mpesa')) {
    return /^(84|85)\d{7}$/.test(cleaned);
  }
  if (typeCode.includes('emola')) {
    return /^(86|87)\d{7}$/.test(cleaned);
  }
  if (typeCode.includes('mkesh')) {
    return /^(82|83)\d{7}$/.test(cleaned);
  }

  return true;
}

function getPhoneValidationMessage(walletTypeCode) {
  const typeCode = String(walletTypeCode || '').toLowerCase();
  if (typeCode.includes('mpesa')) {
    return 'O número deve começar com 84 ou 85 e conter 9 dígitos locais.';
  }
  if (typeCode.includes('emola')) {
    return 'O número deve começar com 86 ou 87 e conter 9 dígitos locais.';
  }
  if (typeCode.includes('mkesh')) {
    return 'O número deve começar com 82 ou 83 e conter 9 dígitos locais.';
  }
  return 'O número de telefone não está em um formato válido para esta carteira.';
}

function calculateWithdrawalFee(amount, feePercent) {
  const parsed = Number(amount);
  const fee = Number(feePercent);
  if (!Number.isFinite(parsed) || !Number.isFinite(fee) || parsed <= 0 || fee <= 0) {
    return 0;
  }
  return Number(((parsed * fee) / 100).toFixed(2));
}

function toNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

class WithdrawalRequestController {
  async create(req, res) {
    try {
      const userId = req.user.userId;

      if (!(await hasApprovedKyc(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'KYC deve ser aprovado para realizar levantamentos' });
      }

      const {
        walletId,
        amount,
        phone,
        phoneNumber,
        note,
        notes
      } = req.body;

      const requestedPhone = phone || phoneNumber;
      const requestedNote = note || notes;

      if (!walletId || !amount || !requestedPhone) {
        return res.status(400).json({ error: 'walletId, amount and phone are required' });
      }

      const wallet = await Wallet.findByPk(walletId, {
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name']
          }
        ]
      });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (wallet.userId !== userId) {
        return res.status(403).json({ error: 'You are not allowed to request withdrawals for this wallet' });
      }

      if (wallet.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Wallet is not active' });
      }

      if (wallet.allowWithdraw === false) {
        return res.status(403).json({ error: 'Wallet is not authorized to request withdrawals' });
      }

      const settings = await Setting.findOne();
      const withdrawalFeePercent = Number(settings?.withdrawalFeePercent) || 0;
      const withdrawalMinValue = Number(settings?.withdrawalMinValue) || 0;
      const withdrawalMaxValue = Number(settings?.withdrawalMaxValue) || 0;

      const requestedAmount = parseFloat(amount);
      if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
      }

      if (withdrawalMinValue > 0 && requestedAmount < withdrawalMinValue) {
        return res.status(400).json({ error: `O valor mínimo de saque é ${withdrawalMinValue.toFixed(2)}.` });
      }

      if (withdrawalMaxValue > 0 && requestedAmount > withdrawalMaxValue) {
        return res.status(400).json({ error: `O valor máximo de saque é ${withdrawalMaxValue.toFixed(2)}.` });
      }

      if (!validateWithdrawalPhone(requestedPhone, wallet.WalletType?.code || wallet.WalletType?.name)) {
        return res.status(400).json({ error: getPhoneValidationMessage(wallet.WalletType?.code || wallet.WalletType?.name) });
      }

      const feeAmount = calculateWithdrawalFee(requestedAmount, withdrawalFeePercent);
      const totalRequired = requestedAmount + feeAmount;
      const currentBalance = parseFloat(wallet.balance || 0);
      if (currentBalance < totalRequired) {
        return res.status(400).json({ error: 'Saldo insuficiente para cobrir o valor solicitado e a taxa de saque.' });
      }

      const request = await WithdrawalRequest.create({
        walletId,
        userId,
        amount: requestedAmount,
        phone: requestedPhone,
        note: requestedNote || null,
        status: 'pending'
      });

      await Notification.create({
        userId,
        title: 'Pedido de saque enviado',
        message: `O pedido de saque de ${parseFloat(amount).toFixed(2)} MT para o número ${phone} foi enviado e está pendente de aprovação.`,
        type: 'info'
      });

      const admins = await User.findAll({ where: { roleId: 1 } });
      await Promise.all(admins.map((admin) =>
        Notification.create({
          userId: admin.id,
          title: 'Novo pedido de saque',
          message: `Novo pedido de saque de ${parseFloat(amount).toFixed(2)} MT para o número ${phone}.`,
          type: 'info'
        })
      ));

      await createAuditLog({
        userId,
        action: 'withdrawal_request_created',
        entity: 'WithdrawalRequest',
        entityId: request.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json(request);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getUserRequests(req, res) {
    try {
      const userId = req.user.userId;
      const requests = await WithdrawalRequest.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Wallet,
            attributes: ['id', 'walletCode', 'walletName', 'currency']
          }
        ]
      });

      return res.json(requests);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAdminRequests(req, res) {
    try {
      const requests = await WithdrawalRequest.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Wallet,
            attributes: ['id', 'walletCode', 'walletName', 'currency']
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'Admin',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      return res.json(requests);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async approve(req, res) {
    try {
      const adminId = req.user.userId;
      const { id } = req.params;
      const { adminMessage } = req.body || {};

      const request = await WithdrawalRequest.findByPk(id, {
        include: [
          {
            model: Wallet,
            include: [
              {
                model: WalletType,
                attributes: ['id', 'code', 'name']
              }
            ]
          },
          User
        ]
      });

      if (!request) {
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }

      if (request.status === 'approved') {
        return res.status(400).json({ error: 'Only pending or rejected requests can be approved' });
      }

      const wallet = request.Wallet;
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const settings = await Setting.findOne();
      const withdrawalFeePercent = Number(settings?.withdrawalFeePercent) || 0;
      const requestedAmount = parseFloat(request.amount);
      const feeAmount = calculateWithdrawalFee(requestedAmount, withdrawalFeePercent);
      const totalDeduction = requestedAmount + feeAmount;

      if (wallet.status !== 'ACTIVE') {
        await request.update({
          status: 'rejected',
          adminId,
          adminMessage: 'Carteira não está ativa no momento.',
          processedAt: new Date()
        });

        await Notification.create({
          userId: request.userId,
          title: 'Pedido de saque rejeitado',
          message: `O pedido de saque foi rejeitado porque a carteira não está ativa.`,
          type: 'warning'
        });

        return res.status(400).json({ error: 'Wallet is not active' });
      }

      const currentBalance = parseFloat(wallet.balance || 0);
      if (currentBalance < totalDeduction) {
        await request.update({
          status: 'rejected',
          adminId,
          adminMessage: 'Saldo insuficiente para aprovação do saque.',
          processedAt: new Date()
        });

        await Notification.create({
          userId: request.userId,
          title: 'Pedido de saque rejeitado',
          message: `O pedido de saque foi rejeitado por saldo insuficiente.`,
          type: 'warning'
        });

        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      const transaction = await sequelize.transaction(async (t) => {
        const updatedWallet = await wallet.update(
          { balance: currentBalance - totalDeduction },
          { transaction: t }
        );

        const tx = await Transaction.create(
          {
            fromWalletId: wallet.id,
            toWalletId: null,
            amount: requestedAmount,
            fee: feeAmount,
            paymentMode: 'B2C',
            phone: request.phone,
            walletCode: wallet.walletCode,
            reference: `WITHDRAW-${request.id}`,
            status: 'success',
            provider: 'mpesa',
            providerReference: `SIM-${request.id}`,
            providerTransactionId: `SIMTX-${request.id}`,
            providerResponse: JSON.stringify({
              output_ResponseCode: 'INS-0',
              output_ResponseDescription: 'Request processed successfully',
              output_ConversationID: `SIM-${request.id}`,
              output_TransactionID: `SIMTX-${request.id}`
            }),
            providerResponseCode: 'INS-0',
            providerResponseMessage: 'Request processed successfully',
            type: 'withdrawal',
            apiKeyId: null
          },
          { transaction: t }
        );

        await Ledger.create(
          {
            transactionId: tx.id,
            walletId: wallet.id,
            type: 'debit',
            amount: totalDeduction,
            balanceBefore: currentBalance,
            balanceAfter: updatedWallet.balance
          },
          { transaction: t }
        );

        await request.update(
          {
            status: 'approved',
            adminId,
            adminMessage: adminMessage || 'Aprovado pelo administrador',
            processedAt: new Date()
          },
          { transaction: t }
        );

        return tx;
      });

      await Notification.create({
        userId: request.userId,
        title: 'Pedido de saque aprovado',
        message: `O seu pedido de saque de ${requestedAmount.toFixed(2)} MT para ${request.phone} foi aprovado e processado.`,
        type: 'success'
      });

      await createAuditLog({
        userId: adminId,
        action: 'withdrawal_request_approved',
        entity: 'WithdrawalRequest',
        entityId: request.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({ request, transaction });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async reject(req, res) {
    try {
      const adminId = req.user.userId;
      const { id } = req.params;
      const { adminMessage } = req.body || {};

      const request = await WithdrawalRequest.findByPk(id, {
        include: [Wallet, User]
      });

      if (!request) {
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending requests can be rejected' });
      }

      await request.update({
        status: 'rejected',
        adminId,
        adminMessage: adminMessage || null,
        processedAt: new Date()
      });

      await Notification.create({
        userId: request.userId,
        title: 'Pedido de saque rejeitado',
        message: adminMessage
          ? `O seu pedido de saque foi rejeitado. Motivo: ${adminMessage}`
          : 'O seu pedido de saque foi rejeitado pelo administrador.',
        type: 'warning'
      });

      await createAuditLog({
        userId: adminId,
        action: 'withdrawal_request_rejected',
        entity: 'WithdrawalRequest',
        entityId: request.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json(request);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WithdrawalRequestController();
