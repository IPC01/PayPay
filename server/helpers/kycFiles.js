const crypto = require('crypto');

const KYC_MAX_FILE_BYTES = 10 * 1024 * 1024;
const KYC_MAX_NAME_LENGTH = 40;

const KYC_MIME_EXTENSIONS = {
  'application/pdf': '.pdf',
  'image/avif': '.avif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// Nome legível e curto: sem acentos/espaços/caracteres especiais, no máximo 40 caracteres + extensão.
function shortenKycFileName(fileName, extension, fallback = 'documento') {
  const base = String(fileName || '')
    .replace(/\.[^.]*$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, KYC_MAX_NAME_LENGTH)
    .replace(/-+$/, '');

  return `${base || fallback}${extension}`;
}

function createKycInternalName(extension) {
  return `${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}${extension}`;
}

module.exports = {
  KYC_MAX_FILE_BYTES,
  KYC_MAX_NAME_LENGTH,
  KYC_MIME_EXTENSIONS,
  shortenKycFileName,
  createKycInternalName
};
