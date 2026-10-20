import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessManagement, managementPath } from '../../helpers/roles';

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const { pathname, search, hash } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
          <span className="text-sm text-slate-600">A carregar...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const destination = managementPath(user, pathname);
  if (destination !== pathname && canAccessManagement(user, destination)) {
    return <Navigate to={`${destination}${search}${hash}`} replace />;
  }

  if (!canAccessManagement(user, pathname)) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-slate-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-slate-100">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-600 dark:text-rose-300">Acesso restrito</p>
        <h1 className="mt-4 text-3xl font-semibold">Acesso não autorizado</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          O seu perfil não tem permissão para aceder a esta página. Contacte um administrador se precisar de assistência.
        </p>
      </div>
    );
  }

  return children;
}

export default RequireAdmin;
