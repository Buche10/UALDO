import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePurchaseForm } from '../../../hooks/usePurchaseForm';
import { useSuppliers } from '../../../hooks/usePurchasesData';
import { INVENTORY_LOCATIONS } from '../../../services/inventoryLocations';
import PurchaseLinesEditor from './PurchaseLinesEditor';
import { styles } from './purchaseUi';

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>{label}</label>
      {children}
      <span aria-live="polite" style={styles.fieldError}>{error || null}</span>
    </div>
  );
}

/**
 * Alta de una compra en borrador (Brief 20p): proveedor activo, destino,
 * fecha, factura, notas y líneas con lo pagado.
 */
export default function PurchaseForm({ onBack, onCreated }) {
  const form = usePurchaseForm({ onCreated });
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const suppliers = useSuppliers({ search: supplierSearch });
  // El proveedor elegido sigue en la lista aunque cambie la búsqueda.
  const options = selected && !suppliers.items.some((s) => s.id === selected.id) ? [selected, ...suppliers.items] : suppliers.items;
  const { header, setField, errors, submitting } = form;

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}>
        <ArrowLeft size={16} />
        <span>Volver a compras</span>
      </button>
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Nueva compra</h3>

      <div aria-live="polite">
        {form.error && (
          <div style={styles.errorBox}>
            {form.error}
            {errors.lines && <div>{errors.lines}</div>}
          </div>
        )}
      </div>

      <Field id="purchase-supplier-search" label="Buscar proveedor" error={suppliers.error}>
        <input id="purchase-supplier-search" type="text" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder="Nombre del proveedor" style={styles.input} />
      </Field>

      <Field id="purchase-supplier" label="Proveedor" error={errors.supplier_id}>
        <select id="purchase-supplier" value={header.supplierId} onChange={(e) => { setField('supplierId', e.target.value); setSelected(options.find((s) => String(s.id) === e.target.value) || null); }} style={styles.input}>
          <option value="">{suppliers.loading ? 'Cargando proveedores...' : 'Elige el proveedor'}</option>
          {options.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </select>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Field id="purchase-location" label="Destino" error={errors.location}>
          <select id="purchase-location" value={header.location} onChange={(e) => setField('location', e.target.value)} style={styles.input}>
            {INVENTORY_LOCATIONS.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
          </select>
        </Field>
        <Field id="purchase-date" label="Fecha de compra" error={errors.purchased_on}>
          <input id="purchase-date" type="date" value={header.purchasedOn} onChange={(e) => setField('purchasedOn', e.target.value)} style={styles.input} />
        </Field>
      </div>

      <Field id="purchase-invoice" label="Factura (opcional)" error={errors.invoice_number}>
        <input id="purchase-invoice" type="text" maxLength={60} value={header.invoiceNumber} onChange={(e) => setField('invoiceNumber', e.target.value)} style={styles.input} />
      </Field>

      <Field id="purchase-notes" label="Notas (opcional)" error={errors.notes}>
        <textarea id="purchase-notes" rows={2} maxLength={500} value={header.notes} onChange={(e) => setField('notes', e.target.value)} style={{ ...styles.input, resize: 'vertical' }} />
      </Field>

      <PurchaseLinesEditor lines={form.lines} lineErrors={form.lineErrors} onAddItem={form.onAddItem} onChange={form.onChange} onRemove={form.onRemove} disabled={submitting} />

      <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
        {submitting ? 'Guardando...' : 'Guardar borrador'}
      </button>
    </form>
  );
}
