import React, { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getYesterdayIsoString, validateRecalculateRange } from '../../services/runfoodConsumptionClient';
import { shiftIsoDate } from '../../hooks/useRunfoodConsumption';

/**
 * Formulario para solicitar el recalculo de consumo por ventas (Brief 25p).
 */
export default function RunfoodRecalculateForm({
  loading,
  result,
  error,
  onRecalculate,
  onClearResult
}) {
  const [desde, setDesde] = useState(() => shiftIsoDate(getYesterdayIsoString(), -6));
  const [hasta, setHasta] = useState(() => getYesterdayIsoString());
  const [localError, setLocalError] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleStartConfirm = () => {
    setLocalError(null);
    const check = validateRecalculateRange(desde, hasta);
    if (!check.valid) {
      setLocalError(check.error);
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirm = async () => {
    await onRecalculate({ desde, hasta });
    setIsConfirming(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--border-glass)',
    background: 'var(--chip-bg)',
    color: 'var(--text-main)',
    fontSize: 12
  };

  return (
    <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RefreshCw size={18} stroke="var(--accent)" />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
          Recalcular consumo
        </h3>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
        Aplica los cambios de recetas o mapeos a días anteriores cerrados (máximo 31 días).
      </p>

      {(error || localError) && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: 12 }}>
          <AlertCircle size={14} />
          <span>{error || localError}</span>
        </div>
      )}

      {result && (
        <div role="status" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>Se encolaron {result.dias_encolados} días para recálculo. El resultado aparecerá en unos minutos conforme se procesen los días.</span>
          </div>
          {onClearResult && (
            <button type="button" onClick={onClearResult} style={{ background: 'transparent', border: 'none', color: 'var(--success)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Cerrar
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Desde</label>
          <input type="date" aria-label="Fecha inicial de recálculo" value={desde} onChange={(e) => { setDesde(e.target.value); setLocalError(null); }} disabled={loading} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Hasta</label>
          <input type="date" aria-label="Fecha final de recálculo" value={hasta} onChange={(e) => { setHasta(e.target.value); setLocalError(null); }} disabled={loading} style={inputStyle} />
        </div>
      </div>

      {isConfirming ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, borderRadius: 8, background: 'var(--card-subtle-bg)', border: '1px solid var(--border-glass)' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-main)' }}>¿Confirmas solicitar el recálculo de consumo entre el {desde} y el {hasta}?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Encolando...' : 'Confirmar recálculo'}
            </button>
            <button type="button" onClick={() => setIsConfirming(false)} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={handleStartConfirm} disabled={loading} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <RefreshCw size={14} />
          <span>Recalcular período</span>
        </button>
      )}
    </div>
  );
}
