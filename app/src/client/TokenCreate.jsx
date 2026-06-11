import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function TokenCreate() {
  const { authRequest } = useAuth();
  const [createdToken, setCreatedToken] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setStatus(null);
    setCreatedToken('');
    setIsCopied(false);

    try {
      const response = await authRequest('/api/keys/api-keys', {
        method: 'POST',
        body: { name: 'Client token', scopes: [] }
      });

      setCreatedToken(response.apiKey);
      setStatus({ type: 'success', text: 'Token criado com sucesso. Copie-o agora.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setIsCopied(true);
  };

  const handleDelete = () => {
    setCreatedToken('');
    setIsCopied(false);
    setStatus({ type: 'info', text: 'Token eliminado localmente. Crie outro quando precisar.' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 className="text-xl font-semibold text-slate-900">Gerir tokens de API</h2>
        <p className="mt-2 text-slate-500">Crie um token só uma vez e copie-o imediatamente.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Token ativo</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{createdToken || 'Nenhum token criado'}</h3>
          </div>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? 'Gerando...' : 'Gerar novo token'}
          </button>
        </div>

        {status && (
          <div className={`mt-6 rounded-3xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}>
            {status.text}
          </div>
        )}

        {createdToken && (
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Token</p>
              <p className="mt-2 break-all font-mono text-slate-900">{createdToken}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCopy} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                {isCopied ? 'Copiado!' : 'Copiar token'}
              </button>
              <button onClick={handleDelete} className="rounded-2xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                Eliminar token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TokenCreate;
