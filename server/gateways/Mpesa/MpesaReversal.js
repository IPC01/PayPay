const MpesaClient = require('./MpesaClient');
const { paymentError } = require('../../helpers/mpesaPayment');

const REVERSAL_CONFIG = ['MPESA_SECURITY_CREDENTIAL', 'MPESA_INITIATOR_IDENTIFIER'];

class MpesaReversal {
  // Full reversal only: input_ReversalAmount is intentionally omitted.
  async execute({ transactionId, thirdPartyReference, mode }) {
    if (!transactionId || !thirdPartyReference) {
      throw paymentError('M-Pesa transaction ID and third-party reference are required for a reversal');
    }
    const payload = {
      input_TransactionID: String(transactionId),
      input_SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      input_InitiatorIdentifier: process.env.MPESA_INITIATOR_IDENTIFIER,
      input_ThirdPartyReference: String(thirdPartyReference),
      input_ServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE
    };
    return MpesaClient.put('/ipg/v1x/reversal/', payload, { mode, requiredConfig: REVERSAL_CONFIG });
  }
}

module.exports = new MpesaReversal();
