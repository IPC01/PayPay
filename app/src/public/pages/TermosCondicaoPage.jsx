// TermosCondicaoPage.jsx
import { useMemo, useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

function TermosCondicaoPage() {
  const { settings } = useSettings();
  const [language, setLanguage] = useState('pt');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const platformName = settings?.platformName || 'Romenapay';

  const sections = useMemo(
    () => [
      {
        title: '1. Aceitação dos Termos',
        content:
          'Ao acessar e utilizar os serviços da Romenapay, você concorda integralmente com estes Termos e Condições. Caso não concorde com qualquer disposição, recomendamos que não utilize a plataforma.'
      },
      {
        title: '2. Descrição dos Serviços',
        content:
          'A Romenapay disponibiliza serviços de carteira digital, transferências de fundos, pagamentos e gestão financeira. Os serviços podem ser alterados, suspensos ou descontinuados a qualquer momento, sem aviso prévio.'
      },
      {
        title: '3. Cadastro e Conta',
        content:
          'Para utilizar os serviços, o usuário deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas. O usuário é responsável por manter a confidencialidade das suas credenciais de acesso.'
      },
      {
        title: '4. Privacidade e Proteção de Dados',
        content:
          'A Romenapay compromete-se a proteger os dados pessoais dos usuários, em conformidade com a legislação aplicável. As informações coletadas são utilizadas exclusivamente para a prestação dos serviços e melhoria da experiência.'
      },
      {
        title: '5. Tarifas e Cobranças',
        content:
          'A utilização de determinados serviços pode estar sujeita a tarifas, conforme descrito na página de Tarifas. Os valores são expressos em Meticais (MT) e podem ser atualizados periodicamente.'
      },
      {
        title: '6. Responsabilidades do Usuário',
        content:
          'O usuário compromete-se a utilizar a plataforma de forma lícita, não a utilizar para atividades fraudulentas, ilegais ou não autorizadas. O usuário é responsável por todas as transações realizadas na sua conta.'
      },
      {
        title: '7. Limitação de Responsabilidade',
        content:
          'A Romenapay não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso dos serviços, salvo nos casos previstos em lei.'
      },
      {
        title: '8. Cancelamento e Encerramento',
        content:
          'O usuário pode encerrar a sua conta a qualquer momento, através das configurações da plataforma. A Romenapay reserva-se o direito de suspender ou encerrar contas que violem estes Termos.'
      },
      {
        title: '9. Alterações dos Termos',
        content:
          'A Romenapay pode atualizar estes Termos periodicamente. Recomendamos a consulta regular desta página. O uso continuado da plataforma após alterações constitui aceitação das mesmas.'
      },
      {
        title: '10. Lei Aplicável',
        content:
          'Estes Termos são regidos pelas leis da República de Moçambique. Qualquer litígio será resolvido nos tribunais competentes de Moçambique.'
      }
    ],
    []
  );

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
              Termos e Condições
              <br />
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                de uso da plataforma
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 sm:mt-4 sm:text-lg">
              Leia atentamente os termos que regem a utilização dos serviços da {platformName}.
            </p>

            <p className="mt-2 text-xs text-gray-400 sm:text-sm">Última atualização: —</p>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="bg-gray-50 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Índice rápido (visível em md+) */}
            <nav
              aria-label="Índice dos termos"
              className="mb-6 hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:block"
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500"
                style={{ fontFamily: FONT_MONO }}
              >
                Índice
              </p>
              <ol className="grid grid-cols-2 gap-1.5 text-sm">
                {sections.map((item) => (
                  <li key={item.title}>
                    <a
                      href={`#${item.title.split('.')[0]}`}
                      className="text-gray-600 transition hover:text-gray-900"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-3 sm:space-y-4">
              {sections.map((item) => (
                <article
                  key={item.title}
                  id={item.title.split('.')[0]}
                  className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
                >
                  <h2
                    className="text-sm font-semibold text-gray-900 sm:text-base"
                    style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}
                  >
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.content}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm sm:mt-10 sm:p-6">
              <p className="text-sm text-gray-500">
                Em caso de dúvidas sobre estes Termos, entre em contacto através do nosso
                suporte.
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