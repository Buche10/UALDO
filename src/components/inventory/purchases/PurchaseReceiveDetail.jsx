import React, { useState } from 'react';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { usePurchaseActions, usePurchaseDetail } from '../../../hooks/usePurchaseActions';
import { formatQuantity } from '../../../services/quantityFormat';
import ReceivePurchaseDialog from './ReceivePurchaseDialog';
import { money, styles, unitCost } from './purchaseUi';

/**
 * Detalle de una compra por recibir (Brief 39p). Oculta montos sin
 * inventory.costs y ofrece el diálogo de recepción a purchases.receive.
 */
export default function PurchaseReceiveDetail({ purchaseId, canSeeCosts = false, onBack }) {
  const { purchase, loading, error, reload } = usePurchaseDetail(purchaseId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const actions = usePurchaseActions({
    purchaseId,
    onUpdated: () => {
      setDialogOpen(false);
      onBack();
    },
    onStale: reload,
  });

  if (loading && !purchase) return <div style={styles.muted}>Cargando la compra...</div>;

  if (!purchase) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} aria-hidden="true" /><span>Volver</span></button>
        <div aria-live="polite" style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{error || 'No se pudo cargar la compra.'}</span>
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} aria-hidden="true" /><span>Volver a compras por recibir</span></button>

      <div style={styles.card}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{purchase.supplier?.name || 'Proveedor'}</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
          {purchase.purchased_on}{purchase.invoice_number ? `. Factura ${purchase.invoice_number}` : ''}. {purchase.location_label || ''}
        </p>
        {purchase.notes && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{purchase.notes}</p>}
        {canSeeCosts && <p style={{ margin: '8px 0 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Total: {money(purchase.total)}</p>}
      </div>

      <div aria-live="polite">{actions.error && !dialogOpen && <div style={styles.errorBox}>{actions.error}</div>}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(purchase.lines || []).map((line) => (
          <div key={line.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{line.item_name || `Insumo ${line.item_id || ''}`}</div>
              <div style={{ color: 'var(--text-muted)' }}>
                {formatQuantity(line.quantity)} {line.unit}{canSeeCosts && line.unit_cost ? ` a ${unitCost(line.unit_cost)} c/u` : ''}
              </div>
            </div>
            {canSeeCosts && <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{money(line.line_total)}</div>}
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setDialogOpen(true)} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 18px', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <PackageCheck size={15} aria-hidden="true" />
        <span>Recibir</span>
      </button>

      <ReceivePurchaseDialog
        isOpen={dialogOpen}
        purchase={purchase}
        busy={Boolean(actions.busy)}
        error={actions.error}
        onClose={() => setDialogOpen(false)}
        onConfirm={(lines) => actions.receive(lines)}
      />
    </div>
  );
}
