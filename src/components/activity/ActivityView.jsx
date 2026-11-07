import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';
import { usePagedList } from '../../hooks/usePagedList';
import {
  listActivity,
  listActivityPeople,
} from '../../services/activityClient';
import {
  getTodayDateString,
  getMinOvertimeDateString,
} from '../../services/overtimeClient';
import ActivityItem from './ActivityItem';

const MODULE_OPTIONS = [
  { value: '', label: 'Todos los módulos' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'reservas', label: 'Reservas' },
  { value: 'pedidos', label: 'Pedidos y compras' },
  { value: 'caja', label: 'Cierre de caja' },
  { value: 'retiros', label: 'Retiros de bodega' },
  { value: 'horas_extra', label: 'Horas extra' },
  { value: 'incidencias', label: 'Incidencias' },
  { value: 'equipo', label: 'Equipo y cuentas' },
];

function getDayGroupLabel(dateStr) {
  if (!dateStr || dateStr === 'indefinido') return 'Fecha sin definir';
  const today = getTodayDateString();
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const yesterday = `${y}-${m}-${day}`;

  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  return dateStr;
}

function groupActivitiesByDay(items) {
  const groups = [];
  const map = new Map();

  for (const item of items) {
    const dayKey = item.fecha ? item.fecha.slice(0, 10) : 'indefinido';
    if (!map.has(dayKey)) {
      const group = {
        key: dayKey,
        label: getDayGroupLabel(dayKey),
        items: [],
      };
      map.set(dayKey, group);
      groups.push(group);
    }
    map.get(dayKey).items.push(item);
  }

  return groups;
}

export default function ActivityView({ onBack, onNavigate }) {
  const [modulo, setModulo] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [desde, setDesde] = useState(getMinOvertimeDateString());
  const [hasta, setHasta] = useState(getTodayDateString());
  const [people, setPeople] = useState([]);

  useEffect(() => {
    let mounted = true;
    listActivityPeople()
      .then((res) => {
        if (mounted && res.ok && Array.isArray(res.data)) {
          setPeople(res.data);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (pageToLoad) => {
      return listActivity({
        page: pageToLoad,
        modulo: modulo || undefined,
        usuarioId: usuarioId || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
    },
    [modulo, usuarioId, desde, hasta]
  );

  const { items, loading, error, hasMore, loadMore, reload } = usePagedList(fetchPage, {
    errorMessage: 'No se pudo cargar la actividad del equipo.',
  });

  const dayGroups = groupActivitiesByDay(items);

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
          <Activity size={22} color="var(--accent)" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            Actividad del equipo
          </h2>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        <div>
          <label htmlFor="activity-filter-modulo" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>
            Módulo
          </label>
          <select
            id="activity-filter-modulo"
            value={modulo}
            onChange={(e) => setModulo(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="activity-filter-persona" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>
            Persona
          </label>
          <select
            id="activity-filter-persona"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
          >
            <option value="">Todas las personas</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.cargo_label ? `(${p.cargo_label})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="activity-filter-desde" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>
            Desde
          </label>
          <input
            id="activity-filter-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
          />
        </div>

        <div>
          <label htmlFor="activity-filter-hasta" style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}>
            Hasta
          </label>
          <input
            id="activity-filter-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'var(--error-soft)',
            color: 'var(--error)',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={reload}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--error)',
              color: 'var(--on-primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshCw size={12} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando actividad...
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '13px' }}>
          No hay cambios en estas fechas.
        </div>
      )}

      {dayGroups.map((group) => (
        <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', paddingLeft: '4px' }}>
            {group.label}
          </div>
          {group.items.map((it) => (
            <ActivityItem key={it.id} item={it} onNavigate={onNavigate} />
          ))}
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          style={{
            padding: '10px',
            borderRadius: '9999px',
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            marginTop: '4px',
          }}
        >
          {loading ? 'Cargando más...' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
