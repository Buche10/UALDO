import React from 'react';
import { Utensils, Award, Clock, CreditCard } from 'lucide-react';
import { formatUsd } from '../../services/money';
import { formatQuantity } from '../../services/quantityFormat';

/**
 * Desglose de platos top, personal top, hora pico y formas de pago del día (Brief 27p).
 */
export default function SalesDayTopLists({ summary }) {
  if (!summary) return null;

  const topPlatos = summary.top_platos;
  const topEmpleados = summary.top_empleados;
  const horaPico = summary.hora_pico;
  const formasPago = summary.formas_pago;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Platos más vendidos del día */}
      <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Utensils size={14} color="var(--accent)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Platos top del día</span>
        </div>
        {topPlatos == null ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No disponible</span>
        ) : topPlatos.length === 0 ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin platos registrados</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topPlatos.slice(0, 5).map((plato, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-main)' }}>
                  {idx + 1}. {plato.descripcion}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {formatQuantity(plato.cantidad)} u. &bull; {formatUsd(plato.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empleado que más vendió */}
      <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Award size={14} color="var(--accent)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Personal con más ventas</span>
        </div>
        {topEmpleados == null ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No disponible</span>
        ) : topEmpleados.length === 0 ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin empleados registrados</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topEmpleados.slice(0, 5).map((emp, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-main)' }}>
                  {idx + 1}. {emp.nombre || `Usuario ${emp.runfood_user_id || ''}`}
                  {emp.participacion ? ` (${emp.participacion}%)` : ''}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {emp.pedidos} ped. &bull; {formatUsd(emp.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hora pico y Formas de pago en rejilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {/* Hora pico */}
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Clock size={14} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Hora pico</span>
          </div>
          {horaPico == null ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No disponible</span>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
              <span>{horaPico.hora}:00 hrs</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({horaPico.pedidos} ped. &bull; {formatUsd(horaPico.total)})
              </span>
            </div>
          )}
        </div>

        {/* Formas de pago */}
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <CreditCard size={14} color="var(--accent)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Formas de pago</span>
          </div>
          {formasPago == null ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No disponible</span>
          ) : formasPago.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sin formas de pago</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {formasPago.map((fp, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-main)' }}>{fp.forma}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatUsd(fp.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
