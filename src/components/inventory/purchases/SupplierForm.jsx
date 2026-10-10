import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSupplierSave } from '../../../hooks/usePurchasesData';
import { styles } from './purchaseUi';

const FIELDS = [
  { name: 'name', label: 'Nombre', maxLength: 120 },
  { name: 'tax_id', label: 'RUC o cédula (opcional)', maxLength: 13, inputMode: 'numeric' },
  { name: 'contact_name', label: 'Contacto (opcional)', maxLength: 120 },
  { name: 'phone', label: 'Teléfono (opcional)', maxLength: 30, inputMode: 'tel' },
  { name: 'email', label: 'Correo (opcional)', maxLength: 150, inputMode: 'email' },
];

function initialValues(supplier) {
  return {
    name: supplier?.name || '',
    tax_id: supplier?.tax_id || '',
    contact_name: supplier?.contact_name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    notes: supplier?.notes || '',
    is_active: supplier ? Boolean(supplier.is_active) : true,
  };
}

/**
 * Alta o edición de un proveedor (Brief 20p). El nombre es único en el
 * negocio sin distinguir mayúsculas: el 422 aparece junto al nombre.
 */
export default function SupplierForm({ supplier, onBack, onSaved }) {
  const [values, setValues] = useState(() => initialValues(supplier));
  const { saving, errors, error, save } = useSupplierSave({ onSaved });
  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(supplier?.id, values); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} /><span>Volver a proveedores</span></button>
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{supplier ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>

      <div aria-live="polite">{error && <div style={styles.errorBox}>{error}</div>}</div>

      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={`supplier-${field.name}`} style={styles.label}>{field.label}</label>
          <input id={`supplier-${field.name}`} type="text" inputMode={field.inputMode} maxLength={field.maxLength} value={values[field.name]} onChange={(e) => setValue(field.name, e.target.value)} style={styles.input} />
          <span aria-live="polite" style={styles.fieldError}>{errors[field.name] || null}</span>
        </div>
      ))}

      <div>
        <label htmlFor="supplier-notes" style={styles.label}>Notas (opcional)</label>
        <textarea id="supplier-notes" rows={2} maxLength={500} value={values.notes} onChange={(e) => setValue('notes', e.target.value)} style={{ ...styles.input, resize: 'vertical' }} />
      </div>

      {supplier && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-main)' }}>
          <input type="checkbox" role="switch" checked={values.is_active} onChange={(e) => setValue('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
          <span>Activo (los inactivos no aparecen en compras nuevas)</span>
        </label>
      )}

      <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}>
        {saving ? 'Guardando...' : 'Guardar proveedor'}
      </button>
    </form>
  );
}
