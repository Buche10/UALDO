import {
  Package,
  ClipboardList,
  Calculator,
  TrendingUp,
  ClipboardCheck,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  Tags,
} from 'lucide-react';
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
    description: 'Reporte de faltantes, aprobación y lista de compras.',
    icon: ClipboardList,
    permissions: [ABILITIES.SUPPLY_REQUEST, ABILITIES.SUPPLY_DECIDE],
    subView: 'pedidos',
    roleRequiredLabel: 'personal de cocina, salón, administración o dueño',
  },
  {
    id: 'cash_declaration',
    label: 'Mi cierre de caja',
    description: 'Declaración del efectivo contado y medios de pago del día.',
    icon: Calculator,
    permissions: [ABILITIES.CASH_REGISTER],
    excludePermissions: [ABILITIES.CASH_REVIEW],
    subView: 'cash_declaration',
    roleRequiredLabel: 'jefe de salón',
  },
  {
    id: 'cashclose',
    label: 'Cierre de caja',
    description: 'Arqueo de caja, revisión de ventas y diferencias.',
    icon: Calculator,
    permissions: [ABILITIES.CASH_REVIEW],
    subView: 'cashclose',
    roleRequiredLabel: 'administración o dueño',
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
  {
    id: 'withdrawals',
    label: 'Retiros de bodega',
    description: 'Declaración previa y confirmación de uso al terminar.',
    icon: ArrowDownRight,
    permissions: [ABILITIES.WITHDRAWALS_DECLARE, ABILITIES.WITHDRAWALS_SUPERVISE],
    subView: 'withdrawals',
    roleRequiredLabel: 'personal operativo, jefes de área, administración o dueño',
  },
  {
    id: 'overtime',
    label: 'Horas extra',
    description: 'Registro informativo de horas extra por área y resumen del mes.',
    icon: Clock,
    permissions: [
      ABILITIES.OVERTIME_REGISTER_KITCHEN,
      ABILITIES.OVERTIME_REGISTER_LOUNGE,
      ABILITIES.OVERTIME_REPORT,
    ],
    subView: 'overtime',
    roleRequiredLabel: 'jefe de cocina, salón, administración o dueño',
  },
  {
    id: 'incidents',
    label: 'Incidencias',
    description: 'Reporte y seguimiento de averías, roturas y quejas.',
    icon: AlertTriangle,
    permissions: [ABILITIES.INCIDENTS_REPORT, ABILITIES.INCIDENTS_MANAGE],
    subView: 'incidents',
    roleRequiredLabel: 'personal del restaurante, jefes de área, administración o dueño',
  },
  {
    id: 'lots',
    label: 'Lotes de carne',
    description: 'Rotación FIFO, saldos por ubicación y trazabilidad de cada lote.',
    icon: Tags,
    permissions: [ABILITIES.LOTS_MANAGE, ABILITIES.INVENTORY_VIEW],
    subView: 'lots',
    requiresLotItems: true,
    roleRequiredLabel: 'personal de cocina, administración o dueño',
  },
];

/**
 * Devuelve los módulos visibles para el usuario autenticado según sus permisos.
 *
 * @param {object|null} user
 * @returns {Array<object>}
 */
export function getVisibleModules(user) {
  return MODULE_REGISTRY.filter((mod) => {
    if (mod.excludePermissions && canAny(user, mod.excludePermissions)) {
      return false;
    }
    return canAny(user, mod.permissions);
  });
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
