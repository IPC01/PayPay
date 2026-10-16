const WalletPaymentService = require('../services/WalletPaymentService');
const { paymentError } = require('../helpers/mpesaPayment');
const { hasApprovedKyc } = require('../helpers/kycHelper');

async function handlePayment(req, res, paymentMode) {
  try {
    if (!req.body.walletCode) throw paymentError('walletCode is required');
    const userId = req.user?.userId || req.apiKey?.userId;
    if (paymentMode === 'B2C' && !(await hasApprovedKyc(userId, req.user?.roleId))) {
      throw paymentError('KYC deve ser aprovado para realizar levantamentos', 403);
    }
    const result = await WalletPaymentService.execute({
      walletCode: req.body.walletCode,
      userId,
      amount: req.body.amount,
      phone: req.body.phone || req.body.phoneNumber,
      reference: req.body.reference,
      paymentMode,
      apiKeyId: req.apiKey?.id || null,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(result.pending ? 202 : result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error(`PaymentController.${paymentMode} error:`, error.message);
    return res.status(error.name === 'SequelizeUniqueConstraintError' ? 409 : error.statusCode || 500)
      .json({ success: false, error: error.message });
  }
}

class PaymentController {
  async c2b(req, res) {
    return handlePayment(req, res, 'C2B');
  }

  async b2c(req, res) {
    return handlePayment(req, res, 'B2C');
  }

  async processDirectPayment({ amount, phone, reference, provider = 'mpesa', type = 'direct', userId }) {
    if (String(provider).toLowerCase() !== 'mpesa') throw paymentError('Apenas M-Pesa está disponível.');
    const result = await WalletPaymentService.execute({
      amount, phone, reference, userId, type, paymentMode: 'C2B'
    });
    if (!result.success) {
      throw Object.assign(new Error(result.message), {
        statusCode: result.pending ? 409 : 400,
        transaction: result.transaction
      });
    }
    return { transaction: result.transaction, providerResponse: result.response };
  }

  async direct(req, res) {
    try {
      const { transaction, providerResponse } = await this.processDirectPayment({
        ...req.body, userId: req.user.userId
      });
      return res.json({ success: true, provider: 'mpesa', transactionId: transaction.id, response: providerResponse });
    } catch (error) {
      console.error('PaymentController.direct error:', error.message);
      return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();
