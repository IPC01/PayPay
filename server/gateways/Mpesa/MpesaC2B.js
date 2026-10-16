const MpesaClient = require('./MpesaClient');
const { buildPayload } = require('../../helpers/mpesaPayment');

class MpesaC2B {
  async execute({
    phone,
    amount,
    reference,
    thirdPartyReference = reference,
    mode,
  }) {

    const payload = buildPayload({ phone, amount, reference, thirdPartyReference });

    const response = await MpesaClient.post(
      '/ipg/v1x/c2bPayment/singleStage/',
      payload,
      { mode }
    );

    return response;
  }
}

module.exports = new MpesaC2B();