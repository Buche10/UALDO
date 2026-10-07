import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Calendar, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { getClose } from '../../services/cashCloseClient';
import { formatUsd } from '../../services/money';
import CashCloseReviewForm from './CashCloseReviewForm';
import CashCloseClosedActions from './CashCloseClosedActions';
import CashMovementsPanel from './CashMovementsPanel';
import CashCloseManualForm from './CashCloseManualForm';

const SUGGESTED_ACTIONS = {
  sin_conteo_efectivo: 'Cuenta el efectivo y cárgalo abajo.',
  diferencia_efectivo: 'Vuelve a contar o revisa si falta registrar un movimiento de caja. Si la diferencia es real, confirma forzando con un motivo.',
  formas_sin_mapear: 'Se resuelve configurando las formas de pago en el motor.',
  falta_comision: 'Se resuelve configurando las tasas de comisión en el motor.',
  arqueo_vs_ventas: 'Revisa si hay un anticipo o reserva en RunFood. Si es correcto, confirma forzando con un motivo.',
  sin_cierre_runfood: 'Cierra el turno en RunFood si es posible; la siguiente foto lo reevaluará.',
  sin_datos_runfood: 'Revisa que el PC del local esté encendido y con internet.',
  runfood_cambio_tras_cierre: 'Verifica el cambio en RunFood y reabre el día si corresponde.'
};

export default function CashCloseDetail({ fecha, onBack }) {
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getClose(fecha);
    setLoading(false);

    if (res.ok) {
      const item = Array.isArray(res.data?.data) ? res.data.data[0] || null : res.data?.data || res.data || null;
      setCierre(item);
      if (!item) setShowManualForm(false);
    } else {
      setError(res.error || 'Error al cargar el detalle del cierre.');
    }
  }, [fecha]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando cierre de caja...</div>;
  }

  if (error && !cierre) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <ArrowLeft size={16} /><span>Volver a la lista</span>
          </button>
          <button type="button" onClick={loadData} aria-label="Recargar día" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', borderRadius: '9999px', padding: '6px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
        </div>
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>
      </div>
    );
  }

  if (showManualForm || (!cierre && !loading)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <ArrowLeft size={16} /><span>Volver a la lista</span>
        </button>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>No existe un cierre registrado para el {fecha}.</p>
          <CashCloseManualForm initialFecha={fecha} onCancel={onBack} onSuccess={newItem => { setCierre(newItem); setShowManualForm(false); }} onSwitchToDetail={() => { setShowManualForm(false); loadData(); }} />
        </div>
      </div>
    );
  }

  const isReview = cierre.status === 'revision';
  const diffNumber = Number(cierre.diferencia_efectivo);
  const diffPositive = Number.isFinite(diffNumber) && diffNumber >= 0;
  const snapshotTime = cierre.snapshot?.captured_at ? new Date(cierre.snapshot.captured_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <ArrowLeft size={16} /><span>Volver a la lista</span>
        </button>
        <button type="button" onClick={loadData} aria-label="Recargar día" style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', borderRadius: '9999px', padding: '6px', color: 'var(--text-main)', cursor: 'pointer' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {error && <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: isReview ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)', background: isReview ? 'var(--warning-soft)' : 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--accent)" /><strong style={{ fontSize: '16px' }}>{cierre.fecha}</strong>
            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: isReview ? 'var(--warning-soft)' : 'var(--success-soft)', color: isReview ? 'var(--warning)' : 'var(--success)', border: isReview ? '1px solid var(--border-warning)' : '1px solid var(--border-success)' }}>
              {isReview ? 'En revisión' : cierre.auto_cerrado ? 'Cerrado solo' : 'Cerrado'}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cierre.source === 'runfood' && snapshotTime ? `RunFood, foto de las ${snapshotTime}` : 'Manual'}</span>
        </div>
        {cierre.auto_cerrado && <span style={{ fontSize: '12px', color: 'var(--success)' }}>Cerrado automáticamente</span>}
        {cierre.reopened_at && <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Reabierto el {cierre.reopened_at}</span>}
        {cierre.forced_reason && <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Forzado: {cierre.forced_reason}</span>}
        {cierre.sheets_status && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}><FileSpreadsheet size={13} /><span>Sheets: {cierre.sheets_status}</span></div>}
      </div>

      {Array.isArray(cierre.discrepancias) && cierre.discrepancias.length > 0 && (
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border-warning)' }}>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} /><span>Motivos de revisión ({cierre.discrepancias.length})</span>
          </h4>
          {cierre.discrepancias.map((d, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{d.motivo || d.detalle || d.tipo}</div>
              {SUGGESTED_ACTIONS[d.tipo] && <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>{SUGGESTED_ACTIONS[d.tipo]}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Ventas del Día</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Efectivo: </span><strong>{formatUsd(cierre.efectivo)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Pichincha: </span><strong>{formatUsd(cierre.pichincha)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>De Una: </span><strong>{formatUsd(cierre.de_una)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Internacional: </span><strong>{formatUsd(cierre.internacional)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Crédito: </span><strong>{formatUsd(cierre.credito)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Débito: </span><strong>{formatUsd(cierre.debito)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Diners (bruto/neto): </span><strong>{formatUsd(cierre.diners)} / {formatUsd(cierre.diners_neto)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Tarjeta neto: </span><strong>{formatUsd(cierre.tarjeta_neto)}</strong> <span style={{ fontSize: '10px', color: 'var(--accent)' }}>({cierre.neto_tarjetas_origen || 'pendiente'})</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Pedidos Ya: </span><strong>{formatUsd(cierre.pedidos_ya)} / {formatUsd(cierre.pedidos_ya_neto)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Propinas: </span><strong>{formatUsd(cierre.propinas)}</strong></div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total ventas del día:</span>
          <strong style={{ color: 'var(--accent)' }}>{formatUsd(cierre.ventas_del_dia)}</strong>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Efectivo en Caja</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Declarado: </span><strong>{formatUsd(cierre.efectivo_declarado)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Contado: </span><strong>{formatUsd(cierre.efectivo_contado)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Esperado: </span><strong>{formatUsd(cierre.efectivo_esperado)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Diferencia: </span><strong style={{ color: diffPositive ? 'var(--success)' : 'var(--error)' }}>{formatUsd(cierre.diferencia_efectivo)}</strong></div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Valor en cuentas:</span>
        <strong style={{ fontSize: '13px' }}>{formatUsd(cierre.valor_en_cuentas)}</strong>
      </div>

      {cierre.observacion && (
        <div className="glass-card" style={{ padding: '12px 16px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Observación:</span>
          <span>{cierre.observacion}</span>
        </div>
      )}

      {cierre.status !== 'cerrado' ? (
        <CashCloseReviewForm cierre={cierre} onUpdated={setCierre} onReload={loadData} />
      ) : (
        <CashCloseClosedActions cierre={cierre} onUpdated={setCierre} />
      )}

      <CashMovementsPanel fecha={fecha} onMovementChanged={loadData} />
    </div>
  );
}
