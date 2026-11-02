import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart2 } from 'lucide-react';
import { getIncidentRecurrence, INCIDENT_TYPE_LABELS } from '../../services/incidentsClient';

function RecurrenceSection({ title, items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-main)' }}>{INCIDENT_TYPE_LABELS[it.label] || it.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{it.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IncidentRecurrence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await getIncidentRecurrence(30);
    setLoading(false);
    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setError(res.error || 'No se pudieron consultar las recurrencias.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={16} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Más repetidas en los últimos 30 días
          </span>
        </div>
        <button type="button" onClick={loadData} disabled={loading} aria-label="Recargar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      {loading && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando recurrencias...</div>}

      {!loading && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <RecurrenceSection title="Por tipo de problema" items={data.por_tipo} />
          <RecurrenceSection title="Por plato con quejas" items={data.por_plato} />
          <RecurrenceSection title="Por objeto roto o averiado" items={data.por_activo} />
          <RecurrenceSection title="Por título reportado" items={data.por_titulo} />
        </div>
      )}
    </div>
  );
}
