import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  X, 
  Inbox
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { resolveNotificationRoute } from '../../services/notificationRoutes';
import NotificationItem from './NotificationItem';

export default function NotificationsPanel({ onClose, onNavigate }) {
  const {
    notifications,
    meta,
    loading,
    loadingMore,
    error,
    unreadOnly,
    setUnreadOnly,
    categoryFilter,
    setCategoryFilter,
    reload,
    loadNextPage,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications();

  const [actionError, setActionError] = useState(null);

  const handleNotificationClick = async (notif) => {
    setActionError(null);
    // 1. Marcar como leído si no lo estaba
    if (!notif.read_at) {
      const res = await handleMarkRead(notif.id);
      if (!res.ok) {
        setActionError(res.error || 'Error al marcar como leído.');
        return;
      }
    }

    // 2. Resolver ruta de la lista blanca
    const actionObj = notif.action || (notif.action_screen ? { screen: notif.action_screen, params: notif.action_params } : null);
    const target = resolveNotificationRoute(actionObj);
    if (target && onNavigate) {
      onNavigate(target);
      onClose();
    }
  };

  return (
    <div 
      className="notifications-panel-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        paddingTop: 'calc(16px + var(--safe-top))',
        paddingBottom: 'calc(16px + var(--safe-bottom))',
      }}
    >
      <div 
        className="glass-card" 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden',
          border: '1px solid var(--border-glow)',
          borderRadius: '20px',
        }}
      >
        {/* Cabecera */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color="var(--on-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                Centro de Avisos
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Novedades y alertas del restaurante
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar avisos"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {actionError && (
          <div style={{ padding: '8px 16px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', borderBottom: '1px solid var(--error)' }}>
            {actionError}
          </div>
        )}

        {/* Filtros */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: unreadOnly ? '1px solid var(--primary-2)' : '1px solid var(--border-glass)',
                background: unreadOnly ? 'var(--primary)' : 'var(--chip-bg)',
                color: unreadOnly ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sin leer
            </button>

            {['pedidos', 'inventario', 'caja', 'sistema'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: categoryFilter === cat ? '1px solid var(--primary-2)' : '1px solid var(--border-glass)',
                  background: categoryFilter === cat ? 'var(--primary)' : 'var(--chip-bg)',
                  color: categoryFilter === cat ? 'var(--on-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
            }}
          >
            <CheckCheck size={14} />
            <span>Marcar leídas</span>
          </button>
        </div>

        {/* Lista de avisos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Cargando avisos...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--error)' }}>
              <p style={{ fontSize: '13px', marginBottom: '12px' }}>{error}</p>
              <button
                type="button"
                onClick={reload}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Reintentar
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Inbox size={40} color="var(--text-subtle)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                No tienes avisos pendientes
              </p>
              <p style={{ fontSize: '12px' }}>
                {unreadOnly ? 'Todos los avisos han sido leídos.' : 'Las alertas de inventario y pedidos aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <>
              {notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onClick={handleNotificationClick}
                />
              ))}

              {meta.current_page < meta.last_page && (
                <button
                  type="button"
                  onClick={loadNextPage}
                  disabled={loadingMore}
                  className="glass-card-interactive"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--bg-card)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  {loadingMore ? 'Cargando más...' : 'Cargar más avisos'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
