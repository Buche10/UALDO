import React from 'react';
import WithdrawalCard from './WithdrawalCard';

/**
 * Ordena los retiros poniendo abiertos y escalados primero, luego cerrados y cancelados,
 * ordenados por fecha descendente.
 */
function sortWithdrawals(list = []) {
  return [...list].sort((a, b) => {
    const aOpen = a.status === 'open' || a.status === 'escalated';
    const bOpen = b.status === 'open' || b.status === 'escalated';
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    const aTime = new Date(a.created_at || a.withdrawn_at || 0).getTime();
    const bTime = new Date(b.created_at || b.withdrawn_at || 0).getTime();
    return bTime - aTime;
  });
}

export default function WithdrawalsList({
  withdrawals = [],
  currentUser,
  showAuthor = false,
  onCloseClick,
  onCancelClick,
}) {
  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          borderRadius: '12px',
        }}
      >
        No hay retiros registrados.
      </div>
    );
  }

  const sorted = sortWithdrawals(withdrawals);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {sorted.map((item) => (
        <WithdrawalCard
          key={item.id}
          withdrawal={item}
          currentUser={currentUser}
          showAuthor={showAuthor}
          onCloseClick={onCloseClick}
          onCancelClick={onCancelClick}
        />
      ))}
    </div>
  );
}
