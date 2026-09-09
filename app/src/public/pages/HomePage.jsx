// HomePage.jsx - Versão leve com fundo branco
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

  const platformName = settings?.platformName || 'Romenapay';

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
                Bem-vindo ao Romenapay
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
                A plataforma de pagamentos que conecta você ao futuro das transações financeiras.
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
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;