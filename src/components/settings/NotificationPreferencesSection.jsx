import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getPreferences, updatePreferences } from '../../services/notificationsClient';

export default function NotificationPreferencesSection({ authenticated }) {
  const [preferences, setPreferences] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState(null);
  const [savingCategory, setSavingCategory] = useState(null);

  useEffect(() => {
    if (!authenticated) {
      setPreferences([]);
      setLoadingPrefs(false);
      return;
    }

    const loadNotificationPrefs = async () => {
      setLoadingPrefs(true);
      setPrefsError(null);
      const res = await getPreferences();
      setLoadingPrefs(false);
      if (res.ok && res.data) {
        let prefsList = [];
        if (Array.isArray(res.data.preferences)) {
          prefsList = res.data.preferences;
        } else if (Array.isArray(res.data)) {
          prefsList = res.data;
        } else if (res.data && typeof res.data === 'object') {
          prefsList = Object.entries(res.data)
            .filter(([k]) => ['pedidos', 'inventario', 'caja', 'sistema'].includes(k))
            .map(([category, enabled]) => ({ category, enabled: Boolean(enabled) }));
        }
        setPreferences(prefsList);
      } else {
        setPrefsError(res.error || 'No se pudieron cargar las preferencias de avisos.');
      }
    };

    loadNotificationPrefs();
  }, [authenticated]);

  const handleTogglePreference = async (category, currentEnabled) => {
    const newEnabled = !currentEnabled;
    setPreferences((prev) => prev.map((p) => (p.category === category ? { ...p, enabled: newEnabled } : p)));
    setSavingCategory(category);
    setPrefsError(null);

    const res = await updatePreferences([{ category, enabled: newEnabled }]);
    setSavingCategory(null);

    if (res.ok) {
      if (res.data?.preferences && Array.isArray(res.data.preferences)) {
        setPreferences(res.data.preferences);
      }
    } else {
      setPreferences((prev) => prev.map((p) => (p.category === category ? { ...p, enabled: currentEnabled } : p)));
      setPrefsError(res.error || 'Error guardando preferencias');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Bell size={18} color="var(--accent)" />
        <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
          Avisos del Sistema
        </h3>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Controla qué categorías deseas recibir en la app. Los avisos críticos llegan siempre.
      </p>

      {prefsError && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '12px', marginBottom: '12px' }}>
          {prefsError}
        </div>
      )}

      {!authenticated ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Inicia sesión para gestionar tus avisos.
        </div>
      ) : loadingPrefs ? (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '10px 0' }}>
          Cargando preferencias de avisos...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {preferences.map((p) => (
            <div
              key={p.category}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'var(--surface-soft)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                  {p.label || p.category}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Avisos de {p.category}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={p.enabled}
                aria-label={`${p.enabled ? 'Desactivar' : 'Activar'} avisos de ${p.label || p.category}`}
                disabled={savingCategory === p.category}
                onClick={() => handleTogglePreference(p.category, p.enabled)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: p.enabled ? 'var(--primary)' : 'var(--toggle-off)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: '2px',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--on-primary)',
                    transform: p.enabled ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          ))}

          <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px', fontStyle: 'italic' }}>
            Nota: Los avisos críticos de descuadre y seguridad se entregan siempre, independientemente de estos interruptores.
          </div>
        </div>
      )}
    </div>
  );
}
