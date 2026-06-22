import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { API_BASE } from '../services/api';

function Tickets() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [tickets, setTickets] = useState([]);

  const resolveAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url}`;
  };
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/tickets');
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
      const response = await authRequest(`/api/tickets/${ticket.id}/messages`);
      setMessages(response.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!subject || !description) {
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
          subject,
          description,
          attachment,
          attachmentName: attachmentFile?.name
        }
      });

      setSubject('');
      setDescription('');
      setAttachmentFile(null);
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
      notify({
        type: 'error',
        title: 'Erro ao responder',
        message: err.message || 'Não foi possível enviar a resposta.'
      });
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
      await authRequest(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Suporte</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Tickets de Suporte</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crie um novo pedido de suporte ou acompanhe o status de um ticket já criado.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Abrir novo ticket</h2>
          <form onSubmit={createTicket} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Assunto</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Descreva o problema"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Conte-nos o que está a acontecer..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Imagem (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
              />
              {attachmentFile && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Anexo: {attachmentFile.name}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'A enviar...' : 'Enviar ticket'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Meus tickets</h2>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">A carregar tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">Nenhum ticket encontrado.</div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`rounded-3xl border ${selectedTicket?.id === ticket.id ? 'border-brand-500 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'} shadow-sm transition hover:border-brand-300 hover:bg-slate-50 dark:hover:border-brand-500/40 dark:hover:bg-slate-900/70`}
                >
                  <button
                    type="button"
                    onClick={() => openTicket(ticket)}
                    className="w-full text-left px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ticket.status}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{ticket.priority}</span>
                    </div>
                  </button>
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => openTicket(ticket)}
                      className="rounded-2xl border border-brand-600 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-200"
                    >Ver</button>
                    <button
                      type="button"
                      onClick={() => deleteTicket(ticket.id)}
                      disabled={deletingId === ticket.id}
                      className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === ticket.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {selectedTicket && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ticket: {selectedTicket.subject}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Status: {selectedTicket.status}</p>
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

            {selectedTicket.attachmentUrl && (
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">Anexo</p>
                <img
                  src={resolveAttachmentUrl(selectedTicket.attachmentUrl)}
                  alt="Anexo do ticket"
                  className="max-h-80 w-full rounded-3xl object-contain"
                />
              </div>
            )}

            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-3xl border p-4 ${message.senderType === 'admin' ? 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{message.senderType === 'admin' ? 'Admin / Suporte' : message.User?.name || 'Você'}</p>
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
  );
}

export default Tickets;
