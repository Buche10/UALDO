import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { styles } from './purchaseUi';
import ItemSearch from './ItemSearch';

/**
 * Una línea leída de la factura, editable antes de confirmar (Brief 34ap).
 */
export default function InvoiceReviewLine({ line, index, onChange, onPickItem, onToggleOther, onRemove, onMarkReviewed, disabled }) {
  const baseId = `invoice-line-${index}`;
  const itemLabel = line.item_name || (line.item_id ? `Insumo #${line.item_id}` : 'Sin insumo');
  const reasons = Array.isArray(line.review_reasons) ? line.review_reasons : [];

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: line.needs_review && !line.reviewed ? '3px solid var(--warning)' : '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Línea {index + 1}: {line.description || 'Sin descripción'}</span>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {line.code ? `Código ${line.code}. ` : ''}Leído: {line.read_quantity || 'Sin cantidad'} {line.read_unit || ''} a {line.unit_price ? `USD ${line.unit_price}` : 'sin precio'} c/u.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {line.needs_review ? (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 700 }}>Revisar</span>
          ) : (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--success-soft)', color: 'var(--success)', fontWeight: 700 }}>Lista</span>
          )}
          {onRemove && (
            <button type="button" aria-label={`Quitar línea ${index + 1}`} onClick={() => onRemove(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '2px' }}>
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {line.needs_review && reasons.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--warning)' }}>
          {reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'var(--surface-soft)' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: line.is_other ? 'var(--accent)' : 'var(--text-main)' }}>
          {line.is_other ? 'Otras compras' : itemLabel}
        </span>
        <button type="button" onClick={() => onToggleOther(line.key)} disabled={disabled} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
          {line.is_other ? 'Usar insumo del catálogo' : 'Otras compras'}
        </button>
      </div>

      <ItemSearch
        inputId={`${baseId}-search`}
        label={`Buscar insumo para la línea ${index + 1}`}
        disabled={disabled}
        onPick={(item) => onPickItem(line.key, item)}
      />

      {line.is_other && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label htmlFor={`${baseId}-name`} style={styles.label}>Nombre</label>
            <input id={`${baseId}-name`} type="text" maxLength={120} value={line.free_text_name || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'free_text_name', e.target.value)} style={styles.input} />
          </div>
          <div>
            <label htmlFor={`${baseId}-unit`} style={styles.label}>Unidad</label>
            <input id={`${baseId}-unit`} type="text" maxLength={20} value={line.unit || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'unit', e.target.value)} style={styles.input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor={`${baseId}-note`} style={styles.label}>Motivo (obligatorio)</label>
            <input id={`${baseId}-note`} type="text" maxLength={255} value={line.note || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'note', e.target.value)} style={styles.input} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label htmlFor={`${baseId}-quantity`} style={styles.label}>Cantidad ({line.unit || 'unidad'})</label>
          <input id={`${baseId}-quantity`} type="text" inputMode="decimal" value={line.quantity} disabled={disabled} onChange={(e) => onChange(line.key, 'quantity', e.target.value)} style={styles.input} />
        </div>
        <div>
          <label htmlFor={`${baseId}-total`} style={styles.label}>Total (USD)</label>
          <input id={`${baseId}-total`} type="text" inputMode="decimal" value={line.line_total} disabled={disabled} onChange={(e) => onChange(line.key, 'line_total', e.target.value)} style={styles.input} />
        </div>
      </div>

      <div>
        <label htmlFor={`${baseId}-factor`} style={styles.label}>Factor de unidad (opcional)</label>
        <input id={`${baseId}-factor`} type="text" inputMode="decimal" placeholder="12" value={line.unit_factor || ''} disabled={disabled} onChange={(e) => onChange(line.key, 'unit_factor', e.target.value)} style={styles.input} />
        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Ejemplo: 1 caja = 12 unidades.</span>
      </div>

      {line.needs_review && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: line.reviewed ? 'var(--success)' : 'var(--text-main)', fontWeight: 600 }}>
          <input type="checkbox" checked={Boolean(line.reviewed)} disabled={disabled} onChange={(e) => onMarkReviewed(line.key, e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
          {line.reviewed ? <CheckCircle2 size={14} /> : null}
          <span>Revisé esta línea</span>
        </label>
      )}
    </div>
  );
}
