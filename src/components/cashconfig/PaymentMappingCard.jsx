import React from 'react';
import { BUCKET_LABELS } from '../../services/cashConfigClient';
import { formatUsd } from '../../services/money';

const NOTA_TARJETA =
  'RunFood junta crédito y débito en esta forma. Ualdo usa la tasa de la casilla elegida; el neto real se ajusta al revisar el cierre.';

const CHIP_BASE = { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px' };

const CHIP_AVISO = {
  ...CHIP_BASE,
  background: 'var(--warning-soft)',
  color: 'var(--warning)',
  border: '1px solid var(--border-warning)'
};

const CHIP_NEUTRO = {
  ...CHIP_BASE,
  background: 'var(--surface-soft)',
  color: 'var(--text-main)',
  border: '1px solid var(--border-glass)'
};

const CHIP_SIN_USO = { ...CHIP_NEUTRO, color: 'var(--text-muted)' };

const TAG = { fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--surface-soft)', color: 'var(--text-muted)' };

/**
 * Etiqueta de estado de la forma (Brief 43p): "Falta asignar" si cobra y no
 * tiene casilla, "Sin uso" en el grupo de otras formas, o la casilla elegida.
 */
function estadoDeForma(mapping, enUso) {
  if (!enUso) {
    return { texto: 'Sin uso', estilo: CHIP_SIN_USO };
  }

  if (mapping.bucket === 'sin_mapear') {
    return { texto: 'Falta asignar', estilo: CHIP_AVISO };
  }

  return { texto: BUCKET_LABELS[mapping.bucket] || mapping.bucket, estilo: CHIP_NEUTRO };
}

function LineaDeCobros({ mapping }) {
  return (
    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
      {mapping.ultimo_arqueo ? (
        <span>Último cobro: {formatUsd(mapping.ultimo_arqueo.monto)} ({mapping.ultimo_arqueo.business_date})</span>
      ) : (
        <span>Sin movimientos recientes</span>
      )}
    </div>
  );
}

function Sugerencia({ mapping, submitting, onAccept }) {
  return (
    <div style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div style={{ fontSize: '11px' }}>
        <span style={{ color: 'var(--accent)' }}>Sugerido: {BUCKET_LABELS[mapping.suggested_bucket] || mapping.suggested_bucket}</span>
        {mapping.suggested_note && <span style={{ color: 'var(--text-muted)' }}> ({mapping.suggested_note})</span>}
      </div>
      <button
        type="button"
        onClick={() => onAccept(mapping)}
        disabled={submitting}
        className="btn-primary"
        style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Aceptar sugerencia
      </button>
    </div>
  );
}

/**
 * Tarjeta de una forma de pago de RunFood (Brief 43p).
 *
 * @param {{ mapping: Object, enUso: boolean, submitting: boolean, onAccept: Function, onChange: Function }} props
 */
export default function PaymentMappingCard({ mapping, enUso, submitting, onAccept, onChange }) {
  const pendiente = enUso && mapping.bucket === 'sin_mapear';
  const hasSuggestion = Boolean(mapping.suggested_bucket && !mapping.confirmado);
  const juntaTarjetas = mapping.es_tarjeta && ['credito', 'debito'].includes(mapping.bucket);
  const estado = estadoDeForma(mapping, enUso);

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        border: pendiente ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)',
        background: pendiente ? 'var(--warning-soft)' : 'var(--bg-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600 }}>
            #{mapping.runfood_forma_pago_id} {mapping.descripcion_runfood}
          </span>
          {mapping.es_efectivo && <span style={TAG}>Efectivo</span>}
          {mapping.es_tarjeta && <span style={TAG}>Tarjeta</span>}
        </div>
        <span style={estado.estilo}>{estado.texto}</span>
      </div>

      {enUso && <LineaDeCobros mapping={mapping} />}

      {juntaTarjetas && (
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{NOTA_TARJETA}</p>
      )}

      {hasSuggestion && <Sugerencia mapping={mapping} submitting={submitting} onAccept={onAccept} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button
          type="button"
          onClick={() => onChange(mapping)}
          className="btn-secondary"
          style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)' }}
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}
