import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useItemSearch } from '../../hooks/useItemSearch';
import { normalizeFactor } from '../../services/runfoodCatalogClient';

/**
 * Modal para seleccionar un insumo de Ualdo y definir su factor de conversión (Brief 24p).
 */
export default function RunfoodMappingEditModal({
  isOpen,
  mapping,
  onClose,
  onSave,
  submitting,
  error
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [factor, setFactor] = useState('1');
  const [localError, setLocalError] = useState(null);

  const { results, searching, failed } = useItemSearch(searchTerm);

  useEffect(() => {
    if (mapping) {
      setSelectedItem(mapping.inventory_item || mapping.suggested_inventory_item || null);
      setFactor(mapping.factor ? String(mapping.factor) : '1');
      setSearchTerm('');
      setLocalError(null);
    }
  }, [mapping]);

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

  const articleName = mapping.runfood_article?.descripcion || 'este artículo';
  const itemUnit = selectedItem?.unit || 'unidades';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-glow)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ minWidth: 0, paddingRight: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Asociar a insumo
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {articleName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{ padding: '6px', borderRadius: '9999px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {(error || localError) && (
            <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
              {localError || error}
            </div>
          )}

          {/* Insumo seleccionado */}
          {selectedItem ? (
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Insumo de Ualdo</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedItem.name} ({selectedItem.unit || 'unidad'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ padding: '4px 8px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            /* Buscador de insumos */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                Buscar insumo de Ualdo
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Escribe al menos 2 letras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--chip-bg)',
                    color: 'var(--text-main)',
                    fontSize: '13px'
                  }}
                />
              </div>

              {searching && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Buscando...</span>}
              {failed && <span style={{ fontSize: '11px', color: 'var(--error)' }}>Error al buscar insumos.</span>}

              {results.length > 0 && (
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '4px', background: 'var(--bg-card)' }}>
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setSelectedItem(r); setSearchTerm(''); }}
                      style={{ textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                      <span>{r.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{r.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campo Factor de conversión */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Factor de conversión
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
              placeholder="1.000000"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                background: 'var(--chip-bg)',
                color: 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 600
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Cuántas unidades de {itemUnit} equivalen a 1 unidad de RunFood de {articleName}.
            </span>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedItem}
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: submitting || !selectedItem ? 'default' : 'pointer', opacity: submitting || !selectedItem ? 0.6 : 1 }}
            >
              {submitting ? 'Guardando...' : 'Confirmar insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
