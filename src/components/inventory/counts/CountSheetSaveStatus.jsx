import React, { useEffect, useState } from 'react';

const REFRESH_MS = 30000;

function formatSavedAgo(lastSavedTime, now) {
  if (!lastSavedTime) return 'Guardado';
  const diffSec = Math.max(0, Math.floor((now - lastSavedTime.getTime()) / 1000));
  const min = Math.floor(diffSec / 60);
  if (min < 1) return 'Guardado hace un momento';
  return min === 1 ? 'Guardado hace 1 min' : `Guardado hace ${min} min`;
}

function statusLabel(saveStatus, saveErrorMessage, lastSavedTime, now) {
  if (saveStatus === 'saving') return 'Guardando avance...';
  if (saveStatus === 'dirty') return 'Cambios sin guardar';
  if (saveStatus === 'invalid') return 'Hay cantidades por corregir';
  if (saveStatus === 'error') return saveErrorMessage || 'Error al guardar';
  return formatSavedAgo(lastSavedTime, now);
}

function statusColors(saveStatus) {
  if (saveStatus === 'dirty' || saveStatus === 'invalid') return { background: 'var(--warning-soft)', color: 'var(--warning)' };
  if (saveStatus === 'error') return { background: 'var(--error-soft)', color: 'var(--error)' };
  return { background: 'var(--chip-bg)', color: 'var(--accent)' };
}

/**
 * Estado del guardado de la planilla, siempre visible. "Guardado hace N min"
 * se recalcula cada 30 segundos.
 */
export default function CountSheetSaveStatus({ saveStatus, saveErrorMessage, lastSavedTime }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="status"
      aria-live="polite"
      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, ...statusColors(saveStatus) }}
    >
      {statusLabel(saveStatus, saveErrorMessage, lastSavedTime, now)}
    </span>
  );
}
