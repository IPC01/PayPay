const router = require('express').Router();

/**
 * Rota simples para testar o service legado de M-Pesa.
 * Body esperado: { amount: number|string, phoneNumber: string }
 */
router.post('/c2b', async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (amount === undefined || amount === null || phoneNumber === undefined || phoneNumber === null) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: amount e phoneNumber'
      });
    }

    let pagamentoMpesa;
    try {
      ({ pagamentoMpesa } = require('../services/mpesa'));
    } catch (serviceError) {
      return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Service M-Pesa indisponível no ambiente atual',
        error: serviceError.message
      });
    }

    const result = await pagamentoMpesa(amount, String(phoneNumber).trim());
    const statusCode = result.success ? 200 : 400;

    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Falha ao executar teste de M-Pesa',
      error: error.message
    });
  }
});

module.exports = router;