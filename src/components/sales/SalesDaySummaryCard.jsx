import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { getSalesDay, getTodayIso } from '../../services/salesClient';
import SalesDayMetrics from './SalesDayMetrics';
import SalesDayTopLists from './SalesDayTopLists';

function formatCaptureTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function getYesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Tarjeta de Resumen del Día para el dueño (Brief 27p).
 * Permite alternar entre "Hoy", "Ayer" y fecha específica.
 */
export default function SalesDaySummaryCard({ todayData, todayLoading, todayError, onRetryToday }) {
  const [dayMode, setDayMode] = useState('hoy');
  const [customDate, setCustomDate] = useState(() => getYesterdayIso());
  const [closedDayData, setClosedDayData] = useState(null);
  const [closedDayLoading, setClosedDayLoading] = useState(false);
  const [closedDayError, setClosedDayError] = useState(null);

  const reqIdRef = useRef(0);

  const loadClosedDay = useCallback(async (date) => {
    if (!date) {
      setClosedDayData(null);
      setClosedDayLoading(false);
      setClosedDayError(null);
      return;
    }
    const currentReqId = ++reqIdRef.current;
    setClosedDayLoading(true);
    setClosedDayError(null);
    const res = await getSalesDay({ fecha: date });
    if (reqIdRef.current !== currentReqId) return;
    setClosedDayLoading(false);
    if (res.ok) {
      setClosedDayData(res.data);
    } else {
      setClosedDayError(res.error || 'No se pudo cargar el resumen del día.');
    }
  }, []);

  useEffect(() => {
    if (dayMode === 'ayer') {
      loadClosedDay(getYesterdayIso());
    } else if (dayMode === 'fecha') {
      if (customDate) {
        loadClosedDay(customDate);
      } else {
        setClosedDayData(null);
        setClosedDayLoading(false);
        setClosedDayError(null);
      }
    }
  }, [dayMode, customDate, loadClosedDay]);

  const activeLoading = dayMode === 'hoy' ? todayLoading : closedDayLoading;
  const activeError = dayMode === 'hoy' ? todayError : closedDayError;
  const activeSummary = dayMode === 'hoy' ? (todayData?.resumen ?? null) : closedDayData;
  const captureTime = dayMode === 'hoy' && activeSummary?.capturada_a ? formatCaptureTime(activeSummary.capturada_a) : null;
  const isStale = dayMode === 'hoy' && Boolean(todayData?.desactualizado);

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Selector de día: Hoy, Ayer, Fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Resumen del día
          </h3>
          {dayMode === 'hoy' && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--chip-bg)', color: 'var(--text-muted)' }}>
              Ventas de hoy
            </span>
          )}
        </div>

        <div role="group" aria-label="Seleccionar día de resumen" style={{ display: 'flex', gap: '4px', background: 'var(--chip-bg)', padding: '3px', borderRadius: '10px' }}>
          {['hoy', 'ayer', 'fecha'].map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={dayMode === mode}
              onClick={() => {
                reqIdRef.current++;
                setDayMode(mode);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                background: dayMode === mode ? 'var(--primary)' : 'transparent',
                color: dayMode === mode ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {mode === 'hoy' ? 'Hoy' : mode === 'ayer' ? 'Ayer' : 'Fecha'}
            </button>
          ))}
        </div>
      </div>

      {/* Input de fecha si se eligió modo fecha */}
      {dayMode === 'fecha' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} color="var(--accent)" />
          <input
            type="date"
            aria-label="Elegir fecha de resumen"
            max={getTodayIso()}
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: '12px'
            }}
          />
        </div>
      )}

      {/* Aviso de foto parcial desactualizada */}
      {isStale && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--warning-soft)',
            border: '1px solid var(--border-warning)',
            color: 'var(--warning)',
            fontSize: '12px',
            fontWeight: 500
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>La última lectura de RunFood tiene más de una hora.</span>
        </div>
      )}

      {/* Subtítulo informativo */}
      {dayMode === 'hoy' && captureTime && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Parcial, actualizado a las {captureTime}
        </span>
      )}

      {/* Estados de carga, error y contenido */}
      {activeLoading ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando resumen...
        </div>
      ) : activeError ? (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error)' }}>{activeError}</p>
          <button
            type="button"
            onClick={dayMode === 'hoy' ? onRetryToday : () => loadClosedDay(dayMode === 'ayer' ? getYesterdayIso() : customDate)}
            style={{
              alignSelf: 'flex-start',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--error)',
              background: 'transparent',
              color: 'var(--error)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} />
            <span>Reintentar</span>
          </button>
        </div>
      ) : !activeSummary ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          {dayMode === 'hoy' ? 'Aún no hay datos de hoy' : dayMode === 'fecha' && !customDate ? 'Elige una fecha' : 'No hay datos para este día.'}
        </div>
      ) : (
        <>
          <SalesDayMetrics summary={activeSummary} />
          <SalesDayTopLists summary={activeSummary} />
        </>
      )}
    </div>
  );
}
