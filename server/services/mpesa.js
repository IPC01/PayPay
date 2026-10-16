const PaymentService = require('./PaymentService');
const { normalizePhone, generateReference, getOutcome, responseMessage } = require('../helpers/mpesaPayment');

async function pagamentoMpesa(amount, phoneNumber, reference = generateReference()) {
  try {
    const response = await PaymentService.createC2B({
      provider: 'mpesa',
      amount,
      phone: phoneNumber,
      reference,
      thirdPartyReference: reference,
      mode: 'live'
    });
    const outcome = getOutcome(response);
    return {
      success: outcome === 'success',
      status: outcome,
      reference,
      data: response,
      error: outcome === 'success' ? null : responseMessage(response)
    };
  } catch (error) {
    console.error('M-Pesa C2B failed:', error.message);
    return { success: false, status: error.requestNotSent ? 'failed' : 'pending', reference, error: error.message };
  }
}

module.exports = { pagamentoMpesa, normalizePhoneNumberForMpesa: normalizePhone };
