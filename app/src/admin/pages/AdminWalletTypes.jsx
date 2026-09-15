import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const initialForm = {
  id: null,
  code: '',
  name: '',
  provider: '',
  isExternal: false
};

function AdminWalletTypes() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/wallet-types');
      setTypes(data);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar tipos de carteira',
        message: 'Não foi possível carregar os tipos de carteira. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    setForm(initialForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setShowForm(false);
  };

  const toggleTypeStatus = async (type) => {
    try {
      setStatusLoading(type.id);
      await authRequest(`/api/wallet-types/${type.id}`, {
        method: 'PUT',
        body: { status: !type.status }
      });
      notify({
        type: 'success',
        title: 'Sucesso',
        message: `Tipo de carteira ${type.name} foi ${!type.status ? 'ativado' : 'desativado'} com sucesso.`
      });
      await loadTypes();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o estado do tipo de carteira.'
      });
    } finally {
      setStatusLoading(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code || !form.name) {
      notify({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha o código e o nome do tipo de carteira.'
      });
      return;
    }

    try {
      setSaving(true);
      await authRequest('/api/wallet-types', {
        method: 'POST',
        body: {
          code: form.code,
          name: form.name,
          provider: form.provider || null,
          isExternal: Boolean(form.isExternal)
        }
      });

      notify({
        type: 'success',
        title: 'Tipo de carteira criado',
        message: `O tipo de carteira ${form.name} foi criado com sucesso.`
      });

      setForm(initialForm);
      setShowForm(false);
      await loadTypes();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao guardar tipo de carteira',
        message: error?.message || 'Não foi possível guardar o tipo de carteira. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Tipos de Carteira</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Gira os tipos de carteira disponíveis e ativos no sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!showForm && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Adicionar tipo de carteira
            </button>
          )}
          {showForm && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {!showForm ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tipos existentes</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Provedor</th>
                  <th className="px-4 py-3">Externa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      A carregar tipos de carteira...
                    </td>
                  </tr>
                ) : types.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhum tipo de carteira encontrado.
                    </td>
                  </tr>
                ) : (
                  types.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{type.code}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{type.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{type.provider || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{type.isExternal ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${type.status ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {type.status ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleTypeStatus(type)}
                          disabled={statusLoading === type.id}
                          className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold text-white transition ${type.status ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {statusLoading === type.id ? 'A processar...' : type.status ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Adicionar tipo de carteira</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(event) => handleChange('code', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Provedor</label>
              <input
                type="text"
                value={form.provider}
                onChange={(event) => handleChange('provider', event.target.value)}
                placeholder="Ex: M-Pesa, e-Mola"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="wallet-type-external"
                type="checkbox"
                checked={form.isExternal}
                onChange={(event) => handleChange('isExternal', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="wallet-type-external" className="text-sm text-slate-700 dark:text-slate-300">
                Carteira externa (gateway de pagamento)
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? 'Guardando...' : 'Criar tipo de carteira'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminWalletTypes;
