module.exports = (requiredScopes = []) => {
  return (req, res, next) => {
    try {

      const apiKey = req.apiKey;

      if (!apiKey) {
        return res.status(401).json({ error: 'API key not found in request' });
      }

      // scopes podem vir como JSON ou array
      const scopes = apiKey.scopes || [];

      const hasPermission = requiredScopes.every(scope =>
        scopes.includes(scope)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient API key permissions',
          required: requiredScopes
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};