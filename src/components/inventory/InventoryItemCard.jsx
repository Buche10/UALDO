import React, { useState } from 'react';
import { History, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { getUser } from '../../services/auth';
import { can, ABILITIES } from '../../services/permissions';
import ItemPurchaseParams from './ItemPurchaseParams';
import ItemLotSettings from './ItemLotSettings';
import { STORAGE_MAP, formatCategory, renderLocationBreakdown } from './inventoryCardHelpers';

export default function InventoryItemCard({
  item,
  onSelectForMovement,
  onSelectForHistory,
  onSelectForTransfer,
  onItemUpdated,
}) {
  const [expanded, setExpanded] = useState(false);
  const currentUser = getUser();
  const canManagePurchases = can(currentUser, ABILITIES.PURCHASES_MANAGE);
  const canManageSettings = can(currentUser, ABILITIES.SETTINGS_MANAGE);
  const canConfigure = canManagePurchases || canManageSettings;

  const categoryLabel = formatCategory(item.category);
  const storageInfo = item.storage_type ? STORAGE_MAP[item.storage_type] : null;
  const StorageIcon = storageInfo ? storageInfo.icon : null;
  const isDimmed = item.is_active === false;

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: item.is_low_stock ? '1px solid var(--warning)' : '1px solid var(--border-glass)',
        opacity: isDimmed ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          {canConfigure && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              title="Configuración del insumo"
              aria-label="Configuración del insumo"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: expanded ? 'var(--surface-soft)' : 'var(--surface-strong)',
                color: expanded ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectForHistory(item)}
            title="Ver historial de movimientos"
            aria-label="Ver historial de movimientos"
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

      {expanded && canConfigure && (
        <>
          {canManagePurchases && (
            <ItemPurchaseParams
              item={item}
              onSaved={() => {}}
            />
          )}
          <ItemLotSettings item={item} onSaved={onItemUpdated} />
        </>
      )}
    </div>
  );
}
