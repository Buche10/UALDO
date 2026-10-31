import React, { useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import RunfoodConsumptionDatePicker from './RunfoodConsumptionDatePicker';
import RunfoodConsumptionLineItem from './RunfoodConsumptionLineItem';
import RunfoodConsumptionUnmappedBlock from './RunfoodConsumptionUnmappedBlock';

const STATE_CONFIG = {
  aplicado: { label: 'Consumo aplicado', bg: 'var(--success-soft)', color: 'var(--success)', border: 'var(--border-success)', icon: CheckCircle2 },
  apagado: { label: 'Consumo desactivado', bg: 'var(--card-subtle-bg)', color: 'var(--text-muted)', border: 'var(--card-subtle-border)', icon: Clock },
  antes_de_inicio: { label: 'Anterior a fecha de inicio', bg: 'var(--card-subtle-bg)', color: 'var(--text-subtle)', border: 'var(--card-subtle-border)', icon: Clock },
  sin_ventas: { label: 'Sin ventas cerradas', bg: 'var(--warning-soft)', color: 'var(--warning)', border: 'var(--border-warning)', icon: AlertTriangle },
  fallido: { label: 'Falló la aplicación', bg: 'var(--error-soft)', color: 'var(--error)', border: 'var(--border-error)', icon: AlertCircle }
};

/**
 * Vista de consumo del dia para RunFood (Brief 25p).
 */
export default function RunfoodConsumptionDay({
  date,
  onDateChange,
  onPreviousDay,
  onNextDay,
  consumption,
  loading,
  error,
  onNavigateToRecipes,
  onNavigateToMappings
}) {
  const isInitialLoading = loading && !consumption;
  const hasFailed = !consumption && Boolean(error);
  const estado = consumption?.estado || 'apagado';
  let cfg;
  if (isInitialLoading) {
    cfg = { label: 'Cargando...', bg: 'var(--chip-bg)', color: 'var(--text-muted)', border: 'var(--border-glass)', icon: Clock };
  } else if (hasFailed) {
    cfg = { label: 'No disponible', bg: 'var(--chip-bg)', color: 'var(--text-muted)', border: 'var(--border-glass)', icon: AlertCircle };
  } else {
    cfg = STATE_CONFIG[estado] || STATE_CONFIG.apagado;
  }
  const StateIcon = cfg.icon;

  const sortedLines = useMemo(() => {
    if (!consumption?.lineas) return [];
    return [...consumption.lineas].sort((a, b) => {
      const numA = Number(String(a.cantidad || 0).replace(',', '.'));
      const numB = Number(String(b.cantidad || 0).replace(',', '.'));
      return numB - numA;
    });
  }, [consumption?.lineas]);

  const stockNegativo = consumption?.stock_negativo || [];
  const ultimoError = consumption?.ultimo_error;

  return (
    <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <RunfoodConsumptionDatePicker
        date={date}
        loading={loading}
        onDateChange={onDateChange}
        onPreviousDay={onPreviousDay}
        onNextDay={onNextDay}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 9999,
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <StateIcon size={14} />
          <span>{cfg.label}</span>
        </span>
        {consumption?.applied_at && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Aplicado: {new Date(consumption.applied_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: 12 }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {!hasFailed && ultimoError && (
        <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: 12 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>Último error al procesar:</p>
            <p style={{ margin: '2px 0 0 0' }}>{ultimoError.mensaje || 'Error interno al aplicar el consumo.'}</p>
          </div>
        </div>
      )}

      {!hasFailed && stockNegativo.length > 0 && (
        <div role="status" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--warning-soft)', border: '1px solid var(--border-warning)', color: 'var(--warning)', fontSize: 12 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>Atención con inventario negativo</p>
            <p style={{ margin: '2px 0 0 0' }}>{stockNegativo.length} {stockNegativo.length === 1 ? 'insumo quedó' : 'insumos quedaron'} con stock negativo tras esta corrida.</p>
          </div>
        </div>
      )}

      {!hasFailed && consumption && (
        <RunfoodConsumptionUnmappedBlock
          sinReceta={consumption.sin_receta}
          incompletos={consumption.incompletos}
          conOpciones={consumption.con_opciones}
          onNavigateToRecipes={onNavigateToRecipes}
          onNavigateToMappings={onNavigateToMappings}
        />
      )}

      {!hasFailed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} stroke="var(--accent)" />
              <span>Insumos descontados</span>
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {sortedLines.length} {sortedLines.length === 1 ? 'insumo' : 'insumos'}
            </span>
          </div>

          {loading ? (
            <p style={{ margin: '12px 0', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Cargando consumo del día...
            </p>
          ) : sortedLines.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, background: 'var(--card-subtle-bg)', borderRadius: 8 }}>
              {estado === 'sin_ventas' ? 'No hubo ventas registradas en esta fecha.' : 'No se registraron deducciones de inventario para este día.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedLines.map((line) => (
                <RunfoodConsumptionLineItem key={line.inventory_item_id} line={line} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
