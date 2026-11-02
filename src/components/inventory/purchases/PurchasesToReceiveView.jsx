import React, { useCallback, useState } from 'react';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { listPurchasesToReceive } from '../../../services/purchasesClient';
import { usePagedList } from '../../../hooks/usePagedList';
import { money, styles } from './purchaseUi';
import PurchaseReceiveDetail from './PurchaseReceiveDetail';

/**
 * Compras en borrador pendientes de recibir para jefes con purchases.receive
 * y sin purchases.manage (Brief 39p). Sin montos si falta inventory.costs.
 */
export default function PurchasesToReceiveView({ onBack, canSeeCosts = false }) {
  const [purchaseId, setPurchaseId] = useState(null);
  const fetchPage = useCallback((page) => listPurchasesToReceive({ page }), []);
  const list = usePagedList(fetchPage, { errorMessage: 'No se pudieron cargar las compras por recibir.' });
  const { items, loading, error, hasMore, loadMore, reload } = list;

  if (purchaseId) {
    return (
      <PurchaseReceiveDetail
        purchaseId={purchaseId}
        canSeeCosts={canSeeCosts}
        onBack={() => { setPurchaseId(null); reload(); }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageCheck size={18} color="var(--accent)" aria-hidden="true" />
          <span>Compras por recibir</span>
        </h2>
        <button type="button" onClick={onBack} style={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Inventario</span>
        </button>
      </div>

      <div aria-live="polite">
        {error && (
          <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
          </div>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div style={styles.muted}>Cargando compras por recibir...</div>
      ) : items.length === 0 && !error ? (
        <div style={styles.muted}>No hay compras pendientes de recibir.</div>
      ) : (
        items.map((purchase) => (
          <button
            key={purchase.id}
            type="button"
            onClick={() => setPurchaseId(purchase.id)}
            className="glass-card-interactive"
            style={{ ...styles.card, width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-main)' }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>{purchase.supplier?.name || 'Proveedor'}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {purchase.purchased_on}{purchase.invoice_number ? `, factura ${purchase.invoice_number}` : ''}
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {purchase.lines_count} {Number(purchase.lines_count) === 1 ? 'línea' : 'líneas'}
              </span>
            </span>
            {canSeeCosts && <span style={{ fontSize: '13px', fontWeight: 700 }}>{money(purchase.total)}</span>}
          </button>
        ))
      )}

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={loading} style={{ ...styles.secondary, color: 'var(--accent)', fontSize: '12px' }}>
          {loading ? 'Cargando más...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
