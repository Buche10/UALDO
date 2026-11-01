import React, { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { closeWithdrawal } from '../../services/withdrawalsClient';
import { getLocationLabel } from './withdrawalHelpers';
import WithdrawalCloseRow from './WithdrawalCloseRow';
import WithdrawalCloseActions from './WithdrawalCloseActions';

export default function WithdrawalCloseForm({ withdrawal, user, onSuccess, onCancel }) {
  const lines = withdrawal?.lines || withdrawal?.items || [];
  const areaLabel = getLocationLabel(withdrawal?.to_location);
  const isSupervisorForOther = Number(withdrawal?.user_id || withdrawal?.user?.id) !== Number(user?.id);

  const [lineValues, setLineValues] = useState(() => {
    const initial = {};
    lines.forEach((l) => {
      const id = l.id || l.line_id;
      initial[id] = { consumed: '', returned: '' };
    });
    return initial;
  });

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleLineChange = (lineId, field, val) => {
    setLineValues((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: val },
    }));
  };

  const hasAnyKept = lines.some((l) => {
    const id = l.id || l.line_id;
    const orig = parseFloat(l.quantity) || 0;
    const cons = parseFloat(lineValues[id]?.consumed) || 0;
    const ret = parseFloat(lineValues[id]?.returned) || 0;
    return orig - (cons + ret) > 0.0001;
  });

  const hasAnyOver = lines.some((l) => {
    const id = l.id || l.line_id;
    const orig = parseFloat(l.quantity) || 0;
    const cons = parseFloat(lineValues[id]?.consumed) || 0;
    const ret = parseFloat(lineValues[id]?.returned) || 0;
    return cons + ret > orig + 0.0001;
  });

  const noteRequired = hasAnyKept || isSupervisorForOther;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (hasAnyOver) {
      setError('La suma de usado y devuelto no puede superar lo retirado.');
      return;
    }

    if (noteRequired && note.trim().length < 3) {
      setError(
        isSupervisorForOther
          ? 'Debes ingresar una nota explicando el cierre en nombre del trabajador.'
          : 'Quedó insumo en el área. La nota es obligatoria para explicarlo.'
      );
      return;
    }

    const payloadLines = lines.map((l) => {
      const id = l.id || l.line_id;
      return {
        line_id: id,
        consumed: lineValues[id]?.consumed || '0',
        returned: lineValues[id]?.returned || '0',
      };
    });

    setSubmitting(true);
    const res = await closeWithdrawal(withdrawal.id, payloadLines, note.trim() || null);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo cerrar el retiro.');
      return;
    }

    onSuccess?.(res.data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        maxWidth: '560px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            Confirmar cierre de retiro
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Destino: {areaLabel} {withdrawal?.purpose ? `· ${withdrawal.purpose}` : ''}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {lines.map((l) => {
          const id = l.id || l.line_id;
          return (
            <WithdrawalCloseRow
              key={id}
              line={l}
              consumed={lineValues[id]?.consumed}
              returned={lineValues[id]?.returned}
              areaLabel={areaLabel}
              onChangeConsumed={(val) => handleLineChange(id, 'consumed', val)}
              onChangeReturned={(val) => handleLineChange(id, 'returned', val)}
              disabled={submitting}
            />
          );
        })}
      </div>

      <WithdrawalCloseActions
        note={note}
        onChangeNote={setNote}
        noteRequired={noteRequired}
        isSupervisorForOther={isSupervisorForOther}
        hasAnyKept={hasAnyKept}
        disabled={submitting}
        hasAnyOver={hasAnyOver}
        onCancel={onCancel}
      />
    </form>
  );
}
