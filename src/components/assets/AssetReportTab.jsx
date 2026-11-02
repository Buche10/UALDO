import React, { useState, useEffect } from 'react';
import { getAssetReport } from '../../services/assetsClient';
import {
  getUserAssetAreas,
  getCurrentPeriod,
  getPreviousPeriod,
  ASSET_AREA_LABELS,
  formatPeriodLabel,
} from './assetHelpers';
import AssetReportTable from './AssetReportTable';
import AssetReportReplenishList from './AssetReportReplenishList';
import AssetReportRepairsList from './AssetReportRepairsList';

export default function AssetReportTab({ user, onNavigateToIncident }) {
  const allowedAreas = getUserAssetAreas(user);
  const [selectedArea, setSelectedArea] = useState(allowedAreas.length > 1 ? '' : allowedAreas[0]);
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    const res = await getAssetReport(period, selectedArea || undefined);
    setLoading(false);
    if (res.ok) {
      setReportData(res.data);
    } else {
      setError(res.error || 'Error al cargar el reporte de activos.');
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, selectedArea]);

  const activos = reportData?.activos || [];
  const porReponer = reportData?.por_reponer || [];
  const reparaciones = reportData?.reparaciones_pendientes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: allowedAreas.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
        <div>
          <label htmlFor="report-period-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Mes del reporte</label>
          <select
            id="report-period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}
          >
            <option value={getCurrentPeriod()}>{formatPeriodLabel(getCurrentPeriod())} (actual)</option>
            <option value={getPreviousPeriod()}>{formatPeriodLabel(getPreviousPeriod())} (anterior)</option>
          </select>
        </div>

        {allowedAreas.length > 1 && (
          <div>
            <label htmlFor="report-area-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Área</label>
            <select
              id="report-area-select"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="">Todas las áreas</option>
              {allowedAreas.map((a) => (
                <option key={a} value={a}>{ASSET_AREA_LABELS[a] || a}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div role="alert" style={{ padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando reporte...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Por reponer ({porReponer.length})
            </h4>
            <AssetReportReplenishList items={porReponer} />
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Reparaciones pendientes ({reparaciones.length})
            </h4>
            <AssetReportRepairsList repairs={reparaciones} onNavigateToIncident={onNavigateToIncident} />
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              Balance mensual de activos ({activos.length})
            </h4>
            <AssetReportTable rows={activos} />
          </div>
        </div>
      )}
    </div>
  );
}
