import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

export default function PendingActionCard({ action, onApprove, onCancel, disabled = false }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [processing, setProcessing] = useState(false);

  const status = action.status || (isExpired ? 'expired' : 'pending');

  useEffect(() => {
    if (!action.expires_at || status !== 'pending') return;

    const updateCountdown = () => {
      const diff = new Date(action.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Vencido');
      } else {
        const minutes = Math.floor(diff / 60000);
        if (minutes > 0) {
          setTimeLeft(`Vence en ${minutes} min`);
        } else {
          setTimeLeft('Vence en menos de 1 min');
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [action.expires_at, status]);

  const handleApprove = async () => {
    if (processing || disabled || status !== 'pending') return;
    setProcessing(true);
    try {
      await onApprove(action.token);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (processing || disabled || status !== 'pending') return;
    setProcessing(true);
    try {
      await onCancel(action.token);
    } finally {
      setProcessing(false);
    }
  };

  const isTerminal = ['done', 'success', 'cancelled', 'expired', 'error'].includes(status);

  return (
    <div className="pending-action-card" role="region" aria-label="Acción pendiente">
      <div className="action-header">
        <span className={`action-badge badge-${status === 'success' ? 'done' : status}`}>
          {status === 'pending' && 'Acción requerida'}
          {(status === 'done' || status === 'success') && 'Hecho'}
          {status === 'cancelled' && 'Cancelado'}
          {status === 'expired' && 'Vencido'}
          {status === 'error' && 'No se pudo'}
        </span>
        {status === 'pending' && timeLeft && (
          <span className="action-expiry">
            <Clock size={12} className="action-icon-inline" aria-hidden="true" />
            {timeLeft}
          </span>
        )}
      </div>

      <p className="action-summary">{action.summary}</p>

      {action.result && (
        <div className="action-result-text">
          {action.result}
        </div>
      )}

      {action.error && (
        <div className="action-error-text">
          <AlertCircle size={14} className="action-icon-inline" aria-hidden="true" />
          {action.error}
        </div>
      )}

      {!isTerminal && (
        <div className="action-buttons">
          <button
            type="button"
            className="btn-pill btn-approve"
            disabled={processing || disabled}
            onClick={handleApprove}
          >
            <Check size={16} aria-hidden="true" />
            <span>{processing ? 'Procesando...' : 'Aprobar'}</span>
          </button>
          <button
            type="button"
            className="btn-pill btn-cancel"
            disabled={processing || disabled}
            onClick={handleCancel}
          >
            <X size={16} aria-hidden="true" />
            <span>Cancelar</span>
          </button>
        </div>
      )}
    </div>
  );
}
