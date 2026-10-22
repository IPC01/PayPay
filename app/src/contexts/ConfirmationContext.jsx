import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ConfirmationContext = createContext(null);

function ConfirmationModal({ options, onClose }) {
  const dialogRef = useRef(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (options.input && value !== options.input.expectedValue) {
      setError(options.input.errorMessage);
      return;
    }
    onClose(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="confirmation-title" aria-describedby="confirmation-description"
      onKeyDown={handleKeyDown}
      onCancel={(event) => { event.preventDefault(); onClose(false); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-6">
          <h2 id="confirmation-title" className="text-xl font-semibold">{options.title}</h2>
          <div id="confirmation-description" className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
            {options.message}
          </div>
          {options.details}
          {options.input && (
            <div>
              <label htmlFor="confirmation-input" className="mb-2 block text-sm font-medium">{options.input.label}</label>
              <input id="confirmation-input" type={options.input.type || 'text'} value={value} required
                autoComplete="off" aria-invalid={Boolean(error)} aria-describedby={error ? 'confirmation-error' : undefined}
                onChange={(event) => { setValue(event.target.value); setError(''); }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900" />
              {error && <p id="confirmation-error" role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:justify-end dark:border-slate-700">
          <button type="button" autoFocus onClick={() => onClose(false)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700">
            Cancelar
          </button>
          <button type="submit" className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white ${options.danger === false ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {options.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function ConfirmationProvider({ children }) {
  const [options, setOptions] = useState(null);
  const pendingRef = useRef(null);
  const location = useLocation();

  const close = useCallback((accepted) => {
    const resolve = pendingRef.current;
    pendingRef.current = null;
    setOptions(null);
    resolve?.(accepted);
  }, []);

  useEffect(() => {
    close(false);
  }, [location.key, close]);

  useEffect(() => () => {
    pendingRef.current?.(false);
    pendingRef.current = null;
  }, []);

  const confirm = useCallback((nextOptions) => {
    // Never replace a pending confirmation with a second destructive action.
    if (pendingRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pendingRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const context = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmationContext.Provider value={context}>
      {children}
      {options && <ConfirmationModal options={options} onClose={close} />}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error('useConfirmation requires ConfirmationProvider');
  return context;
}
