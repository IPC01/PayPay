import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useNotification } from '../../contexts/NotificationContext';
import { request } from '../../services/api';

const SIMULATED_OTP = '123456';

// Componente de botão voltar reutilizável
const BackButton = ({ onClick, to }) => {
  if (to) {
    return (
      <Link 
        to={to} 
        className="group inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1D4ED8] transition-all duration-200"
      >
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1D4ED8] transition-all duration-200"
    >
      <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Voltar
    </button>
  );
};

// Componente de input reutilizável
const InputField = ({ label, type, value, onChange, placeholder, required, className = '', ...props }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus:border-[#3B82F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
      placeholder={placeholder}
      {...props}
    />
  </div>
);

// Componente de loading
const LoadingSpinner = () => (
  <span className="flex items-center justify-center gap-2">
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    Processando...
  </span>
);

function LoginView() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvePostLoginRoute = (requestedPath, roleId) => {
    const safePath = requestedPath && requestedPath !== '/login' ? requestedPath : '/client';

    if (roleId === 1) {
      if (safePath.startsWith('/admin')) {
        return safePath;
      }
      return '/admin';
    }

    if (roleId !== 1 && safePath.startsWith('/admin')) {
      return '/client';
    }

    return safePath;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'credentials') {
      setLoading(true);

      try {
        await request('/api/auth/verify-credentials', {
          method: 'POST',
          body: { email, password }
        });

        setCredentialsVerified(true);
        setStep('otp');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }

      return;
    }

    if (!credentialsVerified) {
      setError('Valide as credenciais antes de continuar.');
      setStep('credentials');
      return;
    }

    if (otp !== SIMULATED_OTP) {
      setError('Código 2FA inválido. Use 123456.');
      return;
    }

    setLoading(true);

    try {
      const userData = await login(email, password);
      const requestedPath = location.state?.from?.pathname || '/client';
      const destination = resolvePostLoginRoute(requestedPath, userData?.roleId);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('credentials');
      setOtp('');
      setError(null);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#1D4ED8]/5 border border-[#E2E8F0] p-6 sm:p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#1D4ED8]/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {step === 'credentials' ? 'Entrar' : 'Verificação 2FA'}
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {step === 'credentials' 
              ? `Acesse sua conta ${settings?.platformName || 'PayPay'}`
              : 'Insira o código de verificação enviado para seu email.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'credentials' ? (
            <>
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setCredentialsVerified(false);
                }}
                placeholder="seu@email.com"
                required
              />
              <div>
                <InputField
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setCredentialsVerified(false);
                  }}
                  placeholder="********"
                  required
                />
                <div className="mt-2 text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-[#3B82F6] hover:text-[#1D4ED8] font-medium transition-colors duration-200"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-[#EFF6FF] border border-[#93C5FD] p-3">
                <p className="text-xs font-semibold text-[#1D4ED8]">Autenticação de dois fatores</p>
                <p className="text-xs text-[#3B82F6] mt-0.5">Insira o código enviado para seu email.</p>
                <p className="text-[10px] font-mono bg-[#DBEAFE] inline-block px-2 py-0.5 rounded mt-2 text-[#1D4ED8]">
                  Código: 123456
                </p>
              </div>
              <InputField
                label="Código 2FA"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                required
                maxLength="6"
                className="text-center text-xl tracking-[0.5em]"
              />
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <p className="text-xs text-red-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : (step === 'credentials' ? 'Continuar' : 'Entrar')}
          </button>

          {step === 'otp' && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-xs text-[#64748B] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              ← Voltar para credenciais
            </button>
          )}
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-[#64748B]">
            Não tem conta?{' '}
            <Link 
              to="/register" 
              className="font-semibold text-[#1D4ED8] hover:text-[#3B82F6] transition-colors duration-200"
            >
              Registrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterView() {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const { register } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'details') {
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

  const handleBack = () => {
    if (step === 'otp') {
      setStep('details');
      setOtp('');
      setError(null);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#1D4ED8]/5 border border-[#E2E8F0] p-6 sm:p-8">
        <div className="mb-4">
          <BackButton onClick={handleBack} />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#1D4ED8]/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {step === 'details' 
              ? `Comece no ${settings?.platformName || 'PayPay'}`
              : 'Verifique seu email com o código 2FA'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'details' ? (
            <>
              <InputField
                label="Nome completo"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="João Silva"
                required
              />
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
              <InputField
                label="Senha"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </>
          ) : (
            <>
              <div className="rounded-lg bg-[#EFF6FF] border border-[#93C5FD] p-3">
                <p className="text-xs font-semibold text-[#1D4ED8]">Verificação necessária</p>
                <p className="text-xs text-[#3B82F6] mt-0.5">Insira o código enviado para seu email.</p>
                <p className="text-[10px] font-mono bg-[#DBEAFE] inline-block px-2 py-0.5 rounded mt-2 text-[#1D4ED8]">
                  Código: 123456
                </p>
              </div>
              <InputField
                label="Código 2FA"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                required
                maxLength="6"
                className="text-center text-xl tracking-[0.5em]"
              />
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <p className="text-xs text-red-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : (step === 'details' ? 'Continuar' : 'Confirmar código')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-[#64748B] hover:text-[#1D4ED8] transition-colors duration-200">
            Já tem conta? <span className="font-semibold">Entrar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordView() {
  const { forgotPassword } = useAuth();
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async event => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#1D4ED8]/5 border border-[#E2E8F0] p-6 sm:p-8">
        <div className="mb-4">
          <BackButton to="/login" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Esqueceu a senha?</h1>
          <p className="mt-1 text-sm text-[#64748B]">Digite seu email para receber um token de redefinição</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : 'Enviar token de redefinição'}
          </button>
        </form>

        {resetToken && (
          <div className="mt-4 rounded-lg border border-[#93C5FD] bg-[#EFF6FF] p-4 animate-in slide-in-from-top-4 fade-in duration-300">
            <p className="text-xs font-semibold text-[#1D4ED8]">Token de redefinição</p>
            <p className="mt-1 break-all font-mono text-xs bg-white p-2 rounded border border-[#93C5FD] text-[#0F172A]">
              {resetToken}
            </p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5"
            >
              Redefinir senha
            </Link>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-[#64748B] hover:text-[#1D4ED8] transition-colors duration-200">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#1D4ED8]/5 border border-[#E2E8F0] p-6 sm:p-8">
        <div className="mb-4">
          <BackButton to="/login" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Nova senha</h1>
          <p className="mt-1 text-sm text-[#64748B]">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Token de redefinição"
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Cole o token recebido"
            required
          />
          <InputField
            label="Nova senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <InputField
            label="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Digite novamente a senha"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1D4ED8]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Auth() {
  const { pathname } = useLocation();

  if (pathname === '/login') {
    return <LoginView />;
  }

  if (pathname === '/register') {
    return <RegisterView />;
  }

  if (pathname === '/forgot-password') {
    return <ForgotPasswordView />;
  }

  if (pathname === '/reset-password') {
    return <ResetPasswordView />;
  }

  return <Navigate to="/login" replace />;
}

export default Auth;