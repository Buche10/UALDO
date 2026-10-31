import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { normalizeFactor } from '../../services/runfoodCatalogClient';
import RunfoodItemPicker from './RunfoodItemPicker';
import RunfoodFactorInput from './RunfoodFactorInput';

/**
 * Modal para seleccionar un insumo de Ualdo y definir su factor de conversión (Brief 24p-fix).
 */
export default function RunfoodMappingEditModal({
  isOpen,
  mapping,
  onClose,
  onSave,
  submitting,
  error,
  fieldErrors = {},
  onClearErrors
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [factor, setFactor] = useState('1');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isOpen && mapping) {
      if (onClearErrors) onClearErrors();
      setSelectedItem(mapping.inventory_item || mapping.suggested_inventory_item || null);
      setFactor(mapping.factor ? String(mapping.factor) : '1');
      setLocalError(null);
    }
  }, [isOpen, mapping, onClearErrors]);

  if (!isOpen || !mapping) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem?.id) {
      setLocalError('Debes seleccionar un insumo.');
      return;
    }
    const norm = normalizeFactor(factor);
    if (!norm) {
      setLocalError('El factor debe ser mayor a 0 y hasta 100000 con máximo 6 decimales.');
      return;
    }

    setLocalError(null);
    onSave(mapping.id, {
      inventory_item_id: selectedItem.id,
      factor: norm
    });
  };

  const articleName = mapping.runfood_article?.descripcion || 'este ingrediente';
  const itemName = selectedItem?.name;
  const itemUnit = selectedItem?.unit || 'unidad';
  const hasFieldErrors = Boolean(fieldErrors?.factor?.length || fieldErrors?.inventory_item_id?.length);
  const generalError = localError || (!hasFieldErrors ? error : null);

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 9999 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)', border: '1px solid var(--border-glow)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ minWidth: 0, paddingRight: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
              Asociar a insumo
            </h3>
            <span style={{ fontSize: 12, color: 'var(--accent)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {articleName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{ padding: 6, borderRadius: 9999, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {generalError && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: 12 }}>
              {generalError}
            </div>
          )}

          {/* Selector de insumo */}
          <RunfoodItemPicker
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onClearItem={() => setSelectedItem(null)}
            fieldError={fieldErrors?.inventory_item_id?.[0]}
          />

          {/* Campo Factor de conversión */}
          <RunfoodFactorInput
            factor={factor}
            onChange={setFactor}
            fieldError={fieldErrors?.factor?.[0]}
            itemName={itemName}
            itemUnit={itemUnit}
            articleName={articleName}
          />

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '8px 14px', borderRadius: 9999, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedItem}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: submitting || !selectedItem ? 'default' : 'pointer', opacity: submitting || !selectedItem ? 0.6 : 1 }}
            >
              {submitting ? 'Guardando...' : 'Confirmar insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
