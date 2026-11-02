// DOBLEFILO (RunFood POS) integration for UALDO Mobile.
// Solo datos reales del punto de venta: no hay catálogos ni mesas de ejemplo.
import { getSettings } from './storage';

const TABLES_STORAGE_KEY = 'ualdo_doblefilo_tables';

/**
 * Borra las mesas de ejemplo que guardó una versión anterior de la app.
 * Se ejecuta al arrancar y nunca falla si localStorage no está disponible.
 */
export const clearStoredTables = () => {
  try {
    localStorage.removeItem(TABLES_STORAGE_KEY);
  } catch {
    // Sin localStorage no hay nada guardado que borrar.
  }
};

const getDoblefiloBaseUrl = () => {
  const settings = getSettings();
  const ip = settings.runfoodIp || settings.nodeIp || '192.168.100.10';
  const port = settings.runfoodPort || '1000';
  return `http://${ip}:${port}`;
};

const RUNFOOD_TIMEOUT = 8000;

// Single fetch helper for RunFood: always bounded by a timeout so a slow/offline shop PC
// fails fast instead of hanging the UI. Throws on network error or non-2xx; never returns mock.
const runfoodFetch = async (path, { method = 'GET', body = null, timeout = RUNFOOD_TIMEOUT } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const options = { method, signal: controller.signal };
    if (body != null) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const response = await fetch(`${getDoblefiloBaseUrl()}${path}`, options);
    if (!response.ok) {
      throw new Error(`RunFood ${path} respondió HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Carta real de RunFood. Si el punto de venta no responde devuelve una
 * respuesta sin éxito y sin menú: nunca inventa platos ni precios.
 */
export const getDoblefiloMenu = async () => {
  try {
    const data = await runfoodFetch('/LOCAL_NETWORK/ARTICULO/FETCH', {
      method: 'POST',
      body: { tablet: JSON.stringify({ bodega: 1 }) }
    });

    if (Array.isArray(data) && data.length > 0) {
      const realMenu = data
        .filter(a => a.habilitado && ((a.pvp1 && a.pvp1 > 0) || (a.pvp && a.pvp > 0)))
        .map(a => {
          const precioSinIva = a.pvp1 || a.pvp || 0;
          const precioConIva = a.pagaIva ? (precioSinIva * 1.15) : precioSinIva;
          return {
            id: a.id,
            codigo: a.codigo,
            nombre: a.descripcion,
            precio: parseFloat(precioConIva.toFixed(2)),
            precioSinIva: parseFloat(precioSinIva.toFixed(2)),
            categoria: 'Carta Real RunFood (SQL Server)'
          };
        });

      if (realMenu.length > 0) {
        return { success: true, menu: realMenu, source: 'runfood' };
      }
    }
  } catch (e) {
    console.warn('Error obteniendo el menú real de RunFood:', e.message);
  }

  return {
    success: false,
    menu: [],
    source: 'runfood',
    error: 'El menú de RunFood no está disponible en este momento.'
  };
};
