const { Wallet, ApiKeyScope } = require('../models');

function authorizeWalletAction(requiredScope) {
  return async (req, res, next) => {
    try {
      const apiKey = req.apiKey;
      const { walletCode } = req.body;


      // 1. validar API key
      if (!apiKey) {
        return res.status(401).json({ error: 'API key missing apikey :'+apiKey });
      }

      if (!walletCode) {
        return res.status(400).json({ error: 'walletCode is required' });
      }

      // 2. validar scope
      const scopes = await ApiKeyScope.findAll({
        where: { apiKeyId: apiKey.id }
      });

      const hasScope = scopes.some(
        (s) => s.permission === requiredScope
      );

      if (!hasScope) {
        return res.status(403).json({
          error: `Missing required scope: ${requiredScope}`
        });
      }

      // 3. buscar wallet
      const wallet = await Wallet.findOne({
        where: { walletCode }
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // 4. validar ownership (CRÍTICO)
      if (wallet.userId !== apiKey.userId) {
        return res.status(403).json({
          error: 'You do not own this wallet'
        });
      }

      // 5. validar estado
      if (wallet.status !== 'ACTIVE') {
        return res.status(400).json({
          error: `Wallet is not active (${wallet.status})`
        });
      }

      // 6. attach data
      req.wallet = wallet;

      next();

    } catch (error) {
     return res.status(500).json({
    name: error.name,
    message: error.message,
    stack: error.stack,
    errors: error.errors
  });
    }
  };
}

module.exports = authorizeWalletAction;