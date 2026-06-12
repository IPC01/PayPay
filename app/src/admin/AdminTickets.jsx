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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Tickets de Clientes</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Veja todos os tickets abertos e responda como suporte ou administrador.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tickets de clientes</h2>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">A carregar tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Nenhum ticket encontrado.</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicket(ticket)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedTicket?.id === ticket.id ? 'border-brand-500 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'} hover:border-brand-300 hover:bg-slate-50 dark:hover:border-brand-500/40 dark:hover:bg-slate-900/70`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.status} • {ticket.priority}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{new Date(ticket.updatedAt).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{ticket.description}</p>
                </button>
              ))
            )}
          </div>
        </section>

        {selectedTicket && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ticket: {selectedTicket.subject}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cliente: {selectedTicket.User?.name || 'Desconhecido'} • Status: {selectedTicket.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{selectedTicket.description}</p>
              </div>

              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`rounded-3xl border p-4 ${message.senderType === 'admin' ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{message.senderType === 'admin' ? 'Admin / Suporte' : message.User?.name || 'Cliente'}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(message.createdAt).toLocaleString('pt-PT')}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{message.message}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="space-y-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Responder ao ticket</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Digite sua resposta aqui..."
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
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
