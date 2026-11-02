import React, { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';

export default function IncidentDetailActions({
  incident,
  canManage,
  isOwnerOrAdmin,
  isKitchenHead,
  submitting,
  onStatusChange,
  onOpenModal,
  onKitchenConfirm,
  onPhotoUpload,
}) {
  const [outOfService, setOutOfService] = useState(false);

  if (!canManage && !isOwnerOrAdmin && !isKitchenHead) return null;

  const isComplaint = incident.type === 'queja';
  const isProductionComplaint = isComplaint && incident.cause === 'produccion';
  const isKitchenConfirmed = Boolean(incident.kitchen_confirmed_at);
  const isBlocked = isProductionComplaint && !isKitchenConfirmed;

  const handleAttend = () => {
    const payload = incident.type === 'averia' && outOfService ? { asset_out_of_service: true } : {};
    onStatusChange('en_atencion', payload);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', alignItems: 'center' }}>
      {incident.status === 'abierta' && (
        <>
          <button
            type="button"
            onClick={handleAttend}
            disabled={submitting}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Atender
          </button>
          {incident.type === 'averia' && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={outOfService}
                onChange={(e) => setOutOfService(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Fuera de servicio mientras se repara</span>
            </label>
          )}
        </>
      )}

      {incident.status === 'en_atencion' && (
        <button
          type="button"
          onClick={() => onOpenModal('resolve')}
          disabled={submitting}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--success)', color: 'var(--on-primary)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
        >
          Marcar resuelta
        </button>
      )}

      {incident.status === 'resuelta' && (
        <>
          {isProductionComplaint && !isKitchenConfirmed && (isKitchenHead || isOwnerOrAdmin) && (
            <button
              type="button"
              onClick={onKitchenConfirm}
              disabled={submitting}
              style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--primary-2)', color: 'var(--on-primary)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
            >
              Confirmar solución de cocina
            </button>
          )}

          <button
            type="button"
            onClick={() => onStatusChange('validada')}
            disabled={submitting || isBlocked}
            title={isBlocked ? 'Bloqueado: falta la confirmación del jefe de cocina' : ''}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: isBlocked ? 'var(--track-bg)' : 'var(--primary)',
              color: isBlocked ? 'var(--text-subtle)' : 'var(--on-primary)',
              border: 'none',
              fontWeight: 600,
              cursor: isBlocked ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            Validar
          </button>

          {isBlocked && (
            <div style={{ fontSize: '11px', color: 'var(--warning)', alignSelf: 'center' }}>
              Validar bloqueado: falta confirmación de cocina
            </div>
          )}
        </>
      )}

      {(incident.status === 'abierta' || incident.status === 'en_atencion') && (
        <button
          type="button"
          onClick={() => onOpenModal('discard')}
          disabled={submitting}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--error)', border: '1px solid var(--border-error)', fontSize: '12px', cursor: 'pointer' }}
        >
          Descartar
        </button>
      )}

      {isComplaint && incident.status === 'en_atencion' && (
        <button
          type="button"
          onClick={() => onOpenModal('waste')}
          disabled={submitting}
          style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--chip-bg)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Trash2 size={14} /> Registrar merma
        </button>
      )}

      <button
        type="button"
        onClick={() => onOpenModal('comment')}
        style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--chip-bg)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', fontSize: '12px', cursor: 'pointer' }}
      >
        Comentar
      </button>

      <label
        style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--chip-bg)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Camera size={14} /> Foto
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhotoUpload} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
