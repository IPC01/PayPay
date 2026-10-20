export const roleName = (user) => user?.Role?.name || user?.roleName || (user?.roleId === 1 ? 'admin' : null);
export const isAdmin = (user) => roleName(user) === 'admin';
export const isOperator = (user) => ['operator', 'support'].includes(roleName(user));
export const isStaff = (user) => isAdmin(user) || isOperator(user);
export const roleLabel = (user) => isAdmin(user) ? 'Administrador' : isOperator(user) ? 'Operador' : 'Cliente';

const operatorPages = new Set(['users', 'wallets', 'transactions', 'tickets', 'kyc', 'subscriptions', 'profile', 'notifications']);

export function managementPath(user, path = '/admin') {
  return isOperator(user) ? path.replace(/^\/admin(?=\/|$)/, '/operador') : path;
}

export function canAccessManagement(user, pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (isAdmin(user)) return parts[0] === 'admin';
  if (!isOperator(user) || parts[0] !== 'operador') return false;
  return parts.length === 1 || operatorPages.has(parts[1]);
}

export function postLoginRoute(user, requestedPath) {
  const destination = managementPath(user, requestedPath || '');
  if (isStaff(user)) return canAccessManagement(user, destination) ? destination : managementPath(user);
  return requestedPath && requestedPath !== '/login' && !/^\/(admin|operador)(\/|$)/.test(requestedPath) ? requestedPath : '/client';
}
