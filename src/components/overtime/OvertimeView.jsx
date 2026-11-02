import React, { useState } from 'react';
import { ArrowLeft, Clock, PlusCircle, List, BarChart3 } from 'lucide-react';
import { can, canAny, ABILITIES } from '../../services/permissions';
import OvertimeForm from './OvertimeForm';
import OvertimeList from './OvertimeList';
import OvertimeSummary from './OvertimeSummary';

export default function OvertimeView({ user, initialMonth, onBack }) {
  const canRegister = canAny(user, [
    ABILITIES.OVERTIME_REGISTER_KITCHEN,
    ABILITIES.OVERTIME_REGISTER_LOUNGE,
    ABILITIES.OVERTIME_REPORT,
  ]);
  const canReport = can(user, ABILITIES.OVERTIME_REPORT);

  const determineDefaultTab = () => {
    if (initialMonth && canReport) return 'mes';
    if (canRegister) return 'registrar';
    return 'registros';
  };

  const [activeTab, setActiveTab] = useState(determineDefaultTab);

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
        {canRegister && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'registrar'}
            onClick={() => setActiveTab('registrar')}
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
          onClick={() => setActiveTab('registros')}
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
            onClick={() => setActiveTab('mes')}
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

      {activeTab === 'registrar' && canRegister && (
        <OvertimeForm user={user} onRegistered={() => setActiveTab('registros')} />
      )}
      {activeTab === 'registros' && <OvertimeList user={user} />}
      {activeTab === 'mes' && canReport && <OvertimeSummary initialMonth={initialMonth} />}
    </div>
  );
}
