import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const STATUS_LABELS = {
  active: 'Ativa',
  expired: 'Expirada',
  cancelled: 'Cancelada',
  pending: 'Pendente'
};

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'MZN'
  });
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
}

function AdminSubscriptions() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('startedAt');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions
      .filter((sub) => {
        const fields = [
          sub.User?.name || '',
          sub.User?.email || '',
          sub.Package?.name || '',
          sub.status || '',
          sub.PaymentTransaction?.reference || ''
        ];
        return !query || fields.join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (sortBy === 'startedAt' || sortBy === 'expiresAt') {
          return sortOrder === 'asc'
            ? new Date(a[sortBy] || 0) - new Date(b[sortBy] || 0)
            : new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0);
        }
        const left = String(a[sortBy] ?? '').toLowerCase();
        const right = String(b[sortBy] ?? '').toLowerCase();
        if (left < right) return sortOrder === 'asc' ? -1 : 1;
        if (left > right) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [subscriptions, search, sortBy, sortOrder]);

  const setSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder('asc');
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/subscriptions');
      setSubscriptions(data);
      setSelectedSubscription((current) =>
        current ? data.find((s) => s.id === current.id) || current : null
      );
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao carregar subscrições',
        message: error.message || 'Não foi possível carregar as subscrições.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowKeyDown = (event, sub) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedSubscription(sub);
    }
  };

  // ── Detalhe compacto interno ──────────────────────────────────────────────
  const SubscriptionDetailsCard = ({ sub, onClose }) => {
    if (!sub) return null;

    const InfoTile = ({ label, children }) => (
      <div className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900">
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          {children}
        </div>
      </div>
    );

    const payment = sub.PaymentTransaction;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalhes da Subscrição
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
              {sub.User?.name || sub.User?.email || 'Utilizador'}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {sub.Package?.name || 'Pacote'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Fechar detalhes"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="space-y-3 px-4 py-3">
          {/* Valor pago em destaque */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Valor pago</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(sub.pricePaid)}
            </p>
          </div>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Estado">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_STYLES[sub.status] ||
                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {STATUS_LABELS[sub.status] || sub.status}
              </span>
            </InfoTile>
            <InfoTile label="Auto-renovação">{sub.autoRenew ? 'Sim' : 'Não'}</InfoTile>
            <InfoTile label="Início">{formatDate(sub.startedAt)}</InfoTile>
            <InfoTile label="Expira">{formatDate(sub.expiresAt)}</InfoTile>
          </div>

          {/* Pagamento */}
          <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Pagamento</p>
            {payment ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {payment.provider?.toUpperCase() || 'N/A'} · {payment.reference || '—'}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Código: {payment.providerResponseCode || '—'} · Estado:{' '}
                  {payment.status || '—'}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Sem registo de pagamento associado.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Gestão de Subscrições
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja e gerencie todas as subscrições da plataforma. Os pagamentos são processados
            diretamente na API de pagamentos principal, sem debitar nenhuma carteira.
          </p>
        </div>
      </div>

      {selectedSubscription ? (
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Subscrição selecionada
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedSubscription.User?.name || selectedSubscription.User?.email || 'Utilizador'} ·{' '}
                {selectedSubscription.Package?.name || 'Pacote'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSubscription(null)}
              className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ← Voltar à lista
            </button>
          </div>

          <div className="max-w-xl">
            <SubscriptionDetailsCard
              sub={selectedSubscription}
              onClose={() => setSelectedSubscription(null)}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por utilizador, pacote, estado ou referência"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white lg:flex-1"
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Ordenar por:</span>
              {[
                { key: 'startedAt', label: 'Data de Início' },
                { key: 'status', label: 'Estado' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortField(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    sortBy === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              A carregar subscrições...
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              Nenhuma subscrição encontrada.
            </div>
          ) : (
            <>
              {/* Tabela (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Usuário</th>
                      <th className="px-4 py-4">Pacote</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Início</th>
                      <th className="px-4 py-4">Expira</th>
                      <th className="px-4 py-4">Auto-renovação</th>
                      <th className="px-4 py-4">Valor pago</th>
                      <th className="px-4 py-4">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {filteredSubscriptions.map((sub) => (
                      <tr
                        key={sub.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedSubscription(sub)}
                        onKeyDown={(event) => handleRowKeyDown(event, sub)}
                        className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                          {sub.User?.name || sub.User?.email || 'Usuário'}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {sub.Package?.name || 'Pacote'}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[sub.status] ||
                              'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {STATUS_LABELS[sub.status] || sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(sub.startedAt)}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(sub.expiresAt)}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {sub.autoRenew ? 'Sim' : 'Não'}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatCurrency(sub.pricePaid)}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {sub.PaymentTransaction ? (
                            <div className="space-y-0.5">
                              <p className="font-medium text-slate-800 dark:text-slate-100">
                                {sub.PaymentTransaction.provider?.toUpperCase() || 'N/A'} ·{' '}
                                {sub.PaymentTransaction.reference || '—'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {sub.PaymentTransaction.providerResponseCode ||
                                  sub.PaymentTransaction.status}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sem registo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-3">
                {filteredSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSubscription(sub)}
                    onKeyDown={(event) => handleRowKeyDown(event, sub)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {sub.User?.name || sub.User?.email || 'Usuário'}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {sub.Package?.name || 'Pacote'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          STATUS_STYLES[sub.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[sub.status] || sub.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block uppercase tracking-wider">Início</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(sub.startedAt)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Expira</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(sub.expiresAt)}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider">Valor pago</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(sub.pricePaid)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block uppercase tracking-wider">Auto-renovação</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {sub.autoRenew ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedSubscription(sub);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminSubscriptions;