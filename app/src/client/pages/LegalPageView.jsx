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
        setPage(null);
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

  // ── Cabeçalho reutilizado nas 3 vistas ──────────────────────────────────
  const Header = ({ subtitle }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
          Documento
        </p>
        <h1 className="mt-2 truncate text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {page?.title || 'Documento Legal'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      <Link
        to="/client/legal"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar à lista
      </Link>
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Header subtitle="Leia a política ou termos oficiais publicados pela plataforma." />
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-11/12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-10/12 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  // ── Não encontrado ──────────────────────────────────────────────────────
  if (!page) {
    return (
      <div className="space-y-6">
        <Header subtitle="Leia a política ou termos oficiais publicados pela plataforma." />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <svg
            className="mx-auto h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            Documento não encontrado
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            O documento pode ter sido removido ou o link está incorreto.
          </p>
          <Link
            to="/client/legal"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Ver todos os documentos
          </Link>
        </div>
      </div>
    );
  }

  // ── Documento ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Header subtitle="Leia a política ou termos oficiais publicados pela plataforma." />

      <article className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-3xl">
          <div
            className="prose prose-sm sm:prose-base prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-brand-600 hover:prose-a:text-brand-700 dark:prose-a:text-brand-400 prose-p:leading-relaxed prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </article>

      <div className="flex justify-center">
        <Link
          to="/client/legal"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar à lista de documentos
        </Link>
      </div>
    </div>
  );
}

export default LegalPageView;