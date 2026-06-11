import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const actions = [
  { title: 'Criar nova carteira', description: 'Adicionar uma nova wallet ao sistema', href: '/wallets/create' },
  { title: 'Gerir tokens', description: 'Criar e eliminar tokens de API', href: '/tokens' },
  { title: 'Ver transações', description: 'Histórico de pagamentos e eventos', href: '/transactions' }
];

function Dashboard() {
  const { user, authRequest } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWallets() {
      try {
        const data = await authRequest('/api/wallets');
        setWallets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadWallets();
  }, [authRequest]);

  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bem-vindo, {user?.name}</h2>
            <p className="text-slate-500">Visão geral rápida das suas carteiras e saldos.</p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-2 text-brand-700">Atualizado há poucos segundos</div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Saldo total</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{loading ? '...' : totalBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</p>
          <p className="mt-2 text-sm text-slate-500">Total agregado de todas as carteiras</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {actions.map(action => (
          <a key={action.title} href={action.href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">{action.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{action.description}</p>
          </a>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-600">A carregar carteiras...</div>
        ) : wallets.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-6 text-slate-600">Nenhuma carteira encontrada. Comece por criar uma nova carteira.</div>
        ) : (
          wallets.map(wallet => (
            <div key={wallet.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{wallet.WalletType?.name || 'Wallet'}</p>
              <h3 className="mt-4 text-3xl font-semibold text-slate-900">{Number(wallet.balance).toLocaleString('pt-PT', { style: 'currency', currency: 'MZN' })}</h3>
              <p className="mt-2 text-sm text-slate-500">Código: {wallet.walletCode}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Dashboard;
