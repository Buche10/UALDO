import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { useTransferSubmit } from '../../hooks/useTransferSubmit';
import { INVENTORY_LOCATIONS } from '../../services/inventoryLocations';
import { formatQuantity } from '../../services/quantityFormat';

export default function TransferModal({ isOpen, item, onClose, onTransferSuccess }) {
  const [from, setFrom] = useState('warehouse');
  const [to, setTo] = useState('kitchen');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

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
    submitTransfer({ from, to, quantity, reason });
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="transfer-from-select" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Origen
              </label>
              <select
                id="transfer-from-select"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              >
                {INVENTORY_LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-to-select" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Destino
              </label>
              <select
                id="transfer-to-select"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
              >
                {INVENTORY_LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Disponible en el origen: </span>
            <strong style={{ color: 'var(--accent)' }}>{availableInOrigin} {item.unit || ''}</strong>
          </div>

          <div>
            <label htmlFor="transfer-quantity-input" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Cantidad a transferir ({item.unit || 'unidades'})
            </label>
            <input
              id="transfer-quantity-input"
              type="text"
              inputMode="decimal"
              placeholder="Ej: 2.500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
            {fieldErrors.quantity && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.quantity) ? fieldErrors.quantity.join(', ') : fieldErrors.quantity}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="transfer-reason-input" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Motivo o nota (opcional)
            </label>
            <input
              id="transfer-reason-input"
              type="text"
              placeholder="Ej: Reposición de cocina"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
            {fieldErrors.reason && (
              <span style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
                {Array.isArray(fieldErrors.reason) ? fieldErrors.reason.join(', ') : fieldErrors.reason}
              </span>
            )}
          </div>

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
