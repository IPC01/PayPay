// Auth.jsx - Versão leve com fundo branco e cores pretas
import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useNotification } from '../../contexts/NotificationContext';
import { request } from '../../services/api';

const SIMULATED_OTP = '123456';

// ============================================
// COMPONENTES REUTILIZÁVEIS
// ============================================

const BackButton = ({ onClick, to, label = 'Voltar' }) => {
  const className = "group inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-all duration-200 font-medium";
  
  if (to) {
    return (
      <Link to={to} className={className}>
        <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  );
};

const InputField = ({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  required, 
  className = '', 
  icon,
  error,
  ...props 
}) => (
  <div className={className}>
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`
          w-full rounded-lg border-2 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 
          transition-all duration-200 outline-none
          ${icon ? 'pl-9' : 'pl-3'}
          ${error ? 'border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 bg-gray-50 focus:border-gray-700 focus:ring-2 focus:ring-gray-700/20 focus:bg-white'}
          hover:border-gray-300
        `}
        placeholder={placeholder}
        {...props}
      />
    </div>
  </div>
);

const LoadingSpinner = () => (
  <span className="flex items-center justify-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <span className="text-sm">Processando...</span>
  </span>
);

const Divider = ({ text }) => (
  <div className="relative my-4">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-white px-3 text-gray-400 font-medium">{text}</span>
    </div>
  </div>
);

// ============================================
// LOGIN VIEW - RESPONSIVA E OTIMIZADA
// ============================================

function LoginView() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [credentialsVerified, setCredentialsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedEmail = localStorage.getItem('romenapay_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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
      if (!email || !password) {
        setError('Preencha todos os campos.');
        return;
      }

      setLoading(true);

      try {
        await request('/api/auth/verify-credentials', {
          method: 'POST',
          body: { email, password }
        });

        if (rememberMe) {
          localStorage.setItem('romenapay_email', email);
        } else {
          localStorage.removeItem('romenapay_email');
        }

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

  const platformName = settings?.platformName || 'Romenapay';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[380px]">
        {/* Logo e Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-30 h-20 object-contain"
            />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Plataforma de pagamentos</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          {/* Botão Voltar */}
          <div className="mb-4">
            <BackButton onClick={handleBack} />
          </div>

          {/* Título do formulário */}
          <div className="mb-5">
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {step === 'credentials' ? 'Bem-vindo' : 'Verificação em 2 etapas'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {step === 'credentials' 
                ? 'Acesse sua conta com segurança'
                : 'Insira o código de verificação enviado para seu email.'}
            </p>
          </div>

          {/* Formulário */}
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
                  error={!!error}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />

                <div className="relative">
                  <InputField
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setCredentialsVerified(false);
                    }}
                    placeholder="••••••••"
                    required
                    error={!!error}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-2 border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-700/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="group-hover:text-gray-900 transition-colors">Lembrar-me</span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Autenticação de dois fatores</p>
                      <p className="text-xs text-gray-500 mt-0.5">Insira o código de 6 dígitos enviado para seu email.</p>
                      <p className="text-[10px] font-mono bg-gray-200 inline-block px-2 py-0.5 rounded mt-1.5 text-gray-700">
                        Código: 123456
                      </p>
                    </div>
                  </div>
                </div>

                <InputField
                  label="Código de verificação"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength="6"
                  className="text-center text-lg tracking-[0.5em] font-mono"
                  error={!!error}
                />

                <button
                  type="button"
                  onClick={handleBack}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  ← Voltar para credenciais
                </button>
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
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : (step === 'credentials' ? 'Continuar' : 'Entrar')}
            </button>
          </form>

          <Divider text="ou" />

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Não tem conta?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>

          {/* Rodapé compacto */}
          <p className="mt-4 text-center text-[10px] text-gray-400">
            Ao continuar, você concorda com nossos{' '}
            <Link to="/termos-de-condicao" className="text-gray-500 hover:text-gray-700 transition-colors">
              Termos
            </Link>
            {' e '}
            <Link to="/termos-de-condicao" className="text-gray-500 hover:text-gray-700 transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REGISTER VIEW - RESPONSIVA
// ============================================

function RegisterView() {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'details') {
      if (!acceptTerms) {
        setError('Você precisa aceitar os termos e condições.');
        return;
      }
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
      setSuccess('Conta registada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 1500);
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

  const platformName = settings?.platformName || 'Romenapay';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="w-30 h-20 object-contain" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Crie sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          <div className="mb-4">
            <BackButton onClick={handleBack} />
          </div>

          <div className="mb-5">
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {step === 'details' ? 'Criar conta' : 'Verifique seu email'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {step === 'details' 
                ? 'Preencha os dados para começar'
                : 'Insira o código de verificação enviado para seu email.'}
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
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />
                <div className="relative">
                  <InputField
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-2 border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-700/20 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                  />
                  <span className="group-hover:text-gray-900 transition-colors">
                    Li e aceito os{' '}
                    <Link to="/termos-de-condicao" className="text-gray-700 hover:underline font-medium">
                      Termos de Serviço
                    </Link>
                    {' e '}
                    <Link to="/termos-de-condicao" className="text-gray-700 hover:underline font-medium">
                      Política de Privacidade
                    </Link>
                  </span>
                </label>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-700 rounded-md flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Verificação necessária</p>
                      <p className="text-xs text-gray-500 mt-0.5">Insira o código de 6 dígitos enviado para seu email.</p>
                      <p className="text-[10px] font-mono bg-gray-200 inline-block px-2 py-0.5 rounded mt-1.5 text-gray-700">
                        Código: 123456
                      </p>
                    </div>
                  </div>
                </div>

                <InputField
                  label="Código de verificação"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="000000"
                  required
                  maxLength="6"
                  className="text-center text-lg tracking-[0.5em] font-mono"
                  error={!!error}
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
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : (step === 'details' ? 'Continuar' : 'Confirmar código')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium">
              Já tem conta? <span className="font-semibold">Entrar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FORGOT PASSWORD VIEW - RESPONSIVA
// ============================================

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          <div className="mb-4">
            <BackButton to="/login" />
          </div>

          <div className="mb-5">
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Esqueceu a senha?
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Digite seu email para receber um token de redefinição
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : 'Enviar token de redefinição'}
            </button>
          </form>

          {resetToken && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 animate-in slide-in-from-top-4 fade-in duration-300">
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Token de redefinição</p>
              <p className="mt-1.5 break-all font-mono text-xs bg-white p-2 rounded border border-gray-200 text-gray-900">
                {resetToken}
              </p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30"
              >
                Redefinir senha
              </Link>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium">
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// RESET PASSWORD VIEW - RESPONSIVA
// ============================================

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          <div className="mb-4">
            <BackButton to="/login" />
          </div>

          <div className="mb-5">
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Nova senha
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Digite sua nova senha para acessar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Token de redefinição"
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Cole o token recebido"
              required
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              }
            />

            <div className="relative">
              <InputField
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <InputField
                label="Confirmar senha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a senha"
                required
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-gray-800/20 transition-all duration-200 hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-800/30 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AUTH - ROTEADOR PRINCIPAL
// ============================================

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