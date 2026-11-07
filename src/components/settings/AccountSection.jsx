import React, { useState } from 'react';
import { User, LogOut, Building, KeyRound } from 'lucide-react';
import { getUser, logout, isAuthenticated } from '../../services/auth';
import ChangePasswordView from '../ChangePasswordView';
/** Sección de cuenta de usuario en Ajustes. */
export default function AccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
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

  const handlePasswordChanged = () => {
    setChangingPassword(false);
    setPasswordUpdated(true);
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
        <>
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
                <User size={20} color="var(--on-primary)" />
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

            {!changingPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {confirming ? (
                  <>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>¿Cerrar sesión?</span>
                    <button
                      type="button"
                      disabled={loggingOut}
                      onClick={handleConfirmLogout}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        color: 'var(--error)',
                        border: '1px solid var(--border-error)',
                        background: 'var(--error-soft-strong)',
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
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordUpdated(false);
                        setChangingPassword(true);
                      }}
                      className="btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        border: '1px solid var(--border-glass)',
                        background: 'var(--chip-bg)',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <KeyRound size={14} />
                      <span>Cambiar contraseña</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: 'var(--error)',
                        border: '1px solid var(--border-error)',
                        background: 'var(--error-soft-strong)',
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
                  </>
                )}
              </div>
            )}
          </div>

          {changingPassword && (
            <div style={{ marginTop: '16px' }}>
              <ChangePasswordView
                embedded
                onSuccess={handlePasswordChanged}
                onCancel={() => setChangingPassword(false)}
              />
            </div>
          )}

          {passwordUpdated && (
            <p role="status" style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--success)' }}>
              Contraseña actualizada.
            </p>
          )}
        </>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          No hay sesión activa. Ingresa desde el módulo correspondiente.
        </div>
      )}
    </div>
  );
}
