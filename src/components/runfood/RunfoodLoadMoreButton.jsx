import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Botón para cargar más registros paginados (Brief 24p-fix).
 */
export default function RunfoodLoadMoreButton({ hasMore, loading, onLoadMore }) {
  if (!hasMore) return null;

  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={loading}
      style={{
        marginTop: 6,
        padding: '10px 16px',
        borderRadius: 9999,
        border: '1px solid var(--border-glass)',
        background: 'var(--chip-bg)',
        color: 'var(--text-main)',
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.7 : 1
      }}
    >
      <ChevronDown size={14} />
      <span>{loading ? 'Cargando más...' : 'Cargar más'}</span>
    </button>
  );
}
