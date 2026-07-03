import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE } from '../../services/api';

function AdminTickets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const resolveAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url}`;
  };
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/tickets');
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const response = await authRequest(`/api/admin/tickets/${ticket.id}/messages`);
      setMessages(response.messages);
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro ao abrir ticket', message: err.message || 'Não foi possível carregar as mensagens do ticket.' });
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !replyText) return;

    try {
      setSending(true);
      await authRequest(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: { message: replyText }
      });
      setReplyText('');
      await openTicket(selectedTicket);
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro ao responder', message: err.message || 'Não foi possível enviar a resposta.' });
    } finally {
      setSending(false);
    }
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm('Tem certeza que deseja excluir este ticket?')) {
      return;
    }

    try {
      setDeletingId(ticketId);
      await authRequest(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      notify({ type: 'error', title: 'Erro ao excluir ticket', message: err.message || 'Não foi possível excluir o ticket.' });
    } finally {
      setDeletingId(null);
    }
  };

  const TicketDetailsModal = ({
    ticket,
    messages,
    replyText,
    setReplyText,
    sendReply,
    sending,
    onClose,
    resolveAttachmentUrl
  }) => {
    if (!ticket) return null;

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{ticket.subject}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cliente: {ticket.User?.name || 'Desconhecido'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{ticket.status}</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >Fechar</button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{ticket.description}</p>
          </div>

          {ticket.attachmentUrl ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Anexo</p>
                <a href={resolveAttachmentUrl(ticket.attachmentUrl)} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">Abrir</a>
              </div>
              <img
                src={resolveAttachmentUrl(ticket.attachmentUrl)}
                alt="Anexo do ticket"
                className="w-full rounded-3xl object-contain"
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Nenhum anexo disponível para este ticket.
            </div>
          )}

          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conversa ainda. Envie a primeira resposta abaixo.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`rounded-3xl border p-4 ${message.senderType === 'admin' ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{message.senderType === 'admin' ? 'Admin / Suporte' : message.User?.name || 'Cliente'}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(message.createdAt).toLocaleString('pt-PT')}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{message.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendReply} className="space-y-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Responder</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              rows={5}
              placeholder="Digite a resposta para o cliente..."
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'A enviar...' : 'Enviar resposta'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Tickets de Clientes</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja todos os tickets abertos, abra para ver detalhes e responda diretamente no modal.
          </p>
        </div>
      </div>

      {selectedTicket ? (
        <TicketDetailsModal
          ticket={selectedTicket}
          messages={messages}
          replyText={replyText}
          setReplyText={setReplyText}
          sendReply={sendReply}
          sending={sending}
          onClose={() => setSelectedTicket(null)}
          resolveAttachmentUrl={resolveAttachmentUrl}
        />
      ) : (
        <div className="grid gap-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lista de tickets</h2>
            <div className="mt-5 overflow-x-auto">
              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">A carregar tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Nenhum ticket encontrado.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                  <thead className="bg-slate-50 text-left uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Assunto</th>
                      <th className="px-4 py-4">Cliente</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Prioridade</th>
                      <th className="px-4 py-4">Atualizado</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ticket.description}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{ticket.User?.name || 'Usuário'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200' : ticket.status === 'pending' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200' : ticket.status === 'closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200'}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{ticket.priority}</td>
                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString('pt-PT')}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openTicket(ticket)}
                            className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                          >Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminTickets;
