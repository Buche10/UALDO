import React, { useState, useCallback } from 'react';
import { can, ABILITIES } from '../../services/permissions';
import { usePagedList } from '../../hooks/usePagedList';
import {
  listOvertime,
  voidOvertime,
  isValidOvertimeDate,
} from '../../services/overtimeClient';
import OvertimeCard from './OvertimeCard';
import VoidOvertimeModal from './VoidOvertimeModal';

function canUserVoid(user, entry) {
  if (!user || !entry || entry.voided) return false;
  if (can(user, ABILITIES.OVERTIME_REPORT)) return true;
  if (entry.registered_by?.id && entry.registered_by.id === user.id) {
    return isValidOvertimeDate(entry.work_date);
  }
  return false;
}

export default function OvertimeList({ user }) {
  const canFilterArea = can(user, ABILITIES.OVERTIME_REPORT);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [area, setArea] = useState('');
  const [worker, setWorker] = useState('');
  const [totals, setTotals] = useState(null);
  const [voidEntry, setVoidEntry] = useState(null);
  const [submittingVoid, setSubmittingVoid] = useState(false);

  const fetchPage = useCallback(
    async (pageToLoad) => {
      const res = await listOvertime({
        page: pageToLoad,
        from: from || undefined,
        to: to || undefined,
        area: area || undefined,
        worker: worker.trim() || undefined,
      });
      if (res.ok && res.data?.totals) {
        setTotals(res.data.totals);
      }
      return res;
    },
    [from, to, area, worker]
  );

  const { items, loading, error, hasMore, loadMore, upsert } = usePagedList(fetchPage, {
    errorMessage: 'No se pudieron cargar los registros de horas extra.',
  });

  const handleConfirmVoid = async (reason) => {
    if (!voidEntry?.id) return;
    setSubmittingVoid(true);
    const res = await voidOvertime(voidEntry.id, reason);
    setSubmittingVoid(false);

    if (res.ok) {
      upsert({
        ...voidEntry,
        voided: true,
        void_reason: reason,
      });
      setVoidEntry(null);
    }
  };

  const computedTotalHours = totals?.total_hours ?? items.reduce((acc, it) => acc + (it.voided ? 0 : Number(it.hours || 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        <div>
          <label htmlFor="filter-from" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>Desde</label>
          <input id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }} />
        </div>
        <div>
          <label htmlFor="filter-to" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>Hasta</label>
          <input id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }} />
        </div>
        {canFilterArea && (
          <div>
            <label htmlFor="filter-area" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>Área</label>
            <select id="filter-area" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}>
              <option value="">Todas las áreas</option>
              <option value="kitchen">Cocina</option>
              <option value="lounge">Salón</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="filter-worker" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>Trabajador</label>
          <input id="filter-worker" type="text" placeholder="Buscar..." value={worker} onChange={(e) => setWorker(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }} />
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total del filtro</span>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{computedTotalHours} h</span>
      </div>

      {error && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando registros...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '13px' }}>
          No hay registros de horas extra para este filtro.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((entry) => (
          <OvertimeCard
            key={entry.id}
            entry={entry}
            canVoid={canUserVoid(user, entry)}
            onVoidClick={setVoidEntry}
          />
        ))}
      </div>

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={loading} style={{ padding: '10px', borderRadius: '8px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', marginTop: '4px' }}>
          {loading ? 'Cargando más...' : 'Cargar más'}
        </button>
      )}

      {voidEntry && (
        <VoidOvertimeModal
          entry={voidEntry}
          onConfirm={handleConfirmVoid}
          onCancel={() => setVoidEntry(null)}
          submitting={submittingVoid}
        />
      )}
    </div>
  );
}
