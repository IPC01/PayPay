import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default RequireAuth;
