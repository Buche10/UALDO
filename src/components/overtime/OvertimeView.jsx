import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, PlusCircle, List, BarChart3, CheckSquare } from 'lucide-react';
import { can, canAny, ABILITIES } from '../../services/permissions';
import { pendingOvertimeCount } from '../../services/overtimeClient';
import OvertimeForm from './OvertimeForm';
import OvertimeList from './OvertimeList';
import OvertimeSummary from './OvertimeSummary';

export default function OvertimeView({
  user,
  initialMonth,
  initialStatus,
  onBack,
}) {
  const canApprove = can(user, ABILITIES.OVERTIME_APPROVE);
  const canRegister = canAny(user, [
    ABILITIES.OVERTIME_REGISTER_KITCHEN,
    ABILITIES.OVERTIME_REGISTER_LOUNGE,
    ABILITIES.OVERTIME_REPORT,
  ]);
  const canReport = can(user, ABILITIES.OVERTIME_REPORT);

  const [pendingCount, setPendingCount] = useState(0);
  const [tabTouched, setTabTouched] = useState(false);

  const determineDefaultTab = () => {
    if (initialStatus === 'pending' && canApprove) return 'por_aprobar';
    if (initialMonth && canReport) return 'mes';
    if (canRegister) return 'registrar';
    return 'registros';
  };

  const [activeTab, setActiveTab] = useState(determineDefaultTab);

  const refreshPendingCount = useCallback(async () => {
    if (!canApprove) return;
    try {
      const res = await pendingOvertimeCount();
      if (res.ok) {
        const count = res.data?.count ?? res.count ?? 0;
        setPendingCount(count);
        if (count > 0 && !initialMonth && !tabTouched && initialStatus !== 'registros') {
          setActiveTab('por_aprobar');
        }
      }
    } catch {
      // Silencioso ante errores de red transitorios
    }
  }, [canApprove, initialMonth, tabTouched, initialStatus]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const handleTabChange = (tab) => {
    setTabTouched(true);
    setActiveTab(tab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={22} color="var(--accent)" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            Horas extra
          </h2>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Pestañas de horas extra"
        style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--surface-soft)',
          padding: '4px',
          borderRadius: '10px',
        }}
      >
        {canApprove && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'por_aprobar'}
            onClick={() => handleTabChange('por_aprobar')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'por_aprobar' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'por_aprobar' ? 'var(--on-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'por_aprobar' ? 600 : 400,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckSquare size={14} />
            <span>Por aprobar{pendingCount > 0 ? ` (${pendingCount})` : ''}</span>
          </button>
        )}

        {canRegister && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'registrar'}
            onClick={() => handleTabChange('registrar')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'registrar' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'registrar' ? 'var(--on-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'registrar' ? 600 : 400,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle size={14} />
            <span>Registrar</span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'registros'}
          onClick={() => handleTabChange('registros')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'registros' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'registros' ? 'var(--on-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'registros' ? 600 : 400,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <List size={14} />
          <span>Registros</span>
        </button>

        {canReport && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mes'}
            onClick={() => handleTabChange('mes')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'mes' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'mes' ? 'var(--on-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'mes' ? 600 : 400,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <BarChart3 size={14} />
            <span>Mes</span>
          </button>
        )}
      </div>

      {activeTab === 'por_aprobar' && canApprove && (
        <OvertimeList
          user={user}
          fixedStatus="pending"
          onDecided={refreshPendingCount}
        />
      )}

      {activeTab === 'registrar' && canRegister && (
        <OvertimeForm
          user={user}
          onRegistered={() => {
            refreshPendingCount();
            handleTabChange('registros');
          }}
        />
      )}

      {activeTab === 'registros' && (
        <OvertimeList
          user={user}
          onDecided={refreshPendingCount}
        />
      )}

      {activeTab === 'mes' && canReport && <OvertimeSummary initialMonth={initialMonth} />}
    </div>
  );
}
