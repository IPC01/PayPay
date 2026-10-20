const { User, Role } = require('../models');

const isOperator = (user) => ['operator', 'support'].includes(user?.roleName);
const isAdmin = (user) => user?.roleName === 'admin';
const isStaff = (user) => isAdmin(user) || isOperator(user);

async function staffAccess(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId, { include: [{ model: Role }] });
    if (!user || !user.isActive) return res.status(403).json({ error: 'Conta indisponível' });
    req.user.roleName = user.Role?.name;
    if (!isStaff(req.user)) return res.status(403).json({ error: 'Acesso reservado ao administrador ou operador' });
    req.userData = user;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function customerTarget(req, res, next) {
  if (!isOperator(req.user)) return next();
  try {
    const target = await User.findByPk(req.params.id, { include: [{ model: Role }] });
    if (!target) return res.status(404).json({ error: 'Cliente não encontrado' });
    if (target.Role?.name !== 'user') return res.status(403).json({ error: 'O operador só pode aceder a clientes' });
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { staffAccess, customerTarget, isAdmin, isOperator, isStaff };
