import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { changePassword } from '../services/accountClient';

const EMPTY_FORM = {
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
};

function validateForm(form) {
  if (!form.currentPassword) return 'Escribe tu contraseña actual.';
  if (form.password.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(form.password) || !/\d/.test(form.password)) {
    return 'La nueva contraseña debe incluir letras y números.';
  }
  if (form.password !== form.passwordConfirmation) return 'Las contraseñas nuevas no coinciden.';
  return null;
}

export default function ChangePasswordView({
  forced = false,
  fullScreen = false,
  embedded = false,
  onSuccess,
  onCancel,
  onLogout,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    const res = await changePassword(form);
    setSaving(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo cambiar la contraseña.');
      return;
    }

    setForm(EMPTY_FORM);
    if (onSuccess) await onSuccess();
  };

  const card = (
    <div className={embedded ? undefined : 'glass-card'} style={{ width: '100%', maxWidth: '440px', padding: embedded ? 0 : '24px', borderRadius: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
          <KeyRound size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            {forced ? 'Cambia tu contraseña temporal' : 'Cambiar contraseña'}
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            {forced ? 'Crea una contraseña solo tuya para continuar.' : 'Actualiza la contraseña de tu cuenta.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="password-current">Contraseña actual</label>
          <input id="password-current" className="form-input" type="password" autoComplete="current-password" value={form.currentPassword} onChange={handleChange('currentPassword')} disabled={saving} required />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="password-new">Nueva contraseña</label>
          <input id="password-new" className="form-input" type="password" autoComplete="new-password" value={form.password} onChange={handleChange('password')} disabled={saving} required />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="password-repeat">Repite la nueva contraseña</label>
          <input id="password-repeat" className="form-input" type="password" autoComplete="new-password" value={form.passwordConfirmation} onChange={handleChange('passwordConfirmation')} disabled={saving} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent)" aria-hidden="true" />
            <span>Mínimo 8 caracteres.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent)" aria-hidden="true" />
            <span>Debe incluir letras y números.</span>
          </div>
        </div>

        {error && (
          <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', border: '1px solid var(--error)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '12px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {saving && <Loader2 size={15} className="spin" aria-hidden="true" />}
          <span>Guardar contraseña</span>
        </button>

        {(onCancel || onLogout) && (
          <button type="button" onClick={onCancel || onLogout} className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '9999px', fontSize: '12px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {onLogout && !onCancel && <LogOut size={14} aria-hidden="true" />}
            <span>{onCancel ? 'Cancelar' : 'Salir'}</span>
          </button>
        )}
      </form>
    </div>
  );

  if (!fullScreen) return card;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'radial-gradient(circle at top right, var(--primary-glow), transparent 45%), radial-gradient(circle at bottom left, var(--accent-soft), transparent 45%)' }}>
      {card}
    </div>
  );
}
