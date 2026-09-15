const { Op } = require('sequelize');
const { Subscription, Package } = require('../models');

function parsePackageScopes(pack) {
  if (!pack?.permissionsGranted) return [];
  return pack.permissionsGranted
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Retorna a subscrição ativa (não expirada) do utilizador, com o respetivo pacote
async function getActiveSubscription(userId) {
  const subscription = await Subscription.findOne({
    where: {
      userId,
      status: 'active',
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: Package }],
    order: [['expiresAt', 'DESC']]
  });
  return subscription;
}

async function hasActivePackage(userId, roleId) {
  if (roleId === 1) {
    return true;
  }
  return Boolean(await getActiveSubscription(userId));
}

// Escopos de chave de API que o pacote atual do utilizador permite gerar
async function getAllowedScopesForUser(userId, roleId) {
  if (roleId === 1) {
    return null; // admin não é limitado por pacote
  }
  const subscription = await getActiveSubscription(userId);
  return parsePackageScopes(subscription?.Package);
}

module.exports = {
  parsePackageScopes,
  getActiveSubscription,
  hasActivePackage,
  getAllowedScopesForUser
};
