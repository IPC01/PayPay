import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function TermosCondicaoPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Termos de condicao</p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Uso seguro e transparente do sistema</h1>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Ao utilizar a plataforma, voce concorda com as politicas de seguranca, protecao de dados e validacao
              de identidade (KYC).
            </p>
            <p>
              Todas as operacoes sao registradas para auditoria, rastreabilidade e prevencao de fraude, garantindo
              conformidade com as exigencias regulatórias aplicaveis.
            </p>
            <p>
              O acesso ao sistema depende de autenticacao valida e do cumprimento das regras internas de conformidade,
              incluindo verificacao de permissao por perfil de usuario.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </main>
    </div>
  );
}

export default TermosCondicaoPage;
