import React, { useState } from 'react';
import { Settings, Power, AlertCircle, CheckCircle2 } from 'lucide-react';
import { locationLabel } from '../../services/inventoryLocations';
import RunfoodConsumptionActivateForm from './RunfoodConsumptionActivateForm';

/**
 * Ficha de configuracion del consumo por ventas (Brief 25p).
 */
export default function RunfoodConsumptionSettingsCard({
  settings,
  loading,
  error,
  errors,
  onSave
}) {
  const isEnabled = Boolean(settings?.enabled);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const activeErrors = errors || localErrors;

  const handleActivate = async ({ startDate, location }) => {
    setLocalErrors({});
    const res = await onSave({ enabled: true, start_date: startDate, location });
    if (res && !res.ok && res.errors) {
      setLocalErrors(res.errors);
    }
    return res;
  };

  const handleDeactivate = async () => {
    await onSave({ enabled: false, location: settings?.location });
    setIsDeactivating(false);
  };

  return (
    <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} stroke="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            Consumo por ventas
          </h3>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 9999,
            background: isEnabled ? 'var(--success-soft)' : 'var(--card-subtle-bg)',
            color: isEnabled ? 'var(--success)' : 'var(--text-muted)',
            border: `1px solid ${isEnabled ? 'var(--border-success)' : 'var(--card-subtle-border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {isEnabled ? <CheckCircle2 size={12} /> : <Power size={12} />}
          {isEnabled
            ? `Activo desde ${settings?.start_date} en ${locationLabel(settings?.location)}`
            : 'Apagado'}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--error-soft)',
            border: '1px solid var(--border-error)',
            color: 'var(--error)',
            fontSize: 12
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {!isEnabled ? (
        <RunfoodConsumptionActivateForm
          initialStartDate={settings?.start_date}
          initialLocation={settings?.location}
          loading={loading}
          onActivate={handleActivate}
          fieldErrors={activeErrors}
        />
      ) : (
        <div>
          {isDeactivating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 10,
                borderRadius: 8,
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-main)' }}>
                ¿Confirmas desactivar el consumo automático de insumos por ventas?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--error)',
                    color: 'var(--on-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Desactivando...' : 'Confirmar desactivación'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeactivating(false)}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-glass)',
                    background: 'var(--chip-bg)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDeactivating(true)}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-error)',
                background: 'var(--error-soft)',
                color: 'var(--error)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Power size={14} />
              <span>Desactivar consumo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
