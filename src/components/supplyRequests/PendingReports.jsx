import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { decideRequest } from '../../services/supplyRequestsClient';
import { styles } from '../common/uiStyles';
import { formatRelativeTime, quantityWithUnit, requesterName } from './requestUi';

/**
 * Bloque de pedidos pendientes de aprobación por el dueño (Brief 26p).
 */
export default function PendingReports({ reports = [], onView, onReload }) {
  const [busyId, setBusyId] = useState(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState(null);
  const [singleError, setSingleError] = useState(null);

  const handleApproveSingle = async (reportId) => {
    setSingleError(null);
    setBusyId(reportId);
    try {
      const res = await decideRequest(reportId, 'approved');
      if (res.ok) {
        if (onReload) onReload();
      } else {
        setSingleError(res.error || res.data?.message || 'No se pudo aprobar el pedido.');
      }
    } catch (err) {
      setSingleError(err?.message || 'Error al aprobar el pedido.');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveAll = async () => {
    setBatchRunning(true);
    setConfirmingAll(false);
    let successCount = 0;
    const failures = [];
    for (const report of reports) {
      try {
        const res = await decideRequest(report.id, 'approved');
        if (res.ok) {
          successCount++;
        } else {
          failures.push({
            id: report.id,
            name: requesterName(report),
            message: res.error || res.data?.message || 'No se pudo aprobar el pedido.',
          });
        }
      } catch (err) {
        failures.push({
          id: report.id,
          name: requesterName(report),
          message: err?.message || 'Error al aprobar el pedido.',
        });
      }
    }
    setBatchRunning(false);
    setBatchSummary({ total: reports.length, successCount, failCount: failures.length, failures });
    if (onReload) onReload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="var(--warning)" />
          <span>Por aprobar</span>
        </h3>
        {reports.length > 1 && !confirmingAll && !batchRunning && (
          <button type="button" onClick={() => setConfirmingAll(true)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px', fontWeight: 600 }}>
            Aprobar todos
          </button>
        )}
      </div>

      {singleError && (
        <div role="alert" style={{ ...styles.errorBox, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <AlertCircle size={14} />
          <span>{singleError}</span>
        </div>
      )}

      {confirmingAll && (
        <div style={{ ...styles.card, background: 'var(--card-subtle-bg)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>Se aprobarán {reports.length} pedidos.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handleApproveAll} disabled={batchRunning} className="btn-primary" style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '8px', fontWeight: 600 }}>
              {batchRunning ? 'Aprobando...' : 'Confirmar aprobación'}
            </button>
            <button type="button" onClick={() => setConfirmingAll(false)} disabled={batchRunning} style={{ ...styles.secondary, padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {batchSummary && (
        <div
          role="status"
          style={{
            ...styles.card,
            background: batchSummary.failCount > 0 ? 'var(--card-subtle-bg)' : 'var(--success-soft)',
            border: `1px solid ${batchSummary.failCount > 0 ? 'var(--border-glass)' : 'var(--border-success)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: batchSummary.failCount > 0 ? 'var(--text-main)' : 'var(--success)' }}>
              <CheckCircle2 size={15} color={batchSummary.failCount > 0 ? 'var(--warning)' : 'var(--success)'} />
              <span>
                Se aprobaron {batchSummary.successCount} de {batchSummary.total} pedidos.
                {batchSummary.failCount > 0 ? ` (${batchSummary.failCount} con fallo)` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBatchSummary(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
            >
              Cerrar
            </button>
          </div>
          {batchSummary.failures && batchSummary.failures.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-glass)', paddingTop: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--error)' }}>Pedidos que no se pudieron aprobar:</span>
              {batchSummary.failures.map((f) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 500 }}>#{f.id} · {f.name}</span>
                  <span style={{ color: 'var(--error)', textAlign: 'right' }}>{f.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reports.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>Nada por aprobar.</div>
      ) : (
        reports.map((report) => {
          const isBusy = busyId === report.id || batchRunning;
          return (
            <div key={report.id} style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>{requesterName(report)}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>{formatRelativeTime(report.created_at)}</span>
                  {report.priority === 'urgent' && <span style={{ color: 'var(--warning)', fontWeight: 600, marginLeft: '6px' }}>(urgente)</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => handleApproveSingle(report.id)} disabled={isBusy} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px', fontWeight: 600 }}>
                    {isBusy ? 'Aprobando...' : 'Aprobar'}
                  </button>
                  {onView && (
                    <button type="button" onClick={() => onView(report.id)} disabled={isBusy} style={{ ...styles.secondary, padding: '4px 8px', fontSize: '11px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /><span>Ver</span>
                    </button>
                  )}
                </div>
              </div>
              {report.note && <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{report.note}"</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', background: 'var(--chip-bg)', padding: '6px 8px', borderRadius: '6px' }}>
                {(report.items || []).map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                    <span>{item.name || item.free_text_name}</span>
                    <span style={{ fontWeight: 600 }}>{quantityWithUnit(item.quantity, item.unit)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
