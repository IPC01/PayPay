import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

const SIMULATED_OTP = '123456';

function Login() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvePostLoginRoute = (requestedPath, roleId) => {
    const safePath = requestedPath && requestedPath !== '/login' ? requestedPath : '/client';

    if (roleId !== 1 && safePath.startsWith('/admin')) {
      return '/client';
    }

    return safePath;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    if (step === 'credentials') {
      setStep('otp');
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

  return (
    <div className="fixed inset-0 flex bg-slate-50">
      {/* Coluna da Imagem - Esquerda */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <h2 className="text-3xl font-bold mb-4">Bem-vindo de volta!</h2>
            <p className="text-lg text-white/90 mb-8">
              Acesse sua conta e gerencie suas atividades de forma segura e eficiente.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Segurança em dois fatores</p>
                <p className="text-sm text-white/80">Proteção adicional para sua conta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Dados protegidos</p>
                <p className="text-sm text-white/80">Criptografia de ponta a ponta</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Acesso rápido</p>
                <p className="text-sm text-white/80">Interface otimizada para sua produtividade</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm text-white/70">
              © {new Date().getFullYear()} {settings?.platformName || 'Sua Empresa'}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Coluna do Formulário - Direita */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-brand-100 text-brand-600 mb-6">
              {settings?.logoImg ? (
                <img src={settings.logoImg} alt={settings.platformName || 'Logo'} className="h-10 w-10 object-contain" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Faça login na sua conta</h1>
            <p className="text-slate-500">Aceda ao {settings?.platformName || 'sistema'} com as suas credenciais.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 'credentials' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-slate-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="••••••••"
                  />
                  <div className="mt-2 text-right">
                    <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                      Esqueceu a senha?
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-brand-50 border border-brand-200 p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-brand-900">Autenticação de dois fatores</p>
                      <p className="text-sm text-brand-700 mt-1">
                        Insira o código enviado para o seu email.
                      </p>
                      <p className="text-xs font-mono bg-brand-100 inline-block px-2 py-1 rounded mt-2 text-brand-800">
                        Código simulado: 123456
                      </p>
                    </div>
                  </div>
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-slate-900 text-center text-2xl tracking-widest transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:shadow-none"
            >
              {step === 'credentials' ? (
                'Continuar'
              ) : loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Verificar código'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Não tem conta?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Registar
              </Link>
            </p>
          </div>

          {/* Versão mobile das features */}
          <div className="mt-8 pt-8 border-t border-gray-200 lg:hidden">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Autenticação em dois fatores</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Dados protegidos com criptografia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;