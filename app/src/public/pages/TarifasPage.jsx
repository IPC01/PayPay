import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function TarifasPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pricingCards = useMemo(
    () => [
      {
        title: 'Conta Starter',
        value: '2.5%',
        description: 'Ideal para quem está iniciando e precisa de recebimentos rápidos.',
        features: ['Transações ilimitadas', 'Suporte por email', 'Dashboard básico'],
        popular: false,
      },
      {
        title: 'Conta Business',
        value: '1.8%',
        description: 'Menor custo por transação para operações em crescimento.',
        features: ['Transações ilimitadas', 'Suporte prioritário', 'Dashboard avançado', 'API de integração'],
        popular: true,
      },
      {
        title: 'Saque para banco',
        value: 'Taxa fixa',
        description: 'Cobrança transparente por operação, sem custos ocultos.',
        features: ['Transferência em 24h', 'Taxa única por saque', 'Múltiplos bancos'],
        popular: false,
      }
    ],
    []
  );

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
                Transparência total
              </p>
              <h1 
                className="mt-6 text-4xl font-semibold text-[var(--ink)] sm:text-5xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                Planos claros para
                <br />
                <span className="bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] bg-clip-text text-transparent">
                  cada etapa
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-[var(--slate)]">
                Escolha o plano ideal para o volume da sua operação. Sem surpresas e com custos transparentes.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {pricingCards.map((card, index) => (
              <div
                key={card.title}
                className={`relative rounded-2xl bg-white p-8 shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 ${
                  card.popular 
                    ? 'border-[#3B82F6] shadow-lg shadow-[#1D4ED8]/10' 
                    : 'border-[#E2E8F0] hover:border-[#3B82F6]'
                }`}
              >
                {card.popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] px-4 py-1 text-xs font-semibold text-white shadow-md">
                    Mais popular
                  </span>
                )}
                
                <h2 
                  className="text-lg font-semibold text-[var(--ink)]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {card.title}
                </h2>
                
                <p 
                  className="mt-4 text-4xl font-bold bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] bg-clip-text text-transparent"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {card.value}
                </p>
                
                <p className="mt-2 text-sm text-[var(--slate)]">
                  {card.description}
                </p>

                <ul className="mt-6 space-y-3 border-t border-[#E2E8F0] pt-6">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[var(--slate)]">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                    card.popular
                      ? 'bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] text-white shadow-lg shadow-[#1D4ED8]/25 hover:shadow-xl hover:shadow-[#1D4ED8]/35 hover:-translate-y-0.5'
                      : 'border-2 border-[#E2E8F0] text-[var(--ink)] hover:border-[#3B82F6] hover:bg-[#F8FAFC]'
                  }`}
                >
                  Escolher plano
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-16 rounded-2xl bg-white p-8 shadow-sm border border-[#E2E8F0]">
            <h3 
              className="text-xl font-semibold text-[var(--ink)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Compare todos os planos
            </h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="pb-4 text-left font-semibold text-[var(--slate)]">Recurso</th>
                    <th className="pb-4 text-center font-semibold text-[var(--slate)]">Starter</th>
                    <th className="pb-4 text-center font-semibold text-[var(--slate)]">Business</th>
                    <th className="pb-4 text-center font-semibold text-[var(--slate)]">Saque</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Transações mensais', 'Ilimitadas', 'Ilimitadas', 'N/A'],
                    ['Suporte', 'Email', 'Prioritário', 'Email'],
                    ['Dashboard', 'Básico', 'Avançado', 'Básico'],
                    ['API de integração', '❌', '✅', '❌'],
                    ['Taxa por saque', 'MZN 50', 'MZN 35', 'MZN 25'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#E2E8F0] last:border-0">
                      <td className="py-4 font-medium text-[var(--ink)]">{row[0]}</td>
                      <td className="py-4 text-center text-[var(--slate)]">{row[1]}</td>
                      <td className="py-4 text-center text-[var(--slate)]">{row[2]}</td>
                      <td className="py-4 text-center text-[var(--slate)]">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] p-8">
            <div>
              <h4 
                className="text-lg font-semibold text-[var(--ink)]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Pronto para começar?
              </h4>
              <p className="text-sm text-[var(--slate)]">
                Escolha seu plano e comece a receber pagamentos hoje mesmo.
              </p>
            </div>
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default TarifasPage;