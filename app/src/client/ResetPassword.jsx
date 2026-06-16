import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      notify({ type: 'error', title: 'Erro', message: 'Por favor, insira o token de redefinição.' });
      return;
    }

    if (!password || password.length < 6) {
      notify({ type: 'error', title: 'Erro', message: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (password !== confirmPassword) {
      notify({ type: 'error', title: 'Erro', message: 'As senhas não coincidem.' });
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      notify({ type: 'success', title: 'Senha atualizada', message: 'Sua senha foi redefinida com sucesso.' });
      navigate('/login');
    } catch (err) {
      notify({ type: 'error', title: 'Erro', message: err.message || 'Falha ao redefinir a senha.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[36px] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">Redefinir senha</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Digite seu novo acesso</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Use o token de redefinição e crie uma nova senha segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Token de redefinição
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Cole aqui o token de redefinição"
            />
          </label>

          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Nova senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="••••••••"
            />
          </label>

          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
