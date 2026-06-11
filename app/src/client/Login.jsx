import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'credentials') {
      setStep('otp');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-600">Entrar</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Faça login na sua conta</h1>
        <p className="mt-2 text-slate-500">Use as suas credenciais para aceder ao sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 'credentials' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-brand-100 bg-brand-50 p-4 text-brand-700">
              <p className="font-semibold">Autenticação de dois fatores</p>
              <p className="mt-2 text-sm text-slate-700">Insira o código enviado para o seu email.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Código 2FA</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
          </>
        )}

        {error && <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <button type="submit" disabled={loading} className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {step === 'credentials' ? 'Continuar' : loading ? 'Verificando...' : 'Verificar código'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Não tem conta? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Registar</Link>
      </p>
    </div>
  );
}

export default Login;
