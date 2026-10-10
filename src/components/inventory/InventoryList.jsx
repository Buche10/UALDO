import React from 'react';
import { History, ArrowRightLeft, Sun, Thermometer, Snowflake } from 'lucide-react';
import InventoryAlertsList from './InventoryAlertsList';
import { formatQuantity } from '../../services/quantityFormat';

const STORAGE_MAP = {
  ambient: {
    label: 'Ambiente',
    icon: Sun,
    bg: 'var(--storage-ambient-bg)',
    color: 'var(--storage-ambient-color)',
  },
  refrigerated: {
    label: 'Refrigerado',
    icon: Thermometer,
    bg: 'var(--storage-refrigerated-bg)',
    color: 'var(--storage-refrigerated-color)',
  },
  frozen: {
    label: 'Congelado',
    icon: Snowflake,
    bg: 'var(--storage-frozen-bg)',
    color: 'var(--storage-frozen-color)',
  },
};

function formatCategory(category) {
  if (!category || typeof category !== 'object') return null;
  const catName = category.name ? String(category.name).trim() : '';
  const famName = category.family?.name ? String(category.family.name).trim() : '';
  if (famName && catName) {
    return `${famName} / ${catName}`;
  }
  return catName || null;
}

function renderLocationBreakdown(stockByLoc) {
  if (!stockByLoc || typeof stockByLoc !== 'object') return null;
  const bodegaQty = formatQuantity(stockByLoc.warehouse);
  const cocinaQty = formatQuantity(stockByLoc.kitchen);
  const salonQty = formatQuantity(stockByLoc.lounge);

  const dot = (
    <span
      style={{
        display: 'inline-block',
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        background: 'var(--text-subtle)',
        margin: '0 4px',
      }}
      aria-hidden="true"
    />
  );

  return (
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
      <span>Bodega {bodegaQty}</span>
      {dot}
      <span>Cocina {cocinaQty}</span>
      {dot}
      <span>Salón {salonQty}</span>
    </div>
  );
}

/**
 * Componente que renderiza el listado de insumos o el listado de alertas de compra.
 */
export default function InventoryList({
  activeTab,
  items,
  alerts,
  hasMore,
  loadingMore,
  onLoadMore,
  onSelectForMovement,
  onSelectForHistory,
  onSelectForTransfer,
}) {
  if (activeTab === 'alerts') {
    return <InventoryAlertsList alerts={alerts} />;
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
        No se encontraron insumos.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map(item => {
        const categoryLabel = formatCategory(item.category);
        const storageInfo = item.storage_type ? STORAGE_MAP[item.storage_type] : null;
        const StorageIcon = storageInfo ? storageInfo.icon : null;
        const isDimmed = item.is_active === false;

        return (
          <div
            key={item.id}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: item.is_low_stock ? '1px solid var(--warning)' : '1px solid var(--border-glass)',
              opacity: isDimmed ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.name}
                </span>
                {item.code ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {item.code}
                  </span>
                ) : null}
                {item.is_low_stock && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--warning-soft)', color: 'var(--warning)', fontWeight: 700 }}>
                    Bajo
                  </span>
                )}
                {item.product_kind === 'prepared' && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--badge-prepared-bg)', color: 'var(--badge-prepared-color)', fontWeight: 700 }}>
                    Preparado
                  </span>
                )}
                {item.is_active === false && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: 'var(--badge-inactive-bg)', color: 'var(--badge-inactive-color)', fontWeight: 700 }}>
                    Inactivo
                  </span>
                )}
                {storageInfo && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '9999px', background: storageInfo.bg, color: storageInfo.color, display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <StorageIcon size={11} />
                    <span>{storageInfo.label}</span>
                  </span>
                )}
              </div>
              {categoryLabel && (
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                  {categoryLabel}
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                {Number(item.stock).toFixed(3)} {item.unit}
              </div>
              {renderLocationBreakdown(item.stock_by_location)}
            </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onSelectForHistory(item)}
              title="Ver historial de movimientos"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--surface-strong)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <History size={16} />
            </button>

            {item.type !== 'service' && onSelectForTransfer && (
              <button
                type="button"
                onClick={() => onSelectForTransfer(item)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--surface-strong)',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Transferir</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectForMovement(item)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--primary-2)',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowRightLeft size={14} />
              <span>Mover</span>
            </button>
          </div>
        </div>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="glass-card-interactive"
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-card)',
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            marginTop: '6px',
          }}
        >
          {loadingMore ? 'Cargando más...' : 'Cargar más insumos'}
        </button>
      )}
    </div>
  );
}
