import React from 'react';

/**
 * Fila de edición de alias para un usuario de RunFood (Brief 27p / 28p_fix2).
 */
export default function StaffAliasRow({
  user,
  status = {},
  isConfirming,
  editingAlias = '',
  onAliasChange,
  onSave,
  onRemove,
  onStartRemove
}) {
  const uId = user.runfood_user_id;
  const currentInput = editingAlias.trim();
  const isClearing = isConfirming && currentInput === '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
          {user.nombre_runfood || `Usuario ${uId}`}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {uId}</span>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Alias para este usuario"
          maxLength={60}
          aria-label={`Alias para ${user.nombre_runfood || uId}`}
          value={editingAlias}
          onChange={(e) => onAliasChange(uId, e.target.value)}
          style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--surface-soft)', color: 'var(--text-main)', fontSize: '12px' }}
        />
        <button
          type="button"
          disabled={status.saving}
          onClick={() => onSave(user)}
          className={isClearing ? undefined : 'btn-primary'}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            border: isClearing ? 'none' : undefined,
            background: isClearing ? 'var(--error)' : undefined,
            color: isClearing ? 'var(--on-primary)' : 'var(--on-primary)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            opacity: status.saving ? 0.6 : 1
          }}
        >
          {status.saving ? 'Guardando...' : isClearing ? '¿Confirmar quitar?' : 'Guardar'}
        </button>
        {user.alias && (
          <button
            type="button"
            disabled={status.saving}
            onClick={() => (isConfirming ? onRemove(uId) : onStartRemove(uId))}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--border-error)',
              background: isConfirming ? 'var(--error)' : 'transparent',
              color: isConfirming ? 'var(--on-primary)' : 'var(--error)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isConfirming && !isClearing ? '¿Confirmar quitar?' : 'Quitar alias'}
          </button>
        )}
      </div>
      {status.error && <span style={{ fontSize: '11px', color: 'var(--error)' }}>{status.error}</span>}
      {status.success && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{status.success}</span>}
    </div>
  );
}
