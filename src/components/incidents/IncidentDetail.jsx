import React, { useState } from 'react';
import { ArrowLeft, XCircle } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import {
  changeStatus,
  kitchenConfirm,
  addIncidentComment,
  uploadEvidence,
  getEvidenceBlob,
} from '../../services/incidentsClient';
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_AREA_LABELS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_CAUSE_LABELS,
  COMPLAINT_KIND_LABELS,
  getStatusStyle,
  formatTimeAgo,
} from './incidentUi';
import IncidentTimeline from './IncidentTimeline';
import IncidentWasteModal from './IncidentWasteModal';
import { ResolveModal, DiscardModal, CommentModal } from './IncidentActionModals';
import IncidentDetailActions from './IncidentDetailActions';

export default function IncidentDetail({ incident, user, onBack, onUpdated }) {
  const [activeModal, setActiveModal] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!incident) return null;

  const canManage = can(user, ABILITIES.INCIDENTS_MANAGE);
  const isOwnerOrAdmin = Boolean(user?.capabilities?.is_owner || user?.role === 'owner' || user?.role === 'admin');
  const isKitchenHead = user?.capabilities?.role === 'kitchen_head' || user?.role === 'kitchen_head';
  const isComplaint = incident.type === 'queja';
  const isProductionComplaint = isComplaint && incident.cause === 'produccion';
  const isKitchenConfirmed = Boolean(incident.kitchen_confirmed_at);

  const handleStatusChange = async (newStatus, payload = {}) => {
    setSubmitting(true);
    setError(null);
    const res = await changeStatus(incident.id, newStatus, payload);
    setSubmitting(false);
    if (res.ok) {
      setActiveModal(null);
      onUpdated?.(res.data);
    } else {
      setError(res.error || 'No se pudo actualizar el estado.');
    }
  };

  const handleKitchenConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const res = await kitchenConfirm(incident.id);
    setSubmitting(false);
    if (res.ok) onUpdated?.(res.data);
    else setError(res.error || 'No se pudo registrar la confirmación de cocina.');
  };

  const handleAddComment = async (text) => {
    setSubmitting(true);
    const res = await addIncidentComment(incident.id, text);
    setSubmitting(false);
    if (res.ok) {
      setActiveModal(null);
      onUpdated?.(res.data);
    } else setError(res.error || 'No se pudo agregar el comentario.');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    const res = await uploadEvidence(incident.id, file);
    setSubmitting(false);
    if (res.ok) onUpdated?.(res.data);
    else setError(res.error || 'No se pudo subir la foto.');
  };

  const openPreview = async (evId) => {
    const blob = await getEvidenceBlob(incident.id, evId);
    if (blob) setPreviewUrl(URL.createObjectURL(blob));
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const statusStyle = getStatusStyle(incident.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button type="button" onClick={onBack} aria-label="Volver" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-soft)', color: 'var(--accent)', fontWeight: 600 }}>
              {INCIDENT_TYPE_LABELS[incident.type]}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`, fontWeight: 600 }}>
              {INCIDENT_STATUS_LABELS[incident.status]}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
              {INCIDENT_AREA_LABELS[incident.area]} • {formatTimeAgo(incident.occurred_at || incident.created_at)}
            </span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--text-main)', fontWeight: 700 }}>
            {incident.title}
          </h2>
        </div>
      </div>

      {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
        <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{incident.description}</div>
        {incident.type === 'rotura' && (
          <div style={{ color: 'var(--text-muted)' }}>Objeto: <strong>{incident.asset_label}</strong> ({incident.quantity} piezas)</div>
        )}
        {incident.type === 'averia' && (
          <div style={{ color: 'var(--text-muted)' }}>Severidad: <strong>{INCIDENT_SEVERITY_LABELS[incident.severity] || incident.severity}</strong></div>
        )}
        {isComplaint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-muted)' }}>
            <div>Plato: <strong>{incident.dish_name}</strong> • Clase: <strong>{COMPLAINT_KIND_LABELS[incident.complaint_kind] || incident.complaint_kind}</strong></div>
            {incident.cause && <div>Causa: <strong>{INCIDENT_CAUSE_LABELS[incident.cause]}</strong></div>}
            {incident.remade && <div style={{ color: 'var(--accent)' }}>Se volvió a preparar el plato</div>}
            {isProductionComplaint && (
              <div style={{ color: isKitchenConfirmed ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                {isKitchenConfirmed ? 'Solución de cocina confirmada por jefe de cocina' : 'Pendiente de confirmación por el jefe de cocina'}
              </div>
            )}
          </div>
        )}
        {incident.resolution && <div style={{ color: 'var(--success)', marginTop: '4px' }}><strong>Resolución:</strong> {incident.resolution}</div>}
      </div>

      {incident.evidence?.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Evidencias fotográficas</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {incident.evidence.map((ev) => (
              <button key={ev.id} type="button" onClick={() => openPreview(ev.id)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px' }}>
                Ver foto ({Math.round(ev.size_bytes / 1024)} KB)
              </button>
            ))}
          </div>
        </div>
      )}

      <IncidentDetailActions
        incident={incident}
        canManage={canManage}
        isOwnerOrAdmin={isOwnerOrAdmin}
        isKitchenHead={isKitchenHead}
        submitting={submitting}
        onStatusChange={handleStatusChange}
        onOpenModal={setActiveModal}
        onKitchenConfirm={handleKitchenConfirm}
        onPhotoUpload={handlePhotoUpload}
      />

      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Historial de eventos</div>
        <IncidentTimeline events={incident.events} />
      </div>

      {activeModal === 'resolve' && (
        <ResolveModal isOpen isComplaint={isComplaint} onClose={() => setActiveModal(null)} onConfirm={(p) => handleStatusChange('resuelta', p)} submitting={submitting} />
      )}
      {activeModal === 'discard' && (
        <DiscardModal isOpen onClose={() => setActiveModal(null)} onConfirm={(reason) => handleStatusChange('descartada', { reason })} submitting={submitting} />
      )}
      {activeModal === 'comment' && (
        <CommentModal isOpen onClose={() => setActiveModal(null)} onConfirm={handleAddComment} submitting={submitting} />
      )}
      {activeModal === 'waste' && (
        <IncidentWasteModal incidentId={incident.id} isOpen onClose={() => setActiveModal(null)} onWasteRegistered={(d) => onUpdated?.(d)} />
      )}

      {previewUrl && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button type="button" onClick={closePreview} aria-label="Cerrar imagen" style={{ position: 'absolute', top: '-36px', right: 0, background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><XCircle size={28} /></button>
            <img src={previewUrl} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
