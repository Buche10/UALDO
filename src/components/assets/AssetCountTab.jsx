import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { createAssetCount } from '../../services/assetsClient';
import {
  getUserAssetAreas,
  getCurrentPeriod,
  getPreviousPeriod,
  ASSET_AREA_LABELS,
  formatPeriodLabel,
} from './assetHelpers';
import AssetCountSheet from './AssetCountSheet';
import AssetExplanationsForm from './AssetExplanationsForm';

export default function AssetCountTab({ user }) {
  const allowedAreas = getUserAssetAreas(user);
  const [selectedArea, setSelectedArea] = useState(allowedAreas[0] || 'lounge');
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod);
  const [activeCount, setActiveCount] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const getStorageKey = (area, period) => `ualdo_asset_count_${area}_${period}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(selectedArea, selectedPeriod));
      if (saved) {
        setActiveCount(JSON.parse(saved));
      } else {
        setActiveCount(null);
      }
    } catch {
      setActiveCount(null);
    }
    setError(null);
  }, [selectedArea, selectedPeriod]);

  const updateCountState = (count) => {
    setActiveCount(count);
    try {
      if (count) {
        localStorage.setItem(getStorageKey(count.area, count.period), JSON.stringify(count));
      }
    } catch {}
  };

  const handleStartCount = async () => {
    setStarting(true);
    setError(null);
    const res = await createAssetCount(selectedArea, selectedPeriod);
    setStarting(false);

    if (res.ok) {
      updateCountState(res.data);
    } else if (res.status === 409) {
      setError('Ya existe un conteo registrado para esta área y periodo. Revisa el reporte del mes.');
    } else {
      setError(res.error || 'Error al iniciar el conteo.');
    }
  };

  if (activeCount && activeCount.status === 'draft') {
    return (
      <AssetCountSheet
        count={activeCount}
        onBack={() => setActiveCount(null)}
        onSubmitted={updateCountState}
        onCountUpdated={updateCountState}
      />
    );
  }

  if (activeCount && activeCount.status === 'submitted') {
    return (
      <AssetExplanationsForm
        count={activeCount}
        user={user}
        onBack={() => setActiveCount(null)}
        onValidated={updateCountState}
        onExplanationsSaved={updateCountState}
      />
    );
  }

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

        {activeCount && activeCount.status === 'validated' ? (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '13px' }}>
              <CheckCircle2 size={16} /> Conteo del periodo validado
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Validado por: <strong>{activeCount.validated_by || 'Jefe de área'}</strong>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartCount}
            disabled={starting}
            style={{
              padding: '10px 18px',
              borderRadius: '9999px',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: starting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ClipboardCheck size={16} /> {starting ? 'Iniciando...' : 'Empezar conteo'}
          </button>
        )}
      </div>
    </div>
  );
}
