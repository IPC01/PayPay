const { Kyc } = require('../models');

async function hasApprovedKyc(userId) {
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
