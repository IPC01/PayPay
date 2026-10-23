import { useEffect, useRef } from 'react';

/**
 * Hook de sincronização automática (auto refresh) sem recarregar a página.
 *
 * Re-executa `callback` a cada `intervalMs` milissegundos (padrão: 20 segundos),
 * buscando apenas os dados mais recentes da API. Como apenas chama a função de
 * carregamento já existente da página, todo o estado temporário da interface
 * (formulários, campos preenchidos, filtros, paginação, modais abertos) é
 * preservado — apenas os dados vindos da base de dados são atualizados.
 *
 * Características:
 * - Usa uma ref para invocar sempre a versão mais recente do callback,
 *   respeitando os filtros/estado atuais (sem "stale closures").
 * - Não executa enquanto o separador estiver oculto e sincroniza assim que
 *   volta a ficar visível.
 * - Evita requisições sobrepostas: se a sincronização anterior ainda estiver
 *   em curso, aguarda o próximo ciclo.
 * - Erros de sincronização em segundo plano são ignorados silenciosamente
 *   (não sobrescrevem dados válidos já apresentados).
 *
 * Uso típico:
 *   useAutoRefresh(() => loadData(true)); // true = modo silencioso (sem spinner)
 */
export function useAutoRefresh(callback, intervalMs = 20000) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;

    const tick = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } catch {
        // Falhas na sincronização em segundo plano não alteram a interface.
      } finally {
        inFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(tick, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}

export default useAutoRefresh;
