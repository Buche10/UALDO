import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useValuation } from '../../../hooks/usePurchasesData';
import { INVENTORY_LOCATIONS } from '../../../services/inventoryLocations';
import { money, styles } from './purchaseUi';

/**
 * Valor del inventario a costo promedio, por ubicación y total (Brief 20p).
 * Todas las cifras vienen del motor.
 */
export default function ValuationPanel() {
  const { valuation, loading, error, reload } = useValuation();

  if (loading) return <div style={styles.muted}>Calculando el valor del inventario...</div>;

  if (error || !valuation) {
    return (
      <div aria-live="polite" style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span>{error || 'Sin datos de valorización.'}</span>
        <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
      </div>
    );
  }

  const withoutCost = Number(valuation.items_without_cost) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={styles.card}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Valor total del inventario</div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>{money(valuation.total)}</div>
      </div>

      {INVENTORY_LOCATIONS.map((loc) => {
        const row = valuation.by_location?.[loc.value];
        return (
          <div key={loc.value} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-main)' }}>
            <span>{row?.label || loc.label}</span>
            <strong>{money(row?.total)}</strong>
          </div>
        );
      })}

      {withoutCost > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--warning)' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            {withoutCost === 1 ? 'Hay 1 insumo con stock sin costo' : `Hay ${withoutCost} insumos con stock sin costo`}: no suman valor hasta su primera compra recibida.
          </span>
        </div>
      )}
    </div>
  );
}
