import React, { useState } from 'react';
import { createItem } from '../../services/inventoryClient';

export default function ItemCreateModal({ isOpen, onClose, onItemCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    min_stock: '',
    reorder_point: '',
    type: 'supply',
    sku: '',
    supplier: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    setError(null);

    const res = await createItem(formData);
    setSubmitting(false);

    if (res.ok) {
      onItemCreated(res.data?.item || res.data);
      onClose();
    } else {
      if (res.status === 403) {
        setError('Solo el dueño puede crear insumos.');
      } else {
        setError(res.error || 'Error al crear el insumo.');
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
          Nuevo Insumo
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          El stock inicial se creará en 0 y se ajustará mediante movimientos.
        </p>

        {error && (
          <div style={{ padding: '10px 12px', background: 'var(--error-soft)', border: '1px solid var(--error)', borderRadius: '10px', color: 'var(--error)', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="item-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Nombre del insumo *
            </label>
            <input
              id="item-name"
              type="text"
              required
              placeholder="Ej: Bondiola de Cerdo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="item-unit" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Unidad *
              </label>
              <input
                id="item-unit"
                type="text"
                required
                placeholder="kg, l, unidad"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              />
            </div>

            <div>
              <label htmlFor="item-type" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Tipo
              </label>
              <select
                id="item-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              >
                <option value="supply">Insumo</option>
                <option value="raw_material">Materia prima</option>
                <option value="retail">Venta directa</option>
                <option value="service">Servicio</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="item-min-stock" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Stock mínimo
              </label>
              <input
                id="item-min-stock"
                type="text"
                placeholder="Ej: 5.0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              />
            </div>

            <div>
              <label htmlFor="item-reorder-point" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Punto de reorden
              </label>
              <input
                id="item-reorder-point"
                type="text"
                placeholder="Ej: 8.0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                className="glass-input"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="item-sku" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              SKU (opcional)
            </label>
            <input
              id="item-sku"
              type="text"
              placeholder="Ej: PRD-BONDIOLA"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer' }}
            >
              {submitting ? 'Guardando...' : 'Crear Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
