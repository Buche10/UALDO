import React, { useState, useEffect } from 'react';
import { PackageCheck, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { styles } from './purchaseUi';

export default function ReceivePurchaseDialog({
  isOpen,
  purchase,
  busy = false,
  error = null,
  onClose,
  onConfirm,
}) {
  const [step, setStep] = useState(1);
  const [quantities, setQuantities] = useState({});
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen && purchase?.lines) {
      setStep(1);
      setValidationError(null);
      const initial = {};
      purchase.lines.forEach((line) => {
        if (!line.is_other) {
          initial[line.id] = String(line.quantity);
        }
      });
      setQuantities(initial);
    }
  }, [isOpen, purchase]);

  if (!isOpen || !purchase) return null;

  const catalogLines = (purchase.lines || []).filter((l) => !l.is_other);
  const otherLines = (purchase.lines || []).filter((l) => l.is_other);

  const handleQtyChange = (lineId, value) => {
    setQuantities((prev) => ({ ...prev, [lineId]: value }));
    setValidationError(null);
  };

  const differences = catalogLines.map((line) => {
    const raw = quantities[line.id];
    const recVal = raw === '' || raw === undefined ? NaN : Number(raw.replace(/,/g, '.'));
    const billed = Number(line.quantity);
    const diff = Number.isNaN(recVal) ? 0 : recVal - billed;
    return { line, recVal, billed, diff, hasDiff: Math.abs(diff) > 0.0001 };
  });

  const diffCount = differences.filter((d) => d.hasDiff).length;

  const handleContinue = () => {
    for (const d of differences) {
      if (Number.isNaN(d.recVal) || d.recVal < 0) {
        setValidationError(`Cantidad inválida para ${d.line.item_name || 'insumo'}.`);
        return;
      }
    }
    setStep(2);
  };

  const handleFinalConfirm = () => {
    const payloadLines = catalogLines.map((l) => ({
      line_id: l.id,
      received_quantity: String(quantities[l.id]).replace(/,/g, '.').trim(),
    }));
    onConfirm(payloadLines);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="receive-dialog-title" className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glow)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageCheck size={18} color="var(--accent)" />
            <h3 id="receive-dialog-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {step === 1 ? 'Recepción contra factura' : 'Confirmar recepción'}
            </h3>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar modal" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {(error || validationError) && (
          <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error || validationError}</span>
          </div>
        )}

        {step === 1 ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Verifica el peso o cantidad real recibida de cada insumo.
            </p>

            {catalogLines.map((line) => {
              const diffInfo = differences.find((d) => d.line.id === line.id);
              const diff = diffInfo?.diff || 0;
              const hasDiff = diffInfo?.hasDiff;
              return (
                <div key={line.id} style={{ ...styles.card, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{line.item_name}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>Facturado: {line.quantity} {line.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor={`rec-qty-${line.id}`} style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '55px' }}>
                      Recibido:
                    </label>
                    <input
                      id={`rec-qty-${line.id}`}
                      type="text"
                      inputMode="decimal"
                      value={quantities[line.id] ?? ''}
                      onChange={(e) => handleQtyChange(line.id, e.target.value)}
                      style={{ ...styles.input, flex: 1, padding: '6px 8px', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '35px' }}>{line.unit}</span>
                  </div>
                  {hasDiff && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-soft)', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                      Diferencia: {diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)} {line.unit}
                    </div>
                  )}
                </div>
              );
            })}

            {otherLines.map((line) => (
              <div key={line.id} style={{ ...styles.card, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{line.item_name || 'Otra compra'}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{line.quantity} {line.unit} &bull; Otras compras (no pide peso)</div>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--accent)' }}>Directo</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} style={{ ...styles.secondary, flex: 1 }}>Cancelar</button>
              <button type="button" onClick={handleContinue} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>Continuar</button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ ...styles.card, padding: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                {diffCount > 0 ? `Se detectaron ${diffCount} diferencias contra factura.` : 'Todas las líneas coinciden con lo facturado.'}
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {diffCount > 0
                  ? 'La compra quedará registrada como "Recibida con diferencias" para su posterior resolución por administración.'
                  : 'El stock entrará a la ubicación de destino y se actualizarán los costos promedio.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setStep(1)} disabled={busy} style={{ ...styles.secondary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <ArrowLeft size={14} />
                <span>Modificar</span>
              </button>
              <button type="button" onClick={handleFinalConfirm} disabled={busy} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
                {busy ? 'Recibiendo...' : 'Confirmar recepción'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
