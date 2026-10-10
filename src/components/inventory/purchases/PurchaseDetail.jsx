import React, { useRef, useState } from 'react';
import { ArrowLeft, PackageCheck, XCircle, Pencil } from 'lucide-react';
import { usePurchaseActions, usePurchaseDetail } from '../../../hooks/usePurchaseActions';
import { useLinesState } from '../../../hooks/usePurchaseForm';
import { linesFromPurchase } from '../../../hooks/purchaseLines';
import { formatQuantity } from '../../../services/quantityFormat';
import ConfirmDialog from './ConfirmDialog';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import { money, purchaseLocation, statusLabel, styles, unitCost } from './purchaseUi';

const DIALOGS = {
  receive: {
    title: 'Recibir compra',
    message: 'Cada línea entra al stock de la ubicación de destino y se actualiza el costo promedio de cada insumo. No se puede deshacer.',
    confirmLabel: 'Recibir',
  },
  cancel: {
    title: 'Cancelar compra',
    message: 'El borrador se cancela y no cambia el stock. No se puede deshacer.',
    confirmLabel: 'Cancelar compra',
  },
};

function LinesEditMode({ purchase, actions, onDone }) {
  const state = useLinesState(linesFromPurchase(purchase));
  const [general, setGeneral] = useState(null);
  const save = async () => {
    const result = await actions.saveLines(state.lines);
    if (result.ok) onDone();
    else {
      state.setLineErrors(result.lineErrors);
      setGeneral(result.general);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div aria-live="polite">{general && <div style={styles.errorBox}>{general}</div>}</div>
      <PurchaseLinesEditor lines={state.lines} lineErrors={state.lineErrors} onAddItem={state.onAddItem} onChange={state.onChange} onRemove={state.onRemove} disabled={actions.busy === 'lines'} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={onDone} style={{ ...styles.secondary, flex: 1 }}>Descartar cambios</button>
        <button type="button" onClick={save} disabled={actions.busy === 'lines'} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
          {actions.busy === 'lines' ? 'Guardando...' : 'Guardar líneas'}
        </button>
      </div>
    </div>
  );
}

function LinesView({ purchase }) {
  return (purchase.lines || []).map((line) => (
    <div key={line.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{line.item_name || `Insumo ${line.item_id}`}</div>
        <div style={{ color: 'var(--text-muted)' }}>{formatQuantity(line.quantity)} {line.unit} a {unitCost(line.unit_cost)} c/u</div>
        {line.note && <div style={{ color: 'var(--text-muted)' }}>{line.note}</div>}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{money(line.line_total)}</div>
    </div>
  ));
}

/**
 * Cuerpo del detalle con las cifras del motor (Brief 20p). En borrador:
 * editar líneas, recibir y cancelar, cada una con confirmación propia.
 */
function PurchaseDetailBody({ purchase, onBack, onUpdated, onStale }) {
  const [dialog, setDialog] = useState(null);
  const [editing, setEditing] = useState(false);
  const receiveRef = useRef(null);
  const cancelRef = useRef(null);
  const headingRef = useRef(null);
  const actions = usePurchaseActions({
    purchaseId: purchase.id,
    onStale,
    onUpdated: (updated, action) => {
      setDialog(null);
      if (onUpdated) onUpdated(updated, action);
    },
  });
  const isDraft = purchase.status === 'draft';

  const open = (name) => { actions.clearError(); setDialog(name); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} /><span>Volver a compras</span></button>

      <div style={styles.card}>
        <h3 ref={headingRef} tabIndex={-1} style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{purchase.supplier?.name || 'Proveedor'}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
          {statusLabel(purchase.status)}. {purchase.purchased_on}. Destino: {purchaseLocation(purchase)}.
          {purchase.invoice_number ? ` Factura ${purchase.invoice_number}.` : ''}
        </p>
        {purchase.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{purchase.notes}</p>}
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 0 0' }}>Total: {money(purchase.total)}</p>
      </div>

      <div aria-live="polite">{actions.error && !dialog && <div style={styles.errorBox}>{actions.error}</div>}</div>

      {editing ? (
        <LinesEditMode purchase={purchase} actions={actions} onDone={() => setEditing(false)} />
      ) : (
        <LinesView purchase={purchase} />
      )}

      {isDraft && !editing && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setEditing(true)} style={{ ...styles.secondary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Pencil size={14} /><span>Editar líneas</span></button>
          <button ref={cancelRef} type="button" onClick={() => open('cancel')} style={{ ...styles.secondary, flex: 1, color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><XCircle size={14} /><span>Cancelar</span></button>
          <button ref={receiveRef} type="button" onClick={() => open('receive')} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PackageCheck size={14} /><span>Recibir</span></button>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(dialog)}
        {...(dialog ? DIALOGS[dialog] : {})}
        busy={Boolean(actions.busy)}
        error={actions.error}
        onClose={() => setDialog(null)}
        onConfirm={() => (dialog === 'receive' ? actions.receive() : actions.cancel())}
        triggerRef={dialog === 'receive' ? receiveRef : cancelRef}
        fallbackFocusRef={headingRef}
      />
    </div>
  );
}

/**
 * Detalle de una compra (Brief 20p). La lista del motor no trae las líneas,
 * así que el detalle se pide siempre al motor: sin eso, "Editar líneas"
 * empezaría vacío y al guardar borraría las líneas anteriores.
 */
export default function PurchaseDetail({ purchaseId, onBack, onSynced }) {
  const { purchase, setPurchase, loading, error, reload } = usePurchaseDetail(purchaseId);

  const handleUpdated = (updated, action) => {
    if (updated) setPurchase(updated);
    if (onSynced) onSynced(updated, action);
  };

  // Tras un 409 el motor tiene otro estado: se recarga y se avisa a la lista.
  const handleStale = async () => {
    const fresh = await reload();
    if (fresh && onSynced) onSynced(fresh, null);
  };

  if (loading && !purchase) return <div style={styles.muted}>Cargando la compra...</div>;
  if (!purchase) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} /><span>Volver a compras</span></button>
        <div aria-live="polite" style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{error}</span>
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>
        </div>
      </div>
    );
  }
  return <PurchaseDetailBody purchase={purchase} onBack={onBack} onUpdated={handleUpdated} onStale={handleStale} />;
}
