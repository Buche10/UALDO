import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { listRunfoodStaff, updateRunfoodStaffAlias } from '../../services/salesClient';
import { trapTab } from '../common/ConfirmDialog';
import StaffAliasRow from './StaffAliasRow';

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
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

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
      items.forEach((u) => { initialEdits[u.runfood_user_id] = u.alias || ''; });
      setEditingAliases((prev) => ({ ...prev, ...initialEdits }));
    } else {
      setError(res.error || 'No se pudo cargar la lista de personal.');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    triggerRef.current = document.activeElement;
    loadPage(1, false);
    setConfirmRemoveId(null);
    return () => {
      const el = triggerRef.current;
      if (el && el.isConnected) {
        el.focus();
      } else {
        const btn = document.querySelector('button[aria-label="Nombres del personal"]') ||
          Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Nombres del personal'));
        btn?.focus();
      }
    };
  }, [isOpen, loadPage]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        trapTab(e, dialogRef.current);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (!loading && users.length > 0) {
      dialogRef.current?.querySelector('input')?.focus();
    }
  }, [isOpen, loading, users.length]);

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
      const err = res.data?.errors?.alias?.[0] || res.error || 'Error al quitar';
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: err, success: null } }));
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
      const err = res.data?.errors?.alias?.[0] || res.error || 'Error al guardar';
      setRowStatus((prev) => ({ ...prev, [userId]: { saving: false, error: err, success: null } }));
    }
  };

  const handleAliasChange = (userId, val) => {
    setEditingAliases((prev) => ({ ...prev, [userId]: val }));
    if (confirmRemoveId === userId) setConfirmRemoveId(null);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="staff-aliases-title" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div ref={dialogRef} className="glass-card" style={{ maxWidth: '520px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px', gap: '14px', overflow: 'hidden' }}>
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
            {users.map((u) => (
              <StaffAliasRow
                key={u.runfood_user_id}
                user={u}
                status={rowStatus[u.runfood_user_id]}
                isConfirming={confirmRemoveId === u.runfood_user_id}
                editingAlias={editingAliases[u.runfood_user_id] ?? ''}
                onAliasChange={handleAliasChange}
                onSave={handleSave}
                onRemove={handleRemove}
                onStartRemove={setConfirmRemoveId}
              />
            ))}
            {page < lastPage && (
              <button type="button" disabled={loadingMore} onClick={() => loadPage(page + 1, true)} style={{ padding: '8px 14px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', alignSelf: 'center', marginTop: '6px' }}>
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
