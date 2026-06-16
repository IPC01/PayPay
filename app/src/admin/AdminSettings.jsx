import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

function AdminSettings() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [settings, setSettings] = useState({
    platformName: '',
    logoImg: '',
    contacts: '',
    address: '',
    emails: '',
    ownerName: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/settings');
      setSettings({
        platformName: data.platformName || '',
        logoImg: data.logoImg || '',
        contacts: data.contacts || '',
        address: data.address || '',
        emails: data.emails || '',
        ownerName: data.ownerName || '',
        additionalInfo: data.additionalInfo || ''
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar definições',
        message: 'Não foi possível carregar as definições da plataforma.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const data = await authRequest('/api/admin/settings', {
        method: 'POST',
        body: settings
      });
      setSettings({
        platformName: data.platformName || '',
        logoImg: data.logoImg || '',
        contacts: data.contacts || '',
        address: data.address || '',
        emails: data.emails || '',
        ownerName: data.ownerName || '',
        additionalInfo: data.additionalInfo || ''
      });
      notify({
        type: 'success',
        title: 'Definições salvas',
        message: 'As definições da plataforma foram atualizadas com sucesso.'
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao salvar definições',
        message: 'Não foi possível guardar as definições. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Definições da Plataforma</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Atualize os detalhes principais da plataforma, contactos e tipo de transação padrão.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Plataforma</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(event) => updateField('platformName', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Logo da Plataforma</label>
            <div className="flex flex-col gap-3">
              {settings.logoImg ? (
                <img
                  src={settings.logoImg}
                  alt="Logo da plataforma"
                  className="h-20 w-auto rounded-2xl border border-slate-200 object-contain dark:border-slate-700"
                />
              ) : (
                <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Sem logo carregada
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    if (!reader.result) return;
                    setUploadingLogo(true);
                    try {
                      const response = await authRequest('/api/admin/settings/logo-upload', {
                        method: 'POST',
                        body: {
                          fileName: file.name,
                          data: reader.result
                        }
                      });
                      updateField('logoImg', response.logoImg);
                    } catch (error) {
                      notify({
                        type: 'error',
                        title: 'Erro no upload da imagem',
                        message: error.message || 'Não foi possível carregar o logo.'
                      });
                    } finally {
                      setUploadingLogo(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:text-white focus:outline-none dark:text-slate-200"
              />
              {uploadingLogo && <p className="text-sm text-slate-500 dark:text-slate-400">Carregando logo...</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Contacto</label>
            <textarea
              value={settings.contacts}
              onChange={(event) => updateField('contacts', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
            <textarea
              value={settings.address}
              onChange={(event) => updateField('address', event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">E-mails</label>
            <textarea
              value={settings.emails}
              onChange={(event) => updateField('emails', event.target.value)}
              rows={4}
              placeholder="ex: suporte@exemplo.com, admin@exemplo.com"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Proprietário (Opcional)</label>
            <input
              type="text"
              value={settings.ownerName}
              onChange={(event) => updateField('ownerName', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Outras Informações</label>
          <textarea
            value={settings.additionalInfo}
            onChange={(event) => updateField('additionalInfo', event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Guardando...' : 'Guardar definições'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
