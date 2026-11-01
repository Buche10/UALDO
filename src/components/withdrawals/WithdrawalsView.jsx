import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import { listWithdrawals, getWithdrawal } from '../../services/withdrawalsClient';
import WithdrawalsList from './WithdrawalsList';
import WithdrawalForm from './WithdrawalForm';
import WithdrawalCloseForm from './WithdrawalCloseForm';
import WithdrawalCancelModal from './WithdrawalCancelModal';
import WithdrawalsViewHeader from './WithdrawalsViewHeader';

export default function WithdrawalsView({ user, initialId }) {
  const canDeclare = can(user, ABILITIES.WITHDRAWALS_DECLARE);
  const canSupervise = can(user, ABILITIES.WITHDRAWALS_SUPERVISE);

  const [activeTab, setActiveTab] = useState('my');
  const [viewMode, setViewMode] = useState('list');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeWithdrawal, setActiveWithdrawal] = useState(null);
  const [cancelModalItem, setCancelModalItem] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    const res = await listWithdrawals({ page: 1 });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar los retiros.');
      return;
    }
    const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setWithdrawals(data);
    const meta = res.data?.meta;
    setHasMore(Boolean(meta && meta.current_page < meta.last_page));
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await listWithdrawals({ page: nextPage });
    setLoadingMore(false);
    if (!res.ok) return;

    const newItems = Array.isArray(res.data) ? res.data : res.data?.data || [];
    setWithdrawals((prev) => {
      const existing = new Set(prev.map((w) => w.id));
      const unique = newItems.filter((w) => !existing.has(w.id));
      return [...prev, ...unique];
    });
    setPage(nextPage);
    const meta = res.data?.meta;
    setHasMore(Boolean(meta && meta.current_page < meta.last_page));
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  }, [initialId]);

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

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
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
          )}
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
