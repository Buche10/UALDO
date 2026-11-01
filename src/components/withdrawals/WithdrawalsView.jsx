import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import { getWithdrawal } from '../../services/withdrawalsClient';
import { useWithdrawalsList } from '../../hooks/useWithdrawalsList';
import WithdrawalsList from './WithdrawalsList';
import WithdrawalForm from './WithdrawalForm';
import WithdrawalCloseForm from './WithdrawalCloseForm';
import WithdrawalCancelModal from './WithdrawalCancelModal';
import WithdrawalsViewHeader from './WithdrawalsViewHeader';
import WithdrawalsLoadMore from './WithdrawalsLoadMore';

export default function WithdrawalsView({ user, initialId }) {
  const canDeclare = can(user, ABILITIES.WITHDRAWALS_DECLARE);
  const canSupervise = can(user, ABILITIES.WITHDRAWALS_SUPERVISE);

  const [activeTab, setActiveTab] = useState('my');
  const [viewMode, setViewMode] = useState('list');
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null);

  const {
    withdrawals,
    loading,
    error,
    setError,
    hasMore,
    loadingMore,
    loadData,
    handleLoadMore,
  } = useWithdrawalsList();

  useEffect(() => {
    if (initialId) {
      getWithdrawal(initialId).then((res) => {
        if (res.ok && res.data) {
          const st = res.data.status;
          if (st === 'open' || st === 'escalated') {
            setActiveWithdrawal(res.data);
            setViewMode('close');
          } else {
            setError('Ese retiro ya se cerró o se canceló.');
          }
        }
      });
    }
  }, [initialId, setError]);

  if (viewMode === 'declare') {
    return (
      <WithdrawalForm
        user={user}
        onSuccess={() => {
          setViewMode('list');
          loadData();
        }}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  if (viewMode === 'close' && activeWithdrawal) {
    return (
      <WithdrawalCloseForm
        withdrawal={activeWithdrawal}
        user={user}
        onSuccess={() => {
          setViewMode('list');
          setActiveWithdrawal(null);
          loadData();
        }}
        onCancel={() => {
          setViewMode('list');
          setActiveWithdrawal(null);
        }}
      />
    );
  }

  const myWithdrawals = withdrawals.filter(
    (w) => Number(w.user_id || w.user?.id) === Number(user?.id)
  );

  const areaWithdrawals = withdrawals.filter((w) => {
    const isArea = !user?.area || user?.role === 'owner' || user?.role === 'admin' || w.to_location === user?.area;
    const isOpen = w.status === 'open' || w.status === 'escalated';
    return isArea && isOpen;
  });

  const displayedList = activeTab === 'my' ? myWithdrawals : areaWithdrawals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <WithdrawalsViewHeader
        loading={loading}
        canDeclare={canDeclare}
        canSupervise={canSupervise}
        activeTab={activeTab}
        myCount={myWithdrawals.length}
        areaCount={areaWithdrawals.length}
        onRefresh={loadData}
        onDeclare={() => setViewMode('declare')}
        onTabChange={setActiveTab}
      />

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando retiros...
        </div>
      ) : (
        <>
          <WithdrawalsList
            withdrawals={displayedList}
            currentUser={user}
            showAuthor={activeTab === 'area'}
            onCloseClick={(w) => {
              setActiveWithdrawal(w);
              setViewMode('close');
            }}
            onCancelClick={(w) => setCancelModalItem(w)}
          />

          <WithdrawalsLoadMore
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        </>
      )}

      {cancelModalItem && (
        <WithdrawalCancelModal
          withdrawal={cancelModalItem}
          user={user}
          onSuccess={() => {
            setCancelModalItem(null);
            loadData();
          }}
          onClose={() => setCancelModalItem(null)}
        />
      )}
    </div>
  );
}
