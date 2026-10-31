import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Award, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { getSalesStaff } from '../../services/salesClient';
import { formatUsd } from '../../services/money';
import RunfoodStaffAliases from './RunfoodStaffAliases';

/**
 * Ranking de ventas por empleado en el rango seleccionado (Brief 27p).
 */
export default function SalesStaffRanking({ from, to, enabled = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aliasesOpen, setAliasesOpen] = useState(false);

  const loadRanking = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);

    const res = await getSalesStaff({ from, to });
    setLoading(false);
    if (res.ok) {
      setData(res.data);
    } else {
      setError(res.error || 'No se pudo cargar el ranking del personal.');
    }
  }, [from, to]);

  useEffect(() => {
    if (enabled) {
      loadRanking();
    }
  }, [enabled, loadRanking]);

  // Ordenar empleados por total descendente
  const sortedStaff = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.empleados || data?.data || []);
    return [...list].sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
  }, [data]);

  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Cabecera del ranking */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Ranking del personal
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setAliasesOpen(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <UserCheck size={14} color="var(--accent)" />
            <span>Nombres del personal</span>
          </button>

          <button
            type="button"
            onClick={loadRanking}
            aria-label="Actualizar ranking del personal"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando ranking del personal...
        </div>
      ) : error ? (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} color="var(--error)" />
            <span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadRanking}
            style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            <RefreshCw size={12} /><span>Reintentar</span>
          </button>
        </div>
      ) : sortedStaff.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay datos de ventas por personal para este periodo.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedStaff.map((emp, index) => {
            const rawPart = emp.participacion != null ? Number(emp.participacion) : null;
            const partPct = rawPart != null && !Number.isNaN(rawPart) ? Math.min(Math.max(rawPart, 0), 100) : 0;
            const empName = emp.nombre || (emp.runfood_user_id === 0 ? 'Sin usuario' : `Usuario ${emp.runfood_user_id || ''}`);
            const ticketText = emp.ticket_promedio != null ? formatUsd(emp.ticket_promedio) : '-';
            const propinaText = emp.propina != null ? formatUsd(emp.propina) : '-';

            let anulText = 'No disponible';
            if (emp.anulados != null && typeof emp.anulados === 'object') {
              anulText = emp.anulados.total != null
                ? `${emp.anulados.pedidos ?? 0} (${formatUsd(emp.anulados.total)})`
                : 'No disponible';
            } else if (emp.anulados_pedidos != null || emp.anulados_total != null) {
              anulText = emp.anulados_total != null
                ? `${emp.anulados_pedidos ?? 0} (${formatUsd(emp.anulados_total)})`
                : 'No disponible';
            }

            return (
              <div
                key={emp.runfood_user_id ?? index}
                style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {index + 1}. {empName}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                    {formatUsd(emp.total || '0.00')}
                  </span>
                </div>

                {/* Barra de participación */}
                <div
                  role="progressbar"
                  aria-valuenow={partPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Participación de ${empName}`}
                  style={{ width: '100%', height: '6px', borderRadius: '9999px', background: 'var(--surface-soft)', overflow: 'hidden' }}
                >
                  <div style={{ width: `${partPct}%`, height: '100%', background: 'var(--accent)', borderRadius: '9999px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{emp.pedidos ?? 0} pedidos</span>
                  {rawPart != null && <span>{rawPart}% part.</span>}
                  <span>Ticket: {ticketText}</span>
                  {emp.mesas != null && <span>Mesas: {emp.mesas}</span>}
                  <span>Propina: {propinaText}</span>
                  <span>Anulaciones: {anulText}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de asignación de alias */}
      <RunfoodStaffAliases
        isOpen={aliasesOpen}
        onClose={() => setAliasesOpen(false)}
        onAliasUpdated={loadRanking}
      />
    </div>
  );
}
