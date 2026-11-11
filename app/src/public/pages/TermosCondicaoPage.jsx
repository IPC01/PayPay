// TermosCondicaoPage.jsx
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

function TermosCondicaoPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const platformName = settings?.platformName || 'Romenapay';

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
        <section className="relative overflow-hidden bg-white pt-20 pb-10 sm:pt-24 sm:pb-12">
          <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/30 blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1
              className="text-3xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl"
              style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
            >
              Termos e Condições
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:mt-4 sm:text-base">
              Resumo dos termos que regem o uso da {platformName}.
            </p>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="bg-gray-50 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:space-y-6 sm:p-8">
              <p
                className="text-sm leading-relaxed text-gray-600 sm:text-base"
                style={{ fontFamily: FONT_SANS }}
              >
                Ao utilizar a <strong className="font-semibold text-gray-900">{platformName}</strong>,
                concordas com estes Termos e Condições. A plataforma oferece serviços de carteira
                digital, transferências e pagamentos em meticais, sujeitos a alterações a qualquer
                momento.
              </p>

              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Para usar os serviços deves criar uma conta com dados verdadeiros e manter as tuas
                credenciais seguras. Os teus dados pessoais são protegidos e utilizados apenas para
                a prestação do serviço, em conformidade com a legislação aplicável.
              </p>

              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Alguns serviços podem ter tarifas, expressas em Meticais (MT). És responsável por
                utilizar a plataforma de forma lícita e por todas as transações realizadas na tua
                conta. Não nos responsabilizamos por danos indiretos decorrentes do uso dos
                serviços, salvo nos casos previstos na lei.
              </p>

              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Podes encerrar a tua conta a qualquer momento nas configurações. Estes Termos podem
                ser atualizados periodicamente e o uso contínuo da plataforma implica a sua
                aceitação. Tudo é regido pelas leis da República de Moçambique.
              </p>

              <p
                className="border-t border-gray-100 pt-4 text-xs text-gray-400 sm:pt-5"
                style={{ fontFamily: FONT_MONO }}
              >
                Dúvidas? Contacta o nosso suporte.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default TermosCondicaoPage;