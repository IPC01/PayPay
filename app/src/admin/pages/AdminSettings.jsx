import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const settingsFields = [
  { name: 'c2bFeePercent', label: 'Taxa da plataforma em depósitos C2B (%)', max: 100 },
  { name: 'withdrawalFeePercent', label: 'Taxa da plataforma em saques B2C (%)', max: 100 },
  { name: 'withdrawalMinValue', label: 'Valor mínimo de saque (MZN)' },
  { name: 'withdrawalMaxValue', label: 'Valor máximo de saque (MZN)' }
];

function withdrawalSettings(data) {
  return Object.fromEntries(settingsFields.map(({ name }) => [name, data[name] != null ? String(data[name]) : '']));
}

function AdminSettings() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState(() => withdrawalSettings({}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // Guarda o último estado carregado para não sobrescrever edições do utilizador
  const lastLoadedRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const data = await authRequest('/api/admin/settings');
      const loaded = withdrawalSettings(data);
      setSettings((current) => {
        // Na sincronização silenciosa, não sobrescreve campos já editados
        if (silent && JSON.stringify(current) !== JSON.stringify(lastLoadedRef.current)) {
          return current;
        }
        return loaded;
      });
      lastLoadedRef.current = loaded;
    } catch (error) {
      if (silent) return;
      const message = error.message || 'Não foi possível carregar os limites e custos de saque.';
      setLoadError(message);
      notify({ type: 'error', title: 'Erro ao carregar definições', message });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página
  // e sem alterar campos que o utilizador esteja a editar.
  useAutoRefresh(() => loadSettings(true));

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const data = await authRequest('/api/admin/settings', {
        method: 'POST',
        body: settings
      });
      setSettings(withdrawalSettings(data));
      notify({
        type: 'success',
        title: 'Definições salvas',
        message: 'Os limites e custos de saque foram atualizados com sucesso.'
      });
      await refreshSettings();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao salvar definições',
        message: error.message || 'Não foi possível guardar as definições. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Configurações de Taxas e Saques</h1>
      </div>
      {loadError && (
        <div role="alert" className="rounded-2xl border border-rose-200 p-4 text-sm text-rose-700 dark:text-rose-300">
          <p>{loadError}</p>
          <button type="button" onClick={() => loadSettings()} disabled={loading} className="mt-2 underline">Tentar novamente</button>
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Taxas da plataforma e limites de saque</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              As taxas são percentagens retidas pela plataforma: em depósitos C2B o cliente recebe o valor líquido na carteira; em saques B2C a taxa é debitada adicionalmente ao valor solicitado.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {settingsFields.map(({ name, label, max }) => (
              <label key={name} className="block text-sm text-slate-700 dark:text-slate-300">
                {label}
                <input
                  type="number"
                  min="0"
                  max={max}
                  step="0.01"
                  value={settings[name]}
                  disabled={loading || saving || Boolean(loadError)}
                  onChange={(event) => setSettings((current) => ({ ...current, [name]: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || saving || Boolean(loadError)}
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
