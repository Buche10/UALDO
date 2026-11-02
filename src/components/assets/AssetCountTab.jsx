import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react';
import { createAssetCount, getAssetCountForPeriod, getAssetCount } from '../../services/assetsClient';
import {
  getUserAssetAreas,
  canValidateAssetArea,
  getCurrentPeriod,
  getPreviousPeriod,
  ASSET_AREA_LABELS,
  formatPeriodLabel,
  getAssetCountStatusInfo,
} from './assetHelpers';
import AssetCountSheet from './AssetCountSheet';
import AssetExplanationsForm from './AssetExplanationsForm';

export default function AssetCountTab({ user }) {
  const allowedAreas = getUserAssetAreas(user);
  const [selectedArea, setSelectedArea] = useState(allowedAreas[0] || 'lounge');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod);
  const [activeCount, setActiveCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const canValidate = canValidateAssetArea(user, selectedArea);

  const loadCount = useCallback(async (area, period) => {
    setLoadingCount(true);
    setError(null);
    const res = await getAssetCountForPeriod(area, period);
    setLoadingCount(false);
    if (res.ok) {
      setActiveCount(res.data || null);
    } else if (res.status === 404) {
      setActiveCount(null);
    } else {
      setActiveCount(null);
      setError(res.error || 'Error al consultar el conteo.');
    }
  }, []);

  useEffect(() => {
    setIsViewing(false);
    loadCount(selectedArea, selectedPeriod);
  }, [selectedArea, selectedPeriod, loadCount]);

  const handleStartCount = async () => {
    setStarting(true);
    setError(null);
    const res = await createAssetCount(selectedArea, selectedPeriod);
    setStarting(false);

    if (res.ok) {
      setActiveCount(res.data);
      setIsViewing(true);
    } else if (res.status === 409) {
      const existingId = res.data?.id;
      if (existingId) {
        setLoadingCount(true);
        const existingRes = await getAssetCount(existingId);
        setLoadingCount(false);
        if (existingRes.ok) {
          setActiveCount(existingRes.data);
          setIsViewing(true);
          return;
        }
      }
      setError('Ya existe un conteo registrado para esta área y periodo.');
    } else {
      setError(res.error || 'Error al iniciar el conteo.');
    }
  };

  if (isViewing && activeCount) {
    if (activeCount.status === 'draft') {
      return (
        <AssetCountSheet
          count={activeCount}
          onBack={() => {
            setIsViewing(false);
            loadCount(selectedArea, selectedPeriod);
          }}
          onSubmitted={(updated) => setActiveCount(updated)}
          onCountUpdated={(updated) => setActiveCount(updated)}
        />
      );
    }
    return (
      <AssetExplanationsForm
        count={activeCount}
        user={user}
        onBack={() => {
          setIsViewing(false);
          loadCount(selectedArea, selectedPeriod);
        }}
        onValidated={(updated) => {
          setActiveCount(updated);
          setIsViewing(false);
          loadCount(selectedArea, selectedPeriod);
        }}
        onExplanationsSaved={(updated) => setActiveCount(updated)}
      />
    );
  }

  const statusInfo = getAssetCountStatusInfo(activeCount, canValidate);
  const StatusIcon = statusInfo?.icon === 'ready' || statusInfo?.icon === 'validated'
    ? CheckCircle2
    : statusInfo?.icon === 'warning'
      ? AlertTriangle
      : Clock;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>
          Conteo mensual de vajilla y equipos
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Realiza el recuento físico por área al cierre del mes. El esperado no se muestra hasta enviar para garantizar un conteo imparcial.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label htmlFor="count-area-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Área</label>
            <select
              id="count-area-select"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              {allowedAreas.map((a) => (
                <option key={a} value={a}>{ASSET_AREA_LABELS[a] || a}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="count-period-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Periodo</label>
            <select
              id="count-period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value={getCurrentPeriod()}>{formatPeriodLabel(getCurrentPeriod())} (actual)</option>
              <option value={getPreviousPeriod()}>{formatPeriodLabel(getPreviousPeriod())} (anterior)</option>
            </select>
          </div>
        </div>

        {error && <div role="alert" style={{ padding: '8px 10px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

        {loadingCount ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0' }}>Consultando estado del conteo...</div>
        ) : activeCount && statusInfo ? (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                <StatusIcon size={16} /> Estado: <span>{statusInfo.label}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsViewing(true)}
                style={{ padding: '6px 14px', borderRadius: '9999px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {statusInfo.action === 'Ver' ? <Eye size={13} /> : <ClipboardCheck size={13} />} {statusInfo.action}
              </button>
            </div>
            {activeCount.validated_by && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Validado por: <strong>{activeCount.validated_by}</strong>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartCount}
            disabled={starting}
            style={{ padding: '10px 18px', borderRadius: '9999px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', fontWeight: 600, fontSize: '13px', cursor: starting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ClipboardCheck size={16} /> {starting ? 'Iniciando...' : 'Empezar'}
          </button>
        )}
      </div>
    </div>
  );
}
