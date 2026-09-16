// HomePage.jsx - Versão completa com carteira de pagamentos
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function HomePage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fontsInjected = useRef(false);

  // Simulação de usuário logado (substitua pela sua lógica real de auth)
  const user = null; // ou useAuth()?.user

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (fontsInjected.current) return;
    fontsInjected.current = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }, []);

  const platformName = 'Romenapay';

  const features = [
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      ),
      title: 'Carteira Digital',
      desc: 'Armazene, envie e receba fundos com total segurança e controle.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      ),
      title: 'Transferências Instantâneas',
      desc: 'Envie dinheiro para qualquer conta em segundos, 24 horas por dia.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      ),
      title: 'Segurança Avançada',
      desc: 'Criptografia de ponta a ponta e autenticação em dois fatores.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
      title: 'Relatórios Detalhados',
      desc: 'Acompanhe entradas, saídas e saldos com gráficos em tempo real.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      title: 'Multimoedas',
      desc: 'Suporte a diversas moedas com conversão automática de câmbio.',
    },
    {
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      title: 'Suporte 24/7',
      desc: 'Atendimento humanizado disponível todos os dias, a qualquer hora.',
    },
  ];

  const stats = [
    { value: '—', label: 'Usuários ativos' },
    { value: '—', label: 'Processados/mês' },
    { value: '—', label: 'Uptime garantido' },
    { value: '—', label: 'Avaliação dos clientes' },
  ];

  const steps = [
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

  const transactions = [
    { type: 'in', label: '—', value: '—', date: '—' },
    { type: 'out', label: '—', value: '—', date: '—' },
    { type: 'in', label: '—', value: '—', date: '—' },
  ];

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
        <section className="relative overflow-hidden bg-white pt-24 pb-20">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-gray-200/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <p
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-gray-700 shadow-sm"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                <span className="h-2 w-2 rounded-full bg-gray-700 animate-pulse" />
                Bem-vindo ao {platformName}
              </p>

              <h1
                className="text-4xl leading-[1.08] text-gray-900 sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Pagamentos simples,
                <br />
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  rápidos e seguros
                </span>
              </h1>

              <p className="mt-6 max-w-xl mx-auto text-lg leading-relaxed text-gray-500">
                A plataforma de pagamentos que conecta você ao futuro das transações financeiras em Moçambique.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-gray-800/25 transition-all hover:shadow-xl hover:shadow-gray-800/35 hover:-translate-y-0.5"
                >
                  Entrar
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-600 hover:bg-gray-50 hover:shadow-md"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CARD DE SALDO - visível apenas para usuários logados */}
        {user && (
          <section className="bg-white pt-8 pb-4">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-white shadow-lg">
                  <p
                    className="text-xs uppercase tracking-wider text-gray-300"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Saldo disponível
                  </p>
                  <p
                    className="mt-2 text-3xl"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
                  >
                    — MT
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                      Enviar
                    </button>
                    <button className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30">
                      Receber
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p
                    className="text-xs uppercase tracking-wider text-gray-500"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Entradas (mês)
                  </p>
                  <p className="mt-2 text-2xl text-green-600" style={{ fontWeight: 700 }}>
                    + — MT
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p
                    className="text-xs uppercase tracking-wider text-gray-500"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Saídas (mês)
                  </p>
                  <p className="mt-2 text-2xl text-red-500" style={{ fontWeight: 700 }}>
                    - — MT
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ÚLTIMAS TRANSAÇÕES - visível apenas para usuários logados */}
        {user && (
          <section className="bg-white py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-xl text-gray-900"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                >
                  Últimas transações
                </h2>
                <Link to="/extrato" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                  Ver todas →
                </Link>
              </div>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-4 transition hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                        }`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={tx.type === 'in' ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'}
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.label}</p>
                        <p className="text-xs text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === 'in' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RECURSOS */}
        <section className="relative bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Recursos
              </span>
              <h2
                className="mt-3 text-3xl sm:text-4xl text-gray-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Tudo o que você precisa em um só lugar
              </h2>
              <p className="mt-4 text-gray-500">
                Gerencie sua carteira digital, faça transferências e acompanhe suas transações em tempo real.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 text-white shadow-md shadow-gray-800/20">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <h3
                    className="mt-5 text-lg text-gray-900"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ESTATÍSTICAS */}
        <section className="border-y border-gray-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="text-3xl sm:text-4xl text-gray-900"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Como funciona
              </span>
              <h2
                className="mt-3 text-3xl sm:text-4xl text-gray-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Comece em 3 passos simples
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((item) => (
                <div key={item.step} className="relative">
                  <span
                    className="text-5xl text-gray-200"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
                  >
                    {item.step}
                  </span>
                  <h3
                    className="mt-2 text-xl text-gray-900"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 px-8 py-14 text-center shadow-2xl shadow-gray-900/30">
              <h2
                className="text-3xl sm:text-4xl text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Pronto para começar?
              </h2>
              <p className="mt-4 text-gray-300 max-w-xl mx-auto">
                Junte-se a milhares de usuários que já transformaram a forma de gerenciar seu dinheiro.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Criar conta gratuita
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/60 hover:bg-white/10"
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