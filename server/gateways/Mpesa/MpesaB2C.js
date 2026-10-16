const MpesaClient = require('./MpesaClient');
const { buildPayload } = require('../../helpers/mpesaPayment');

class MpesaB2C {
	async execute({
		phone,
		amount,
		reference,
		thirdPartyReference = reference,
		mode,
	}) {
		const payload = buildPayload({ phone, amount, reference, thirdPartyReference });

		const response = await MpesaClient.post(
			'/ipg/v1x/b2cPayment/',
			payload,
			{ mode }
		);

		return response;
	}
}

module.exports = new MpesaB2C();
