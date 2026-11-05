import React from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePaymentMappings } from '../../hooks/usePaymentMappings';
import PaymentMappingCard from './PaymentMappingCard';
import PaymentMappingGroup from './PaymentMappingGroup';
import PaymentMappingDialog from './PaymentMappingDialog';

const TEXTO_OTRAS =
  'RunFood las tiene en su catálogo (muchas son códigos de impuestos del SRI), pero el local no cobró con ellas. Déjalas sin asignar: no afectan el cierre.';

const LISTA = { display: 'flex', flexDirection: 'column', gap: '10px' };

/**
 * Aviso de estado (Brief 43p): cuántas formas con cobros faltan por asignar, o
 * que todo está listo.
 */
function AvisoDeEstado({ pendientes }) {
  const falta = pendientes > 0;
  const Icono = falta ? AlertCircle : CheckCircle2;

  return (
    <div
      role="status"
      style={{
        padding: '8px 12px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        background: falta ? 'var(--warning-soft)' : 'var(--success-soft)',
        border: falta ? '1px solid var(--border-warning)' : '1px solid var(--border-success)',
        color: falta ? 'var(--warning)' : 'var(--success)'
      }}
    >
      <Icono size={16} aria-hidden="true" />
      <span>
        {falta
          ? `Falta asignar ${pendientes} forma(s) con cobros. Hasta que lo hagas, el cierre de esos días queda para revisión.`
          : 'Todo listo: todas las formas con cobros tienen su casilla.'}
      </span>
    </div>
  );
}

function Encabezado({ loading, onRefresh }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Formas de pago de RunFood</h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Dile a Ualdo en qué casilla del cierre va cada forma con la que cobra el local.
        </span>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Actualizar formas de pago"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
      >
        <RefreshCw size={14} className={loading ? 'spin' : ''} />
      </button>
    </div>
  );
}

function Mensajes({ successBanner, error }) {
  return (
    <>
      {successBanner && (
        <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '12px' }}>
          {successBanner}
        </div>
      )}
      {error && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </>
  );
}

function Grupos({ enUso, otras, submitting, onAccept, onChange }) {
  const pendientes = enUso.filter(m => m.bucket === 'sin_mapear' && m.ultimo_arqueo != null).length;
  const tarjeta = (m, uso) => (
    <PaymentMappingCard key={m.id} mapping={m} enUso={uso} submitting={submitting} onAccept={onAccept} onChange={onChange} />
  );

  return (
    <>
      <AvisoDeEstado pendientes={pendientes} />

      <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Con cobros</h5>
        {enUso.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Todavía no hay cobros recientes de RunFood.</p>
        ) : (
          <div style={LISTA}>{enUso.map(m => tarjeta(m, true))}</div>
        )}
      </section>

      {otras.length > 0 && (
        <PaymentMappingGroup title={`Otras formas de RunFood (${otras.length})`} description={TEXTO_OTRAS}>
          {otras.map(m => tarjeta(m, false))}
        </PaymentMappingGroup>
      )}
    </>
  );
}

export default function PaymentMappingsPanel() {
  const {
    mappings,
    enUso,
    otras,
    loading,
    error,
    successBanner,
    submitting,
    selectedMapping,
    targetBucket,
    setTargetBucket,
    confirmStep,
    setConfirmStep,
    fetchMappings,
    handleAcceptSuggestion,
    openChangeModal,
    closeChangeModal,
    confirmAndSave,
    applyBucketAssignment
  } = usePaymentMappings();

  let contenido;

  if (loading && mappings.length === 0) {
    contenido = (
      <div style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
        Cargando formas de pago...
      </div>
    );
  } else if (mappings.length === 0) {
    contenido = (
      <div className="glass-card" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        No hay formas de pago registradas.
      </div>
    );
  } else {
    contenido = (
      <Grupos enUso={enUso} otras={otras} submitting={submitting} onAccept={handleAcceptSuggestion} onChange={openChangeModal} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Encabezado loading={loading} onRefresh={fetchMappings} />
      <Mensajes successBanner={successBanner} error={error} />
      {contenido}

      {selectedMapping && (
        <PaymentMappingDialog
          mapping={selectedMapping}
          targetBucket={targetBucket}
          setTargetBucket={setTargetBucket}
          confirmStep={confirmStep}
          setConfirmStep={setConfirmStep}
          submitting={submitting}
          onClose={closeChangeModal}
          onSave={confirmAndSave}
          onApply={applyBucketAssignment}
        />
      )}
    </div>
  );
}
