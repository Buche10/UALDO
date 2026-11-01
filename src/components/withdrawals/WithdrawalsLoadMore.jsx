import React from 'react';

export default function WithdrawalsLoadMore({ hasMore, loadingMore, onLoadMore }) {
  if (!hasMore) return null;

  return (
    <button
      type="button"
      onClick={onLoadMore}
      disabled={loadingMore}
      className="btn-secondary"
      style={{
        alignSelf: 'center',
        padding: '8px 20px',
        borderRadius: '9999px',
        border: '1px solid var(--border-glass)',
        background: 'var(--surface-soft)',
        color: 'var(--text-main)',
        fontSize: '12px',
        fontWeight: 500,
        cursor: loadingMore ? 'not-allowed' : 'pointer',
      }}
    >
      {loadingMore ? 'Cargando...' : 'Ver más'}
    </button>
  );
}
