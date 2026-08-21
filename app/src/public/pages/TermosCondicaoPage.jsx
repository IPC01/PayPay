import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function TermosCondicaoPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    {
      title: '1. Aceitação dos Termos',
      content: 'Ao utilizar a plataforma, você concorda com todas as políticas de segurança, proteção de dados e validação de identidade (KYC) estabelecidas neste documento. O uso contínuo da plataforma constitui aceitação plena destes termos.'
    },
    {
      title: '2. Segurança e Proteção de Dados',
      content: 'Todas as operações são registradas para auditoria, rastreabilidade e prevenção de fraude, garantindo conformidade com as exigências regulatórias aplicáveis. Seus dados são protegidos com criptografia de ponta a ponta e armazenados em servidores seguros.'
    },
    {
      title: '3. Autenticação e Acesso',
      content: 'O acesso ao sistema depende de autenticação válida e do cumprimento das regras internas de conformidade, incluindo verificação de permissão por perfil de usuário. Cada usuário é responsável pela confidencialidade de suas credenciais.'
    },
    {
      title: '4. Responsabilidades do Usuário',
      content: 'O usuário se compromete a fornecer informações verdadeiras e atualizadas, utilizar a plataforma apenas para fins legítimos, e notificar imediatamente qualquer uso não autorizado de sua conta.'
    },
    {
      title: '5. Política de Privacidade',
      content: 'Coletamos e processamos dados pessoais apenas para fins operacionais e de conformidade. Não compartilhamos suas informações com terceiros sem seu consentimento explícito, exceto quando exigido por lei.'
    },
    {
      title: '6. Cancelamento e Rescisão',
      content: 'O usuário pode cancelar sua conta a qualquer momento. A plataforma reserva-se o direito de suspender ou encerrar contas que violem estes termos ou apresentem atividades suspeitas.'
    }
  ];

  return (
    <div 
      className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"
      style={{
        '--ink': '#0F172A',
        '--paper': '#F8FAFC',
        '--primary': '#1D4ED8',
        '--primary-light': '#3B82F6',
        '--primary-lighter': '#93C5FD',
        '--primary-dark': '#1E3A8A',
        '--slate': '#64748B',
        '--slate-light': '#94A3B8',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={settings?.platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#DBEAFE] pt-24 pb-16">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#1D4ED8]/5 blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p 
                className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-light)]/30 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)] shadow-sm"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <span className="h-2 w-2 rounded-full bg-[var(--primary-light)] animate-pulse" />
                Transparência e conformidade
              </p>
              <h1 
                className="mt-6 text-4xl font-semibold text-[var(--ink)] sm:text-5xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Termos e
                <br />
                <span className="bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] bg-clip-text text-transparent">
                  Condições
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-[var(--slate)]">
                Uso seguro e transparente do sistema. Conheça nossas políticas e compromissos.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-[#E2E8F0] sm:p-10">
            {/* Última atualização */}
            <div className="mb-8 flex items-center gap-2 text-sm text-[var(--slate)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Última atualização: 15 de janeiro de 2026
            </div>

            {/* Introdução */}
            <div className="mb-10 rounded-xl bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] p-6">
              <p className="text-sm leading-relaxed text-[var(--ink)]">
                <span className="font-semibold">Bem-vindo à plataforma {settings?.platformName || 'PayPay'}.</span>{' '}
                Estes Termos e Condições regem o uso de nossos serviços e estabelecem um compromisso de 
                transparência, segurança e conformidade com todas as partes envolvidas.
              </p>
            </div>

            {/* Seções */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div 
                  key={index} 
                  className={`pb-8 ${
                    index < sections.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                  }`}
                >
                  <h2 
                    className="text-lg font-semibold text-[var(--ink)]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--slate)]">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Aceitação */}
            <div className="mt-10 rounded-xl border-2 border-[#3B82F6] bg-[#F8FAFC] p-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="font-semibold text-[var(--ink)]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Ao continuar, você aceita estes termos
                  </h3>
                  <p className="mt-1 text-sm text-[var(--slate)]">
                    Recomendamos a leitura completa deste documento antes de utilizar a plataforma.
                    Em caso de dúvidas, entre em contato com nosso suporte.
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/25 transition-all hover:shadow-xl hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5"
                >
                  Entrar agora
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center rounded-xl border-2 border-[#E2E8F0] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-all hover:border-[#3B82F6] hover:bg-[#F8FAFC]"
                >
                  Voltar ao início
                </Link>
              </div>
              
              <Link
                to="/suporte"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#3B82F6] transition hover:text-[#1D4ED8]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Precisa de ajuda?
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default TermosCondicaoPage;