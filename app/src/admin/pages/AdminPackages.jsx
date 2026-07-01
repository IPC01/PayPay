import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const initialForm = {
  id: null,
  code: '',
  name: '',
  price: '',
  promoPrice: '',
  promoStartDate: '',
  promoEndDate: '',
  permissionsGranted: '',
  permissionsDenied: '',
  description: '',
  active: true
};

function AdminPackages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/packages');
      setPackages(data);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar pacotes',
        message: 'Não foi possível carregar os pacotes. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (pack) => {
    setForm({
      id: pack.id,
      code: pack.code || '',
      name: pack.name || '',
      price: pack.price != null ? String(pack.price) : '',
      promoPrice: pack.promoPrice != null ? String(pack.promoPrice) : '',
      promoStartDate: pack.promoStartDate ? String(pack.promoStartDate).slice(0, 10) : '',
      promoEndDate: pack.promoEndDate ? String(pack.promoEndDate).slice(0, 10) : '',
      permissionsGranted: pack.permissionsGranted || '',
      permissionsDenied: pack.permissionsDenied || '',
      description: pack.description || '',
      active: Boolean(pack.active)
    });
    setShowForm(true);
  };

  const handleDelete = async (pack) => {
    if (!window.confirm(`Tem certeza de que deseja remover o pacote ${pack.name}?`)) {
      return;
    }

    try {
      setDeletingId(pack.id);
      await authRequest(`/api/admin/packages/${pack.id}`, {
        method: 'DELETE'
      });
      notify({
        type: 'success',
        title: 'Pacote removido',
        message: `O pacote ${pack.name} foi removido com sucesso.`
      });
      await loadPackages();
      setForm(initialForm);
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao remover pacote',
        message: 'Não foi possível remover o pacote. Tente novamente.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code || !form.name || form.price === '') {
      notify({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha código, nome e preço do pacote.'
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: form.id,
        code: form.code,
        name: form.name,
        price: parseFloat(String(form.price).replace(',', '.')) || 0,
        promoPrice: form.promoPrice ? parseFloat(String(form.promoPrice).replace(',', '.')) : null,
        promoStartDate: form.promoStartDate || null,
        promoEndDate: form.promoEndDate || null,
        description: form.description || null,
        permissionsGranted: form.permissionsGranted || null,
        permissionsDenied: form.permissionsDenied || null,
        active: Boolean(form.active)
      };

      const response = await authRequest('/api/admin/packages', {
        method: 'POST',
        body: payload
      });

      const actionText = form.id ? 'atualizado' : 'criado';
      notify({
        type: 'success',
        title: 'Pacote salvo',
        message: `O pacote ${response.name} foi ${actionText} com sucesso.`
      });

      setForm(initialForm);
      setShowForm(false);
      await loadPackages();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao guardar pacote',
        message: 'Não foi possível guardar o pacote. Tente novamente.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPackage = () => {
    setForm(initialForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Gestão de Pacotes</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crie, edite e remova pacotes de assinatura para a plataforma.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!showForm && (
            <button
              type="button"
              onClick={handleAddPackage}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Adicionar pacote
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pacotes existentes</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      A carregar pacotes...
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhum pacote encontrado.
                    </td>
                  </tr>
                ) : (
                  packages.map((pack) => (
                    <tr key={pack.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{pack.code}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{pack.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{parseFloat(pack.price).toFixed(2)} MZN</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${pack.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {pack.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(pack)}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pack)}
                            disabled={deletingId === pack.id}
                            className="rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
                          >
                            {deletingId === pack.id ? 'Removendo...' : 'Remover'}
                          </button>
                        </div>
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Adicionar ou atualizar pacote</h2>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Preço</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => handleChange('price', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Preço Promo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.promoPrice}
                  onChange={(event) => handleChange('promoPrice', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Início da Promoção</label>
                <input
                  type="date"
                  value={form.promoStartDate}
                  onChange={(event) => handleChange('promoStartDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fim da Promoção</label>
                <input
                  type="date"
                  value={form.promoEndDate}
                  onChange={(event) => handleChange('promoEndDate', event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Permissões Concedidas</label>
              <textarea
                value={form.permissionsGranted}
                onChange={(event) => handleChange('permissionsGranted', event.target.value)}
                rows={3}
                placeholder="Ex: basic_access,transaction_history"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Permissões Negadas</label>
              <textarea
                value={form.permissionsDenied}
                onChange={(event) => handleChange('permissionsDenied', event.target.value)}
                rows={3}
                placeholder="Ex: priority_support,advanced_reports"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="package-active"
                type="checkbox"
                checked={form.active}
                onChange={(event) => handleChange('active', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="package-active" className="text-sm text-slate-700 dark:text-slate-300">
                Pacote ativo
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
                {saving ? 'Guardando...' : form.id ? 'Atualizar pacote' : 'Criar pacote'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminPackages;
