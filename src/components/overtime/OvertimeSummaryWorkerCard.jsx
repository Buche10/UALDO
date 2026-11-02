import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export default function OvertimeSummaryWorkerCard({ worker }) {
  const [expanded, setExpanded] = useState(false);

  if (!worker) return null;

  const days = worker.days || [];
  const daysText = `${worker.days_count} ${worker.days_count === 1 ? 'día' : 'días'}`;

  return (
    <div
      style={{
        borderRadius: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
            {worker.worker_name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {daysText} con horas extra
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
            {worker.hours} h
          </span>
          {expanded ? (
            <ChevronUp size={18} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={18} color="var(--text-muted)" />
          )}
        </div>
      </button>

      {expanded && (
        <div
          style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid var(--border-glass)',
            background: 'var(--card-subtle-bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '2px' }}>
            Desglose por día:
          </div>
          {days.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Sin detalle de días.</div>
          ) : (
            days.map((day) => (
              <div
                key={day.date}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'var(--text-main)',
                  padding: '4px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--text-muted)" />
                  <span>{day.date}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{day.hours} h</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
