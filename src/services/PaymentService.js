class PaymentService {
  constructor({ mpesa, emola }) {
    this.mpesa = mpesa;
    this.emola = emola;
  }

  async createC2B({ provider, phone, amount, reference }) {
    const normalizedProvider = provider.toLowerCase();

    switch (normalizedProvider) {
      case 'mpesa':
        return this.mpesa.c2b.execute({
          phone,
          amount,
          reference
        });

      case 'emola':
        return this.emola.c2b.execute({
          phone,
          amount,
          reference
        });

      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }
}

module.exports = new PaymentService({
  mpesa: require('../gateways/Mpesa'),
  emola: null
});