import { useEffect, useState } from 'react';
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

function AdminLegalPages() {
  const { authRequest } = useAuth();
  const { notify } = useNotification();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', content: '', status: 'draft' });

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

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(form.content || '');
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

  const toggleBold = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  };

  const toggleOrderedList = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await authRequest('/api/admin/legal-pages', {
        method: 'POST',
        body: form
      });
      await loadPages();
      setForm({ id: null, title: '', content: '', status: 'draft' });
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

  const handleEdit = (page) => {
    setForm({
      id: page.id,
      title: page.title,
      content: page.content,
      status: page.status
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta página?')) return;
    try {
      await authRequest(`/api/admin/legal-pages/${id}`, { method: 'DELETE' });
      await loadPages();
      notify({
        type: 'success',
        title: 'Página removida',
        message: 'A página foi removida com sucesso.'
      });
      if (form.id === id) {
        setForm({ id: null, title: '', content: '', status: 'draft' });
      }
    } catch (error) {
      console.error(error);
      notify({
        type: 'error',
        title: 'Erro ao remover',
        message: error.message || 'Não foi possível remover a página.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Páginas Legais</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Crie e publique termos, políticas e outros documentos legais.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Ex: Termos e Condições"
                required
              />
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleBold}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Negrito
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Itálico
                </button>
                <button
                  type="button"
                  onClick={toggleOrderedList}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Lista numerada
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Lista com marcadores
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Título
                </button>
              </div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Conteúdo</label>
              <div className="rounded-3xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <EditorContent editor={editor} className="min-h-[300px] prose prose-slate dark:prose-invert" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(event) => updateForm('status', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? 'Salvando...' : 'Salvar página'}
              </button>
              <button
                type="button"
                onClick={() => setForm({ id: null, title: '', content: '', status: 'draft' })}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Limpar
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Páginas existentes</h2>
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Carregando páginas...</div>
            ) : pages.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Nenhuma página criada ainda.</div>
            ) : (
              pages.map((page) => (
                <div key={page.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{page.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{page.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(page)}
                        className="rounded-full border border-brand-600 px-3 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-950/40"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(page.id)}
                        className="rounded-full border border-rose-600 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-400 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{page.content.slice(0, 120).replace(/\n/g, ' ')}...</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLegalPages;
