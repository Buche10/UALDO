import React, { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { styles } from '../common/uiStyles';

/**
 * Cancelación de una reserva con motivo obligatorio (Brief 39p).
 */
export default function CancelReservationDialog({ isOpen, busy = false, error = null, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState(null);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (isOpen) return;
    setReason('');
    setLocalError(null);
  }, [isOpen]);

  const close = () => {
    if (busy) return;
    setReason('');
    setLocalError(null);
    onClose();
  };

  const confirm = () => {
    const clean = reason.trim();
    if (!clean) {
      setLocalError('Indica el motivo de la cancelación.');
      return;
    }
    setLocalError(null);
    onConfirm(clean);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Cancelar reserva"
      message="La reserva se cancela y el stock comprometido se libera. No se puede deshacer."
      confirmLabel="Cancelar reserva"
      busy={busy}
      error={localError || error}
      onConfirm={confirm}
      onClose={close}
      initialFocusRef={reasonRef}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="reservation-cancel-reason" style={styles.label}>Motivo de la cancelación</label>
        <textarea
          id="reservation-cancel-reason"
          ref={reasonRef}
          rows="3"
          maxLength="300"
          value={reason}
          onChange={(event) => { setReason(event.target.value); setLocalError(null); }}
          style={{ ...styles.input, resize: 'vertical' }}
        />
      </div>
    </ConfirmDialog>
  );
}
