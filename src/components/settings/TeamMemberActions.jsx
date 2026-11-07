import React, { useState } from 'react';
import { MoreVertical, KeyRound, UserX, UserCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { deactivateMember, reactivateMember, resetMemberPassword } from '../../services/teamClient';
import { getUser } from '../../services/auth';
import TemporaryPasswordDialog from './TemporaryPasswordDialog';

const MENU_ITEM_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '9px 12px',
  border: 'none',
  background: 'none',
  color: 'var(--text-main)',
  fontSize: '12px',
  textAlign: 'left',
  cursor: 'pointer',
};

export default function TeamMemberActions({ member, onMemberUpdated }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [temporary, setTemporary] = useState(null);

  const currentUser = getUser();
  const isSelf = String(currentUser?.id) === String(member?.id);
  const isActive = member?.is_active !== false;

  const applyResult = (res) => {
    if (!res.ok) {
      setError(res.error || 'No se pudo completar la acción.');
      return false;
    }
    const updated = res.data?.data || res.data || null;
    if (updated && onMemberUpdated) onMemberUpdated(updated);
    return true;
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    setError(null);
    const res = await deactivateMember(member.id);
    setSubmitting(false);
    if (applyResult(res)) {
      setConfirming(false);
      setOpen(false);
    }
  };

  const handleReactivate = async () => {
    setSubmitting(true);
    setError(null);
    const res = await reactivateMember(member.id);
    setSubmitting(false);
    if (applyResult(res)) setOpen(false);
  };

  const handleResetPassword = async () => {
    setSubmitting(true);
    setError(null);
    const res = await resetMemberPassword(member.id);
    setSubmitting(false);
    if (!applyResult(res)) return;

    const password = res.data?.temporary_password;
    if (!password) {
      setError('El servidor no devolvió la contraseña temporal.');
      return;
    }
    setTemporary({ name: member.name, email: member.email, password });
    setOpen(false);
  };

  const closeMenu = () => {
    setOpen(false);
    setConfirming(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
      <button
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        aria-label={`Acciones para ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={submitting}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: submitting ? 'wait' : 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
      >
        {submitting ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <MoreVertical size={16} aria-hidden="true" />}
      </button>

      {open && (
        <div role="menu" aria-label={`Acciones para ${member.name}`} style={{ position: 'absolute', top: '28px', right: 0, zIndex: 20, minWidth: '190px', padding: '4px', borderRadius: '12px', background: 'var(--surface-strong)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-dialog)' }}>
          <button type="button" role="menuitem" onClick={handleResetPassword} disabled={submitting} style={MENU_ITEM_STYLE}>
            <KeyRound size={14} aria-hidden="true" />
            <span>Restablecer contraseña</span>
          </button>
          {isActive && !isSelf && (
            <button type="button" role="menuitem" onClick={() => setConfirming(true)} disabled={submitting} style={{ ...MENU_ITEM_STYLE, color: 'var(--error)' }}>
              <UserX size={14} aria-hidden="true" />
              <span>Desactivar</span>
            </button>
          )}
          {!isActive && (
            <button type="button" role="menuitem" onClick={handleReactivate} disabled={submitting} style={MENU_ITEM_STYLE}>
              <UserCheck size={14} aria-hidden="true" />
              <span>Reactivar</span>
            </button>
          )}
        </div>
      )}

      {confirming && (
        <div role="region" aria-label={`Confirmar desactivación de ${member.name}`} style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>
            {member.name} ya no podrá entrar. Puedes reactivarla después.
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '11px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleDeactivate} disabled={submitting} className="btn-primary" style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '11px', cursor: submitting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {submitting && <Loader2 size={12} className="spin" aria-hidden="true" />}
              <span>Sí, desactivar</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', border: '1px solid var(--error)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {temporary && (
        <TemporaryPasswordDialog
          name={temporary.name}
          email={temporary.email}
          password={temporary.password}
          onClose={() => setTemporary(null)}
        />
      )}
    </div>
  );
}
