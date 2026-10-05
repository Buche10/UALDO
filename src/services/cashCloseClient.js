// Cliente del cierre de caja (Ualdo Teams / RunFood).
import { teamsRequest } from './teamsClient';

// Trae la base del día (prellenada desde RunFood) + el cierre guardado si existe.
export const fetchCashCloseDay = (fecha) =>
  teamsRequest(`/mobile/cash-close?fecha=${encodeURIComponent(fecha)}`);

// Guarda (o actualiza) el cierre del día.
export const saveCashClose = (payload) =>
  teamsRequest('/mobile/cash-close', { method: 'POST', body: payload });
