const { Kyc } = require('../models');

async function hasApprovedKyc(userId, roleId) {
  if (roleId === 1) {
    return true;
  }

  const kyc = await Kyc.findOne({
    where: {
      userId,
      status: 'APPROVED'
    }
  });
  return Boolean(kyc);
}

module.exports = {
  hasApprovedKyc
};
