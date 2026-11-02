import { DEFAULT_AGE_ALERT_DAYS } from '../../services/lotsClient';
import { formatQuantity } from '../../services/quantityFormat';
import { locationLabel } from '../../services/inventoryLocations';

export const LOT_STATUS_LABELS = Object.freeze({
  activo: 'Activo',
  agotado: 'Agotado',
  no_apto: 'No apto',
});

export const MOVEMENT_KIND_LABELS = Object.freeze({
  ingreso: 'Ingreso',
  porcionado_salida: 'Porcionado (salida)',
  porcionado_entrada: 'Porcionado (entrada)',
  venta: 'Venta',
  transferencia: 'Transferencia',
  retiro: 'Retiro',
  merma: 'Merma',
  ajuste: 'Ajuste',
  no_apto: 'No apto',
});

export const MOVEMENT_KIND_ORDER = Object.freeze(Object.keys(MOVEMENT_KIND_LABELS));

/** Fecha local de hoy en formato AAAA-MM-DD. */
export function todayIsoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Días completos desde la fecha de recepción hasta hoy (nunca negativo). */
export function daysSinceReceived(receivedOn, today = todayIsoDate()) {
  const received = String(receivedOn || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(received) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  const start = Date.parse(`${received}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.floor((end - start) / 86400000));
}

/** Etiqueta de antigüedad en días. */
export function ageLabel(days) {
  if (days === null) return 'Sin fecha';
  return days === 1 ? '1 día' : `${days} días`;
}

export function isAgeWarning(days, alertDays = DEFAULT_AGE_ALERT_DAYS) {
  return typeof days === 'number' && days >= alertDays;
}

/** Texto corto de los saldos de un lote, por ubicación y producto. */
export function balanceSummary(balances = []) {
  return (balances || [])
    .filter((row) => Number(row.quantity) > 0)
    .map((row) => `${row.item || 'Insumo'}: ${locationLabel(row.location)} ${formatQuantity(row.quantity)}`);
}

/** Nombre del corte principal del lote. */
export function lotCutName(lot) {
  return lot?.item || 'Corte sin nombre';
}

export function formatMoneyCents(cents) {
  if (cents === null || cents === undefined) return 'Sin dato';
  const value = Number(cents) / 100;
  if (Number.isNaN(value)) return 'Sin dato';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatUnitCost(value) {
  if (value === null || value === undefined) return 'Sin dato';
  const number = Number(value);
  if (Number.isNaN(number)) return 'Sin dato';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(number);
}
