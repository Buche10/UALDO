import { formatQuantity } from '../../services/quantityFormat';

/**
 * Textos, fechas y cálculos de presentación de reservas (Brief 39p).
 * Solo formatea lo que manda el motor; las horas se muestran en Guayaquil.
 */

export const STATUS_LABELS = {
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  cumplida: 'Cumplida',
  no_show: 'No vino',
};

export const STATUS_STYLES = {
  confirmada: { background: 'var(--success-soft)', color: 'var(--success)' },
  cancelada: { background: 'var(--error-soft)', color: 'var(--error)' },
  cumplida: { background: 'var(--primary-soft)', color: 'var(--accent)' },
  no_show: { background: 'var(--warning-soft)', color: 'var(--warning)' },
};

const DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const TIME_FMT = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const LONG_FMT = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const SHORT_FMT = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  weekday: 'short',
});

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Hora "20:30" de una fecha del motor, en Guayaquil. */
export function formatReservationTime(value) {
  const date = toDate(value);
  return date ? TIME_FMT.format(date) : '';
}

/** Fecha YYYY-MM-DD de una fecha del motor, en Guayaquil. */
export function reservationDate(value) {
  const date = toDate(value);
  return date ? DATE_FMT.format(date) : '';
}

/** Fecha larga en español: "viernes, 20 de noviembre". */
export function formatReservationDate(value) {
  const date = toDate(value);
  return date ? LONG_FMT.format(date) : '';
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || 'Sin dato';
}

export function statusStyle(status) {
  return STATUS_STYLES[status] || { background: 'var(--chip-bg)', color: 'var(--text-muted)' };
}

/** Primer nombre del cliente; nunca el nombre completo. */
export function firstName(name) {
  const clean = String(name || '').trim();
  return clean ? clean.split(/\s+/)[0] : 'Cliente';
}

export function sumParty(reservations = []) {
  return reservations.reduce((total, row) => total + (Number(row?.party_size) || 0), 0);
}

/** Orden ascendente por hora de reserva. */
export function sortByTime(reservations = []) {
  return [...reservations].sort((a, b) => {
    const left = new Date(a?.reserved_for).getTime() || 0;
    const right = new Date(b?.reserved_for).getTime() || 0;
    return left - right;
  });
}

/** Lunes a domingo de la semana de una fecha YYYY-MM-DD. */
export function weekDates(dateIso) {
  const [year, month, day] = String(dateIso || '').split('-').map(Number);
  const base = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const weekday = base.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  base.setUTCDate(base.getUTCDate() + offset);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(base);
    current.setUTCDate(base.getUTCDate() + index);
    return current.toISOString().slice(0, 10);
  });
}

export function addDays(dateIso, days) {
  const [year, month, day] = String(dateIso || '').split('-').map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayShort(dateIso) {
  const date = new Date(`${dateIso}T12:00:00-05:00`);
  return Number.isNaN(date.getTime()) ? '' : SHORT_FMT.format(date);
}

export function dayNumber(dateIso) {
  return String(dateIso || '').slice(8, 10);
}

/** "Hoy" o "Mañana" o la fecha larga. */
export function dayLabel(dateIso, today) {
  if (dateIso === today) return 'Hoy';
  if (dateIso === addDays(today, 1)) return 'Mañana';
  return formatReservationDate(`${dateIso}T12:00:00-05:00`);
}

export function isFromReservationDay(reservation, today) {
  if (!reservation || reservation.status !== 'confirmada') return false;
  const date = reservationDate(reservation.reserved_for);
  return Boolean(date) && date <= today;
}

/** Avisos del motor y de bajo mínimo para mostrar en la reserva guardada. */
export function reservationFeedback(warnings = [], suggestions = []) {
  const notices = (Array.isArray(warnings) ? warnings : [])
    .map((row) => String(row || '').trim())
    .filter(Boolean);
  const lowStock = (Array.isArray(suggestions) ? suggestions : [])
    .filter((row) => row && row.min !== null && row.min !== undefined)
    .map((row) => {
      const name = row.name || 'insumo';
      const available = formatQuantity(row.available);
      const minimum = formatQuantity(row.min);
      return `Esta reserva deja poco ${name}: disponible ${available}, mínimo ${minimum}. Se avisó a compras.`;
    });
  return { warnings: notices, lowStock };
}

export function partyLabel(size) {
  const count = Number(size) || 0;
  return count === 1 ? '1 persona' : `${count} personas`;
}

export function reservationsSummary(reservations = []) {
  const count = reservations.length;
  const people = sumParty(reservations);
  return `${count} ${count === 1 ? 'reserva' : 'reservas'}, ${partyLabel(people)}`;
}
