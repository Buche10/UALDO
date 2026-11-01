import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import DifferencesHeader from './DifferencesHeader';
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

  useEffect(() => {
    const next = {};
    (count?.lines || []).forEach((l) => {
      next[l.item_id] = { cause: l.explanation_cause || '', explanation: l.explanation || '' };
    });
    setExplanationsState(next);
  }, [count]);

  const differenceLines = useMemo(() => {
    return (count?.lines || []).filter(
      (l) => l.difference !== null && Math.abs(Number(l.difference)) > 0.0001
    );
  }, [count?.lines]);

  const serverUnexplainedCount = useMemo(() => {
    return differenceLines.filter((l) => {
      const cause = l.explanation_cause;
      if (!cause) return true;
      if (cause === 'otro' && (!l.explanation || !l.explanation.trim())) return true;
      return false;
    }).length;
  }, [differenceLines]);

  const hasUnsavedChanges = useMemo(() => {
    return differenceLines.some((l) => {
      const local = explanationsState[l.item_id] || { cause: '', explanation: '' };
      const serverCause = l.explanation_cause || '';
      const serverExp = l.explanation || '';
      return local.cause !== serverCause || local.explanation.trim() !== serverExp.trim();
    });
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

  const isValidated = count.status === 'validated';
  const canShowValidatorActions = canValidate && (count.status === 'submitted' || count.status === 'escalated');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <DifferencesHeader
        onBack={onBack}
        canValidate={canValidate}
        countStatus={count.status}
        onOpenEditSheet={onOpenEditSheet}
        onSaveExplanations={handleSaveExplanations}
        saving={saving}
        hasLines={differenceLines.length > 0}
      />

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
              disabled={isValidated}
            />
          ))}
        </div>
      )}

      {canShowValidatorActions && (
        <DifferencesValidatorActions
          serverUnexplainedCount={serverUnexplainedCount}
          hasUnsavedChanges={hasUnsavedChanges}
          validating={validating}
          canEscalate={count.status === 'submitted'}
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
