import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

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

  if (user.roleId !== 1) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-slate-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-slate-100">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-600 dark:text-rose-300">Acesso restrito</p>
        <h1 className="mt-4 text-3xl font-semibold">Permissão de Administrador Necessária</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Esta área é reservada apenas para contas administrativas. Se acha que isto é um erro, contacte um administrador.
        </p>
      </div>
    );
  }

  return children;
}

export default RequireAdmin;
