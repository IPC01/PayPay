import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      notify({ type: 'error', title: 'Erro', message: 'Por favor, insira o seu email.' });
      return;
    }

    try {
      setLoading(true);
      const data = await forgotPassword(email);
      setResetToken(data.resetToken || null);
      notify({ type: 'success', title: 'Solicitação enviada', message: 'Verifique o token de redefinição abaixo ou o seu email.' });
    } catch (err) {
      notify({ type: 'error', title: 'Erro', message: err.message || 'Não foi possível enviar a solicitação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[36px] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">Recuperação de senha</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Esqueceu a sua senha?</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Insira o email associado à sua conta para gerar um token de redefinição.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm text-slate-700 dark:text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="seu@email.com"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Enviando...' : 'Enviar token de redefinição'}
          </button>
        </form>

        {resetToken && (
          <div className="mt-6 rounded-3xl border border-brand-100 bg-brand-50 p-5 text-sm text-brand-900 dark:border-brand-700/40 dark:bg-brand-950/20 dark:text-brand-200">
            <p className="font-semibold">Token de redefinição</p>
            <p className="mt-2 break-all font-mono text-[0.95rem]">{resetToken}</p>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Use este token na página de redefinição de senha ou copie-o para o seu email.</p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >Redefinir senha</Link>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
