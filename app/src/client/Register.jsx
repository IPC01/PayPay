import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIMULATED_OTP = '123456';

function Register() {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'details') {
      // Não enviamos email real aqui; usamos uma simulação de 2FA com código fixo.
      setStep('otp');
      return;
    }

    if (otp !== SIMULATED_OTP) {
      setError('Código 2FA inválido. Use 123456.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      setSuccess('Conta registada com sucesso. Faça login para continuar.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-600">Registo</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Crie a sua conta</h1>
        <p className="mt-2 text-slate-500">Insira os dados e verifique o código 2FA.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 'details' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome completo</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
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
              <p className="mt-2 text-sm text-slate-700">Insira o código enviado para o seu telemóvel ou email. Código simulado: 123456.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Código 2FA</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
          </>
        )}

        {error && <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <button type="submit" disabled={loading} className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {step === 'details' ? 'Continuar' : loading ? 'Confirmando...' : 'Confirmar código'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Entrar</Link>
      </p>
    </div>
  );
}

export default Register;
