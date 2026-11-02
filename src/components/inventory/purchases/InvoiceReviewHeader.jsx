import React, { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useSuppliers } from '../../../hooks/usePurchasesData';
import SupplierForm from './SupplierForm';
import { money, styles } from './purchaseUi';

/**
 * Cabecera de la factura: proveedor, datos leídos y motivos de revisión
 * (Brief 34ap).
 */
export default function InvoiceReviewHeader({ extraction, supplier, onSupplierChange, headerReviewed, onHeaderReviewedChange, disabled }) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const suppliers = useSuppliers({ search });
  const options = supplier && !suppliers.items.some((known) => known.id === supplier.id)
    ? [supplier, ...suppliers.items]
    : suppliers.items;
  const reasons = Array.isArray(extraction.header_review_reasons) ? extraction.header_review_reasons : [];

  if (creating) {
    return (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <SupplierForm
          prefill={{ name: extraction.supplier_name, tax_id: extraction.supplier_tax_id }}
          backLabel="Volver a la factura"
          onBack={() => setCreating(false)}
          onSaved={(saved) => { setCreating(false); onSupplierChange(saved); }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Proveedor de la factura</p>
        <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          {extraction.supplier_name || 'Sin nombre'} {extraction.supplier_tax_id ? `(${extraction.supplier_tax_id})` : ''}
        </p>
      </div>

      <div>
        <label htmlFor="invoice-supplier-search" style={styles.label}>Buscar proveedor</label>
        <input id="invoice-supplier-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o RUC" style={styles.input} />
      </div>

      <div>
        <label htmlFor="invoice-supplier" style={styles.label}>Proveedor</label>
        <select id="invoice-supplier" value={supplier?.id ?? ''} disabled={disabled} onChange={(e) => onSupplierChange(options.find((known) => String(known.id) === e.target.value) || null)} style={styles.input}>
          <option value="">{suppliers.loading ? 'Cargando proveedores...' : 'Elige el proveedor'}</option>
          {options.map((known) => <option key={known.id} value={known.id}>{known.name}</option>)}
        </select>
        <span aria-live="polite" style={styles.fieldError}>{suppliers.error || null}</span>
      </div>

      <button type="button" onClick={() => setCreating(true)} disabled={disabled} className="btn-secondary" style={{ ...styles.secondary, alignSelf: 'flex-start', padding: '7px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} color="var(--accent)" />
        <span>Crear proveedor</span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-main)' }}>
        <span><strong>Número:</strong> {extraction.invoice_number || 'Sin dato'}</span>
        <span><strong>Fecha:</strong> {extraction.invoice_date || 'Sin dato'}</span>
        <span><strong>Total:</strong> {money(extraction.total)}</span>
        <span><strong>IVA:</strong> {money(extraction.tax)}</span>
      </div>

      {reasons.length > 0 && (
        <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--warning-soft, var(--surface-soft))', color: 'var(--text-main)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
            <AlertTriangle size={14} color="var(--warning, var(--accent))" />
            <span>Motivos para revisar la cabecera</span>
          </span>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
            {reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
            <input type="checkbox" checked={headerReviewed} disabled={disabled} onChange={(e) => onHeaderReviewedChange(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            <span>Revisé la cabecera</span>
          </label>
        </div>
      )}
    </div>
  );
}
