import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function AdminTickets() {
  const { authRequest } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
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
    } finally {
      setDeletingId(null);
    }
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

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lista de tickets</h2>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">A carregar tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Nenhum ticket encontrado.</div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.User?.name || 'Usuário'} · {ticket.status} · {ticket.priority}</p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{ticket.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openTicket(ticket)}
                      className="rounded-2xl border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-200"
                    >Ver</button>
                    <button
                      type="button"
                      onClick={() => deleteTicket(ticket.id)}
                      disabled={deletingId === ticket.id}
                      className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === ticket.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {selectedTicket && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedTicket.subject}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cliente: {selectedTicket.User?.name || 'Desconhecido'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{selectedTicket.status}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >Fechar</button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{selectedTicket.description}</p>
              </div>

              {selectedTicket.attachmentUrl ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Anexo</p>
                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">Abrir</a>
                  </div>
                  <img
                    src={selectedTicket.attachmentUrl}
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
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminTickets;
