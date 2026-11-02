import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Sliders, ArrowLeft } from 'lucide-react';
import { can, ABILITIES, userArea } from '../../services/permissions';
import { usePagedList } from '../../hooks/usePagedList';
import { listIncidents, getIncident, INCIDENT_TYPES, INCIDENT_STATUSES, INCIDENT_TYPE_LABELS, INCIDENT_STATUS_LABELS } from '../../services/incidentsClient';
import IncidentCard from './IncidentCard';
import IncidentDetail from './IncidentDetail';
import ReportIncidentSheet from './ReportIncidentSheet';
import IncidentRecurrence from './IncidentRecurrence';
import IncidentSettingsModal from './IncidentSettingsModal';

export default function IncidentsView({ user, initialId, onBack }) {
  const canManage = can(user, ABILITIES.INCIDENTS_MANAGE);
  const isOwnerOrAdmin = Boolean(user?.capabilities?.is_owner || user?.role === 'owner' || user?.role === 'admin');
  const canSettings = can(user, ABILITIES.SETTINGS_MANAGE);

  const defaultTab = canManage ? 'mi_area' : 'reporte';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (initialId) {
      getIncident(initialId).then((res) => {
        if (res.ok && res.data) setSelectedIncident(res.data);
      });
    }
  }, [initialId]);

  const fetchPage = useCallback(
    async (pageToLoad) => {
      const area = activeTab === 'mi_area' ? (userArea(user) || undefined) : undefined;
      return listIncidents({
        page: pageToLoad,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        area,
      });
    },
    [activeTab, statusFilter, typeFilter, user]
  );

  const { items, loading, error, hasMore, loadMore, upsert } = usePagedList(fetchPage, {
    errorMessage: 'No se pudieron cargar las incidencias.',
  });

  const handleIncidentCreated = (created) => {
    if (created?.id) upsert(created);
  };

  if (selectedIncident) {
    return (
      <IncidentDetail
        incident={selectedIncident}
        user={user}
        onBack={() => setSelectedIncident(null)}
        onUpdated={(up) => {
          setSelectedIncident(up);
          upsert(up);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Volver" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <AlertTriangle size={22} color="var(--warning)" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Incidencias</h2>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {canSettings && (
            <button type="button" onClick={() => setIsSettingsOpen(true)} aria-label="Ajustes" style={{ padding: '8px', borderRadius: '8px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Sliders size={16} />
            </button>
          )}
          <button type="button" onClick={() => setIsReportOpen(true)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> Reportar
          </button>
        </div>
      </div>

      {(canManage || isOwnerOrAdmin) && (
        <div role="tablist" style={{ display: 'flex', gap: '6px', background: 'var(--surface-soft)', padding: '4px', borderRadius: '10px' }}>
          {canManage && (
            <button type="button" role="tab" aria-selected={activeTab === 'mi_area'} onClick={() => setActiveTab('mi_area')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'mi_area' ? 'var(--primary)' : 'transparent', color: activeTab === 'mi_area' ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: activeTab === 'mi_area' ? 600 : 400, cursor: 'pointer' }}>
              Mi área
            </button>
          )}
          <button type="button" role="tab" aria-selected={activeTab === 'reporte'} onClick={() => setActiveTab('reporte')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'reporte' ? 'var(--primary)' : 'transparent', color: activeTab === 'reporte' ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: activeTab === 'reporte' ? 600 : 400, cursor: 'pointer' }}>
            Reporté
          </button>
          {isOwnerOrAdmin && (
            <button type="button" role="tab" aria-selected={activeTab === 'todas'} onClick={() => setActiveTab('todas')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'todas' ? 'var(--primary)' : 'transparent', color: activeTab === 'todas' ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: activeTab === 'todas' ? 600 : 400, cursor: 'pointer' }}>
              Todas
            </button>
          )}
          {canManage && (
            <button type="button" role="tab" aria-selected={activeTab === 'recurrencia'} onClick={() => setActiveTab('recurrencia')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'recurrencia' ? 'var(--primary)' : 'transparent', color: activeTab === 'recurrencia' ? 'var(--on-primary)' : 'var(--text-muted)', fontSize: '12px', fontWeight: activeTab === 'recurrencia' ? 600 : 400, cursor: 'pointer' }}>
              Recurrencias
            </button>
          )}
        </div>
      )}

      {activeTab === 'recurrencia' ? (
        <IncidentRecurrence />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}>
              <option value="">Todos los estados</option>
              {INCIDENT_STATUSES.map((s) => <option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</option>)}
            </select>
            <select aria-label="Filtrar por tipo" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}>
              <option value="">Todos los tipos</option>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

          {loading && items.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando incidencias...</div>}
          {!loading && items.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '13px' }}>No hay incidencias reportadas en esta vista.</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} onClick={setSelectedIncident} />
            ))}
          </div>

          {hasMore && (
            <button type="button" onClick={loadMore} disabled={loading} style={{ padding: '10px', borderRadius: '8px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px' }}>
              {loading ? 'Cargando más...' : 'Cargar más'}
            </button>
          )}
        </>
      )}

      <ReportIncidentSheet user={user} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onCreated={handleIncidentCreated} />
      <IncidentSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
