import React from 'react';

export default function RequestItemFlags({ item }) {
  if (!Array.isArray(item?.flags) || item.flags.length === 0) return null;
  const badges = [];

  if (item.flags.includes('excede_base')) {
    const baseVal = item.base_quantity !== null && item.base_quantity !== undefined ? item.base_quantity : item.base;
    const formatted = baseVal !== undefined && baseVal !== null ? `${baseVal} ${item.unit || ''}`.trim() : '';
    badges.push(
      <span
        key="excede_base"
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'var(--surface-soft)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        {formatted ? `Excede la base (${formatted})` : 'Excede la base'}
      </span>
    );
  }

  if (item.flags.includes('stock_suficiente')) {
    badges.push(
      <span
        key="stock_suficiente"
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'var(--surface-soft)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        Hay stock
      </span>
    );
  }

  if (badges.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
      {badges}
    </div>
  );
}
