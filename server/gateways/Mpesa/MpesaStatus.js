const MpesaClient = require('./MpesaClient');
const { paymentError } = require('../../helpers/mpesaPayment');

class MpesaStatus {
  async execute({ thirdPartyReference, queryReference, mode }) {
    if (!thirdPartyReference || !queryReference) {
      throw paymentError('M-Pesa third-party reference and query reference are required');
    }

    const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE;
    if (!serviceProviderCode) {
      throw paymentError('MPESA_SERVICE_PROVIDER_CODE is required', 503);
    }

    return MpesaClient.get('/ipg/v1x/queryTransactionStatus/', {
      input_ThirdPartyReference: String(thirdPartyReference),
      input_QueryReference: String(queryReference),
      input_ServiceProviderCode: serviceProviderCode
    }, { mode });
  }
}

module.exports = new MpesaStatus();