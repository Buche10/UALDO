import React, { useRef, useState } from 'react';
import { ArrowLeft, PackageCheck, XCircle, Pencil } from 'lucide-react';
import { getUser } from '../../../services/auth';
import { can, ABILITIES } from '../../../services/permissions';
import { usePurchaseActions, usePurchaseDetail } from '../../../hooks/usePurchaseActions';
import { useLinesState } from '../../../hooks/usePurchaseForm';
import { linesFromPurchase } from '../../../hooks/purchaseLines';
import { formatQuantity } from '../../../services/quantityFormat';
import ConfirmDialog from '../../common/ConfirmDialog';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import ReceivePurchaseDialog from './ReceivePurchaseDialog';
import LotCodesDialog from '../../lots/LotCodesDialog';
import PurchaseIssuesSection from './PurchaseIssuesSection';
import { money, purchaseLocation, statusLabel, styles, unitCost } from './purchaseUi';

const CANCEL_DIALOG = {
  title: 'Cancelar compra',
  message: 'El borrador se cancela y no cambia el stock. No se puede deshacer.',
  confirmLabel: 'Cancelar compra',
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
      <PurchaseLinesEditor lines={state.lines} lineErrors={state.lineErrors} onAddItem={state.onAddItem} onAddOther={state.onAddOther} onChange={state.onChange} onRemove={state.onRemove} disabled={actions.busy === 'lines'} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{line.item_name || `Insumo ${line.item_id}`}</span>
          {line.is_other && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '9999px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', color: 'var(--accent)', fontWeight: 600 }}>
              Otras compras
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {formatQuantity(line.quantity)} {line.unit} {!line.is_other && line.unit_cost ? `a ${unitCost(line.unit_cost)} c/u` : ''}
        </div>
        {line.note && <div style={{ color: 'var(--text-muted)' }}>{line.note}</div>}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{money(line.line_total)}</div>
    </div>
  ));
}

function PurchaseDetailBody({ purchase, onBack, onUpdated, onStale }) {
  const [dialog, setDialog] = useState(null);
  const [lotCodes, setLotCodes] = useState([]);
  const [editing, setEditing] = useState(false);
  const receiveRef = useRef(null);
  const cancelRef = useRef(null);
  const headingRef = useRef(null);

  const currentUser = getUser();
  const canReceive = !currentUser || can(currentUser, ABILITIES.PURCHASES_RECEIVE);
  const canManage = !currentUser || can(currentUser, ABILITIES.PURCHASES_MANAGE);

  const actions = usePurchaseActions({
    purchaseId: purchase.id,
    onStale,
    onUpdated: (updated, action) => {
      if (action !== 'receive') setDialog(null);
      if (onUpdated) onUpdated(updated, action);
    },
  });
  const isDraft = purchase.status === 'draft';
  const hasIssues = purchase.status === 'received_with_issues';

  const handleReceive = async (lines) => {
    const result = await actions.receive(lines);
    if (!result.ok) return;
    const receivedLots = result.data?.lots || result.data?.data?.lots || [];
    setLotCodes(receivedLots);
    setDialog(receivedLots.length > 0 ? 'lots' : null);
  };

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

      {hasIssues && <PurchaseIssuesSection purchase={purchase} onReload={onStale} />}

      {editing ? (
        <LinesEditMode purchase={purchase} actions={actions} onDone={() => setEditing(false)} />
      ) : (
        <LinesView purchase={purchase} />
      )}

      {isDraft && !editing && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canManage && (
            <button type="button" onClick={() => setEditing(true)} style={{ ...styles.secondary, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Pencil size={14} /><span>Editar líneas</span></button>
          )}
          {canManage && (
            <button ref={cancelRef} type="button" onClick={() => { actions.clearError(); setDialog('cancel'); }} style={{ ...styles.secondary, flex: 1, color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><XCircle size={14} /><span>Cancelar</span></button>
          )}
          {canReceive && (
            <button ref={receiveRef} type="button" onClick={() => { actions.clearError(); setDialog('receive'); }} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><PackageCheck size={14} /><span>Recibir</span></button>
          )}
        </div>
      )}

      <ReceivePurchaseDialog
        isOpen={dialog === 'receive'}
        purchase={purchase}
        busy={Boolean(actions.busy)}
        error={actions.error}
        onClose={() => setDialog(null)}
        onConfirm={handleReceive}
      />

      <LotCodesDialog
        isOpen={dialog === 'lots'}
        purchase={purchase}
        lots={lotCodes}
        onDone={() => setDialog(null)}
      />

      <ConfirmDialog
        isOpen={dialog === 'cancel'}
        {...CANCEL_DIALOG}
        busy={Boolean(actions.busy)}
        error={actions.error}
        onClose={() => setDialog(null)}
        onConfirm={() => actions.cancel()}
        triggerRef={cancelRef}
        fallbackFocusRef={headingRef}
      />
    </div>
  );
}

export default function PurchaseDetail({ purchaseId, onBack, onSynced }) {
  const { purchase, setPurchase, loading, error, reload } = usePurchaseDetail(purchaseId);

  const handleUpdated = (updated, action) => {
    if (updated) setPurchase(updated);
    if (onSynced) onSynced(updated, action);
  };

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
