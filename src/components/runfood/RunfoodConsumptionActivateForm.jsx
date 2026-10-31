import React, { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { INVENTORY_LOCATIONS, locationLabel, DEFAULT_LOCATION } from '../../services/inventoryLocations';
import { toIsoDateString } from '../../services/runfoodConsumptionClient';

/**
 * Formulario de activacion del consumo por ventas (Brief 25p).
 */
export default function RunfoodConsumptionActivateForm({
  initialStartDate,
  initialLocation = DEFAULT_LOCATION,
  loading,
  onActivate,
  fieldErrors = {}
}) {
  const [startDate, setStartDate] = useState(() => initialStartDate || toIsoDateString());
  const [location, setLocation] = useState(initialLocation);
  const [hasReopenedCount, setHasReopenedCount] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    await onActivate({ startDate, location });
    setIsConfirming(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Fecha de inicio
          </label>
          <input
            type="date"
            aria-label="Fecha de inicio de consumo"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: 12
            }}
          />
          {fieldErrors?.start_date?.[0] && (
            <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>
              {fieldErrors.start_date[0]}
            </span>
          )}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Ubicación
          </label>
          <select
            aria-label="Ubicación de descuento"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--border-glass)',
              background: 'var(--chip-bg)',
              color: 'var(--text-main)',
              fontSize: 12
            }}
          >
            {INVENTORY_LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
          {fieldErrors?.location?.[0] && (
            <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>
              {fieldErrors.location[0]}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={hasReopenedCount}
        onClick={() => setHasReopenedCount((prev) => !prev)}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: 12,
          textAlign: 'left'
        }}
      >
        {hasReopenedCount ? (
          <CheckSquare size={16} stroke="var(--accent)" />
        ) : (
          <Square size={16} stroke="var(--text-muted)" />
        )}
        <span>Ya cargué el stock real con el conteo de reapertura</span>
      </button>

      {isConfirming ? (
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
            Desde {startDate}, cada día cerrado descontará del inventario de {locationLabel(location)} lo vendido en RunFood según las recetas.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Activando...' : 'Confirmar activación'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
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
          onClick={() => setIsConfirming(true)}
          disabled={loading || !hasReopenedCount}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: 'none',
            background: hasReopenedCount ? 'var(--primary)' : 'var(--chip-bg)',
            color: hasReopenedCount ? 'var(--on-primary)' : 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 600,
            cursor: hasReopenedCount ? 'pointer' : 'not-allowed',
            opacity: hasReopenedCount ? 1 : 0.6
          }}
        >
          Activar consumo
        </button>
      )}
    </div>
  );
}
