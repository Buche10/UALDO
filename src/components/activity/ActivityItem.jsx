import React from 'react';
import { User, ChevronRight } from 'lucide-react';
import { resolveNotificationRoute } from '../../services/notificationRoutes';

const REFERENCE_TYPE_MAP = {
  reserva: 'reserva',
  pedido: 'pedido',
  'solicitud de insumos': 'pedido',
  retiro: 'retiros',
  retiros: 'retiros',
  incidencia: 'incidencia',
  incidencias: 'incidencia',
};

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function ActivityItem({ item, onNavigate }) {
  if (!item) return null;

  const timeStr = formatTime(item.fecha);
  const persona = item.persona;
  const personaName = persona?.nombre || 'Sistema';
  const cargoLabel = persona?.cargo_label;
  const personaText = cargoLabel ? `${personaName} (${cargoLabel})` : personaName;

  const moduloLabel = item.modulo_label || item.modulo || 'General';
  const referencia = item.referencia;

  let targetRoute = null;
  if (referencia?.tipo && referencia?.id) {
    const tipoNormalized = String(referencia.tipo).trim().toLowerCase();
    const mappedScreen = REFERENCE_TYPE_MAP[tipoNormalized];
    if (mappedScreen) {
      targetRoute = resolveNotificationRoute({
        screen: mappedScreen,
        params: { id: referencia.id },
      });
    }
  }

  const isClickable = Boolean(targetRoute && onNavigate);

  const handleClick = () => {
    if (isClickable) {
      onNavigate(targetRoute);
    }
  };

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onNavigate(targetRoute);
    }
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={isClickable ? 'glass-card-interactive' : undefined}
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--surface-soft)',
              color: 'var(--accent)',
              border: '1px solid var(--border-glass)',
              fontWeight: 600,
            }}
          >
            {moduloLabel}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <User size={12} />
            <span>{personaText}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {timeStr}
          </span>
          {isClickable && <ChevronRight size={14} color="var(--text-muted)" />}
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.4 }}>
        {item.descripcion}
      </div>
    </div>
  );
}
