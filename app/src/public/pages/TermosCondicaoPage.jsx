// TermosCondicaoPage.jsx - Versão leve com fundo branco
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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header
        language={language}
        setLanguage={setLanguage}
        onOpenSidebar={() => setSidebarOpen(true)}
        platformName={settings?.platformName || 'Romenapay'}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-white pt-24 pb-16 min-h-[60vh] flex items-center">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />
          
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-gray-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gray-600 animate-pulse" />
              Em manutenção
            </div>
            
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-700/20">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            
            <h1 
              className="mt-6 text-4xl font-semibold text-gray-900 sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Termos em Atualização
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
              Estamos revisando nossos termos e condições para melhor atender você.
              <br />
              Em breve disponibilizaremos a versão atualizada.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-800/25 transition-all hover:shadow-xl hover:shadow-gray-800/35 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
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

export default TermosCondicaoPage;