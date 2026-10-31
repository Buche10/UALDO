import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { listRunfoodStaff, updateRunfoodStaffAlias } from '../../services/salesClient';

/**
 * Modal para gestionar los alias de los usuarios de RunFood (Brief 27p).
 */
export default function RunfoodStaffAliases({ isOpen, onClose, onAliasUpdated }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [editingAliases, setEditingAliases] = useState({});
  const [rowStatus, setRowStatus] = useState({});
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const loadPage = useCallback(async (pageNum, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    const res = await listRunfoodStaff({ page: pageNum });
    setLoading(false);
    setLoadingMore(false);

    if (res.ok) {
      const items = res.data?.data || [];
      setUsers((prev) => (append ? [...prev, ...items] : items));
      setPage(res.data?.current_page || 1);
      setLastPage(res.data?.last_page || 1);
      const initialEdits = {};
      items.forEach((u) => {
        initialEdits[u.runfood_user_id] = u.alias || '';
      });
      setEditingAliases((prev) => ({ ...prev, ...initialEdits }));
    } else {
      setError(res.error || 'No se pudo cargar la lista de personal.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPage(1, false);
      setConfirmRemoveId(null);
    }
  }, [isOpen, loadPage]);

  if (!isOpen) return null;

  const handleRemove = async (userId) => {
    setRowStatus((prev) => ({ ...prev, [userId]: { saving: true, error: null, success: null } }));
    const res = await updateRunfoodStaffAlias(userId, null);
    setConfirmRemoveId(null);
    if (res.ok) {
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: null, success: 'Alias quitado' } }));
      setEditingAliases((prev) => ({ ...prev, [userId]: '' }));
      setUsers((prev) => prev.map((u) => (u.runfood_user_id === userId ? { ...u, alias: null } : u)));
      onAliasUpdated?.();
    } else {
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: res.error || 'Error al quitar', success: null } }));
    }
  };

  const handleSave = async (user) => {
    const userId = user.runfood_user_id;
    const rawVal = editingAliases[userId] ?? (user.alias || '');
    const trimmed = rawVal.trim();

    if (trimmed === '' && user.alias) {
      if (confirmRemoveId !== userId) {
        setConfirmRemoveId(userId);
        return;
      }
      return handleRemove(userId);
    }

    if (trimmed.length > 60) {
      setRowStatus((prev) => ({
        ...prev,
        [userId]: { saving: false, error: 'El alias no puede superar los 60 caracteres.', success: null }
      }));
      return;
    }

    setRowStatus((prev) => ({ ...prev, [userId]: { saving: true, error: null, success: null } }));

    const res = await updateRunfoodStaffAlias(userId, trimmed || null);
    setConfirmRemoveId(null);
    if (res.ok) {
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: null, success: trimmed ? 'Alias guardado' : 'Alias quitado' } }));
      setUsers((prev) => prev.map((u) => (u.runfood_user_id === userId ? { ...u, alias: trimmed || null } : u)));
      onAliasUpdated?.();
    } else {
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: res.error || 'Error al guardar', success: null } }));
    }
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="staff-aliases-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-card" style={{ maxWidth: '520px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px', gap: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="var(--accent)" />
            <h3 id="staff-aliases-title" style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>Nombres del personal</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar nombres del personal" style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Asigna un nombre reconocible a cada usuario de RunFood para el ranking y los informes.</p>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando personal...</div>
        ) : error ? (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} color="var(--error)" /><span style={{ fontSize: '12px', color: 'var(--error)' }}>{error}</span></div>
            <button type="button" onClick={() => loadPage(1, false)} style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RefreshCw size={12} /><span>Reintentar</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
            {users.map((u) => {
              const uId = u.runfood_user_id;
              const status = rowStatus[uId] || {};
              const isConfirming = confirmRemoveId === uId;
              const currentInput = (editingAliases[uId] ?? (u.alias || '')).trim();
              const isClearing = isConfirming && currentInput === '';

              return (
                <div key={uId} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '10px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{u.nombre_runfood || `Usuario ${uId}`}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {uId}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Alias para este usuario"
                      maxLength={60}
                      aria-label={`Alias para ${u.nombre_runfood || uId}`}
                      value={editingAliases[uId] ?? ''}
                      onChange={(e) => setEditingAliases((prev) => ({ ...prev, [uId]: e.target.value }))}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--surface-soft)', color: 'var(--text-main)', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      disabled={status.saving}
                      onClick={() => handleSave(u)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isClearing ? 'var(--error)' : 'var(--primary)',
                        color: 'var(--on-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: status.saving ? 0.6 : 1
                      }}
                    >
                      {status.saving ? 'Guardando...' : isClearing ? '¿Confirmar quitar?' : 'Guardar'}
                    </button>
                    {u.alias && (
                      <button
                        type="button"
                        disabled={status.saving}
                        onClick={() => (isConfirming ? handleRemove(uId) : setConfirmRemoveId(uId))}
                        style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-error)', background: isConfirming ? 'var(--error)' : 'transparent', color: isConfirming ? 'var(--on-primary)' : 'var(--error)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {isConfirming && !isClearing ? '¿Confirmar quitar?' : 'Quitar alias'}
                      </button>
                    )}
                  </div>
                  {status.error && <span style={{ fontSize: '11px', color: 'var(--error)' }}>{status.error}</span>}
                  {status.success && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{status.success}</span>}
                </div>
              );
            })}
            {page < lastPage && (
              <button type="button" disabled={loadingMore} onClick={() => loadPage(page + 1, true)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'center', marginTop: '6px' }}>
                {loadingMore ? 'Cargando más...' : 'Cargar más'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
