import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Calendar, User } from 'lucide-react';
import { getUser } from '../../../services/auth';
import { can, ABILITIES } from '../../../services/permissions';
import { formatUsd } from '../../../services/money';
import { getDeclaration, DIFFERENCE_CAUSE_LABELS } from '../../../services/cashCloseClient';
import CashDeclarationForm from './CashDeclarationForm';

const getStatusBadge = (estado) => {
  if (estado === 'cerrado') {
    return {
      label: 'Cerrado',
      style: { background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid var(--border-success)' },
    };
  }
  if (estado === 'revision') {
    return {
      label: 'En revisión',
      style: { background: 'var(--warning-soft)', color: 'var(--warning)', border: '1px solid var(--border-warning)' },
    };
  }
  return {
    label: 'Por declarar',
    style: { background: 'var(--surface-soft)', color: 'var(--text-muted)', border: '1px solid var(--border-glass)' },
  };
};

export default function CashDeclarationView({ onBack, fechaInicial = null }) {
  const [currentUser] = useState(() => getUser());
  const canRegister = can(currentUser, ABILITIES.CASH_REGISTER);
  const [selectedDate, setSelectedDate] = useState(() => (fechaInicial === 'ayer' ? 'ayer' : 'hoy'));
  const [declaration, setDeclaration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState(null);

  const fetchDeclaration = useCallback(async (fechaToLoad) => {
    if (!canRegister) return;
    setLoading(true);
    setError(null);

    const res = await getDeclaration(fechaToLoad);
    setLoading(false);

    if (res.ok) {
      setDeclaration(res.data?.data || res.data);
    } else {
      setError(res.error || 'No se pudo cargar la información del cierre.');
    }
  }, [canRegister]);

  useEffect(() => {
    if (canRegister) {
      fetchDeclaration(selectedDate);
    }
  }, [canRegister, selectedDate, fetchDeclaration]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setResultMessage(null);
  };

  const handleSuccess = (msg) => {
    setResultMessage(msg);
    fetchDeclaration(selectedDate);
  };

  if (!canRegister) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={32} color="var(--warning)" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Acceso Restringido</h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Esta sección le corresponde al jefe de salón.
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className="btn-secondary" style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '9999px', fontSize: '12px' }}>
            Volver
          </button>
        )}
      </div>
    );
  }

  const estado = declaration?.estado || 'borrador';
  const badge = getStatusBadge(estado);
  const isClosedOrReview = estado === 'cerrado' || estado === 'revision';
  const declaredBy = typeof declaration?.declared_by === 'object' ? declaration.declared_by?.name : declaration?.declared_by;
  const mediosList = Array.isArray(declaration?.medios) ? declaration.medios : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} />
            <span>Volver a módulos</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Mi cierre de caja</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Declaración de efectivo y medios de pago
          </p>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-soft)', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-glass)' }}>
          <button
            type="button"
            onClick={() => handleDateChange('hoy')}
            style={{ padding: '6px 14px', borderRadius: '9999px', border: 'none', background: selectedDate === 'hoy' ? 'var(--accent)' : 'transparent', color: selectedDate === 'hoy' ? 'var(--bg-dark)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => handleDateChange('ayer')}
            style={{ padding: '6px 14px', borderRadius: '9999px', border: 'none', background: selectedDate === 'ayer' ? 'var(--accent)' : 'transparent', color: selectedDate === 'ayer' ? 'var(--bg-dark)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Ayer
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{declaration?.fecha || selectedDate}</span>
          <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, ...badge.style }}>
            {badge.label}
          </span>
        </div>

        {declaredBy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <User size={13} />
            <span>Declarado por: <strong style={{ color: 'var(--text-main)' }}>{declaredBy}</strong></span>
          </div>
        )}
      </div>

      {resultMessage && (
        <div role="status" style={{ padding: '12px 14px', borderRadius: '12px', background: estado === 'cerrado' ? 'var(--success-soft)' : 'var(--warning-soft)', border: `1px solid ${estado === 'cerrado' ? 'var(--border-success)' : 'var(--border-warning)'}`, color: estado === 'cerrado' ? 'var(--success)' : 'var(--warning)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {estado === 'cerrado' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <strong style={{ fontSize: '13px' }}>{resultMessage}</strong>
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando cierre de caja...
        </div>
      ) : isClosedOrReview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Resumen declarado</h4>
            {mediosList.map((m) => (
              <div key={m.medio} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                <span style={{ textTransform: 'capitalize' }}>{m.etiqueta || m.medio}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Esp: {formatUsd(m.esperado)}</span>
                  <span>Decl: <strong>{formatUsd(m.declarado)}</strong></span>
                </div>
              </div>
            ))}
            {estado === 'revision' && declaration?.difference_cause && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--warning)' }}>
                <div><strong>Causa: </strong>{DIFFERENCE_CAUSE_LABELS[declaration.difference_cause] || declaration.difference_cause}</div>
                {declaration.difference_explanation && <div><strong>Explicación: </strong>{declaration.difference_explanation}</div>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <CashDeclarationForm declaration={declaration} fecha={selectedDate} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
