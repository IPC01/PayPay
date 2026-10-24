const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function confirmWithdrawalPassword(req, res, next) {
  const password = req.body?.password;
  delete req.body?.password;

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Informe a senha de acesso à plataforma para confirmar o levantamento.' });
  }

  try {
    const user = await User.findByPk(req.user.userId, { attributes: ['passwordHash'] });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(403).json({ error: 'Senha de acesso incorreta. O levantamento não foi realizado.' });
    }
  } catch (error) {
    console.error('Withdrawal password verification failed:', error.message);
    return res.status(500).json({ error: 'Não foi possível confirmar a senha. Tente novamente.' });
  }

  return next();
}

module.exports = confirmWithdrawalPassword;
