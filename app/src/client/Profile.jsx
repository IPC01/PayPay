import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Profile() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  const handlePasswordUpdate = e => {
    e.preventDefault();
    setStatus({ type: 'success', text: 'Senha atualizada com sucesso (simulado).' });
  };

  const handleDeleteAccount = () => {
    setStatus({ type: 'error', text: 'Funcionalidade de exclusão de conta não implementada no backend.' });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Perfil do utilizador</h2>
          <p className="mt-2 text-slate-500">Gestão de conta, senha e notificações.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Nome</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user?.name || 'Usuário'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Email</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user?.email}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Membro desde</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-PT') : '—'}</p>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-3xl border border-slate-200 bg-brand-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Segurança</p>
          <p className="mt-2 text-slate-600">Altere a senha e mantenha a sua conta segura.</p>
        </div>

        {status && (
          <div className={`rounded-3xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {status.text}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold text-slate-900">Alterar senha</p>
          <input type="password" placeholder="Senha atual" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" required />
          <input type="password" placeholder="Nova senha" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" required />
          <button className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">Atualizar senha</button>
        </form>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold text-slate-900">Ações da conta</p>
          <button onClick={handleDeleteAccount} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50">Deletar conta</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
