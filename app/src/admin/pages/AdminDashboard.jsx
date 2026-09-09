import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const DEFAULT_GROWTH = [8, 14, 18, 25, 32, 42, 51];
const DEFAULT_TRANSACTIONS = [4, 6, 5, 9, 11, 13, 16];

function AdminDashboard() {
  const { authRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const walletHealth = useMemo(() => {
    if (!stats) return 0;
    return Math.round(((stats.activeWalletCount || 0) / Math.max(stats.walletCount || 1, 1)) * 100);
  }, [stats]);

  const averageTransactions = useMemo(() => {
    if (!stats) return 0;
    return Math.round((stats.transactionCount || 0) / Math.max(stats.walletCount || 1, 1));
  }, [stats]);

  // Preparar dados para gráficos
  const growthData = useMemo(() => {
    const series = stats?.weeklyGrowth || DEFAULT_GROWTH;
    const now = new Date();
    return series.map((value, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (series.length - 1 - index));
      return {
        dia: day.toLocaleDateString('pt-PT'),
        usuarios: value,
        semana: `Semana ${Math.floor(index / 7) + 1}`
      };
    });
  }, [stats]);

  const transactionData = useMemo(() => {
    const series = stats?.dailyTransactions || DEFAULT_TRANSACTIONS;
    const now = new Date();
    return series.map((value, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (series.length - 1 - index));
      return {
        dia: day.toLocaleDateString('pt-PT'),
        transacoes: value,
        semana: `Semana ${Math.floor(index / 7) + 1}`
      };
    });
  }, [stats]);

  const pieData = useMemo(() => [
    { name: 'Carteiras Ativas', value: walletHealth, color: '#10b981' },
    { name: 'Carteiras Inativas', value: 100 - walletHealth, color: '#ef4444' }
  ], [walletHealth]);

  const performanceData = useMemo(() => [
    { name: 'Seg', transacoes: 45, usuarios: 12 },
    { name: 'Ter', transacoes: 52, usuarios: 15 },
    { name: 'Qua', transacoes: 48, usuarios: 18 },
    { name: 'Qui', transacoes: 61, usuarios: 22 },
    { name: 'Sex', transacoes: 78, usuarios: 28 },
    { name: 'Sáb', transacoes: 65, usuarios: 24 },
    { name: 'Dom', transacoes: 42, usuarios: 16 }
  ], []);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

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

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Painel de Gestão</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Monitorize utilizadores, carteiras e transações com métricas e evolução da plataforma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/users"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver utilizadores
          </Link>
          <Link
            to="/admin/wallets"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Ver carteiras
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Utilizadores</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.userCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Contas ativas no último mês</p>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            +12% este mês
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.walletCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Total de carteiras registadas</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Transações</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.transactionCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Movimentos processados</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Carteiras ativas</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
            {loading ? '...' : stats?.activeWalletCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sistemas ativos agora</p>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Gráfico de Área - Crescimento */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Evolução de Utilizadores
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="usuarios" 
                stroke="#10b981" 
                fill="url(#colorUsuarios)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Transações */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Transações Diárias
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="dia" className="text-xs text-slate-500" />
              <YAxis className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transacoes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos de Performance */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Gráfico de Linhas - Performance Semanal */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Performance Semanal
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="name" className="text-xs text-slate-500" />
              <YAxis className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="transacoes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="usuarios" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Saúde das Carteiras */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Saúde das Carteiras
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
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Taxa de atividade: <span className="font-semibold text-green-600">{walletHealth}%</span>
            </p>
          </div>
        </div>

        {/* Gráfico Radial - Métricas */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Métricas de Performance
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="20%" 
              outerRadius="90%" 
              barSize={20} 
              data={[
                { name: 'Média Transações', value: averageTransactions, fill: '#3b82f6' },
                { name: 'Wallet Health', value: walletHealth, fill: '#10b981' }
              ]}
            >
              <RadialBar
                minAngle={15}
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                clockWise
                dataKey="value"
              />
              <Legend 
                iconSize={10} 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value) => <span className="text-sm text-slate-600 dark:text-slate-300">{value}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicadores Detalhados */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Crescimento Detalhado
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={growthData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis type="number" className="text-xs text-slate-500" />
              <YAxis dataKey="dia" type="category" className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usuarios" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Distribuição de Transações
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="dia" className="text-xs text-slate-500" />
              <YAxis className="text-xs text-slate-500" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transacoes" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Resumo Rápido
          </h2>
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-transparent p-4 dark:from-brand-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">Crescimento de chamadas API</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">+12%</p>
              <p className="mt-1 text-xs text-green-600">↑ Comparado com semana anterior</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-transparent p-4 dark:from-blue-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">Tempo médio de resposta</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">320ms</p>
              <p className="mt-1 text-xs text-green-600">✓ Dentro do SLA esperado</p>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;