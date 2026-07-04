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
      <Link to={to} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors duration-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors duration-200"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Voltar
    </button>
  );
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Lado esquerdo - Ilustração */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <div>
            <div className="mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Bem-vindo de volta!
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Acesse sua conta e gerencie suas atividades de forma segura e eficiente.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Segurança em dois fatores</p>
                <p className="text-sm text-white/80">Proteção adicional para sua conta</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Dados protegidos</p>
                <p className="text-sm text-white/80">Criptografia de ponta a ponta</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm text-white/70">
              © {new Date().getFullYear()} {settings?.platformName || 'SAMPAY'}. Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="mb-8">
            <BackButton to="/" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {step === 'credentials' ? 'Login' : 'Verificação 2FA'}
            </h1>
            <p className="text-slate-500">
              {step === 'credentials' 
                ? `Acesse o ${settings?.platformName || 'SAMPAY'} com suas credenciais.`
                : 'Insira o código de verificação enviado para seu email.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'credentials' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setCredentialsVerified(false);
                    }}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setCredentialsVerified(false);
                    }}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                    placeholder="********"
                  />
                  <div className="mt-3 text-right">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors duration-200"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-brand-50 border border-brand-200 p-4">
                  <p className="font-semibold text-brand-900">Autenticação de dois fatores</p>
                  <p className="text-sm text-brand-700 mt-1">Insira o código enviado para o seu email.</p>
                  <p className="text-xs font-mono bg-brand-100 inline-block px-3 py-1 rounded-lg mt-3 text-brand-800">
                    Código simulado: 123456
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código 2FA
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-center text-2xl tracking-[0.5em] placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando...
                </span>
              ) : (
                step === 'credentials' ? 'Continuar' : 'Entrar'
              )}
            </button>

            {step === 'otp' && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm text-slate-500 hover:text-brand-600 transition-colors duration-200"
              >
                ← Voltar para credenciais
              </button>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Não tem conta?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-brand-600 hover:text-brand-700 transition-colors duration-200"
              >
                Registrar
              </Link>
            </p>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <BackButton onClick={handleBack} />
        </div>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Criar conta
          </h1>
          <p className="mt-2 text-slate-500">
            {step === 'details' 
              ? `Insira seus dados para começar no ${settings?.platformName || 'SAMPAY'}`
              : 'Verifique seu email com o código 2FA'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 'details' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </>
          ) : (
            <div>
              <div className="rounded-2xl bg-brand-50 border border-brand-200 p-4 mb-5">
                <p className="font-semibold text-brand-900">Verificação necessária</p>
                <p className="text-sm text-brand-700 mt-1">Insira o código enviado para seu email.</p>
                <p className="text-xs font-mono bg-brand-100 inline-block px-3 py-1 rounded-lg mt-3 text-brand-800">
                  Código simulado: 123456
                </p>
              </div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código 2FA
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength="6"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                placeholder="000000"
              />
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processando...
              </span>
            ) : (
              step === 'details' ? 'Continuar' : 'Confirmar código'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-500 hover:text-brand-600 transition-colors duration-200">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <BackButton to="/login" />
        </div>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Esqueceu a senha?</h1>
          <p className="mt-2 text-slate-500">Digite seu email para receber um token de redefinição</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              placeholder="seu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar token de redefinição'
            )}
          </button>
        </form>

        {resetToken && (
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5">
            <p className="font-semibold text-brand-900">Token de redefinição</p>
            <p className="mt-2 break-all font-mono text-sm bg-white p-3 rounded-xl border border-brand-200">{resetToken}</p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all duration-200"
            >
              Redefinir senha
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-500 hover:text-brand-600 transition-colors duration-200">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <BackButton to="/login" />
        </div>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Nova senha</h1>
          <p className="mt-2 text-slate-500">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Token de redefinição
            </label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              placeholder="Cole o token recebido"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nova senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
              placeholder="Digite novamente a senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Redefinindo...
              </span>
            ) : (
              'Redefinir senha'
            )}
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