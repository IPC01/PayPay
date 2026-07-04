import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function TarifasPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pricingCards = useMemo(
    () => [
      {
        title: 'Conta Starter',
        value: '2.5%',
        description: 'Ideal para quem esta iniciando e precisa de recebimentos rapidos.'
      },
      {
        title: 'Conta Business',
        value: '1.8%',
        description: 'Menor custo por transacao para operacoes em crescimento.'
      },
      {
        title: 'Saque para banco',
        value: 'Taxa fixa',
        description: 'Cobranca transparente por operacao, sem custos ocultos.'
      }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-slate-50 to-white text-slate-900">
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={settings?.platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Tarifas</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Planos claros para cada etapa</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Escolha o plano ideal para o volume da sua operacao. Sem surpresas e com custos transparentes.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {pricingCards.map(card => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-3xl font-extrabold text-brand-700">{card.value}</p>
              <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700"
          >
            Entrar agora
          </Link>
          <Link
            to="/inicio"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Voltar ao inicio
          </Link>
        </div>
      </main>
    </div>
  );
}

export default TarifasPage;
