import React, { useState } from 'react';
import { User, LogOut, Building } from 'lucide-react';
import { getUser, logout, isAuthenticated } from '../../services/auth';

/**
 * Sección de cuenta de usuario en Ajustes (Brief 34bp_fix).
 * Muestra únicamente datos reales sin respaldos inventados y pide confirmación antes de salir.
 */
export default function AccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const currentUser = getUser();
  const authenticated = isAuthenticated();

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '12px',
          letterSpacing: '0.5px',
        }}
      >
        Cuenta
      </h3>

      {authenticated && currentUser ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={20} color="#ffffff" />
            </div>
            <div>
              {currentUser.name && (
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                  {currentUser.name}
                </div>
              )}
              {(currentUser.business_name || currentUser.email) && (
                <div style={{ fontSize: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  {currentUser.business_name && (
                    <>
                      <Building size={12} />
                      <span>{currentUser.business_name}</span>
                    </>
                  )}
                  {currentUser.email && (
                    <span style={{ color: 'var(--text-muted)' }}>({currentUser.email})</span>
                  )}
                </div>
              )}
              {currentUser.role_title && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {currentUser.role_title}
                </div>
              )}
            </div>
          </div>

          {confirming ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>¿Cerrar sesión?</span>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleConfirmLogout}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--error)',
                  border: '1px solid rgba(244,63,94,0.3)',
                  background: 'rgba(244,63,94,0.1)',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  opacity: loggingOut ? 0.6 : 1,
                  fontWeight: 600,
                }}
              >
                {loggingOut ? 'Cerrando...' : 'Sí, cerrar'}
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setConfirming(false)}
                className="btn-secondary"
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--error)',
                border: '1px solid rgba(244,63,94,0.3)',
                background: 'rgba(244,63,94,0.1)',
                cursor: 'pointer',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          No hay sesión activa. Ingresa desde el módulo correspondiente.
        </div>
      )}
    </div>
  );
}
