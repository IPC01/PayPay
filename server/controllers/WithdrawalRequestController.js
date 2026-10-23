const { WithdrawalRequest, Wallet, User, Transaction } = require('../models');
const WalletPaymentService = require('../services/WalletPaymentService');
const { hasApprovedKyc } = require('../helpers/kycHelper');

// Anexa a taxa da plataforma (registada na transação com a mesma referência)
// para que o cliente veja quanto recebeu e quanto foi descontado.
async function withFees(requests) {
  const references = requests.map((r) => r.reference).filter(Boolean);
  if (references.length === 0) {
    return requests.map((r) => ({ ...r.toJSON(), fee: 0 }));
  }
  const transactions = await Transaction.findAll({
    where: { reference: references },
    attributes: ['reference', 'fee']
  });
  const feeByReference = new Map(transactions.map((tx) => [tx.reference, Number(tx.fee || 0)]));
  return requests.map((r) => ({ ...r.toJSON(), fee: feeByReference.get(r.reference) || 0 }));
}

class WithdrawalRequestController {
  async create(req, res) {
    try {
      const userId = req.user.userId;
      if (!(await hasApprovedKyc(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'KYC deve ser aprovado para realizar levantamentos' });
      }
      if (!req.body.walletId) return res.status(400).json({ error: 'walletId is required' });
      const result = await WalletPaymentService.execute({
        walletId: req.body.walletId,
        userId,
        amount: req.body.amount,
        phone: req.body.phone || req.body.phoneNumber,
        reference: req.body.reference,
        note: req.body.note || req.body.notes,
        paymentMode: 'B2C',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(result.pending ? 202 : result.success ? 201 : 400).json(result);
    } catch (error) {
      console.error('Withdrawal processing failed:', error.message);
      return res.status(error.name === 'SequelizeUniqueConstraintError' ? 409 : error.statusCode || 500)
        .json({ error: error.message });
    }
  }

  async getUserRequests(req, res) {
    try {
      const requests = await WithdrawalRequest.findAll({
        where: { userId: req.user.userId },
        order: [['createdAt', 'DESC']],
        include: [{ model: Wallet, attributes: ['id', 'walletCode', 'walletName', 'currency'] }]
      });
      return res.json(await withFees(requests));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAdminRequests(req, res) {
    try {
      const requests = await WithdrawalRequest.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          { model: Wallet, attributes: ['id', 'walletCode', 'walletName', 'currency'] },
          { model: User, attributes: ['id', 'name', 'email'] },
          { model: User, as: 'Admin', attributes: ['id', 'name', 'email'] }
        ]
      });
      return res.json(await withFees(requests));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async approve(req, res) {
    return res.status(410).json({ error: 'Saques são executados via B2C. A aprovação manual foi desativada.' });
  }

  async reject(req, res) {
    return res.status(410).json({ error: 'O estado do saque depende da confirmação M-Pesa e não pode ser alterado manualmente.' });
  }
}

module.exports = new WithdrawalRequestController();
