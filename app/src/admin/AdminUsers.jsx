import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminUsers() {
  const { authRequest } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => {
        const fields = [
          user.name || '',
          user.email || '',
          user.Role?.name || '',
          user.isActive ? 'ativo' : 'bloqueado'
        ];
        return !query || fields.join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();

        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [users, search, sortBy, sortOrder]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const nextStatus = !user.isActive;

    try {
      setActionLoading(user.id);
      const response = await authRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        body: { isActive: nextStatus }
      });

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, isActive: response.user.isActive } : item))
      );
      setFeedback(`Usuário ${response.user.name} foi ${response.user.isActive ? 'ativado' : 'bloqueado'} com sucesso.`);
    } catch (err) {
      console.error(err);
      setFeedback('Não foi possível atualizar o estado do utilizador.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Gestão de Utilizadores</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Liste e analise todos os utilizadores registados no sistema.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-100">
          {feedback}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome, email, perfil ou estado"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Ordenar por:</span>
            <button
              type="button"
              onClick={() => setSortField('name')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'name' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Nome
            </button>
            <button
              type="button"
              onClick={() => setSortField('email')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'email' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setSortField('createdAt')}
              className={`rounded-full px-3 py-2 transition ${sortBy === 'createdAt' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              Data
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Criado em</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar utilizadores...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum utilizador encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.Role?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200'}`}>
                        {user.isActive ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-500"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user)}
                          disabled={actionLoading === user.id}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${user.isActive ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {actionLoading === user.id ? 'A processar...' : user.isActive ? 'Bloquear' : 'Ativar'}
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
    </div>
  );
}

export default AdminUsers;
