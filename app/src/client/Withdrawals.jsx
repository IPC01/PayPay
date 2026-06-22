import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800'
};

function Withdrawals() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ walletId: '', amount: '', phone: '', note: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [withdrawals, walletsData] = await Promise.all([
        authRequest('/api/withdrawals'),
        authRequest('/api/wallets')
      ]);

      setRequests(withdrawals);
      setWallets(walletsData);

      const queryWalletId = searchParams.get('walletId');
      const selectedWallet = walletsData.find((wallet) => wallet.id === queryWalletId);
      if (selectedWallet) {
        setForm((prev) => ({ ...prev, walletId: selectedWallet.id }));
      } else if (!form.walletId && walletsData.length > 0) {
        setForm((prev) => ({ ...prev, walletId: walletsData[0].id }));
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar saques',
        message: err.message || 'Não foi possível carregar os pedidos de saque.'
      });
    } finally {
      setLoading(false);
    }
  };

  const { settings } = useSettings();

  const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

  const getLocalPhone = (phone) => {
    let digits = normalizePhone(phone);
    if (digits.startsWith('258')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits;
  };

  const selectedWallet = wallets.find((wallet) => wallet.id === form.walletId);
  const walletTypeCode = selectedWallet?.WalletType?.code || selectedWallet?.WalletType?.name || '';
  const withdrawalFeePercent = Number(settings?.withdrawalFeePercent) || 0;
  const withdrawalMinValue = Number(settings?.withdrawalMinValue) || 0;
  const withdrawalMaxValue = Number(settings?.withdrawalMaxValue) || 0;
  const currentBalance = Number(selectedWallet?.balance) || 0;
  const requestedAmount = Number(form.amount || 0);
  const feeAmount = Number(((requestedAmount * withdrawalFeePercent) / 100).toFixed(2));
  const totalRequired = requestedAmount > 0 ? requestedAmount + feeAmount : 0;

  const formatCurrency = (value, currency = 'MZN') =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(Number(value || 0));

  const validatePhone = () => {
    const phone = getLocalPhone(form.phone);
    if (phone.length !== 9) {
      return false;
    }

    const lowerCode = String(walletTypeCode).toLowerCase();
    if (lowerCode.includes('mpesa')) {
      return /^(84|85)\d{7}$/.test(phone);
    }
    if (lowerCode.includes('emola')) {
      return /^(86|87)\d{7}$/.test(phone);
    }
    if (lowerCode.includes('mkesh')) {
      return /^(82|83)\d{7}$/.test(phone);
    }
    return true;
  };

  const phoneError = () => {
    if (!form.phone) return '';
    if (validatePhone()) return '';
    if (walletTypeCode.toLowerCase().includes('mpesa')) {
      return 'Número inválido. Use prefixo 84 ou 85 com 9 dígitos locais.';
    }
    if (walletTypeCode.toLowerCase().includes('emola')) {
      return 'Número inválido. Use prefixo 86 ou 87 com 9 dígitos locais.';
    }
    if (walletTypeCode.toLowerCase().includes('mkesh')) {
      return 'Número inválido. Use prefixo 82 ou 83 com 9 dígitos locais.';
    }
    return 'Número de telefone inválido para esta carteira.';
  };

  const amountError = () => {
    if (!form.amount) return '';
    if (requestedAmount <= 0) {
      return 'O valor deve ser maior que zero.';
    }
    if (withdrawalMinValue > 0 && requestedAmount < withdrawalMinValue) {
      return `O valor mínimo de saque é ${withdrawalMinValue.toFixed(2)}.`;
    }
    if (withdrawalMaxValue > 0 && requestedAmount > withdrawalMaxValue) {
      return `O valor máximo de saque é ${withdrawalMaxValue.toFixed(2)}.`;
    }
    if (currentBalance < totalRequired) {
      return `Saldo insuficiente. Total requerido é ${formatCurrency(totalRequired, selectedWallet?.currency || 'MZN')}.`;
    }
    return '';
  };

  const amountValidationMessage = amountError();
  const phoneValidationMessage = phoneError();

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.walletId || !form.amount || !form.phone) {
      notify({
        type: 'error',
        title: 'Dados obrigatórios',
        message: 'Informe a carteira, o valor e o telefone para solicitar o saque.'
      });
      return;
    }

    const amountValidation = amountError();
    if (amountValidation) {
      notify({
        type: 'error',
        title: 'Valor inválido',
        message: amountValidation
      });
      return;
    }

    const phoneValidation = phoneError();
    if (phoneValidation) {
      notify({
        type: 'error',
        title: 'Telefone inválido',
        message: phoneValidation
      });
      return;
    }

    try {
      setSubmitting(true);
      await authRequest('/api/withdrawals', {
        method: 'POST',
        body: {
          walletId: form.walletId,
          amount: Number(form.amount),
          phone: form.phone,
          note: form.note
        }
      });

      notify({
        type: 'success',
        title: 'Pedido enviado',
        message: 'Seu pedido de saque foi enviado e o admin será notificado.'
      });

      setForm({ walletId: form.walletId, amount: '', phone: '', note: '' });
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Falha ao solicitar saque',
        message: err.message || 'Não foi possível enviar o pedido de saque.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const requestCount = requests.length;
  const summary = useMemo(() => ({
    pending: requests.filter((item) => item.status === 'pending').length,
    approved: requests.filter((item) => item.status === 'approved').length,
    rejected: requests.filter((item) => item.status === 'rejected').length
  }), [requests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Saques</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Seus pedidos de saque</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Envie solicitações de saque e acompanhe o status. Quando o admin responder, você receberá uma notificação.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Solicitar saque
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Total</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{requestCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Pendente</p>
          <p className="mt-3 text-3xl font-bold text-yellow-700 dark:text-yellow-300">{summary.pending}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">Aprovado</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{summary.approved}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">A carregar pedidos de saque...</div>
        ) : requestCount === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300">
            <p className="text-lg font-semibold">Nenhum pedido de saque encontrado.</p>
            <p className="mt-2 text-sm">Clique em Solicitar saque para criar sua primeira solicitação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Carteira</th>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Valor</th>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Telefone</th>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Status</th>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Data</th>
                  <th className="px-6 py-4 text-left font-semibold uppercase tracking-[0.16em]">Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {request.Wallet?.walletName || request.Wallet?.walletCode || '—'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {request.Wallet?.currency || 'MZN'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">{formatCurrency(request.amount, request.Wallet?.currency)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-300">{request.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status] || 'bg-slate-100 text-slate-700'}`}>
                        {request.status === 'pending' ? 'Pendente' : request.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleString('pt-PT')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{request.adminMessage || 'Aguardando administrador'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Novo pedido</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Solicitação de saque</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Carteira</span>
                  <select
                    value={form.walletId}
                    onChange={(e) => setForm((prev) => ({ ...prev, walletId: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400"
                  >
                    {wallets.length === 0 ? (
                      <option value="">Nenhuma carteira disponível</option>
                    ) : (
                      wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.walletName || wallet.walletCode} — {wallet.currency || 'MZN'}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Valor</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 dark:text-white ${
                      amountValidationMessage
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/40 dark:focus:border-rose-400'
                        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200 dark:border-slate-700 dark:focus:border-brand-400'
                    } bg-white dark:bg-slate-800`}
                  />
                  {amountValidationMessage && (
                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{amountValidationMessage}</p>
                  )}
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefone de destino</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+258 84 000 0000"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 dark:text-white ${
                      phoneValidationMessage
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/40 dark:focus:border-rose-400'
                        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200 dark:border-slate-700 dark:focus:border-brand-400'
                    } bg-white dark:bg-slate-800`}
                  />
                  {phoneValidationMessage && (
                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{phoneValidationMessage}</p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Observação</span>
                  <textarea
                    rows={4}
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Motivo ou referência (opcional)"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-brand-400"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white">Simulação B2C</p>
                <p className="mt-2">
                  Este pedido criará uma solicitação de saque e, quando aprovada, o sistema simulará o envio para o número informado.
                  Nenhum endpoint real de pagamento será chamado aqui.
                </p>
                {withdrawalFeePercent > 0 && form.amount && (
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                    Taxa de saque: {withdrawalFeePercent.toFixed(2)}% — Total exigido: {formatCurrency(totalRequired, selectedWallet?.currency || 'MZN')}.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">Dica:</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Após o envio, o administrador receberá a notificação automaticamente. Quando o pedido for respondido, você verá o status e uma notificação no sistema.
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Caso ainda não tenha carteira ativa, crie ou ative uma em <Link to="/wallets" className="font-semibold text-brand-600 hover:text-brand-700">Carteiras</Link>.
        </p>
      </div>
    </div>
  );
}

export default Withdrawals;
