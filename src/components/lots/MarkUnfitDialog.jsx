import React, { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { markLotUnfit } from '../../services/lotsClient';
import { LOT_REASON_MAX, LOT_REASON_MIN, normalizeLotJustification } from '../../services/lotSelection';

const UNFIT_MESSAGE = 'Todo el saldo saldrá como merma. No se puede deshacer.';

/** Confirmación en dos pasos y motivo obligatorio para marcar un lote no apto. */
export default function MarkUnfitDialog({ isOpen, lot, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setReason('');
    setBusy(false);
    setError(null);
  }, [isOpen, lot?.id]);

  if (!isOpen || !lot) return null;

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2);
      setError(null);
      return;
    }
    const cleanReason = normalizeLotJustification(reason);
    if (!cleanReason) {
      setError(`Indica el motivo (${LOT_REASON_MIN} a ${LOT_REASON_MAX} caracteres).`);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await markLotUnfit(lot.id, cleanReason);
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.message || res.error || 'No se pudo marcar el lote como no apto.');
      return;
    }
    if (onDone) onDone(res.data?.data || res.data);
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={step === 1 ? `Marcar ${lot.code} no apto` : 'Motivo del lote no apto'}
      message={step === 1
        ? `${UNFIT_MESSAGE} Revisa bien el lote antes de continuar.`
        : UNFIT_MESSAGE}
      confirmLabel={step === 1 ? 'Continuar' : 'Marcar no apto'}
      busy={busy}
      error={error}
      onClose={() => { if (!busy) onClose(); }}
      onConfirm={handleConfirm}
      initialFocusRef={step === 2 ? reasonRef : undefined}
    >
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="unfit-reason" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Motivo ({LOT_REASON_MIN} a {LOT_REASON_MAX} caracteres)
          </label>
          <textarea
            id="unfit-reason"
            ref={reasonRef}
            rows={3}
            maxLength={LOT_REASON_MAX}
            value={reason}
            onChange={(event) => { setReason(event.target.value); setError(null); }}
            disabled={busy}
            style={{ width: '100%', padding: '9px 10px', borderRadius: '9px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '12px', resize: 'vertical' }}
          />
        </div>
      )}
    </ConfirmDialog>
  );
}
