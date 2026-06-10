function parseMode(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['mock', 'test', 'testing', 'true', '1'].includes(normalized)) {
    return 'mock';
  }

  if (['live', 'real', 'false', '0'].includes(normalized)) {
    return 'live';
  }

  return null;
}

function mpesaRequestMode(options = {}) {
  const forcedMode = parseMode(options.forceMode);

  return (req, res, next) => {
    const headerMode = parseMode(req.headers['x-mpesa-mode']);
    const testHeader = parseMode(req.headers['x-mpesa-test-mode']);
    const envMode = parseMode(process.env.MPESA_MOCK_MODE) || 'live';

    req.mpesaMode = forcedMode || headerMode || testHeader || envMode;
    next();
  };
}

module.exports = mpesaRequestMode;