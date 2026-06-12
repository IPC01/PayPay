import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AdminUsers() {
  const { authRequest } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Perfil</th>
              <th className="px-6 py-4">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-700 dark:bg-slate-800">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar utilizadores...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Nenhum utilizador encontrado.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.Role?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('pt-PT')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
