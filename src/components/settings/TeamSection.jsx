import React, { useState, useEffect, useCallback } from 'react';
import { Users, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { listTeam } from '../../services/teamClient';
import TeamMemberRow from './TeamMemberRow';
import TeamCreateForm from './TeamCreateForm';

const FILTERS = [
  { value: 'activos', label: 'Activas' },
  { value: 'inactivos', label: 'Desactivadas' },
  { value: 'todos', label: 'Todas' },
];

const matchesFilter = (member, filter) => {
  if (filter === 'todos') return true;
  return filter === 'activos' ? member.is_active !== false : member.is_active === false;
};

export default function TeamSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('activos');

  const fetchTeam = useCallback(async (targetPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const res = await listTeam(targetPage, filter);
    if (append) setLoadingMore(false);
    else setLoading(false);

    if (res.ok) {
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const meta = res.data?.meta;
      setMembers((prev) => (append ? [...prev, ...list] : list));
      setPage(targetPage);
      if (meta && typeof meta.last_page === 'number') {
        setHasMore(targetPage < meta.last_page);
      } else {
        setHasMore(false);
      }
    } else {
      setError(res.error || 'No se pudo cargar la lista del equipo.');
    }
  }, [filter]);

  useEffect(() => {
    fetchTeam(1, false);
  }, [fetchTeam]);

  const handleMemberUpdated = (updatedMember) => {
    setMembers((prev) => prev
      .map((member) => (member.id === updatedMember.id ? { ...member, ...updatedMember } : member))
      .filter((member) => matchesFilter(member, filter)));
  };

  const handleCreated = () => {
    fetchTeam(1, false);
  };

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--accent)" aria-hidden="true" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>Equipo</h3>
        </div>

        <button
          type="button"
          onClick={() => fetchTeam(1, false)}
          disabled={loading}
          aria-label="Recargar lista del equipo"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: loading ? 'not-allowed' : 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} aria-hidden="true" />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        Crea cuentas para el personal, entrega su contraseña temporal y administra los cargos del restaurante.
      </p>

      <TeamCreateForm onCreated={handleCreated} />

      <div role="group" aria-label="Filtrar equipo" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: filter === option.value ? 'var(--accent)' : 'var(--chip-bg)', color: filter === option.value ? 'var(--on-primary)' : 'var(--text-muted)' }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => fetchTeam(1, false)} className="btn-secondary" style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )}

      {loading && members.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Loader2 size={16} className="spin" aria-hidden="true" />
          <span>Cargando equipo...</span>
        </div>
      ) : members.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay miembros del equipo en este filtro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              onRoleUpdated={handleMemberUpdated}
              onMemberUpdated={handleMemberUpdated}
            />
          ))}

          {hasMore && (
            <button type="button" onClick={() => fetchTeam(page + 1, true)} disabled={loadingMore} className="btn-secondary" style={{ marginTop: '4px', padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--accent)', cursor: loadingMore ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {loadingMore && <Loader2 size={14} className="spin" aria-hidden="true" />}
              <span>Cargar más miembros</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
