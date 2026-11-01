import { Package, ClipboardList, Calculator, TrendingUp, ClipboardCheck } from 'lucide-react';
import { ABILITIES, canAny } from '../../services/permissions';

/**
 * Registro de módulos del ecosistema Ualdo Negocios.
 * Cada módulo declara sus permisos requeridos y subvista asociada.
 * Los Briefs 31p a 40p añaden sus tarjetas editando este registro.
 */
export const MODULE_REGISTRY = [
  {
    id: 'inventory',
    label: 'Inventario',
    description: 'Existencias, movimientos, producción y compras.',
    icon: Package,
    permissions: [ABILITIES.INVENTORY_VIEW],
    subView: 'inventory',
    roleRequiredLabel: 'personal de cocina, salón, administración o dueño',
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    description: 'Pedidos internos del equipo y lista de compras.',
    icon: ClipboardList,
    permissions: [ABILITIES.SUPPLY_REQUEST, ABILITIES.SUPPLY_DECIDE],
    subView: 'pedidos',
    roleRequiredLabel: 'personal de cocina, salón, administración o dueño',
  },
  {
    id: 'cashclose',
    label: 'Cierre de caja',
    description: 'Arqueo de caja, revisión de ventas y diferencias.',
    icon: Calculator,
    permissions: [ABILITIES.CASH_REVIEW, ABILITIES.CASH_REGISTER],
    subView: 'cashclose',
    roleRequiredLabel: 'jefe de salón, administración o dueño',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    description: 'Resumen diario, ventas por plato y ranking del personal.',
    icon: TrendingUp,
    permissions: [ABILITIES.SALES_TOTALS],
    subView: 'ventas',
    roleRequiredLabel: 'dueño o administración',
  },
  {
    id: 'daily_close',
    label: 'Cierre del día',
    description: 'Conteo físico por área y conciliación con el sistema.',
    icon: ClipboardCheck,
    permissions: [
      ABILITIES.INVENTORY_COUNT_KITCHEN,
      ABILITIES.INVENTORY_COUNT_LOUNGE,
      ABILITIES.INVENTORY_COUNT_WAREHOUSE,
      ABILITIES.INVENTORY_VALIDATE_KITCHEN,
      ABILITIES.INVENTORY_VALIDATE_LOUNGE,
      ABILITIES.INVENTORY_ADJUST,
    ],
    subView: 'daily_close',
    roleRequiredLabel: 'jefe de cocina, salón, bodega, administración o dueño',
  },
];

/**
 * Devuelve los módulos visibles para el usuario autenticado según sus permisos.
 *
 * @param {object|null} user
 * @returns {Array<object>}
 */
export function getVisibleModules(user) {
  return MODULE_REGISTRY.filter((mod) => canAny(user, mod.permissions));
}

/**
 * Encuentra un módulo por su subvista.
 *
 * @param {string} subView
 * @returns {object|undefined}
 */
export function getModuleBySubView(subView) {
  return MODULE_REGISTRY.find((mod) => mod.subView === subView);
}
