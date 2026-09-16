// TarifasPage.jsx - Versão completa com tabela de tarifas
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function TarifasPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const platformName = settings?.platformName || 'Romenapay';

  const plans = [
    {
      name: 'Básico',
      price: 'Grátis',
      features: ['Transferências ilimitadas', '1 moeda (MT)', 'Suporte por e-mail'],
    },
    {
      name: 'Profissional',
      price: '299 MT/mês',
      features: [
        'Tudo do Básico',
        'Multimoedas',
        'Relatórios avançados',
        'Suporte prioritário',
      ],
      highlight: true,
    },
    {
      name: 'Empresarial',
      price: '999 MT/mês',
      features: ['Tudo do Profissional', 'API dedicada', 'Gerente de conta', 'SLA garantido'],
    },
  ];

  const feeTable = [
    { service: 'Transferência interna', fee: 'Grátis', time: 'Instantâneo' },
    { service: 'Depósito via M-Pesa', fee: 'Grátis', time: 'Instantâneo' },
    { service: 'Depósito via e-Mola', fee: 'Grátis', time: 'Instantâneo' },
    { service: 'Levantamento', fee: '100 MT', time: 'Instantâneo' },
  
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-white pt-24 pb-16">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <p
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-gray-700 shadow-sm"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <span className="h-2 w-2 rounded-full bg-gray-700 animate-pulse" />
              Tarifas
            </p>

            <h1
              className="text-4xl font-semibold text-gray-900 sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Transparência total
              <br />
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                sem surpresas
              </span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
              Conheça os planos e as tarifas do {platformName}. Escolha o que melhor se adapta à sua necessidade.
            </p>
          </div>
        </section>

        {/* PLANOS */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2
              className="text-center text-2xl sm:text-3xl text-gray-900 mb-10"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Nossos planos
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-6 ${
                    plan.highlight
                      ? 'border-gray-800 bg-white shadow-xl ring-1 ring-gray-800'
                      : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  {plan.highlight && (
                    <span
                      className="mb-3 inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Mais popular
                    </span>
                  )}
                  <h3
                    className="text-lg text-gray-900"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                    {plan.price}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg
                          className="mt-0.5 h-4 w-4 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TABELA DE TARIFAS */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2
              className="text-center text-2xl sm:text-3xl text-gray-900 mb-10"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Tabela de tarifas
            </h2>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Serviço
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Tarifa
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      Prazo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {feeTable.map((row) => (
                    <tr key={row.service} className="transition hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.service}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{row.fee}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              * Valores em Meticais (MT). Tarifas sujeitas a alteração sem aviso prévio.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default TarifasPage;