import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCheck, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Inbox
} from 'lucide-react';
import { listNotifications, markRead, markAllRead } from '../../services/notificationsClient';
import { resolveNotificationRoute } from '../../services/notificationRoutes';

/**
 * Formatea una fecha ISO a texto relativo en español ("hace 5 min").
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'hace un momento';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} d`;
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

export default function NotificationsPanel({ onClose, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const res = await listNotifications({
      unread: unreadOnly ? 1 : null,
      category: categoryFilter,
      page,
    });

    if (page === 1) setLoading(false);
    else setLoadingMore(false);

    if (res.ok && res.data) {
      const items = res.data.data || [];
      setNotifications(prev => append ? [...prev, ...items] : items);
      setMeta(res.data.meta || { current_page: 1, last_page: 1 });
    } else {
      setError(res.error || 'Error al cargar avisos.');
    }
  }, [unreadOnly, categoryFilter]);

  useEffect(() => {
    loadNotifications(1, false);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    const res = await markAllRead(categoryFilter || null);
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Marcar como leído si no lo estaba
    if (!notif.read_at) {
      await markRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      window.dispatchEvent(new CustomEvent('ualdo:notifications-updated'));
    }

    // 2. Resolver ruta de la lista blanca
    const actionObj = notif.action || (notif.action_screen ? { screen: notif.action_screen, params: notif.action_params } : null);
    const target = resolveNotificationRoute(actionObj);
    if (target && onNavigate) {
      onNavigate(target);
      onClose();
    }
  };

  const getPriorityStyle = (priority) => {
    if (priority === 'critical') {
      return {
        borderLeft: '4px solid var(--error)',
        background: 'rgba(244, 63, 94, 0.08)',
      };
    }
    if (priority === 'warning') {
      return {
        borderLeft: '4px solid var(--warning)',
        background: 'rgba(245, 158, 11, 0.06)',
      };
    }
    return {
      borderLeft: '4px solid var(--primary-2)',
      background: 'var(--bg-card)',
    };
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'critical') {
      return { label: 'Crítico', color: 'var(--error)' };
    }
    if (priority === 'warning') {
      return { label: 'Atención', color: 'var(--warning)' };
    }
    return { label: 'Info', color: 'var(--accent)' };
  };

  return (
    <div 
      className="notifications-panel-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(21, 21, 19, 0.85)',
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
              <Bell size={20} color="#ffffff" />
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
                background: unreadOnly ? 'var(--primary)' : 'rgba(32, 45, 47, 0.6)',
                color: unreadOnly ? '#ffffff' : 'var(--text-muted)',
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
                  background: categoryFilter === cat ? 'var(--primary)' : 'rgba(32, 45, 47, 0.6)',
                  color: categoryFilter === cat ? '#ffffff' : 'var(--text-muted)',
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
                onClick={() => loadNotifications(1, false)}
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
              {notifications.map(notif => {
                const priorityInfo = getPriorityBadge(notif.priority);
                const isUnread = !notif.read_at;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notif); }}
                    style={{
                      ...getPriorityStyle(notif.priority),
                      padding: '14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      border: '1px solid var(--border-glass)',
                      ...getPriorityStyle(notif.priority),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: 'rgba(29, 29, 27, 0.6)',
                            color: priorityInfo.color,
                            border: `1px solid ${priorityInfo.color}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {priorityInfo.label}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-subtle)', textTransform: 'capitalize' }}>
                          {notif.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(notif.created_at)}
                        </span>
                        {isUnread && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--accent)',
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: isUnread ? 700 : 500, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {notif.title}
                    </h4>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {notif.body}
                    </p>
                  </div>
                );
              })}

              {meta.current_page < meta.last_page && (
                <button
                  type="button"
                  onClick={() => loadNotifications(meta.current_page + 1, true)}
                  disabled={loadingMore}
                  className="glass-card-interactive"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(32, 45, 47, 0.7)',
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
