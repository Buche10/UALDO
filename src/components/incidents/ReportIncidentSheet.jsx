import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { userArea } from '../../services/permissions';
import {
  createIncident,
  uploadEvidence,
  COMPLAINT_KINDS,
  COMPLAINT_KIND_LABELS,
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_LABELS,
} from '../../services/incidentsClient';
import ReportTypeSelector from './ReportTypeSelector';
import IncidentAssetSelector from './IncidentAssetSelector';

const DEFAULT_TITLES = {
  averia: 'Avería de equipo',
  rotura: 'Rotura de vajilla o menaje',
  queja: 'Queja de cliente',
};

export default function ReportIncidentSheet({ user, isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('averia');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('media');
  const [assetLabel, setAssetLabel] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dishName, setDishName] = useState('');
  const [complaintKind, setComplaintKind] = useState('plato_frio');
  const [assetId, setAssetId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [personalDataError, setPersonalDataError] = useState(null);

  if (!isOpen) return null;

  const defaultArea = userArea(user) || 'lounge';

  const handleSelectType = (selectedType) => {
    setType(selectedType);
    setTitle(DEFAULT_TITLES[selectedType] || '');
    setStep(2);
  };

  const handleSelectAsset = (asset) => {
    setAssetId(asset ? asset.id : null);
    if (asset && type === 'rotura' && !assetLabel) {
      setAssetLabel(asset.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPersonalDataError(null);
    setSubmitting(true);

    const payload = { type, title: title.trim(), description: description.trim(), area: defaultArea };
    if (assetId) payload.asset_id = assetId;
    if (type === 'averia') payload.severity = severity;
    if (type === 'rotura') {
      payload.asset_label = assetLabel.trim();
      payload.quantity = parseInt(quantity, 10);
    }
    if (type === 'queja') {
      payload.dish_name = dishName.trim();
      payload.complaint_kind = complaintKind;
    }

    const res = await createIncident(payload);
    if (!res.ok) {
      setSubmitting(false);
      const errMsg = res.error || 'No se pudo registrar la incidencia.';
      if (errMsg.toLowerCase().includes('datos personales')) setPersonalDataError(errMsg);
      else setError(errMsg);
      return;
    }

    const createdId = res.data?.id || res.id;
    if (photo && createdId) {
      await uploadEvidence(createdId, photo).catch(() => {});
    }

    setSubmitting(false);
    onCreated?.(res.data || res);
    onClose?.();
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', background: 'var(--grad-surface)', borderRadius: '16px 16px 0 0', border: '1px solid var(--border-glass)', borderBottom: 'none', padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: 600 }}>
            {step === 1 ? 'Reportar un problema' : `Reportar ${type === 'averia' ? 'avería' : type === 'rotura' ? 'rotura' : 'queja'}`}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

        {step === 1 ? (
          <ReportTypeSelector onSelectType={handleSelectType} />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="inc-title" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Título</label>
              <input id="inc-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
            </div>

            {(type === 'averia' || type === 'rotura') && (
              <IncidentAssetSelector area={defaultArea} selectedAssetId={assetId} onSelectAsset={handleSelectAsset} />
            )}

            {type === 'averia' && (
              <div>
                <label htmlFor="inc-severity" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Severidad</label>
                <select id="inc-severity" value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
                  {INCIDENT_SEVERITIES.map((s) => <option key={s} value={s}>{INCIDENT_SEVERITY_LABELS[s]}</option>)}
                </select>
              </div>
            )}

            {type === 'rotura' && (
              <>
                <div>
                  <label htmlFor="inc-asset-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>¿Qué se rompió?</label>
                  <input id="inc-asset-label" type="text" placeholder="Ej: Vaso de agua, plato hondo..." value={assetLabel} onChange={(e) => setAssetLabel(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label htmlFor="inc-quantity" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cantidad de piezas</label>
                  <input id="inc-quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
                </div>
              </>
            )}

            {type === 'queja' && (
              <>
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--accent)' }}>
                  Aviso: No anotes nombres ni teléfonos del cliente.
                </div>
                <div>
                  <label htmlFor="inc-dish" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Plato observado</label>
                  <input id="inc-dish" type="text" placeholder="Ej: Bife de chorizo, Corvina..." value={dishName} onChange={(e) => setDishName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label htmlFor="inc-complaint-kind" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Clase de queja</label>
                  <select id="inc-complaint-kind" value={complaintKind} onChange={(e) => setComplaintKind(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
                    {COMPLAINT_KINDS.map((k) => <option key={k} value={k}>{COMPLAINT_KIND_LABELS[k]}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="inc-description" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Relato de lo sucedido</label>
              <textarea id="inc-description" rows={3} placeholder="Describe los hechos concretos..." value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: personalDataError ? '1px solid var(--border-error)' : '1px solid var(--border-glass)', color: 'var(--text-main)', resize: 'none' }} />
              {personalDataError && (
                <div role="alert" style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {personalDataError}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="inc-photo" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Foto de evidencia (opcional, máx. 8 MB)</label>
              <input id="inc-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} style={{ fontSize: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '6px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Atrás</button>
              <button type="submit" disabled={submitting} style={{ padding: '10px 18px', borderRadius: '8px', background: 'var(--primary)', border: '1px solid var(--border-glow)', color: 'var(--on-primary)', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                {submitting ? 'Enviando...' : 'Guardar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
