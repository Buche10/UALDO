import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Aviso cuando la foto parcial de ventas de hoy tiene más de una hora (Brief 27p / 28p_fix2).
 */
export default function SalesStaleNotice({ isStale }) {
  if (!isStale) return null;

  return (
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
  );
}
