import React, { useState } from 'react';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { createMember } from '../../services/teamClient';
import { ABILITIES, ROLE_LABELS, ROLES, can } from '../../services/permissions';
import { getUser } from '../../services/auth';
import TemporaryPasswordDialog from './TemporaryPasswordDialog';

const ROLE_OPTIONS = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.KITCHEN_HEAD,
  ROLES.LOUNGE_HEAD,
  ROLES.KITCHEN_STAFF,
  ROLES.LOUNGE_STAFF,
  ROLES.STAFF,
].map((value) => ({ value, label: ROLE_LABELS[value] }));

const EMPTY_FORM = { name: '', email: '', role: ROLES.LOUNGE_STAFF };

const EMAIL_HELP = 'Si la persona no tiene correo, usa uno inventado con el dominio del negocio, por ejemplo maria@doblefilo.ualdocorp.com. No se envía nada a ese correo.';

export default function TeamCreateForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [temporary, setTemporary] = useState(null);

  if (!can(getUser(), ABILITIES.TEAM_MANAGE)) return null;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const res = await createMember(form);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'No se pudo crear la cuenta.');
      setFieldErrors(res.data?.errors || {});
      return;
    }

    const member = res.data?.data || res.data || null;
    const password = res.data?.temporary_password;
    if (!password) {
      setError('El servidor no devolvió la contraseña temporal.');
      return;
    }

    setTemporary({
      name: member?.name || form.name,
      email: member?.email || form.email,
      password,
    });
    setForm(EMPTY_FORM);
    if (onCreated && member) onCreated(member);
  };

  const fieldError = (field) => fieldErrors?.[field]?.[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary"
          style={{ alignSelf: 'flex-start', padding: '9px 18px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <UserPlus size={15} aria-hidden="true" />
          <span>Crear cuenta</span>
        </button>
      )}

      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="team-create-name">Nombre</label>
            <input id="team-create-name" className="form-input" type="text" autoComplete="off" value={form.name} onChange={handleChange('name')} required />
            {fieldError('name') && <span role="alert" style={{ fontSize: '11px', color: 'var(--error)' }}>{fieldError('name')}</span>}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="team-create-email">Correo</label>
            <input id="team-create-email" className="form-input" type="email" autoComplete="off" value={form.email} onChange={handleChange('email')} required />
            {fieldError('email') && <span role="alert" style={{ fontSize: '11px', color: 'var(--error)' }}>{fieldError('email')}</span>}
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{EMAIL_HELP}</p>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="team-create-role">Cargo</label>
            <select id="team-create-role" className="form-input" value={form.role} onChange={handleChange('role')} disabled={submitting}>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {fieldError('role') && <span role="alert" style={{ fontSize: '11px', color: 'var(--error)' }}>{fieldError('role')}</span>}
          </div>

          {error && (
            <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', border: '1px solid var(--error)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setOpen(false)} disabled={submitting} className="btn-secondary" style={{ padding: '7px 14px', borderRadius: '9999px', fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '7px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {submitting && <Loader2 size={12} className="spin" aria-hidden="true" />}
              <span>Crear cuenta</span>
            </button>
          </div>
        </form>
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
