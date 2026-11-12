/**
 * Cálculos de presentación de mesas abiertas (Brief 47p).
 * No calcula dinero: solo tiempos, duraciones y etiquetas de fecha.
 */

export const LONG_TABLE_MINUTES = 180;

const DAY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const SHORT_DATE_FMT = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  day: 'numeric',
  month: 'short',
});

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Minutos transcurridos desde que se abrió la mesa, recalculados con `abierta_desde`.
 *
 * @param {string|Date|null|undefined} abiertaDesde
 * @param {Date} [now]
 * @returns {number|null}
 */
export function openTableElapsedMinutes(abiertaDesde, now = new Date()) {
  const start = toDate(abiertaDesde);
  const end = toDate(now);
  if (!start || !end) return null;

  const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  return minutes > 0 ? minutes : 0;
}

/**
 * Duración en texto: "1 h 35 min", "2 h" o "35 min".
 *
 * @param {number|null|undefined} minutes
 * @returns {string}
 */
export function formatElapsedMinutes(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return '';
  }

  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;

  if (hours > 0 && rest > 0) return `${hours} h ${rest} min`;
  if (hours > 0) return `${hours} h`;
  return `${rest} min`;
}

/** Una mesa abierta más de 3 horas se resalta con color de aviso. */
export function isLongOpenTable(minutes) {
  return Number.isFinite(minutes) && minutes > LONG_TABLE_MINUTES;
}

/**
 * Distintivo de día: "De ayer" o "Desde el 8 nov" según la fecha en Guayaquil.
 *
 * @param {string|Date|null|undefined} abiertaDesde
 * @param {Date} [now]
 * @returns {string}
 */
export function formatOpenTableDayLabel(abiertaDesde, now = new Date()) {
  const date = toDate(abiertaDesde);
  const current = toDate(now);
  if (!date || !current) return 'De ayer';

  const yesterday = new Date(current.getTime() - 24 * 60 * 60 * 1000);
  if (DAY_FMT.format(date) === DAY_FMT.format(yesterday)) return 'De ayer';
  return `Desde el ${SHORT_DATE_FMT.format(date)}`;
}
