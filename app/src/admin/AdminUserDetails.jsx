import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function getRecentGrowth(transactions) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      label: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
      fullDate: date,
      count: 0
    };
  });

  transactions.forEach((transaction) => {
    const txDate = new Date(transaction.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    const dayIndex = days.findIndex((item) => item.label === txDate);
    if (dayIndex >= 0) {
      days[dayIndex].count += 1;
    }
  });

  return days;
}

function AdminUserDetails() {
  const { id } = useParams();
  const { authRequest } = useAuth();
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const [userData, walletData, transactionData] = await Promise.all([
        authRequest(`/api/users/${id}`),
        authRequest(`/api/admin/users/${id}/wallets`),
        authRequest(`/api/admin/users/${id}/transactions`)
      ]);
      setUser(userData);
      setWallets(walletData);
      setTransactions(transactionData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = useMemo(
    () => wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0),
    [wallets]
  );

  const walletCount = wallets.length;
  const transactionCount = transactions.length;
  const transactionTrend = useMemo(() => getRecentGrowth(transactions), [transactions]);
  const recentTransactions = transactions.slice(0, 6);

  // Dados para gráficos
  const chartData = useMemo(() => {
    return transactionTrend.map(item => ({
      dia: item.label,
      transacoes: item.count,
      data: item.fullDate
    }));
  }, [transactionTrend]);

  const walletDistribution = useMemo(() => {
    return wallets.map((wallet, index) => ({
      name: wallet.code || `Carteira ${index + 1}`,
      saldo: Number(wallet.balance || 0),
      status: Number(wallet.balance) > 0 ? 'Ativa' : 'Inativa'
    }));
  }, [wallets]);

  const pieData = useMemo(() => {
    const activeWallets = wallets.filter(w => Number(w.balance) > 0).length;
    const inactiveWallets = wallets.length - activeWallets;
    return [
      { name: 'Carteiras com saldo', value: activeWallets, color: '#10b981' },
      { name: 'Carteiras sem saldo', value: inactiveWallets, color: '#ef4444' }
    ];
  }, [wallets]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando dados do utilizador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Detalhes do Utilizador</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Visualize dados pessoais, carteiras, transações e evolução do utilizador.
          </p>
        </div>
        <Link
          to="/admin/users"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-brand-500"
        >
          ← Voltar para utilizadores
        </Link>
      </div>

      {/* Perfil do Utilizador e Resumo */}
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        {/* Card de Perfil */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'} border-2 border-white`}></div>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {user?.name || 'Utilizador'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Informações da conta</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Perfil:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{user?.Role?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user?.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'}`}>
                    {user?.isActive ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Registo:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-PT') : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-3 dark:from-blue-950 dark:to-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Carteiras</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{walletCount}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-white p-3 dark:from-green-950 dark:to-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Saldo total</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Transações */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-brand-600">Atividade</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Transações (Últimos 7 dias)</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Total: {transactionCount} transações
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTransacoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="dia" className="text-xs text-slate-500" />
              <YAxis className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="transacoes" 
                stroke="#10b981" 
                fill="url(#colorTransacoes)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carteiras do Utilizador */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-brand-600">Carteiras</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Detalhe das carteiras</h2>
          </div>
        </div>

        {wallets.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhuma carteira encontrada para este utilizador.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet, index) => (
              <div key={wallet.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Carteira {index + 1}</p>
                    <p className="text-sm font-mono font-medium text-slate-900 dark:text-white mt-1">
                      {wallet.code || 'N/A'}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${Number(wallet.balance) > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {Number(wallet.balance) > 0 ? 'Ativa' : 'Inativa'}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(wallet.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráficos de Análise */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gráfico de Barras - Transações */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Evolução de Transações
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="dia" className="text-xs text-slate-500" />
              <YAxis className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transacoes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Distribuição de Carteiras */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Distribuição de Carteiras
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Carteiras com saldo: <span className="font-semibold text-green-600">{pieData[0].value}</span> de {walletCount}
            </p>
          </div>
        </div>
      </div>

      {/* Últimas Transações e Estatísticas */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Últimas Transações */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Últimas Transações
          </h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                Nenhuma transação encontrada.
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {transaction.reference || transaction.walletCode}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(transaction.createdAt).toLocaleString('pt-PT')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentTransactions.length > 0 && (
            <button className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Ver todas as transações →
            </button>
          )}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Estatísticas Rápidas
          </h2>
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-transparent p-4 dark:from-brand-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total de transações</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{transactionCount}</p>
              <p className="mt-1 text-xs text-green-600">✓ Registadas na plataforma</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-transparent p-4 dark:from-blue-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">Média por carteira</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {walletCount > 0 ? (transactionCount / walletCount).toFixed(1) : 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">transações por carteira</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-transparent p-4 dark:from-purple-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">Ticket médio</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {transactionCount > 0 
                  ? formatCurrency(transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) / transactionCount)
                  : formatCurrency(0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">valor médio por transação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetails;