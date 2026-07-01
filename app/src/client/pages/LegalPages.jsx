import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

function LegalPages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        const data = await authRequest('/api/legal-pages');
        setPages(data);
      } catch (error) {
        console.error(error);
        notify({
          type: 'error',
          title: 'Erro ao carregar documentos',
          message: 'Não foi possível carregar as páginas legais.'
        });
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, [authRequest, notify]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-600">Documentos</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Documentos Legais</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Selecione um documento legal para visualizar os termos e políticas publicadas.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Carregando documentos...
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Nenhum documento legal publicado ainda.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.id}
              to={`/legal/${page.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-500"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{page.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {page.content?.replace(/<[^>]+>/g, '').slice(0, 150) || 'Sem descrição disponível.'}...
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default LegalPages;
