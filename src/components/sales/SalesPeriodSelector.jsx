import React from 'react';
import { Calendar } from 'lucide-react';
import { SALES_PRESETS } from '../../hooks/useSales';

const PRESET_OPTIONS = [
  { id: SALES_PRESETS.DAYS_7, label: 'Últimos 7 días' },
  { id: SALES_PRESETS.DAYS_30, label: 'Últimos 30 días' },
  { id: SALES_PRESETS.MONTH, label: 'Este mes' },
  { id: SALES_PRESETS.CUSTOM, label: 'Personalizado' }
];

/**
 * Selector de periodo de análisis de ventas con presets y fechas personalizadas (Brief 23p/27p).
 */
export default function SalesPeriodSelector({
  preset,
  onPresetChange,
  customRange,
  onCustomDateChange
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        role="group"
        aria-label="Periodo de análisis"
        style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--chip-bg)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-glass)',
          overflowX: 'auto'
        }}
      >
        {PRESET_OPTIONS.map((opt) => {
          const active = preset === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPresetChange(opt.id)}
              aria-pressed={active}
              style={{
                flex: 1,
                minWidth: 'max-content',
                padding: '8px 12px',
                borderRadius: '10px',
                border: 'none',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--on-primary)' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {preset === SALES_PRESETS.CUSTOM && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '12px',
            borderRadius: '12px',
            background: 'var(--chip-bg)',
            border: '1px solid var(--border-glass)',
            alignItems: 'center'
          }}
        >
          <Calendar size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>
              Desde
              <input
                type="date"
                value={customRange?.from || ''}
                onChange={(e) => onCustomDateChange('from', e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, fontSize: '11px', color: 'var(--text-muted)' }}>
              Hasta
              <input
                type="date"
                value={customRange?.to || ''}
                onChange={(e) => onCustomDateChange('to', e.target.value)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
