import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock } from 'lucide-react';
import {
  getOvertimeSummary,
  getCurrentMonthString,
} from '../../services/overtimeClient';
import OvertimeSummaryWorkerCard from './OvertimeSummaryWorkerCard';

export default function OvertimeSummary({ initialMonth }) {
  const [month, setMonth] = useState(initialMonth || getCurrentMonthString());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async (targetMonth) => {
    setLoading(true);
    setError(null);
    const res = await getOvertimeSummary(targetMonth);
    setLoading(false);

    if (res.ok && res.data) {
      setSummary(res.data);
    } else {
      setError(res.error || 'No se pudo obtener el resumen de horas extra.');
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    loadSummary(month);
  }, [month, loadSummary]);

  const workers = summary?.workers || [];
  const totalHours = summary?.total_hours ?? 0;
  const peopleCount = summary?.people ?? workers.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label htmlFor="overtime-month-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Mes a consultar
        </label>
        <input
          id="overtime-month-input"
          type="month"
          max={getCurrentMonthString()}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            fontSize: '13px',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--surface-soft)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Clock size={14} color="var(--accent)" />
            <span>Total horas</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
            {totalHours} h
          </div>
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: 'var(--surface-soft)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Users size={14} color="var(--primary-2)" />
            <span>Colaboradores</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>
            {peopleCount}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando resumen del mes...
        </div>
      )}

      {!loading && workers.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '13px' }}>
          No hay horas extra registradas en {month}.
        </div>
      )}

      {!loading && workers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {workers.map((worker) => (
            <OvertimeSummaryWorkerCard
              key={worker.worker_user_id || worker.worker_name}
              worker={worker}
            />
          ))}
        </div>
      )}
    </div>
  );
}
