const MpesaClient = require('./MpesaClient');

class MpesaB2C {
	async execute({
		phone,
		amount,
		reference,
		mode,
	}) {
		const payload = {
			input_TransactionReference: reference,
			input_CustomerMSISDN: phone,
			input_Amount: String(amount),
			input_ThirdPartyReference: reference,
			input_ServiceProviderCode:
				process.env.MPESA_SERVICE_PROVIDER_CODE,
		};

		const response = await MpesaClient.post(
			'/ipg/v1x/b2cPayment/',
			payload,
			{ mode }
		);

		return response;
	}
}

module.exports = new MpesaB2C();
