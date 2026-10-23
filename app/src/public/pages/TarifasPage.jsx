// TarifasPage.jsx
import { useEffect, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { request } from '../../services/api';
import { isPromoActive } from '../../helpers/packagePricing';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

function formatPrice(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function TarifasPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  const loadPlans = async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const data = await request('/api/packages/public');
      setPlans(data || []);
    } catch (error) {
      setPlansError(error.message || 'Não foi possível carregar os planos.');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const platformName = settings?.platformName || 'Romenapay';
  const c2bFeePercent = Number(settings?.c2bFeePercent) || 0;
  const withdrawalFeePercent = Number(settings?.withdrawalFeePercent) || 0;
  const c2bFeeLabel = c2bFeePercent > 0 ? `${c2bFeePercent}%` : 'Grátis';
  const withdrawalFeeLabel =
    withdrawalFeePercent > 0 ? `${withdrawalFeePercent}%` : 'Grátis';

  const feeTable = [
    { service: 'Transferência interna', fee: 'Grátis', time: 'Instantâneo' },
    { service: 'Depósito via M-Pesa (C2B)', fee: c2bFeeLabel, time: 'Instantâneo' },
    { service: 'Saque (B2C)', fee: withdrawalFeeLabel, time: 'Instantâneo' }
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
        <section className="relative overflow-hidden bg-white pt-20 pb-12 sm:pt-24 sm:pb-16">
          <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
           

            <h1
              className="text-3xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl"
              style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
            >
              Transparência total
              <br />
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                sem surpresas
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:mt-4 sm:text-lg">
              Conheça os planos e as tarifas do {platformName}. Escolha o que melhor se
              adapta à sua necessidade.
            </p>
          </div>
        </section>

        {/* PLANOS */}
        <section className="bg-gray-50 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-8 text-center text-2xl text-gray-900 sm:mb-10 sm:text-3xl"
              style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
            >
              Nossos planos
            </h2>

            {plansLoading ? (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
                  >
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="mt-3 h-6 w-32 rounded bg-gray-200" />
                    <div className="mt-4 h-3 w-full rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : plansError ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-700"
              >
                <p>{plansError}</p>
                <button
                  type="button"
                  onClick={loadPlans}
                  className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 font-semibold underline-offset-2 hover:bg-rose-50"
                >
                  Tentar novamente
                </button>
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-sm text-gray-600">
                Nenhum plano disponível de momento.
              </p>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                {plans.map((plan) => {
                  const promoActive = !plan.isFree && isPromoActive(plan);
                  const finalPrice = promoActive ? plan.promoPrice : plan.price;
                  return (
                    <div
                      key={plan.id}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                    >
                      {promoActive && (
                        <span
                          className="mb-2 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                          style={{ fontFamily: FONT_MONO }}
                        >
                          Em promoção
                        </span>
                      )}
                      <h3
                        className="text-lg text-gray-900"
                        style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
                      >
                        {plan.name}
                      </h3>
                      <div className="mt-2">
                        {promoActive && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(plan.price)} / 30 dias
                          </p>
                        )}
                        <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                          {plan.isFree ? 'Grátis' : formatPrice(finalPrice)}
                          {!plan.isFree && (
                            <span className="ml-1 text-xs font-normal text-gray-500">
                              / 30 dias
                            </span>
                          )}
                        </p>
                      </div>
                      {plan.description && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* TABELA DE TARIFAS */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2
              className="mb-8 text-center text-2xl text-gray-900 sm:mb-10 sm:text-3xl"
              style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
            >
              Tabela de tarifas
            </h2>

            {/* Tabela (sm+) */}
            <div className="hidden overflow-hidden rounded-2xl border border-gray-200 shadow-sm sm:block">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {['Serviço', 'Tarifa', 'Prazo'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 lg:px-6 lg:py-4"
                        style={{ fontFamily: FONT_MONO }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {feeTable.map((row) => (
                    <tr key={row.service} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 lg:px-6 lg:py-4">
                        {row.service}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 lg:px-6 lg:py-4">
                        {row.fee}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 lg:px-6 lg:py-4">
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (mobile) */}
            <div className="space-y-3 sm:hidden">
              {feeTable.map((row) => (
                <div
                  key={row.service}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-900">{row.service}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Tarifa</span>
                    <span className="font-semibold text-gray-900">{row.fee}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Prazo</span>
                    <span className="text-gray-700">{row.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-400">
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