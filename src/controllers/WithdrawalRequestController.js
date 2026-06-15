const { WithdrawalRequest, Wallet, Transaction, Ledger, Notification, User } = require('../models');
const sequelize = require('../config/database');
const { createAuditLog } = require('../helpers/auditLogger');

class WithdrawalRequestController {
  async create(req, res) {
    try {
      const userId = req.user.userId;
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

      const wallet = await Wallet.findByPk(walletId);
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

      const request = await WithdrawalRequest.create({
        walletId,
        userId,
        amount,
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
      const { adminMessage } = req.body;

      const request = await WithdrawalRequest.findByPk(id, {
        include: [Wallet, User]
      });

      if (!request) {
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending requests can be approved' });
      }

      const wallet = request.Wallet;
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

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
      const requestedAmount = parseFloat(request.amount);
      if (currentBalance < requestedAmount) {
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
          { balance: currentBalance - requestedAmount },
          { transaction: t }
        );

        const tx = await Transaction.create(
          {
            fromWalletId: wallet.id,
            toWalletId: null,
            amount: requestedAmount,
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
            amount: requestedAmount,
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
      const { adminMessage } = req.body;

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
