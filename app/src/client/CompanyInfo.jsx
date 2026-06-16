import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function CompanyInfo() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await authRequest('/api/settings');
        setSettings(data);
      } catch (error) {
        console.error(error);
        notify({
          type: 'error',
          title: 'Erro ao carregar informações',
          message: 'Não foi possível buscar as informações da empresa.'
        });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [authRequest, notify]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Empresa</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Informações da Empresa</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Veja os detalhes oficiais sobre a nossa plataforma de pagamentos.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          A carregar informações...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {settings?.logoImg ? (
              <img src={settings.logoImg} alt="Logo da empresa" className="mb-6 h-28 w-auto object-contain" />
            ) : (
              <div className="mb-6 flex h-28 items-center justify-center rounded-3xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Logo não definida
              </div>
            )}
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Nome</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{settings?.platformName || 'Não definido'}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Proprietário</p>
                <p className="mt-2 text-base text-slate-700 dark:text-slate-300">{settings?.ownerName || 'Não definido'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Contato</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{settings?.contacts || 'Nenhum contacto disponível.'}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Endereço</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{settings?.address || 'Nenhum endereço cadastrado.'}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">E-mails</h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{settings?.emails || 'Nenhum e-mail cadastrado.'}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mais informações</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {settings?.additionalInfo ? (
                settings.additionalInfo.split(/\r?\n/).map((line, index) => (
                  <p key={index}>{line}</p>
                ))
              ) : (
                <p>Não há informações adicionais publicadas.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyInfo;
