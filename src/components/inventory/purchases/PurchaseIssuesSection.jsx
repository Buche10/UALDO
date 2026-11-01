import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, PackagePlus } from 'lucide-react';
import { getUser } from '../../../services/auth';
import { can, ABILITIES } from '../../../services/permissions';
import { money, styles } from './purchaseUi';
import ResolveLineModal from './ResolveLineModal';
import ReceiveExtraModal from './ReceiveExtraModal';

const RESOLUTION_LABELS = {
  proveedor_completa: 'Proveedor completa',
  nota_de_credito: 'Nota de crédito',
  error_de_pesaje: 'Error de pesaje',
  aceptado: 'Aceptado',
};

export default function PurchaseIssuesSection({ purchase, onReload }) {
  const [resolvingLine, setResolvingLine] = useState(null);
  const [extraLine, setExtraLine] = useState(null);

  const currentUser = getUser();
  const canManage = can(currentUser, ABILITIES.PURCHASES_MANAGE);
  const canReceive = can(currentUser, ABILITIES.PURCHASES_RECEIVE);
  const canSeeCosts = can(currentUser, ABILITIES.INVENTORY_COSTS);

  const issueLines = (purchase.lines || []).filter(
    (line) => line.receipt_status === 'difference' || line.resolution || Math.abs(Number(line.difference_quantity || 0)) > 0.0001
  );

  if (issueLines.length === 0) return null;

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '3px solid var(--warning)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertCircle size={15} color="var(--warning)" />
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
          Por aclarar
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {issueLines.map((line) => {
          const isResolved = Boolean(line.resolution);
          const canDeliverRest = line.resolution === 'proveedor_completa' && line.receipt_status === 'difference';

          return (
            <div
              key={line.id}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{line.item_name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Facturado: {line.quantity} {line.unit} &bull; Recibido: {line.received_quantity ?? 0} {line.unit}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)' }}>
                    Diferencia: {line.difference_quantity} {line.unit}
                  </div>
                  {canSeeCosts && line.difference_value_cents !== null && line.difference_value_cents !== undefined && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Valor: {money(line.difference_value_cents / 100)}
                    </div>
                  )}
                </div>
              </div>

              {isResolved ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    <span>Resuelto: {RESOLUTION_LABELS[line.resolution] || line.resolution}</span>
                    {line.resolution_note ? ` - "${line.resolution_note}"` : ''}
                  </div>
                  {canDeliverRest && canReceive && (
                    <button
                      type="button"
                      onClick={() => setExtraLine(line)}
                      className="btn-secondary"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <PackagePlus size={12} />
                      <span>Llegó el resto</span>
                    </button>
                  )}
                </div>
              ) : (
                canManage && (
                  <button
                    type="button"
                    onClick={() => setResolvingLine(line)}
                    className="btn-primary"
                    style={{
                      alignSelf: 'flex-end',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Resolver
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {resolvingLine && (
        <ResolveLineModal
          isOpen={Boolean(resolvingLine)}
          purchaseId={purchase.id}
          line={resolvingLine}
          onClose={() => setResolvingLine(null)}
          onResolved={onReload}
        />
      )}

      {extraLine && (
        <ReceiveExtraModal
          isOpen={Boolean(extraLine)}
          purchaseId={purchase.id}
          line={extraLine}
          onClose={() => setExtraLine(null)}
          onReceived={onReload}
        />
      )}
    </div>
  );
}
