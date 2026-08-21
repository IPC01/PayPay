import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Rails que convergem para a plataforma — usado no diagrama do hero
const RAILS = [
  { label: 'Carteira móvel', y: 40 },
  { label: 'Cartão', y: 130 },
  { label: 'Transferência', y: 220 },
  { label: 'Referência', y: 310 },
];

function RoutingDiagram({ platformName, reduceMotion }) {
  const centerX = 250,
    centerY = 175;
  const rightX = 430,
    rightY = 175;

  const pathFor = (y) =>
    `M 60 ${y} C 150 ${y}, 170 ${centerY}, ${centerX - 22} ${centerY}`;

  return (
    <svg
      viewBox="0 0 480 350"
      className="h-full w-full"
      role="img"
      aria-label="Diagrama mostrando várias formas de pagamento a convergirem para a plataforma e a seguirem para o comerciante"
    >
      <defs>
        <marker
          id="dot"
          viewBox="0 0 8 8"
          refX="4"
          refY="4"
          markerWidth="8"
          markerHeight="8"
        >
          <circle cx="4" cy="4" r="4" fill="#3B82F6" />
        </marker>
        <linearGradient id="platformGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="railGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* linhas dos rails até o centro */}
      {RAILS.map((rail, i) => (
        <g key={rail.label}>
          <path
            d={pathFor(rail.y)}
            fill="none"
            stroke="url(#railGrad)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {!reduceMotion && (
            <circle r="3.5" fill="#3B82F6">
              <animateMotion
                dur="3.2s"
                begin={`${i * 0.5}s`}
                repeatCount="indefinite"
                path={pathFor(rail.y)}
              />
            </circle>
          )}
          <circle
            cx="60"
            cy={rail.y}
            r="26"
            fill="#F8FAFC"
            stroke="#3B82F6"
            strokeWidth="2"
          />
          <text
            x="60"
            y={rail.y + 4}
            textAnchor="middle"
            fontSize="8"
            fontFamily="'IBM Plex Mono', monospace"
            fill="#1E293B"
          >
            {rail.label.split(' ')[0]}
          </text>
          <text
            x="60"
            y={rail.y + 42}
            textAnchor="middle"
            fontSize="9"
            fontFamily="'IBM Plex Sans', sans-serif"
            fill="#64748B"
          >
            {rail.label}
          </text>
        </g>
      ))}

      {/* centro: a plataforma */}
      <circle cx={centerX} cy={centerY} r="38" fill="url(#platformGrad)" />
      <circle
        cx={centerX}
        cy={centerY}
        r="38"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="2"
        opacity="0.5"
      />
      <text
        x={centerX}
        y={centerY + 5}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fontFamily="'Space Grotesk', sans-serif"
        fill="#F8FAFC"
      >
        {(platformName || 'PayPay').slice(0, 8)}
      </text>

      {/* saída para o comerciante */}
      <path
        d={`M ${centerX + 22} ${centerY} C 340 ${centerY}, 360 ${rightY}, ${
          rightX - 26
        } ${rightY}`}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2.5"
      />
      {!reduceMotion && (
        <circle r="4" fill="#1E293B">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path={`M ${centerX + 22} ${centerY} C 340 ${centerY}, 360 ${rightY}, ${
              rightX - 26
            } ${rightY}`}
          />
        </circle>
      )}
      <circle
        cx={rightX}
        cy={rightY}
        r="26"
        fill="#F8FAFC"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      <text
        x={rightX}
        y={rightY + 4}
        textAnchor="middle"
        fontSize="8"
        fontFamily="'IBM Plex Mono', monospace"
        fill="#1E293B"
      >
        MZN
      </text>
      <text
        x={rightX}
        y={rightY + 42}
        textAnchor="middle"
        fontSize="9"
        fontFamily="'IBM Plex Sans', sans-serif"
        fill="#64748B"
      >
        Comerciante
      </text>
    </svg>
  );
}

function HomePage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fontsInjected = useRef(false);

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

  const platformName = settings?.platformName || 'PayPay';

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--paper)] text-[var(--ink)]"
      style={{
        '--ink': '#0F172A',
        '--paper': '#F8FAFC',
        '--primary': '#1D4ED8',
        '--primary-light': '#3B82F6',
        '--primary-lighter': '#93C5FD',
        '--primary-dark': '#1E3A8A',
        '--gold': '#3B82F6',
        '--sand': '#EFF6FF',
        '--slate': '#64748B',
        '--slate-light': '#94A3B8',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#DBEAFE] pt-24 pb-20">
          {/* Decorative elements */}
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#1D4ED8]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#93C5FD]/5 blur-2xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <p
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--primary-light)]/30 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)] shadow-sm"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--primary-light)] animate-pulse" />
                  Plataforma agregadora de pagamentos
                </p>

                <h1
                  className="text-4xl leading-[1.08] text-[var(--ink)] sm:text-5xl lg:text-6xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                >
                  O dinheiro entra por
                  <br />
                  <span className="bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] bg-clip-text text-transparent">
                    várias portas.
                  </span>
                  <br />
                  No {platformName}, sai por uma só.
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--slate)]">
                  Ligamos carteiras móveis, cartões e transferências bancárias a um único painel de
                  liquidação — com aprovação em segundos e visibilidade total sobre cada transação.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/25 transition-all hover:shadow-xl hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    Entrar na plataforma
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center rounded-xl border-2 border-[var(--primary-light)]/30 bg-white/80 backdrop-blur-sm px-8 py-3.5 text-sm font-semibold text-[var(--ink)] transition-all hover:border-[var(--primary-light)] hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-light)]"
                  >
                    Criar conta grátis
                  </Link>
                  <Link
                    to="/tarifas"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--slate)] transition hover:text-[var(--primary)] group"
                  >
                    Ver tarifas
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>

                {/* faixa de confiança */}
                <dl
                  className="mt-12 grid max-w-md grid-cols-3 gap-8 border-t border-[var(--slate-light)]/20 pt-8"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--slate)] font-medium">
                      Aprovação
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-[var(--ink)]">98.7%</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--slate)] font-medium">
                      Liquidação
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-[var(--ink)]">2.4s</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-[var(--slate)] font-medium">
                      Suporte
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-[var(--ink)]">24/7</dd>
                  </div>
                </dl>
              </div>

              {/* diagrama de roteamento — elemento assinatura */}
              <div className="rounded-2xl bg-white/70 backdrop-blur-sm p-6 shadow-xl shadow-[#1D4ED8]/5 border border-[#93C5FD]/30">
                <RoutingDiagram platformName={platformName} reduceMotion={reduceMotion} />
              </div>
            </div>
          </div>
        </section>

        {/* FAIXA DE VOLUME (estilo razão contábil) */}
        <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-12 border-t border-[#334155]">
          <div
            className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6 lg:px-8"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#93C5FD] font-medium">Volume hoje</p>
              <p className="mt-1.5 text-2xl font-medium text-white">MZN 4.280.000</p>
              <div className="mt-2 h-0.5 w-12 bg-[#3B82F6]/30 rounded-full" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#93C5FD] font-medium">Transações</p>
              <p className="mt-1.5 text-2xl font-medium text-white">12.940</p>
              <div className="mt-2 h-0.5 w-12 bg-[#3B82F6]/30 rounded-full" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#93C5FD] font-medium">Comerciantes ativos</p>
              <p className="mt-1.5 text-2xl font-medium text-white">1.180</p>
              <div className="mt-2 h-0.5 w-12 bg-[#3B82F6]/30 rounded-full" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#93C5FD] font-medium">Vias de pagamento</p>
              <p className="mt-1.5 text-2xl font-medium text-white">4</p>
              <div className="mt-2 h-0.5 w-12 bg-[#3B82F6]/30 rounded-full" />
            </div>
          </div>
        </section>

        {/* EXPLORAR */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p
                className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--slate)]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Saiba mais
              </p>
              <h2
                className="mt-2 text-2xl font-semibold text-[var(--ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Recursos da plataforma
              </h2>
            </div>
            <div className="hidden sm:block h-0.5 w-32 bg-gradient-to-r from-[#3B82F6] to-transparent rounded-full" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/tarifas"
              className="group rounded-2xl bg-white p-8 shadow-sm border border-[#E2E8F0] transition-all hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#1D4ED8]/5 hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1D4ED8] text-xl font-bold">
                %
              </span>
              <h3
                className="mt-5 text-xl text-[var(--ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Tarifas
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--slate)]">
                Consulte os custos por tipo de conta e operação, sem letras miúdas.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#1D4ED8] transition group-hover:gap-2 gap-1">
                Ver planos
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              to="/termos-de-condicao"
              className="group rounded-2xl bg-white p-8 shadow-sm border border-[#E2E8F0] transition-all hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#1D4ED8]/5 hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1D4ED8] text-xl font-bold">
                §
              </span>
              <h3
                className="mt-5 text-xl text-[var(--ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Termos e condições
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--slate)]">
                Regras de uso, segurança e conformidade da plataforma.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#1D4ED8] transition group-hover:gap-2 gap-1">
                Ler termos
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            <Link
              to="/suporte"
              className="group rounded-2xl bg-white p-8 shadow-sm border border-[#E2E8F0] transition-all hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#1D4ED8]/5 hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1D4ED8] text-xl">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
              </span>
              <h3
                className="mt-5 text-xl text-[var(--ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Suporte
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--slate)]">
                Tire dúvidas e encontre ajuda com nossa equipe especializada.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#1D4ED8] transition group-hover:gap-2 gap-1">
                Falar com suporte
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] py-20 border-t border-[#334155]">
          <div className="mx-auto max-w-4xl text-center px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#1E293B] px-4 py-1.5 text-xs font-medium text-[#93C5FD] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              Comece agora
            </div>
            <h2
              className="text-3xl font-semibold text-white sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Pronto para simplificar seus
              <br />
              <span className="bg-gradient-to-r from-[#93C5FD] to-[#3B82F6] bg-clip-text text-transparent">
                pagamentos?
              </span>
            </h2>
            <p className="mt-4 text-lg text-[#94A3B8] max-w-xl mx-auto">
              Junte-se a mais de 1.000 comerciantes que já confiam na nossa plataforma.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/25 transition-all hover:shadow-xl hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5"
              >
                Criar conta grátis
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-[#334155] px-8 py-3.5 text-sm font-semibold text-[#94A3B8] transition-all hover:border-[#3B82F6] hover:text-white hover:bg-[#1E293B]"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;