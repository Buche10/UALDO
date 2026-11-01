import React from 'react';
import { Plus, ClipboardList, Scissors, ShoppingCart, ChefHat } from 'lucide-react';

const secondaryButton = {
  padding: '8px 12px',
  fontSize: '12px',
  borderRadius: '9999px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid var(--border-glass)',
  background: 'var(--surface-strong)',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontWeight: 600,
};

/**
 * Acciones de la cabecera de Inventario.
 * Filtra cada acción según los permisos concretos del usuario (Brief 30p).
 */
export default function InventoryHeaderActions({
  canManageSettings,
  canManagePurchases,
  canCount,
  isOwner,
  onProduction,
  onPurchases,
  onCounts,
  onRunfoodRecipes,
  onCreate,
}) {
  const allowRecipes = canManageSettings !== undefined ? canManageSettings : Boolean(isOwner);
  const allowPurchases = canManagePurchases !== undefined ? canManagePurchases : Boolean(isOwner);
  const allowCounts = canCount !== undefined ? canCount : Boolean(isOwner);
  const allowCreate = canManageSettings !== undefined ? canManageSettings : Boolean(isOwner);

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button type="button" className="glass-card-interactive" onClick={onProduction} style={secondaryButton}>
        <Scissors size={16} aria-hidden="true" />
        <span>Producción</span>
      </button>

      {allowRecipes && (
        <button type="button" className="glass-card-interactive" onClick={onRunfoodRecipes} style={secondaryButton}>
          <ChefHat size={16} aria-hidden="true" />
          <span>Recetas de RunFood</span>
        </button>
      )}

      {allowPurchases && (
        <button type="button" className="glass-card-interactive" onClick={onPurchases} style={secondaryButton}>
          <ShoppingCart size={16} aria-hidden="true" />
          <span>Compras</span>
        </button>
      )}

      {allowCounts && (
        <button type="button" className="glass-card-interactive" onClick={onCounts} style={secondaryButton}>
          <ClipboardList size={16} aria-hidden="true" />
          <span>Conteos</span>
        </button>
      )}

      {allowCreate && (
        <button
          type="button"
          className="btn-primary"
          onClick={onCreate}
          style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} aria-hidden="true" />
          <span>Nuevo Insumo</span>
        </button>
      )}
    </div>
  );
}
