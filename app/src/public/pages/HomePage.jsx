import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function HomePage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-slate-50 to-white text-slate-900">
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={settings?.platformName}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                Pagamentos digitais simplificados
              </p>
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                Receba, mova e controle seu dinheiro em um só painel.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                O {settings?.platformName || 'PayPay'} conecta clientes, transações e carteira digital com segurança,
                agilidade e visão completa da operação.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Entrar na plataforma
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Criar conta
                </Link>
                <Link
                  to="/tarifas"
                  className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Ver tarifas
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-xl shadow-brand-100/40 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Resumo em tempo real</h2>
              <p className="mt-2 text-sm text-slate-500">Visão rápida da sua operação financeira.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Volume diário</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">MZN 4.280.000</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-brand-50 p-4">
                    <p className="text-xs text-brand-700">Transações aprovadas</p>
                    <p className="mt-1 text-xl font-bold text-brand-900">98.7%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-4">
                    <p className="text-xs text-slate-600">Tempo médio</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">2.4s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-2 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/tarifas"
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Tarifas</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Conheca os planos e custos</h2>
              <p className="mt-2 text-sm text-slate-600">Veja os valores por tipo de conta e operacao.</p>
            </Link>

            <Link
              to="/termos-de-condicao"
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Termos</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Leia os termos de condicao</h2>
              <p className="mt-2 text-sm text-slate-600">Entenda regras de uso, seguranca e conformidade.</p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;