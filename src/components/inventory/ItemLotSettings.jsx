import React, { useEffect, useRef, useState } from 'react';
import { Tags, AlertCircle } from 'lucide-react';
import { getUser } from '../../services/auth';
import { can, ABILITIES } from '../../services/permissions';
import { setRequiresLot } from '../../services/lotsClient';
import ConfirmDialog from '../common/ConfirmDialog';

const ACTIVATE_MESSAGE = 'Se creará un lote inicial con el stock actual.';
const DEACTIVATE_MESSAGE = 'Solo se puede desactivar si no hay lotes activos. El stock actual se conserva.';

/** Casilla de control por lotes en la ficha del insumo (solo settings.manage). */
export default function ItemLotSettings({ item, onSaved }) {
  const currentUser = getUser();
  const canManage = can(currentUser, ABILITIES.SETTINGS_MANAGE);
  const [checked, setChecked] = useState(Boolean(item?.requires_lot));
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const checkboxRef = useRef(null);

  useEffect(() => {
    setChecked(Boolean(item?.requires_lot));
  }, [item?.id, item?.requires_lot]);

  if (!canManage || !item?.id) return null;

  const handleChange = (event) => {
    const next = event.target.checked;
    if (next === checked) return;
    setError(null);
    setPending(next);
  };

  const handleConfirm = async () => {
    if (pending === null || busy) return;
    setBusy(true);
    setError(null);
    const res = await setRequiresLot(item.id, pending);
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.message || res.error || 'No se pudo cambiar el control por lotes.');
      return;
    }
    const updated = res.data?.data || res.data || {};
    setChecked(pending);
    setPending(null);
    if (onSaved) onSaved({ ...item, ...updated });
  };

  return (
    <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={`item-lot-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
        <input
          ref={checkboxRef}
          id={`item-lot-${item.id}`}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
        />
        <Tags size={14} color="var(--accent)" />
        <span>Controlar por lotes (solo carnes)</span>
      </label>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Cada recepción crea un código para escribir en la funda.
      </span>
      <div aria-live="polite">
        {error && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--error)' }}>
            <AlertCircle size={13} />
            <span>{error}</span>
          </span>
        )}
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        title={pending ? 'Controlar por lotes' : 'Dejar de controlar por lotes'}
        message={pending ? ACTIVATE_MESSAGE : DEACTIVATE_MESSAGE}
        confirmLabel={pending ? 'Activar' : 'Desactivar'}
        busy={busy}
        error={error}
        onClose={() => { if (!busy) { setPending(null); setError(null); } }}
        onConfirm={handleConfirm}
        triggerRef={checkboxRef}
      />
    </div>
  );
}
