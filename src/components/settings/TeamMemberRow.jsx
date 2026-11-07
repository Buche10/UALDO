import React, { useState } from 'react';
import { UserCheck, UserX, ShieldAlert, Loader2 } from 'lucide-react';
import { updateRole } from '../../services/teamClient';
import { ROLES, ROLE_LABELS, AREA_LABELS } from '../../services/permissions';
import TeamMemberActions from './TeamMemberActions';

const ROLE_OPTIONS = [
  { value: ROLES.OWNER, label: ROLE_LABELS.owner },
  { value: ROLES.ADMIN, label: ROLE_LABELS.admin },
  { value: ROLES.KITCHEN_HEAD, label: ROLE_LABELS.kitchen_head },
  { value: ROLES.LOUNGE_HEAD, label: ROLE_LABELS.lounge_head },
  { value: ROLES.KITCHEN_STAFF, label: ROLE_LABELS.kitchen_staff },
  { value: ROLES.LOUNGE_STAFF, label: ROLE_LABELS.lounge_staff },
  { value: ROLES.STAFF, label: ROLE_LABELS.staff },
];

const BADGE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: '9999px',
  fontSize: '10px',
  fontWeight: 600,
};

export default function TeamMemberRow({ member, onRoleUpdated, onMemberUpdated }) {
  const [pendingRole, setPendingRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rowError, setRowError] = useState(null);

  const currentRole = member.role;
  const currentArea = member.area ? (AREA_LABELS[member.area] || member.area) : 'Todas las áreas';
  const isActive = member.is_active !== false;

  const handleSelectChange = (event) => {
    const nextRole = event.target.value;
    setRowError(null);
    setPendingRole(nextRole !== currentRole ? nextRole : null);
  };

  const handleCancel = () => {
    setPendingRole(null);
    setRowError(null);
  };

  const handleConfirm = async () => {
    if (!pendingRole || submitting) return;
    setSubmitting(true);
    setRowError(null);

    const res = await updateRole(member.id, pendingRole);
    setSubmitting(false);

    if (res.ok) {
      const updated = res.data?.data || res.data || { ...member, role: pendingRole, role_label: ROLE_LABELS[pendingRole] };
      setPendingRole(null);
      if (onRoleUpdated) onRoleUpdated(updated);
    } else {
      setRowError(res.error || res.data?.message || 'Error al actualizar el cargo.');
    }
  };

  const pendingLabel = pendingRole ? (ROLE_LABELS[pendingRole] || pendingRole) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', opacity: isActive ? 1 : 0.85 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
            {isActive ? <UserCheck size={18} aria-hidden="true" /> : <UserX size={18} aria-hidden="true" />}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{member.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.email} · {currentArea}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {!isActive && (
                <span style={{ ...BADGE_STYLE, background: 'var(--badge-inactive-bg)', color: 'var(--text-muted)' }}>
                  Desactivada
                </span>
              )}
              {member.must_change_password && (
                <span style={{ ...BADGE_STYLE, background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                  Debe cambiar contraseña
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor={`role-select-${member.id}`} className="sr-only">Cargo de {member.name}</label>
          <select
            id={`role-select-${member.id}`}
            aria-label={`Cargo de ${member.name}`}
            value={pendingRole || currentRole}
            onChange={handleSelectChange}
            disabled={submitting}
            style={{ padding: '6px 10px', borderRadius: '8px', background: 'var(--surface-strong)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <TeamMemberActions member={member} onMemberUpdated={onMemberUpdated || onRoleUpdated} />
        </div>
      </div>

      {pendingRole && (
        <div role="region" aria-label={`Confirmar cambio de cargo para ${member.name}`} style={{ marginTop: '4px', padding: '10px 12px', borderRadius: '10px', background: 'var(--primary-soft)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)' }}>
            {member.name} pasará a {pendingLabel}. Tendrá que volver a iniciar sesión.
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleCancel} disabled={submitting} className="btn-secondary" style={{ padding: '6px 12px', borderRadius: '9999px', fontSize: '11px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleConfirm} disabled={submitting} className="btn-primary" style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '11px', cursor: submitting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {submitting && <Loader2 size={12} className="spin" aria-hidden="true" />}
              <span>Confirmar</span>
            </button>
          </div>
        </div>
      )}

      {rowError && (
        <div role="alert" style={{ fontSize: '12px', color: 'var(--error)', background: 'var(--error-soft)', border: '1px solid var(--error)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{rowError}</span>
        </div>
      )}
    </div>
  );
}
