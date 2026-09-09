import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function LegalPageView() {
  const { slug } = useParams();
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const data = await authRequest(`/api/legal-pages/${slug}`);
        setPage(data);
      } catch (error) {
        console.error(error);
        notify({
          type: 'error',
          title: 'Erro ao abrir documento',
          message: 'Não foi possível carregar o documento selecionado.'
        });
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [authRequest, notify, slug]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Documento</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{page?.title || 'Documento Legal'}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Leia a política ou termos oficiais publicados pela plataforma.</p>
        </div>
        <Link
          to="/client/legal"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Voltar à lista
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Carregando documento...
        </div>
      ) : !page ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Documento não encontrado.
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        </div>
      )}
    </div>
  );
}

export default LegalPageView;
