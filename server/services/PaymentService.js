class PaymentService {
  constructor({ mpesa, emola }) {
    this.mpesa = mpesa;
    this.emola = emola;
  }

  async createC2B({ provider, phone, amount, reference, mode }) {
    const normalizedProvider = provider.toLowerCase();

    switch (normalizedProvider) {
      case 'mpesa':
        return this.mpesa.c2b.execute({
          phone,
          amount,
          reference,
          mode
        });

      case 'emola':
        if (!this.emola || !this.emola.c2b || !this.emola.c2b.execute) {
          throw new Error('Provider emola is not configured');
        }

        return this.emola.c2b.execute({
          phone,
          amount,
          reference,
          mode
        });

      default:
        throw new Error(`Provider ${provider} not supported`);
    }
  }

  async createB2C({ provider, phone, amount, reference, mode }) {
    const normalizedProvider = provider.toLowerCase();

    switch (normalizedProvider) {
      case 'mpesa':
        return this.mpesa.b2c.execute({
          phone,
          amount,
          reference,
          mode
        });

      case 'emola':
        if (!this.emola || !this.emola.b2c || !this.emola.b2c.execute) {
          throw new Error('Provider emola is not configured');
        }

        return this.emola.b2c.execute({
          phone,
          amount,
          reference,
          mode
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