// TermosCondicaoPage.jsx - Versão completa com resumo dos termos
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

function TermosCondicaoPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const platformName = settings?.platformName || 'Romenapay';

  const sections = [
    {
      title: '1. Aceitação dos Termos',
      content:
        'Ao acessar e utilizar os serviços da Romenapay, você concorda integralmente com estes Termos e Condições. Caso não concorde com qualquer disposição, recomendamos que não utilize a plataforma.',
    },
    {
      title: '2. Descrição dos Serviços',
      content:
        'A Romenapay disponibiliza serviços de carteira digital, transferências de fundos, pagamentos e gestão financeira. Os serviços podem ser alterados, suspensos ou descontinuados a qualquer momento, sem aviso prévio.',
    },
    {
      title: '3. Cadastro e Conta',
      content:
        'Para utilizar os serviços, o usuário deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas. O usuário é responsável por manter a confidencialidade das suas credenciais de acesso.',
    },
    {
      title: '4. Privacidade e Proteção de Dados',
      content:
        'A Romenapay compromete-se a proteger os dados pessoais dos usuários, em conformidade com a legislação aplicável. As informações coletadas são utilizadas exclusivamente para a prestação dos serviços e melhoria da experiência.',
    },
    {
      title: '5. Tarifas e Cobranças',
      content:
        'A utilização de determinados serviços pode estar sujeita a tarifas, conforme descrito na página de Tarifas. Os valores são expressos em Meticais (MT) e podem ser atualizados periodicamente.',
    },
    {
      title: '6. Responsabilidades do Usuário',
      content:
        'O usuário compromete-se a utilizar a plataforma de forma lícita, não a utilizar para atividades fraudulentas, ilegais ou não autorizadas. O usuário é responsável por todas as transações realizadas na sua conta.',
    },
    {
      title: '7. Limitação de Responsabilidade',
      content:
        'A Romenapay não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso dos serviços, salvo nos casos previstos em lei.',
    },
    {
      title: '8. Cancelamento e Encerramento',
      content:
        'O usuário pode encerrar a sua conta a qualquer momento, através das configurações da plataforma. A Romenapay reserva-se o direito de suspender ou encerrar contas que violem estes Termos.',
    },
    {
      title: '9. Alterações dos Termos',
      content:
        'A Romenapay pode atualizar estes Termos periodicamente. Recomendamos a consulta regular desta página. O uso continuado da plataforma após alterações constitui aceitação das mesmas.',
    },
    {
      title: '10. Lei Aplicável',
      content:
        'Estes Termos são regidos pelas leis da República de Moçambique. Qualquer litígio será resolvido nos tribunais competentes de Moçambique.',
    },
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
              Termos e Condições            </p>

            <h1
              className="text-4xl font-semibold text-gray-900 sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Termos e Condições
              <br />
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                de uso da plataforma
              </span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
              Leia atentamente os termos que regem a utilização dos serviços da {platformName}.
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Última atualização: —
            </p>
          </div>
        </section>

        {/* CONTEÚDO DOS TERMOS */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {sections.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h2
                    className="text-base font-semibold text-gray-900"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                  >
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                Em caso de dúvidas sobre estes Termos, entre em contacto através do nosso suporte.
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