import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Ban, MapPin, Scissors, ArrowLeftRight } from 'lucide-react';
import { useLotDetail } from '../../hooks/useLotDetail';
import LotTraceSummary from './LotTraceSummary';
import LotBalances from './LotBalances';
import LotProductions from './LotProductions';
import LotMovements from './LotMovements';
import MarkUnfitDialog from './MarkUnfitDialog';

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={14} color="var(--accent)" />
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

/** Trazabilidad completa de un lote (Brief 40p). */
export default function LotDetail({ lotId, canManage, canSeeCosts, onBack, onChanged }) {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const { lot, loading, error, reload } = useLotDetail(lotId, page);

  const handleChanged = async () => {
    setNotice('Lote marcado no apto. Todo su saldo salió como merma.');
    setDialogOpen(false);
    await reload();
    if (onChanged) onChanged();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <ArrowLeft size={16} />
          <span>Volver a lotes</span>
        </button>
        <button type="button" onClick={reload} aria-label="Actualizar lote" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div aria-live="polite">
        {notice && (
          <div style={{ padding: '9px 12px', borderRadius: '9px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ padding: '9px 12px', borderRadius: '9px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>

      {loading && !lot ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando el lote...</div>
      ) : !lot ? null : (
        <>
          <LotTraceSummary lot={lot} canSeeCosts={canSeeCosts} />

          <Section icon={MapPin} title="Saldos por ubicación y producto">
            <LotBalances balances={lot.balances} />
          </Section>

          <Section icon={Scissors} title="Porcionados">
            <LotProductions productions={lot.productions} canSeeCosts={canSeeCosts} />
          </Section>

          <Section icon={ArrowLeftRight} title="Movimientos">
            <LotMovements movements={lot.movements} page={page} onPage={(next) => setPage(Math.max(1, next))} />
          </Section>

          {canManage && lot.status !== 'no_apto' && (
            <button type="button" onClick={() => setDialogOpen(true)} style={{ padding: '10px', borderRadius: '9999px', border: '1px solid var(--border-error)', background: 'var(--error-soft)', color: 'var(--error)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Ban size={15} />
              <span>Marcar no apto</span>
            </button>
          )}

          <MarkUnfitDialog
            isOpen={dialogOpen}
            lot={lot}
            onClose={() => setDialogOpen(false)}
            onDone={handleChanged}
          />
        </>
      )}
    </div>
  );
}
