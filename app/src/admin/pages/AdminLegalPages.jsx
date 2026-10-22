import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';

const EMPTY_FORM = { id: null, title: '', content: '', status: 'draft' };

const STATUS_LABELS = {
  draft: 'Rascunho',
  published: 'Publicado'
};

const STATUS_STYLES = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
};

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function AdminLegalPages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const { confirm } = useConfirmation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false
      }),
      Bold,
      Italic,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Placeholder.configure({ placeholder: 'Digite aqui o conteúdo da página legal...' })
    ],
    content: form.content || '',
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, content: editor.getHTML() }));
    }
  });

  // Sincroniza conteúdo ao trocar de página / limpar
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(form.content || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, form.id]);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await authRequest('/api/admin/legal-pages');
      setPages(data);
    } catch (error) {
      console.error(error);
      notify({
        type: 'error',
        title: 'Erro ao carregar páginas',
        message: 'Não foi possível carregar as páginas de documentação.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      notify({ type: 'error', title: 'Título obrigatório', message: 'Informe um título para a página.' });
      return;
    }
    try {
      setSaving(true);
      await authRequest('/api/admin/legal-pages', { method: 'POST', body: form });
      await loadPages();
      setForm(EMPTY_FORM);
      notify({
        type: 'success',
        title: 'Página salva',
        message: 'A página legal foi salva com sucesso.'
      });
    } catch (error) {
      console.error(error);
      notify({
        type: 'error',
        title: 'Erro ao salvar',
        message: error.message || 'Não foi possível salvar a página.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event, page) => {
    if (event) event.stopPropagation();
    setForm({
      id: page.id,
      title: page.title,
      content: page.content,
      status: page.status
    });
    // Scroll para o topo (formulário) em mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (event, page) => {
    if (event) event.stopPropagation();
    if (!(await confirm({
      title: 'Apagar página',
      message: `Tem certeza que deseja apagar a página "${page.title}"?`,
      confirmLabel: 'Apagar página'
    }))) return;
    try {
      setDeletingId(page.id);
      await authRequest(`/api/admin/legal-pages/${page.id}`, { method: 'DELETE' });
      await loadPages();
      notify({
        type: 'success',
        title: 'Página removida',
        message: 'A página foi removida com sucesso.'
      });
      if (form.id === page.id) setForm(EMPTY_FORM);
    } catch (error) {
      console.error(error);
      notify({
        type: 'error',
        title: 'Erro ao remover',
        message: error.message || 'Não foi possível remover a página.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => setForm(EMPTY_FORM);

  // ── Toolbar do editor ─────────────────────────────────────────────────────
  const ToolbarButton = ({ label, isActive, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!isActive}
      aria-label={label}
      title={label}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        isActive
          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );

  const toolbar = useMemo(() => {
    if (!editor) return null;
    return (
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <ToolbarButton
          label="Negrito"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Itálico"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <ToolbarButton
          label="Título 1"
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          label="Título 2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Título 3"
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        <ToolbarButton
          label="Lista com marcadores"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • Lista
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        </ToolbarButton>
      </div>
    );
  }, [editor]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Páginas Legais
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Crie e publique termos, políticas e outros documentos legais.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Editor */}
        <form
          onSubmit={handleSave}
          aria-busy={saving}
          className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {form.id ? 'Editar página' : 'Nova página'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {form.id
                ? 'Altere os campos e clique em Salvar para atualizar a página.'
                : 'Preencha o título, o conteúdo e o estado para publicar.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Título <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Ex: Termos e Condições"
                required
              />
            </div>

            {/* Editor */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Conteúdo
              </label>
              {toolbar}
              <div className="rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <EditorContent
                  editor={editor}
                  className="min-h-[240px] prose prose-sm prose-slate max-w-none dark:prose-invert focus:outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-700">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : form.id ? 'Atualizar página' : 'Salvar página'}
              </button>
            </div>
          </div>
        </form>

        {/* Lista */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Páginas existentes</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Clique numa página para editar.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {pages.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Carregando páginas...
            </div>
          ) : pages.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhuma página criada ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => {
                const isActive = form.id === page.id;
                const preview = stripHtml(page.content).slice(0, 120);
                return (
                  <div
                    key={page.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => handleEdit(event, page)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleEdit(event, page);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                      isActive
                        ? 'border-brand-400 bg-brand-50/40 dark:border-brand-600 dark:bg-brand-900/20'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {page.title}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            STATUS_STYLES[page.status] ||
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {STATUS_LABELS[page.status] || page.status}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                        <button
                          type="button"
                          onClick={(event) => handleEdit(event, page)}
                          className="rounded-lg border border-brand-500 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-500 dark:text-brand-300 dark:hover:bg-brand-900/20"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDelete(event, page)}
                          disabled={deletingId === page.id}
                          className="rounded-lg border border-rose-500 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-900/20"
                        >
                          {deletingId === page.id ? 'A apagar...' : 'Apagar'}
                        </button>
                      </div>
                    </div>
                    {preview && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                        {preview}…
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLegalPages;