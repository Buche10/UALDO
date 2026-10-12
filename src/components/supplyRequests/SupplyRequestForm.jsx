import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSupplyRequestForm } from '../../hooks/useSupplyRequests';
import RequestItemsEditor from './RequestItemsEditor';
import { styles } from '../common/uiStyles';

/**
 * Nuevo pedido interno (Brief 22p): insumos del catálogo o en texto libre,
 * prioridad y nota. El dueño recibe el aviso en la app.
 */
export default function SupplyRequestForm({ onBack, onCreated }) {
  const form = useSupplyRequestForm({ onCreated });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} /><span>Volver a pedidos</span></button>
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Nuevo pedido</h3>

      <div aria-live="polite">
        {form.error && (
          <div style={styles.errorBox}>
            {form.error}
            {form.errors.items && <div>{form.errors.items}</div>}
          </div>
        )}
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-main)' }}>
        <input type="checkbox" role="switch" checked={form.priority === 'urgent'} onChange={(e) => form.setPriority(e.target.checked ? 'urgent' : 'normal')} style={{ accentColor: 'var(--primary)' }} />
        <span>Urgente</span>
      </label>

      <RequestItemsEditor
        items={form.items}
        itemErrors={form.itemErrors}
        onAddCatalog={form.addCatalog}
        onAddFree={form.addFree}
        onChange={form.change}
        onRemove={form.remove}
        disabled={form.submitting}
      />

      <div>
        <label htmlFor="request-note" style={styles.label}>Nota para el dueño (opcional)</label>
        <textarea id="request-note" rows={2} maxLength={500} value={form.note} onChange={(e) => form.setNote(e.target.value)} style={{ ...styles.input, resize: 'vertical' }} />
        <span aria-live="polite" style={styles.fieldError}>{form.errors.note || null}</span>
      </div>

      <button type="submit" disabled={form.submitting} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
        {form.submitting ? 'Enviando...' : 'Enviar pedido'}
      </button>
    </form>
  );
}
