import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getWalletTypeLogo } from '../../helpers/walletTypeLogos';

function WalletDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authRequest } = useAuth();
  const { notify } = useNotification();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [withdrawData, setWithdrawData] = useState({ amount: '', phone: '', note: '' });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        const [walletData, txData, kycData] = await Promise.all([
          authRequest(`/api/wallets/${id}`),
          authRequest(`/api/transactions?walletId=${id}`),
          authRequest('/api/kyc')
        ]);

        setWallet(walletData);
        setTransactions(txData);
        setKycStatus(kycData?.kyc?.status || 'DRAFT');
      } catch (err) {
        notify({
          type: 'error',
          title: 'Erro ao carregar carteira',
          message: err.message || 'Não foi possível carregar os detalhes da carteira.'
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authRequest, id, notify]);

  const handleWithdrawRequest = async (event) => {
    event.preventDefault();
    if (!withdrawData.amount || !withdrawData.phone) {
      notify({ type: 'error', title: 'Dados obrigatórios', message: 'Informe o valor e o número de telefone.' });
      return;
    }

    try {
      setSubmittingWithdraw(true);
      await authRequest('/api/withdrawals', {
        method: 'POST',
        body: {
          walletId: wallet.id,
          amount: Number(withdrawData.amount),
          phone: withdrawData.phone,
          note: withdrawData.note
        }
      });

      notify({ type: 'success', title: 'Pedido enviado', message: 'Seu pedido de saque foi enviado para aprovação.' });
      setWithdrawData({ amount: '', phone: '', note: '' });
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Falha ao solicitar saque', message: err.message || 'Não foi possível enviar o pedido de saque.' });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Dados para gráficos
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const filteredTransactions = transactions.filter(tx => {
      const date = new Date(tx.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (timeRange === 'week') return diffDays <= 7;
      if (timeRange === 'month') return diffDays <= 30;
      return true;
    });

    const grouped = filteredTransactions.reduce((acc, tx) => {
      const date = new Date(tx.createdAt);
      let label;
      if (timeRange === 'week') {
        label = date.toLocaleDateString('pt-PT', { weekday: 'short' });
      } else if (timeRange === 'month') {
        label = date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
      } else {
        label = date.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
      }
      
      if (!acc[label]) {
        acc[label] = { label, entradas: 0, saidas: 0, saldo: 0 };
      }
      
      if (tx.toWalletId === wallet?.id) {
        acc[label].entradas += Number(tx.amount || 0);
      }
      if (tx.fromWalletId === wallet?.id) {
        acc[label].saidas += Number(tx.amount || 0);
      }
      acc[label].saldo = acc[label].entradas - acc[label].saidas;
      
      return acc;
    }, {});

    return Object.values(grouped);
  }, [transactions, wallet?.id, timeRange]);

  const totalIn = useMemo(() => transactions
    .filter((tx) => tx.toWalletId === wallet?.id)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [transactions, wallet?.id]);

  const totalOut = useMemo(() => transactions
    .filter((tx) => tx.fromWalletId === wallet?.id)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0), [transactions, wallet?.id]);

  const statusLabel = wallet?.status === 'ACTIVE' ? 'Ativa' : wallet?.status === 'FROZEN' ? 'Congelada' : 'Fechada';
  const statusColor = wallet?.status === 'ACTIVE' ? 'green' : wallet?.status === 'FROZEN' ? 'yellow' : 'gray';
  const isWalletOwner = wallet?.userId === user?.userId;

  // Dados para gráfico de pizza
  const pieData = useMemo(() => [
    { name: 'Entradas', value: totalIn, color: '#10b981' },
    { name: 'Saídas', value: totalOut, color: '#ef4444' }
  ], [totalIn, totalOut]);

  // Dados para gráfico radial
  const healthScore = useMemo(() => {
    const totalTransactions = totalIn + totalOut;
    if (totalTransactions === 0) return 0;
    const balanceRatio = (totalIn / totalTransactions) * 100;
    return Math.round(balanceRatio);
  }, [totalIn, totalOut]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {Number(p.value).toLocaleString('pt-PT', { style: 'currency', currency: wallet?.currency || 'MZN' })}
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
          <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando detalhes da carteira...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-red-100 p-3 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-900 dark:text-white">Carteira não encontrada</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A carteira que você está procurando não existe ou foi removida.</p>
        <button
          onClick={() => navigate('/client/wallets')}
          className="mt-6 inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Voltar para carteiras
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Carteira</p>
          <div className="flex items-center gap-3 mt-2">
            {wallet.WalletType ? (
              <img
                src={getWalletTypeLogo({ imageUrl: wallet.WalletType.imageUrl, code: wallet.WalletType.code })}
                alt={wallet.WalletType.name}
                className="h-10 w-10 rounded-2xl object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">?</div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{wallet.walletName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{wallet.WalletType?.name || 'Tipo desconhecido'}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Código: {wallet.walletCode}</p>
        </div>
      </div>

      {kycStatus !== 'APPROVED' && (
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700 dark:border-orange-700/40 dark:bg-orange-950/20 dark:text-orange-200">
          A sua conta ainda não foi verificada. Complete o KYC para desbloquear carteiras, levantamentos, transferências e integrações API.
          <Link to="/client/kyc" className="ml-2 font-semibold text-orange-800 dark:text-orange-100 underline">Ir para KYC</Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/client/wallets"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            ← Voltar para carteiras
          </Link>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400`}>
            <span className={`mr-1.5 h-2 w-2 rounded-full bg-${statusColor}-500`}></span>
            {statusLabel}
          </span>
        </div>

      {wallet.allowWithdraw && wallet.status === 'ACTIVE' && wallet.userId === user?.userId && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Solicitar Saque</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Criar um pedido de saque</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Será enviado para aprovação do administrador e, se aceito, o valor será subtraído do saldo.</p>
            </div>
          </div>
          <form onSubmit={handleWithdrawRequest} className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Montante</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={withdrawData.amount}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Número</span>
              <input
                type="tel"
                value={withdrawData.phone}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+258 82 123 4567"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              />
            </label>
            <label className="space-y-2 md:col-span-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</span>
              <textarea
                rows="3"
                value={withdrawData.note}
                onChange={(e) => setWithdrawData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Observações opcionais"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submittingWithdraw}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingWithdraw ? 'Enviando...' : 'Solicitar Saque'}
              </button>
            </div>
          </form>
        </div>
      )}

      {wallet.allowWithdraw && wallet.status === 'ACTIVE' && !isWalletOwner && (
        <div className="rounded-3xl border border-slate-200 bg-yellow-50 p-6 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-yellow-900/10 dark:text-yellow-100">
          Apenas o dono desta carteira pode solicitar um saque.
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Saldo atual</p>
            <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {Number(wallet.balance || 0).toLocaleString('pt-PT', { style: 'currency', currency: wallet.currency || 'MZN' })}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Moeda: {wallet.currency || 'MZN'}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total de transações</p>
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{transactions.length}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Movimentos registados</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Entradas totais</p>
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-semibold text-green-600 dark:text-green-400">
            {totalIn.toLocaleString('pt-PT', { style: 'currency', currency: wallet.currency || 'MZN' })}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Valor recebido</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Saídas totais</p>
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-semibold text-red-600 dark:text-red-400">
            {totalOut.toLocaleString('pt-PT', { style: 'currency', currency: wallet.currency || 'MZN' })}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Valor enviado</p>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Evolução Financeira</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Acompanhe entradas, saídas e saldo ao longo do tempo
            </p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  timeRange === range
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradientEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradientSaidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="label" className="text-xs text-slate-500" />
            <YAxis 
              tickFormatter={(value) => Number(value).toLocaleString('pt-PT', { notation: 'compact' })}
              className="text-xs text-slate-500"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="entradas" 
              name="Entradas"
              stroke="#10b981" 
              fill="url(#gradientEntradas)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="saidas" 
              name="Saídas"
              stroke="#ef4444" 
              fill="url(#gradientSaidas)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gráfico de Barras */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Comparativo Entradas vs Saídas
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="label" className="text-xs text-slate-500" />
              <YAxis 
                tickFormatter={(value) => Number(value).toLocaleString('pt-PT', { notation: 'compact' })}
                className="text-xs text-slate-500"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráficos de Pizza e Radial */}
        <div className="grid gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Distribuição Financeira
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Saúde da Carteira
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                barSize={20} 
                data={[
                  { name: 'Proporção Entradas', value: healthScore, fill: '#10b981' }
                ]}
              >
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: '#fff', formatter: () => `${healthScore}%` }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {healthScore >= 70 
                ? '✓ Excelente saúde financeira' 
                : healthScore >= 40 
                ? '⚠️ Saúde financeira moderada' 
                : '🔴 Saúde financeira crítica'}
            </p>
          </div>
        </div>
      </div>

      {/* Transações Detalhadas */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Histórico de Transações</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Todas as movimentações da carteira em ordem cronológica
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            Total: {transactions.length}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Referência</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((transaction) => {
                  const isCredit = transaction.toWalletId === wallet.id;
                  return (
                    <tr key={transaction.id} className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {new Date(transaction.createdAt).toLocaleString('pt-PT')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          isCredit 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isCredit ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {isCredit ? 'Recebido' : 'Enviado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                        {transaction.reference || '—'}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-semibold ${
                        isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isCredit ? '+' : '-'} {Number(transaction.amount || 0).toLocaleString('pt-PT', { 
                          style: 'currency', 
                          currency: wallet.currency || 'MZN' 
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {transaction.status === 'completed' ? 'Concluído' : transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length > 20 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                  Ver mais transações →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletDetails;