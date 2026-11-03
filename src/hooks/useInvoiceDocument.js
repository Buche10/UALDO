import { useCallback, useEffect, useState } from 'react';
import { getInvoiceDocument } from '../services/purchaseDocumentsClient';

/**
 * Consulta una factura del SRI o recibo mientras el motor lo lee (Brief 34ap / 34bp).
 * Sondea cada 3 segundos, retrocede ante fallos de red y se detiene a los
 * 2 minutos, al desmontar o cuando el documento termina.
 */

export const INVOICE_POLL_INTERVAL_MS = 3000;
export const INVOICE_POLL_TIMEOUT_MS = 120000;
const MAX_BACKOFF_MS = 24000;

export const INVOICE_ERROR_MESSAGES = {
  not_authorized: 'El SRI no tiene esa factura como autorizada. Revisa la clave.',
  sri_unavailable: 'El SRI no responde. Prueba en unos minutos o sube el XML.',
  invalid_xml: 'Ese archivo no es una factura electrónica válida.',
  unreadable: 'No se pudo leer la foto. Prueba con más luz o sube el PDF.',
  timeout: 'No pudimos leer el recibo ahora. Prueba en unos minutos o carga la compra a mano.',
  provider_error: 'No pudimos leer el recibo ahora. Prueba en unos minutos o carga la compra a mano.',
  duplicate: 'Esta factura ya se cargó antes.',
};

const TIMEOUT_MESSAGE = 'La consulta tardó más de 2 minutos. Revisa la factura cargada o inténtalo otra vez.';
const GENERIC_ERROR = 'No se pudo leer la factura. Puedes cargar la compra a mano.';

export function invoiceErrorMessage(code) {
  return INVOICE_ERROR_MESSAGES[code] || GENERIC_ERROR;
}

const INITIAL_STATE = {
  document: null,
  status: 'loading',
  error: null,
  errorCode: null,
  networkError: false,
};

export function useInvoiceDocument(documentId, options = {}) {
  const intervalMs = options.intervalMs ?? INVOICE_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? INVOICE_POLL_TIMEOUT_MS;
  const [state, setState] = useState(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let failures = 0;
    const deadline = Date.now() + timeoutMs;
    setState(INITIAL_STATE);

    const schedule = (delay) => {
      timer = setTimeout(poll, delay);
    };

    const stopWithTimeout = () => {
      setState((prev) => ({ ...prev, status: 'timeout', error: TIMEOUT_MESSAGE, networkError: false }));
    };

    const applyDocument = (document) => {
      if (document.status === 'failed') {
        setState({
          document,
          status: 'failed',
          error: invoiceErrorMessage(document.error_code),
          errorCode: document.error_code || null,
          networkError: false,
        });
        return true;
      }
      if (document.status === 'extracted') {
        setState({ document, status: 'extracted', error: null, errorCode: null, networkError: false });
        return true;
      }
      setState({ document, status: document.status || 'processing', error: null, errorCode: null, networkError: false });
      return false;
    };

    async function poll() {
      if (cancelled) return;
      const res = await getInvoiceDocument(documentId);
      if (cancelled) return;

      if (!res.ok) {
        if (!res.isNetworkError) {
          setState((prev) => ({ ...prev, status: 'error', error: res.error || GENERIC_ERROR }));
          return;
        }
        failures += 1;
        setState((prev) => ({ ...prev, networkError: true, error: 'Sin conexión. Reintentando...' }));
        if (Date.now() >= deadline) {
          stopWithTimeout();
          return;
        }
        schedule(Math.min(intervalMs * 2 ** failures, MAX_BACKOFF_MS));
        return;
      }

      failures = 0;
      if (applyDocument(res.data)) return;
      if (Date.now() >= deadline) {
        stopWithTimeout();
        return;
      }
      schedule(intervalMs);
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [documentId, attempt, intervalMs, timeoutMs]);

  return { ...state, retry };
}
