import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Armchair, ArrowLeft, RefreshCw } from 'lucide-react';
import { getOpenTables } from '../../services/openTablesClient';
import { formatReservationTime } from '../reservations/reservationUi';
import OpenTablesSummary from './OpenTablesSummary';
import OpenTableItem from './OpenTableItem';
import OpenTablesStaleNotice from './OpenTablesStaleNotice';

export const REFRESH_INTERVAL_MS = 30 * 1000;
const FALLBACK_ERROR = 'No se pudieron cargar las mesas abiertas.';

function LoadingCard() {
  return (
    <div
      className="glass-card"
      style={{ padding: '18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}
    >
      Cargando mesas abiertas...
    </div>
  );
}

function ErrorCard({ error, onRetry }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '18px',
        border: '1px solid var(--border-error)',
        background: 'var(--error-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <p role="alert" style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>
        {error}
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: '9999px',
          border: '1px solid var(--error)',
          background: 'transparent',
          color: 'var(--error)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
      >
        <RefreshCw size={14} aria-hidden="true" />
        <span>Reintentar</span>
      </button>
    </div>
  );
}

function EmptyCard({ readingTime }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
        No hay mesas abiertas en RunFood.
      </span>
      {readingTime && <span>Lectura de las {readingTime}.</span>}
    </div>
  );
}

/**
 * Pantalla de mesas abiertas de RunFood (Brief 47p).
 * Refresca cada 30 segundos solo con la vista visible y sin parpadeo.
 */
export default function OpenTablesView({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const timerRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    const res = await getOpenTables();
    inFlightRef.current = false;
    if (!mountedRef.current) return;

    setLoading(false);
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error || FALLBACK_ERROR);
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load({ silent: true });
      }
    }, REFRESH_INTERVAL_MS);
  }, [load, stopTimer]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    startTimer();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load({ silent: true });
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load, startTimer, stopTimer]);

  const mesas = Array.isArray(data?.mesas) ? data.mesas : [];
  const readingTime = formatReservationTime(data?.capturada_en);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: 0,
                marginBottom: '6px',
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Volver</span>
            </button>
          )}
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Armchair size={20} color="var(--accent)" aria-hidden="true" />
            <span>Mesas abiertas</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Mesas sin cobrar en RunFood, desde qué hora y con qué mesero.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load({ silent: true })}
          style={{
            padding: '8px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border-glass)',
            background: 'var(--ualdo-blanco)',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar</span>
        </button>
      </div>

      {error && !data && <ErrorCard error={error} onRetry={() => load()} />}
      {error && data && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}
      {loading && !data && <LoadingCard />}

      {data && (
        <>
          <OpenTablesSummary
            resumen={data.resumen}
            mesas={mesas}
            mostrarMontos={data.mostrar_montos === true}
          />
          {readingTime && mesas.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Lectura de las {readingTime}.
            </span>
          )}
          <OpenTablesStaleNotice
            desactualizado={data.desactualizado === true}
            capturadaEn={data.capturada_en}
          />
          {mesas.length === 0 ? (
            <EmptyCard readingTime={readingTime} />
          ) : (
            <div role="list" aria-label="Mesas abiertas" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {mesas.map((mesa, index) => (
                <OpenTableItem
                  key={mesa.pedido_id ?? `${mesa.etiqueta || mesa.mesa || 'mesa'}-${index}`}
                  mesa={mesa}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
