import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { assetUrl } from '../../services/api';

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

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-PT');
}

function Tickets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const resolveAttachmentUrl = (url) => assetUrl(url) || '';

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/tickets');
      setTickets(data);
      setSelectedTicket((current) =>
        current ? data.find((t) => t.id === current.id) || current : null
      );
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao carregar tickets',
        message: err.message || 'Não foi possível carregar os tickets.'
      });
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (event, ticket) => {
    if (event) event.stopPropagation();
    setSelectedTicket(ticket);
    setMessages([]);
    setReplyText('');
    try {
      const response = await authRequest(`/api/tickets/${ticket.id}/messages`);
      setMessages(response.messages || []);
      setSelectedTicket(response.ticket || ticket);
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao abrir ticket',
        message: err.message || 'Não foi possível carregar as mensagens.'
      });
    }
  };

  const closeTicket = () => {
    setSelectedTicket(null);
    setMessages([]);
    setReplyText('');
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !description.trim()) {
      notify({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Informe assunto e descrição antes de enviar o ticket.'
      });
      return;
    }

    try {
      setSending(true);
      let attachment = null;
      if (attachmentFile) {
        attachment = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(attachmentFile);
        });
      }

      await authRequest('/api/tickets', {
        method: 'POST',
        body: {
          subject: subject.trim(),
          description: description.trim(),
          attachment,
          attachmentName: attachmentFile?.name
        }
      });

      setSubject('');
      setDescription('');
      setAttachmentFile(null);
      setFormOpen(false);
      notify({
        type: 'success',
        title: 'Ticket enviado',
        message: 'O seu ticket foi registado e o admin foi notificado.'
      });
      await loadTickets();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao enviar ticket',
        message: err.message || 'Não foi possível enviar o ticket.'
      });
    } finally {
      setSending(false);
    }
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
      await openTicket(null, selectedTicket);
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
      notify({
        type: 'success',
        title: 'Ticket excluído',
        message: 'O ticket foi removido.'
      });
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Erro ao excluir',
        message: err.message || 'Não foi possível excluir o ticket.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTicketKeyDown = (event, ticket) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTicket(null, ticket);
    }
  };

  // ── Cabeçalho da página ──────────────────────────────────────────────────
  const Header = () => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
          Suporte
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Tickets de Suporte
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Crie um novo pedido de suporte ou acompanhe o estado de um ticket já criado.
        </p>
      </div>
      {!formOpen && !selectedTicket && (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo ticket
        </button>
      )}
    </div>
  );

  // ── Formulário de novo ticket ────────────────────────────────────────────
  const NewTicketForm = () => (
    <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
            Novo ticket
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            Abrir novo ticket
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(false)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Voltar
        </button>
      </div>

      <form onSubmit={createTicket} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Assunto <span className="text-rose-600">*</span>
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Descreva o problema em poucas palavras"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Descrição <span className="text-rose-600">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Conte-nos o que está a acontecer..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Imagem <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 dark:text-slate-300"
          />
          {attachmentFile && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Anexo: {attachmentFile.name}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'A enviar...' : 'Enviar ticket'}
          </button>
        </div>
      </form>
    </section>
  );

  // ── Lista de tickets ─────────────────────────────────────────────────────
  const TicketList = () => (
    <section className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Meus tickets
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Clique num ticket para abrir a conversa.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {tickets.length}
        </span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          A carregar tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ainda não tem tickets.
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Abrir primeiro ticket
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              role="button"
              tabIndex={0}
              onClick={() => openTicket(null, ticket)}
              onKeyDown={(event) => handleTicketKeyDown(event, ticket)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {ticket.subject}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {ticket.description}
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

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="block uppercase tracking-wider">Prioridade</span>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                  onClick={(event) => openTicket(event, ticket)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  Ver conversa
                </button>
                <button
                  type="button"
                  onClick={(event) => deleteTicket(event, ticket.id)}
                  disabled={deletingId === ticket.id}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
                >
                  {deletingId === ticket.id ? 'A excluir...' : 'Excluir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // ── Detalhe compacto do ticket ───────────────────────────────────────────
  const TicketDetails = () => {
    if (!selectedTicket) return null;

    return (
      <div className="space-y-4">
        {/* Barra de contexto */}
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Ticket selecionado
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selectedTicket.subject}
            </p>
          </div>
          <button
            type="button"
            onClick={closeTicket}
            className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Voltar à lista
          </button>
        </div>

        <div className="max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600">
                  Ticket
                </p>
                <h2 className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">
                  {selectedTicket.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeTicket}
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
              {/* Meta */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      STATUS_STYLES[selectedTicket.status] ||
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Prioridade
                  </p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      PRIORITY_STYLES[selectedTicket.priority] ||
                      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {selectedTicket.priority || '—'}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Atualizado
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900 dark:text-white">
                    {formatDate(selectedTicket.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Descrição
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Anexo */}
              {selectedTicket.attachmentUrl && (
                <div className="rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Anexo
                    </p>
                    <a
                      href={resolveAttachmentUrl(selectedTicket.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Abrir
                    </a>
                  </div>
                  <img
                    src={resolveAttachmentUrl(selectedTicket.attachmentUrl)}
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
                    Nenhuma mensagem ainda. Envie a primeira resposta abaixo.
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
                              {isAdmin ? 'Admin / Suporte' : message.User?.name || 'Você'}
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

              {/* Resposta */}
              <form onSubmit={sendReply} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Responder
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Digite sua resposta aqui..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? 'A enviar...' : 'Enviar resposta'}
                  </button>
                </div>
              </form>

              {/* Excluir */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(event) => deleteTicket(event, selectedTicket.id)}
                  disabled={deletingId === selectedTicket.id}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
                >
                  {deletingId === selectedTicket.id ? 'A excluir...' : 'Excluir ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render principal ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Header />

      {formOpen ? (
        <NewTicketForm />
      ) : selectedTicket ? (
        <TicketDetails />
      ) : (
        <TicketList />
      )}
    </div>
  );
}

export default Tickets;