import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

function Dashboard() {
  const { user, authRequest } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const actions = [
    { title: 'Criar nova carteira', description: 'Adicionar uma nova wallet ao sistema', href: '/client/wallets/create', icon: '➕', color: 'bg-blue-500' },
    { title: 'Gerir chaves de acesso', description: 'Criar e eliminar chaves de acesso', href: '/client/tokens', icon: '🔑', color: 'bg-purple-500' },
    { title: 'Ver transações', description: 'Histórico de pagamentos e eventos', href: '/client/transactions', icon: '📊', color: 'bg-green-500' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsData, transactionsData, kycData] = await Promise.all([
        authRequest('/api/wallets'),
        authRequest('/api/transactions'),
        authRequest('/api/kyc')
      ]);
      setWallets(walletsData);
      setTransactions(transactionsData || []);
      setKycStatus(kycData?.kyc?.status || 'DRAFT');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas por tipo de carteira
  const walletTypeStats = wallets.reduce((acc, wallet) => {
    const typeName = wallet.WalletType?.name || 'Outros';
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        total: 0,
        count: 0,
        balance: 0,
        provider: wallet.WalletType?.provider || 'N/A',
        imageUrl: getWalletTypeLogo({ imageUrl: wallet.WalletType?.imageUrl, code: wallet.WalletType?.code }),
        code: wallet.WalletType?.code || null
      };
    }
    acc[typeName].count++;
    acc[typeName].balance += Number(wallet.balance || 0);
    return acc;
  }, {});

  const typeStatsArray = Object.values(walletTypeStats);
  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0);
  const activeWallets = wallets.filter(w => w.status !== 'inactive').length;

  // Dados para o gráfico de crescimento
  const getGrowthData = () => {
    const now = new Date();
    const periods = {
      week: 7,
      month: 30,
      year: 12
    };
    
    const days = periods[selectedPeriod];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      
      const dayTransactions = transactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate.toDateString() === date.toDateString();
      });
      
      const totalAmount = dayTransactions.reduce((sum, t) => sum + (t.status === 'success' ? Number(t.amount) : 0), 0);
      
      data.push({
        date: dateStr,
        volume: totalAmount,
        transactions: dayTransactions.length,
        success: dayTransactions.filter(t => t.status === 'success').length
      });
    }
    return data;
  };

  // Dados para gráfico de distribuição por tipo
  const pieData = typeStatsArray.map(stat => ({
    name: stat.name,
    value: stat.balance,
    count: stat.count
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  const renderTypeLogo = (imageUrl, provider) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={provider || 'Tipo de carteira'}
          className="h-8 w-8 rounded-xl object-contain"
        />
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        {provider?.slice(0, 2) || 'CT'}
      </div>
    );
  };

  const renderBarTick = ({ x, y, payload }) => {
    const stat = typeStatsArray.find((item) => item.name === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        {stat?.imageUrl && (
          <image
            href={stat.imageUrl}
            x={-16}
            y={10}
            width={32}
            height={32}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
        <text x={0} y={55} textAnchor="middle" fill="#64748b" fontSize="11">
          {payload.value}
        </text>
      </g>
    );
  };

  const getPieLegend = (stat, index) => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    const percent = total ? ((stat.value / total) * 100).toFixed(0) : '0';
    return (
      <div key={stat.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        {renderTypeLogo(stat.imageUrl, stat.name)}
        <div className="flex-1 text-sm">
          <p className="font-semibold text-slate-900 dark:text-white">{stat.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{percent}% — {formatCurrency(stat.value)}</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {kycStatus !== 'APPROVED' && (
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700 dark:border-orange-700/40 dark:bg-orange-950/20 dark:text-orange-200">
          A sua conta ainda não foi verificada. Complete o KYC para desbloquear carteiras, levantamentos, transferências e integrações API.
          <Link to="/client/kyc" className="ml-2 font-semibold text-orange-800 dark:text-orange-100 underline">
            Ir para KYC
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bem-vindo, {user?.name?.split(' ')[0] || 'Usuário'}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Visão geral completa do seu ecossistema financeiro
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            Atualizado agora
          </div>
          <button
            onClick={loadData}
            className="rounded-xl bg-slate-100 p-2 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-900/30">
              <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras Ativas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : activeWallets}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Transações</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : transactions.length}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipos de Carteira</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {loading ? '...' : typeStatsArray.length}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
      </div>



      {/* Lista de Carteiras (Movida para cima) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Suas Carteiras</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Detalhes e saldos por carteira</p>
          </div>
          <Link
            to="/client/wallets"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            + Nova Carteira
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-slate-500">A carregar carteiras...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="rounded-xl bg-slate-50 py-12 text-center dark:bg-slate-900">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M6 19h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Nenhuma carteira encontrada
            </p>
            <Link
              to="/client/wallets"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Criar primeira carteira
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {renderTypeLogo(getWalletTypeLogo({ imageUrl: wallet.WalletType?.imageUrl, code: wallet.WalletType?.code }), wallet.WalletType?.provider)}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {wallet.WalletType?.name || 'Carteira'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {wallet.walletName}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {wallet.currency}
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(wallet.balance || 0)}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Código: {wallet.walletCode}
                </p>
                {wallet.WalletType?.provider && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Provedor: {wallet.WalletType.provider}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gráfico de Crescimento */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Crescimento Financeiro</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Evolução do volume de transações</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedPeriod === period
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getGrowthData()}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="volume" 
                name="Volume (MZN)"
                stroke="#3b82f6" 
                fill="url(#colorVolume)" 
              />
              <Line 
                type="monotone" 
                dataKey="transactions" 
                name="Transações"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribuição por Tipo de Carteira */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Distribuição por Tipo de Carteira
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">{typeStatsArray.map(getPieLegend)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Saldo por Tipo de Carteira
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeStatsArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={renderBarTick} height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="balance" name="Saldo" fill="#3b82f6">
                  {typeStatsArray.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;