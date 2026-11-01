import React from 'react';
import { Sun, Thermometer, Snowflake } from 'lucide-react';
import { formatQuantity } from '../../services/quantityFormat';

export const STORAGE_MAP = {
  ambient: {
    label: 'Ambiente',
    icon: Sun,
    bg: 'var(--storage-ambient-bg)',
    color: 'var(--storage-ambient-color)',
  },
  refrigerated: {
    label: 'Refrigerado',
    icon: Thermometer,
    bg: 'var(--storage-refrigerated-bg)',
    color: 'var(--storage-refrigerated-color)',
  },
  frozen: {
    label: 'Congelado',
    icon: Snowflake,
    bg: 'var(--storage-frozen-bg)',
    color: 'var(--storage-frozen-color)',
  },
};

export function formatCategory(category) {
  if (!category || typeof category !== 'object') return null;
  const catName = category.name ? String(category.name).trim() : '';
  const famName = category.family?.name ? String(category.family.name).trim() : '';
  if (famName && catName) return `${famName} / ${catName}`;
  return catName || null;
}

export function renderLocationBreakdown(stockByLoc) {
  if (!stockByLoc || typeof stockByLoc !== 'object') return null;
  const dot = (
    <span
      style={{
        display: 'inline-block',
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        background: 'var(--text-subtle)',
        margin: '0 4px',
      }}
      aria-hidden="true"
    />
  );

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
      <span>Bodega {formatQuantity(stockByLoc.warehouse)}</span>
      {dot}
      <span>Cocina {formatQuantity(stockByLoc.kitchen)}</span>
      {dot}
      <span>Salón {formatQuantity(stockByLoc.lounge)}</span>
    </div>
  );
}
