import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { assetUrl } from '../../services/api';
import { useAutoRefresh } from '../../helpers/useAutoRefresh';

const STATUS_LABELS = {
  open: 'Aberto',
  pending: 'Em atendimento',
  closed: 'Fechado'
};

const STATUS_STYLES = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  pending: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  normal: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
};

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-PT');
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
}

const resolveAttachmentUrl = (url) => assetUrl(url) || '';

// ── Detalhe do ticket ─────────────────────────────────────────────────────
function TicketDetails({
  ticket,
  messages,
  replyText,
  sending,
  updatingStatus,
  deletingId,
  onReplyChange,
  onReplySubmit,
  onStatusChange,
  onClose,
  onDelete
}) {
  if (!ticket) return null;

  return (
    <div className="space-y-4">
      {/* Barra de contexto */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Ticket selecionado</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
            {ticket.subject} · {ticket.User?.name || 'Cliente'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={updatingStatus || sending}
          className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Voltar à lista
        </button>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between dark:border-slate-700">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                Ticket
              </p>
              <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                {ticket.subject}
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {ticket.User?.name || 'Cliente desconhecido'} · {ticket.User?.email || ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Estado do ticket"
                value={ticket.status}
                disabled={updatingStatus || sending}
                onChange={(event) => onStatusChange(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="open">Aberto</option>
                <option value="pending">Em atendimento</option>
                <option value="closed">Fechado</option>
              </select>
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
          </div>

          {/* Corpo */}
          <div className="space-y-3 px-4 py-3">
            {/* Meta: status + prioridade + atualizado */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    STATUS_STYLES[ticket.status] ||
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Prioridade</p>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    PRIORITY_STYLES[ticket.priority] ||
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {ticket.priority || '—'}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Atualizado</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                  {formatDate(ticket.updatedAt)}
                </p>
              </div>
            </div>

            {/* Descrição */}
            <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Descrição</p>
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {ticket.description}
              </p>
            </div>

            {/* Anexo */}
            {ticket.attachmentUrl && (
              <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Anexo</p>
                  <a
                    href={resolveAttachmentUrl(ticket.attachmentUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Abrir
                  </a>
                </div>
                <img
                  src={resolveAttachmentUrl(ticket.attachmentUrl)}
                  alt="Anexo do ticket"
                  className="mt-2 max-h-64 w-full rounded-lg object-contain"
                />
              </div>
            )}

            {/* Conversa */}
            <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Conversa ({messages.length})
              </p>
              {messages.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Nenhuma conversa ainda. Envie a primeira resposta abaixo.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {messages.map((message) => {
                    const isAdmin = message.senderType === 'admin';
                    return (
                      <div
                        key={message.id}
                        className={`rounded-xl px-3 py-2 ${
                          isAdmin
                            ? 'bg-brand-50 dark:bg-brand-900/20'
                            : 'bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                            {isAdmin ? 'Admin / Suporte' : message.User?.name || 'Cliente'}
                          </p>
                          <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                            {formatDateTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-xs text-slate-700 dark:text-slate-300">
                          {message.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Formulário de resposta */}
            <form onSubmit={onReplySubmit} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Responder
              </label>
              <textarea
                value={replyText}
                onChange={(e) => onReplyChange(e.target.value)}
                rows={3}
                placeholder="Digite a resposta para o cliente..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="submit"
                  disabled={sending || updatingStatus || !replyText.trim()}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'A enviar...' : 'Enviar resposta'}
                </button>
              </div>
            </form>

            {/* Ações destrutivas */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={(event) => onDelete(event, ticket.id)}
                disabled={deletingId === ticket.id}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
              >
                {deletingId === ticket.id ? 'A excluir...' : 'Excluir ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lista de tickets ──────────────────────────────────────────────────────
function TicketList({ tickets, loading, deletingId, onOpen, onDelete }) {
  const handleRowKeyDown = (event, ticket) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(ticket);
    }
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lista de tickets</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Clique num ticket para abrir a conversa.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {tickets.length}
        </span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          A carregar tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          Nenhum ticket encontrado.
        </div>
      ) : (
        <>
          {/* Tabela (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-4">Assunto</th>
                  <th className="px-4 py-4">Cliente</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-4 py-4">Prioridade</th>
                  <th className="px-4 py-4">Atualizado</th>
                  <th className="px-4 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(ticket)}
                    onKeyDown={(event) => handleRowKeyDown(event, ticket)}
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/20 dark:hover:bg-slate-700/60 dark:focus:bg-slate-700/60"
                  >
                    <td className="px-4 py-4">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {ticket.User?.name || 'Usuário'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[ticket.status] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          PRIORITY_STYLES[ticket.priority] ||
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {ticket.priority || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(ticket.updatedAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpen(ticket);
                          }}
                          className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={(event) => onDelete(event, ticket.id)}
                          disabled={deletingId === ticket.id}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === ticket.id ? 'A excluir...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(ticket)}
                onKeyDown={(event) => handleRowKeyDown(event, ticket)}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {ticket.subject}
                    </p>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                      {ticket.User?.name || 'Usuário'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      STATUS_STYLES[ticket.status] ||
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {ticket.description}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="block uppercase tracking-wider">Prioridade</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        PRIORITY_STYLES[ticket.priority] ||
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {ticket.priority || '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block uppercase tracking-wider">Atualizado</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatDate(ticket.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(ticket);
                    }}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    Ver conversa
                  </button>
                  <button
                    type="button"
                    onClick={(event) => onDelete(event, ticket.id)}
                    disabled={deletingId === ticket.id}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === ticket.id ? 'A excluir...' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
function AdminTickets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTickets = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await authRequest('/api/admin/tickets');
      setTickets(data);
    } catch (err) {
      console.error(err);
      if (!silent) {
        notify({
          type: 'error',
          title: 'Erro ao carregar tickets',
          message: err.message || 'Não foi possível carregar os tickets.'
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sincronização automática a cada 20 segundos, sem recarregar a página.
  // O ticket aberto e a caixa de resposta não são alterados.
  useAutoRefresh(() => loadTickets(true));

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    try {
      const response = await authRequest(`/api/admin/tickets/${ticket.id}/messages`);
      setSelectedTicket(response.ticket);
      setTickets((current) =>
        current.map((entry) =>
          entry.id === response.ticket.id ? { ...entry, status: response.ticket.status } : entry
        )
      );
      setMessages(response.messages || []);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao abrir ticket',
        message: err.message || 'Não foi possível carregar as mensagens do ticket.'
      });
    }
  };

  const closeTicket = () => {
    setSelectedTicket(null);
    setMessages([]);
    setReplyText('');
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSending(true);
      await authRequest(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: { message: replyText.trim() }
      });
      setReplyText('');
      await openTicket(selectedTicket);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao responder',
        message: err.message || 'Não foi possível enviar a resposta.'
      });
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      setUpdatingStatus(true);
      const updated = await authRequest(`/api/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: { status }
      });
      setSelectedTicket((current) => ({ ...current, status: updated.status }));
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === updated.id ? { ...ticket, status: updated.status } : ticket
        )
      );
      notify({
        type: 'success',
        title: 'Ticket atualizado',
        message: 'O estado do ticket foi atualizado.'
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Erro ao atualizar ticket',
        message: error.message
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteTicket = async (event, ticketId) => {
    if (event) event.stopPropagation();
    if (!(await confirm({
      title: 'Excluir ticket',
      message: `Tem certeza que deseja excluir o ticket ${tickets.find((ticket) => ticket.id === ticketId)?.subject || ticketId}?`,
      confirmLabel: 'Excluir ticket'
    }))) return;

    try {
      setDeletingId(ticketId);
      await authRequest(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      if (selectedTicket?.id === ticketId) closeTicket();
      notify({ type: 'success', title: 'Ticket removido', message: 'O ticket foi excluído.' });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao excluir ticket',
        message: err.message || 'Não foi possível excluir o ticket.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Tickets de Clientes
          </h1>
        </div>
      </div>

      {selectedTicket ? (
        <TicketDetails
          ticket={selectedTicket}
          messages={messages}
          replyText={replyText}
          sending={sending}
          updatingStatus={updatingStatus}
          deletingId={deletingId}
          onReplyChange={setReplyText}
          onReplySubmit={sendReply}
          onStatusChange={updateTicketStatus}
          onClose={closeTicket}
          onDelete={deleteTicket}
        />
      ) : (
        <TicketList
          tickets={tickets}
          loading={loading}
          deletingId={deletingId}
          onOpen={openTicket}
          onDelete={deleteTicket}
        />
      )}
    </div>
  );
}

export default AdminTickets;