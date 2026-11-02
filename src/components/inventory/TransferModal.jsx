import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { useTransferSubmit } from '../../hooks/useTransferSubmit';
import { formatQuantity } from '../../services/quantityFormat';
import { emptyLotSelection } from '../../services/lotSelection';
import TransferFormFields from './TransferFormFields';

export default function TransferModal({ isOpen, item, onClose, onTransferSuccess }) {
  const [from, setFrom] = useState('warehouse');
  const [to, setTo] = useState('kitchen');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [lotSelection, setLotSelection] = useState(emptyLotSelection);

  const {
    submitting,
    error,
    fieldErrors,
    validationError,
    initUuid,
    submitTransfer,
  } = useTransferSubmit({ item, onClose, onTransferSuccess });

  useEffect(() => {
    if (isOpen) {
      initUuid();
      setFrom('warehouse');
      setTo('kitchen');
      setQuantity('');
      setReason('');
      setLotSelection(emptyLotSelection());
    }
  }, [isOpen, item, initUuid]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !item) return null;

  const availableInOrigin = formatQuantity(item.stock_by_location?.[from]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitTransfer({ from, to, quantity, reason, lotSelection });
  };

  const handleFromChange = (value) => {
    setFrom(value);
    setLotSelection(emptyLotSelection());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          background: 'var(--bg-glass)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 id="transfer-modal-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Transferir Stock
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              {item.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          aria-live="polite"
          style={{
            minHeight: error || validationError ? '16px' : '0px',
            padding: error || validationError ? '10px' : 0,
            borderRadius: '8px',
            background: error ? 'var(--error-soft)' : validationError ? 'var(--warning-soft)' : 'transparent',
            color: error ? 'var(--error)' : 'var(--warning)',
            fontSize: '12px',
            marginBottom: error || validationError ? '14px' : '0px',
            border: error ? '1px solid var(--border-error)' : validationError ? '1px solid var(--border-warning)' : 'none',
          }}
        >
          {error || validationError || null}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TransferFormFields
            item={item}
            from={from}
            to={to}
            quantity={quantity}
            reason={reason}
            fieldErrors={fieldErrors}
            availableInOrigin={availableInOrigin}
            lotSelection={lotSelection}
            disabled={submitting}
            onFromChange={handleFromChange}
            onToChange={setTo}
            onQuantityChange={setQuantity}
            onReasonChange={setReason}
            onLotChange={setLotSelection}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowRightLeft size={16} />
              <span>{submitting ? 'Transfiriendo...' : 'Transferir'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
