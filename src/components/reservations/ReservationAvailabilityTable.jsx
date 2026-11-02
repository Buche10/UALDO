import React from 'react';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { useReservationAvailability } from '../../hooks/useReservations';
import { formatQuantity } from '../../services/quantityFormat';
import { styles } from '../common/uiStyles';

/**
 * Insumos comprometidos por los platos de una reserva (Brief 39p).
 */
export default function ReservationAvailabilityTable({ reservation }) {
  const { rows, horizonDays, loading, error, reload } = useReservationAvailability(reservation);

  if ((reservation?.items || []).length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <PackageSearch size={15} color="var(--accent)" aria-hidden="true" />
        <span>Insumos comprometidos</span>
      </h4>

      {loading && <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>Consultando disponibilidad...</div>}
      {error && (
        <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={13} aria-hidden="true" />{error}</span>
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '9999px' }}>Reintentar</button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{ ...styles.card, fontSize: '12px', color: 'var(--text-muted)' }}>
          Los platos no tienen receta mapeada: no comprometen stock.
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: 'var(--chip-bg)', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Insumo</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Existencia</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Comprometido</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item_id} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-main)' }}>{row.name} <span style={{ color: 'var(--text-subtle)' }}>({row.unit})</span></td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatQuantity(row.stock)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatQuantity(row.committed)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>{formatQuantity(row.available)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {horizonDays !== null && (
        <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-subtle)' }}>
          El compromiso considera las reservas de los próximos {horizonDays} días.
        </p>
      )}
    </div>
  );
}
