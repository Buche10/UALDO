import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Edit3, AlertCircle } from 'lucide-react';
import DifferenceRow from './DifferenceRow';
import DifferencesValidatorActions from './DifferencesValidatorActions';
import EscalateDailyCloseDialog from './EscalateDailyCloseDialog';
import ValidateConfirmDialog from './ValidateConfirmDialog';
import { saveExplanations, validateCount } from '../../../services/inventoryCountsClient';

export default function DifferencesList({
  count,
  canValidate = false,
  onBack,
  onCountUpdated,
  onOpenEditSheet,
}) {
  const [explanationsState, setExplanationsState] = useState(() => {
    const initial = {};
    (count?.lines || []).forEach((l) => {
      initial[l.item_id] = { cause: l.explanation_cause || '', explanation: l.explanation || '' };
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showConfirmValidate, setShowConfirmValidate] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const differenceLines = useMemo(() => {
    return (count?.lines || []).filter(
      (l) => l.difference !== null && Math.abs(Number(l.difference)) > 0.0001
    );
  }, [count?.lines]);

  const unexplainedCount = useMemo(() => {
    return differenceLines.filter((l) => {
      const state = explanationsState[l.item_id];
      if (!state || !state.cause) return true;
      if (state.cause === 'otro' && !state.explanation.trim()) return true;
      return false;
    }).length;
  }, [differenceLines, explanationsState]);

  const handleRowChange = (itemId, { cause, explanation }) => {
    setExplanationsState((prev) => ({ ...prev, [itemId]: { cause, explanation } }));
  };

  const handleSaveExplanations = async () => {
    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const payload = differenceLines
      .filter((l) => Boolean(explanationsState[l.item_id]?.cause))
      .map((l) => ({
        item_id: l.item_id,
        cause: explanationsState[l.item_id].cause,
        explanation: explanationsState[l.item_id].explanation,
      }));

    if (payload.length === 0) {
      setSaving(false);
      setErrorMessage('Selecciona al menos una causa antes de guardar.');
      return;
    }

    const res = await saveExplanations(count.id, payload);
    setSaving(false);

    if (res.ok) {
      setStatusMessage('Explicaciones guardadas.');
      if (onCountUpdated) onCountUpdated(res.data?.data || res.data);
    } else {
      setErrorMessage(res.error || res.data?.message || 'Error al guardar explicaciones.');
    }
  };

  const handleConfirmValidate = async () => {
    setValidating(true);
    setErrorMessage(null);
    const res = await validateCount(count.id);
    setValidating(false);
    setShowConfirmValidate(false);

    if (res.ok) {
      if (onCountUpdated) onCountUpdated(res.data?.data || res.data);
      onBack();
    } else {
      setErrorMessage(res.error || res.data?.message || 'Error al validar el cierre.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          <span>Volver al cierre</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canValidate && count.status === 'submitted' && onOpenEditSheet && (
            <button
              type="button"
              onClick={onOpenEditSheet}
              className="glass-card-interactive"
              style={{ padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit3 size={14} />
              <span>Corregir conteo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveExplanations}
            disabled={saving || differenceLines.length === 0}
            className="btn-primary"
            style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Save size={14} />
            <span>{saving ? 'Guardando...' : 'Guardar explicaciones'}</span>
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', fontSize: '13px', color: 'var(--accent)', lineHeight: '1.4' }}>
        Una diferencia no es una falta. Cuéntanos qué pasó para corregirlo.
      </div>

      {statusMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px' }}>
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {differenceLines.length === 0 ? (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No se encontraron diferencias en este cierre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {differenceLines.map((line) => (
            <DifferenceRow
              key={line.id || line.item_id}
              line={line}
              cause={explanationsState[line.item_id]?.cause || ''}
              explanation={explanationsState[line.item_id]?.explanation || ''}
              onChange={handleRowChange}
              disabled={count.status === 'validated'}
            />
          ))}
        </div>
      )}

      {canValidate && count.status === 'submitted' && (
        <DifferencesValidatorActions
          unexplainedCount={unexplainedCount}
          validating={validating}
          onOpenEscalate={() => setShowEscalateDialog(true)}
          onOpenValidate={() => setShowConfirmValidate(true)}
        />
      )}

      <ValidateConfirmDialog
        isOpen={showConfirmValidate}
        diffCount={differenceLines.length}
        validating={validating}
        onClose={() => setShowConfirmValidate(false)}
        onConfirm={handleConfirmValidate}
      />

      <EscalateDailyCloseDialog
        isOpen={showEscalateDialog}
        countId={count.id}
        onClose={() => setShowEscalateDialog(false)}
        onEscalated={(updated) => {
          if (onCountUpdated) onCountUpdated(updated);
          onBack();
        }}
      />
    </div>
  );
}
