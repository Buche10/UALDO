import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSupplyRequestActions, useSupplyRequestDetail } from '../../hooks/useSupplyRequests';
import ConfirmDialog from '../common/ConfirmDialog';
import { styles } from '../common/uiStyles';
import { formatDateTime, quantityWithUnit, requesterName, statusLabel, availableActions } from './requestUi';
import SupplyRequestQuantityFields, { validateApproveQuantities } from './SupplyRequestQuantityFields';
import RequestItemFlags from './RequestItemFlags';

export { availableActions };

const DIALOGS = {
  approve: { title: 'Aprobar pedido', message: 'El pedido pasa a la lista de compras.', confirmLabel: 'Aprobar', label: 'Aprobar', note: 'Nota para quien pidió (opcional)' },
  reject: { title: 'Rechazar pedido', message: 'Quien pidió recibe el motivo en la app.', confirmLabel: 'Rechazar', label: 'Rechazar', note: 'Motivo del rechazo' },
  purchased: { title: 'Marcar comprado', message: 'El pedido sale de la lista de compras. El stock entra al recibir la compra.', confirmLabel: 'Marcar comprado', label: 'Marcar comprado' },
  received: { title: 'Marcar recibido', message: 'El pedido queda cerrado como recibido.', confirmLabel: 'Marcar recibido', label: 'Marcar recibido' },
  cancel: { title: 'Cancelar pedido', message: 'El pedido se cancela. No se puede deshacer.', confirmLabel: 'Cancelar pedido', label: 'Cancelar' },
};

/** Acciones que avanzan el pedido: botón principal. Rechazar y cancelar, secundario en rojo. */
const PRIMARY = new Set(['approve', 'purchased', 'received']);

const NOTICES = { approve: 'Pedido aprobado.', reject: 'Pedido rechazado.', purchased: 'Pedido marcado como comprado.', received: 'Pedido marcado como recibido.', cancel: 'Pedido cancelado.' };

/** Fechas del pedido en el orden del flujo; solo se muestran las que el motor envió. */
const DATES = [['created_at', 'Pedido'], ['decided_at', 'Decisión'], ['purchased_at', 'Comprado'], ['received_at', 'Recibido']];

function RequestDates({ request }) {
  const rows = DATES.map(([key, label]) => [label, formatDateTime(request[key])]).filter(([, value]) => value);
  return (
    <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
      {rows.map(([label, value]) => (
        <React.Fragment key={label}><dt style={{ fontWeight: 600 }}>{label}</dt><dd style={{ margin: 0 }}>{value}</dd></React.Fragment>
      ))}
    </dl>
  );
}

function RequestSummary({ request, headingRef }) {
  return (
    <div style={styles.card}>
      <h3 ref={headingRef} tabIndex={-1} style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Pedido de {requesterName(request)}</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{statusLabel(request.status)}{request.priority === 'urgent' ? ', urgente' : ''}</p>
      <RequestDates request={request} />
      {request.note && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{request.note}</p>}
      {request.decision_note && <p style={{ fontSize: '12px', color: 'var(--warning)', margin: '4px 0 0 0' }}>Respuesta del dueño: {request.decision_note}</p>}
    </div>
  );
}

function RequestItems({ items }) {
  return (items || []).map((item) => (
    <div key={item.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name || item.free_text_name}{item.inventory_item_id ? '' : ' (texto libre)'}</div>
        <RequestItemFlags item={item} />
        {item.note && <div style={{ color: 'var(--text-muted)' }}>{item.note}</div>}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{quantityWithUnit(item.quantity, item.unit)}</div>
    </div>
  ));
}

function ActionButtons({ actions, triggers, onOpen }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {actions.map((action) => (
        <button key={action} ref={(el) => { triggers.current[action] = el; }} type="button" onClick={() => onOpen(action)} className={PRIMARY.has(action) ? 'btn-primary' : undefined} style={PRIMARY.has(action) ? { flex: 1, padding: '10px', borderRadius: '9999px', fontWeight: 600 } : { ...styles.secondary, flex: 1, color: 'var(--error)' }}>
          {DIALOGS[action].label}
        </button>
      ))}
    </div>
  );
}

function RequestBody({ request, canDecide = false, userId, onBack, onUpdated, onStale }) {
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const headingRef = useRef(null);
  const noteRef = useRef(null);
  const triggers = useRef({});
  const dialogTriggerRef = useRef(null);

  const handleStale = async () => {
    setDialog(null);
    await onStale();
    headingRef.current?.focus();
  };
  const actions = useSupplyRequestActions({ requestId: request.id, onStale: handleStale, onUpdated: (updated, action) => { setDialog(null); onUpdated(updated, NOTICES[action]); } });
  const open = (action) => {
    actions.clearError();
    setNote('');
    setItemQuantities({});
    setItemErrors({});
    setSubmittedIds(new Set());
    dialogTriggerRef.current = triggers.current[action];
    setDialog(action);
  };
  const config = dialog ? DIALOGS[dialog] : null;

  const handleQuantityChange = (id, val) => {
    setItemQuantities((prev) => ({ ...prev, [id]: val }));
    if (itemErrors[id]) setItemErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== String(id))));
    if (submittedIds.has(id)) setSubmittedIds((prev) => new Set([...prev].filter((x) => x !== id)));
  };

  const handleConfirm = () => {
    let itemsPayload;
    if (dialog === 'approve') {
      const { valid, errors, list, sentIds } = validateApproveQuantities(itemQuantities);
      if (!valid) {
        setItemErrors(errors);
        return;
      }
      setItemErrors({});
      setSubmittedIds(sentIds);
      if (list.length > 0) itemsPayload = list;
    }
    actions.run(dialog, note, itemsPayload);
  };

  const undefinedItems = (request.items || []).filter((it) => it.quantity === null || it.quantity === undefined || it.quantity === '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} aria-hidden="true" /><span>Volver a pedidos</span></button>
      <RequestSummary request={request} headingRef={headingRef} />
      <div aria-live="polite">{actions.error && !dialog && <div style={styles.errorBox}>{actions.error}</div>}</div>
      <RequestItems items={request.items} />
      <ActionButtons actions={availableActions(request, { canDecide, userId })} triggers={triggers} onOpen={open} />
      <ConfirmDialog
        isOpen={Boolean(dialog)} title={config?.title} message={config?.message} confirmLabel={config?.confirmLabel}
        busy={Boolean(actions.busy)} error={dialog === 'approve' && undefinedItems.length > 0 ? null : actions.error} onClose={() => setDialog(null)} onConfirm={handleConfirm}
        triggerRef={dialogTriggerRef} fallbackFocusRef={headingRef} initialFocusRef={config?.note ? noteRef : undefined}
      >
        {dialog === 'approve' && undefinedItems.length > 0 && (
          <SupplyRequestQuantityFields
            items={undefinedItems}
            values={itemQuantities}
            errors={itemErrors}
            submittedIds={submittedIds}
            serverError={actions.error}
            onChange={handleQuantityChange}
          />
        )}
        {config?.note && (
          <div>
            <label htmlFor="request-decision-note" style={styles.label}>{config.note}</label>
            <textarea id="request-decision-note" ref={noteRef} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

function LoadError({ error, retryable, onBack, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} aria-hidden="true" /><span>Volver a pedidos</span></button>
      <div aria-live="polite" style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span>{error}</span>
        {retryable && <button type="button" onClick={onRetry} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>Reintentar</button>}
      </div>
    </div>
  );
}

export default function SupplyRequestDetail({ requestId, canDecide = false, userId, onBack, onSynced }) {
  const { request, setRequest, loading, error, retryable, reload } = useSupplyRequestDetail(requestId);

  const handleUpdated = (updated, notice) => {
    if (updated) setRequest(updated);
    if (onSynced) onSynced(updated, notice);
  };
  const handleStale = async () => {
    const fresh = await reload();
    if (fresh && onSynced) onSynced(fresh, null);
  };

  if (loading && !request) return <div style={styles.muted}>Cargando el pedido...</div>;
  if (!request) return <LoadError error={error} retryable={retryable} onBack={onBack} onRetry={reload} />;
  return (
    <>
      <div aria-live="polite">{error && <div style={{ ...styles.errorBox, marginBottom: '10px' }}>No se pudo cargar el estado actual: {error}</div>}</div>
      <RequestBody request={request} canDecide={canDecide} userId={userId} onBack={onBack} onUpdated={handleUpdated} onStale={handleStale} />
    </>
  );
}
