// HomePage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// MOCK — substitui pela tua lógica real de auth
function useCurrentUser() {
  // const { user } = useAuth();
  return null;
}

const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

const FEATURES = [
  {
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    title: 'Carteira Digital',
    desc: 'Armazene, envie e receba fundos com total segurança e controle.',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Transferências Instantâneas',
    desc: 'Envie dinheiro para qualquer conta em segundos, 24 horas por dia.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Segurança Avançada',
    desc: 'Criptografia de ponta a ponta e autenticação em dois fatores.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Relatórios Detalhados',
    desc: 'Acompanhe entradas, saídas e saldos com gráficos em tempo real.',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Multimoedas',
    desc: 'Suporte a diversas moedas com conversão automática de câmbio.',
  },
  {
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    title: 'Suporte 24/7',
    desc: 'Atendimento humanizado disponível todos os dias, a qualquer hora.',
  },
];

const STATS = [
  { value: '—', label: 'Usuários ativos' },
  { value: '—', label: 'Processados/mês' },
  { value: '—', label: 'Uptime garantido' },
  { value: '—', label: 'Avaliação dos clientes' },
];

const STEPS = [
  {
    step: '01',
    title: 'Crie sua conta',
    desc: 'Cadastre-se gratuitamente em menos de 2 minutos com seus dados básicos.',
  },
  {
    step: '02',
    title: 'Adicione fundos',
    desc: 'Deposite via M-Pesa, e-Mola, transferência bancária ou cartão.',
  },
  {
    step: '03',
    title: 'Comece a usar',
    desc: 'Envie, receba e gerencie seu dinheiro de forma simples e segura.',
  },
];

function HomePage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fontsInjected = useRef(false);
  const user = useCurrentUser();

  const platformName = settings?.platformName || 'Romenapay';

  useEffect(() => {
    if (fontsInjected.current) return;
    fontsInjected.current = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const dashboardCards = useMemo(
    () => [
      {
        key: 'balance',
        label: 'Saldo disponível',
        value: '— MT',
        accent: 'text-white',
        bg: 'bg-gradient-to-br from-gray-900 to-gray-700 text-white',
      },
      {
        key: 'in',
        label: 'Entradas (mês)',
        value: '+ — MT',
        accent: 'text-emerald-600',
        bg: 'bg-white border border-gray-200',
      },
      {
        key: 'out',
        label: 'Saídas (mês)',
        value: '- — MT',
        accent: 'text-rose-500',
        bg: 'bg-white border border-gray-200',
      },
    ],
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-white pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-200/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1
                className="text-3xl leading-[1.1] text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl"
                style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
              >
                Pagamentos simples,
                <br />
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  rápidos e seguros
                </span>
              </h1>

              <p
                className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500 sm:mt-6 sm:text-lg"
                style={{ fontFamily: FONT_SANS }}
              >
                A plataforma de pagamentos que conecta você ao futuro das transações
                financeiras em Moçambique.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-800/25 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-700/40 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Entrar
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-700/20 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CARTÕES DE SALDO (apenas logado) */}
        {user && (
          <section className="bg-white pb-4 pt-4 sm:pt-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {dashboardCards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl p-4 shadow-sm sm:p-6 ${card.bg}`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-[0.16em] ${
                        card.key === 'balance' ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      style={{ fontFamily: FONT_MONO }}
                    >
                      {card.label}
                    </p>
                    <p
                      className={`mt-1 text-2xl sm:text-3xl ${card.accent}`}
                      style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                    >
                      {card.value}
                    </p>
                    {card.key === 'balance' && (
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                          Enviar
                        </button>
                        <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                          Receber
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RECURSOS */}
        <section className="relative bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs"
                style={{ fontFamily: FONT_MONO }}
              >
                Recursos
              </span>
              <h2
                className="mt-2 text-2xl text-gray-900 sm:mt-3 sm:text-3xl lg:text-4xl"
                style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
              >
                Tudo o que você precisa em um só lugar
              </h2>
              <p className="mt-3 text-sm text-gray-500 sm:mt-4 sm:text-base">
                Gerencie a sua carteira digital, faça transferências e acompanhe as suas
                transações em tempo real.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg sm:p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 text-white shadow-md shadow-gray-800/20 sm:h-12 sm:w-12">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                  </div>
                  <h3
                    className="mt-4 text-base text-gray-900 sm:mt-5 sm:text-lg"
                    style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ESTATÍSTICAS */}
        <section className="border-y border-gray-100 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="text-2xl text-gray-900 sm:text-3xl lg:text-4xl"
                    style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs"
                style={{ fontFamily: FONT_MONO }}
              >
                Como funciona
              </span>
              <h2
                className="mt-2 text-2xl text-gray-900 sm:mt-3 sm:text-3xl lg:text-4xl"
                style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
              >
                Comece em 3 passos simples
              </h2>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="relative rounded-2xl bg-white p-5 shadow-sm sm:bg-transparent sm:p-0 sm:shadow-none">
                  <span
                    className="text-4xl text-gray-200 sm:text-5xl"
                    style={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                  >
                    {item.step}
                  </span>
                  <h3
                    className="mt-1 text-lg text-gray-900 sm:mt-2 sm:text-xl"
                    style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 px-6 py-10 text-center shadow-2xl shadow-gray-900/30 sm:rounded-3xl sm:px-8 sm:py-14">
              <h2
                className="text-2xl text-white sm:text-3xl lg:text-4xl"
                style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
              >
                Pronto para começar?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-300 sm:mt-4 sm:text-base">
                Junte-se a milhares de usuários que já transformaram a forma de gerenciar
                o seu dinheiro.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Criar conta gratuita
                </Link>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;