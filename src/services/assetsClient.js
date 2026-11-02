import { request } from './apiClient';

/**
 * Cliente de activos, vajilla y conteo mensual (Brief 38 / 38p).
 */

export const ASSET_CATEGORIES = Object.freeze([
  'vajilla',
  'cristaleria',
  'equipo_salon',
  'equipo_cocina',
]);

export const ASSET_CATEGORY_LABELS = Object.freeze({
  vajilla: 'Vajilla',
  cristaleria: 'Cristalería',
  equipo_salon: 'Equipo de salón',
  equipo_cocina: 'Equipo de cocina',
});

export const ASSET_STATUSES = Object.freeze([
  'activo',
  'fuera_de_servicio',
  'dado_de_baja',
]);

export const ASSET_STATUS_LABELS = Object.freeze({
  activo: 'Activo',
  fuera_de_servicio: 'Fuera de servicio',
  dado_de_baja: 'Dado de baja',
});

export const ASSET_AREAS = Object.freeze(['kitchen', 'lounge']);

export const ASSET_AREA_LABELS = Object.freeze({
  kitchen: 'Cocina',
  lounge: 'Salón',
});

const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function validateId(id) {
  const parsed = parseInt(String(id ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeAssetResponse(res) {
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: res.error || 'Error al procesar la solicitud.',
      data: res.data || null,
    };
  }
  return {
    ok: true,
    status: res.status,
    data: res.data?.data !== undefined ? res.data.data : res.data,
  };
}

/**
 * GET /api/v1/assets?category=&area=&status=
 */
export async function listAssets(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category && ASSET_CATEGORIES.includes(filters.category)) {
    params.set('category', filters.category);
  }
  if (filters.area && ASSET_AREAS.includes(filters.area)) {
    params.set('area', filters.area);
  }
  if (filters.status && ASSET_STATUSES.includes(filters.status)) {
    params.set('status', filters.status);
  }

  const qs = params.toString();
  const res = await request(qs ? `/assets?${qs}` : '/assets');
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/assets
 */
export async function createAsset(data = {}) {
  if (!data.category || !ASSET_CATEGORIES.includes(data.category)) {
    return { ok: false, status: 400, error: 'Categoría de activo no válida.' };
  }
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name || name.length > 120) {
    return { ok: false, status: 400, error: 'El nombre es obligatorio y no puede superar 120 caracteres.' };
  }

  const expQty = parseInt(data.expected_quantity, 10);
  if (!Number.isInteger(expQty) || expQty < 0) {
    return { ok: false, status: 400, error: 'La cantidad esperada debe ser un entero mayor o igual a 0.' };
  }

  const body = {
    category: data.category,
    name,
    expected_quantity: expQty,
  };

  if (data.code && typeof data.code === 'string' && data.code.trim()) {
    body.code = data.code.trim().slice(0, 30);
  }
  if (data.min_quantity !== undefined && data.min_quantity !== null && data.min_quantity !== '') {
    const minQty = parseInt(data.min_quantity, 10);
    if (!Number.isInteger(minQty) || minQty < 0) {
      return { ok: false, status: 400, error: 'La cantidad mínima debe ser un entero mayor o igual a 0.' };
    }
    body.min_quantity = minQty;
  }
  if (data.notes && typeof data.notes === 'string') {
    body.notes = data.notes.trim();
  }

  const res = await request('/assets', {
    method: 'POST',
    body,
  });
  return normalizeAssetResponse(res);
}

/**
 * PUT /api/v1/assets/{id}
 */
export async function updateAsset(id, data = {}, reason = '') {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de activo no válido.' };
  }

  const body = {};

  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name || name.length > 120) {
      return { ok: false, status: 400, error: 'El nombre debe tener entre 1 y 120 caracteres.' };
    }
    body.name = name;
  }

  if (data.code !== undefined) {
    body.code = data.code ? String(data.code).trim().slice(0, 30) : null;
  }

  if (data.min_quantity !== undefined) {
    if (data.min_quantity === null || data.min_quantity === '') {
      body.min_quantity = null;
    } else {
      const minQty = parseInt(data.min_quantity, 10);
      if (!Number.isInteger(minQty) || minQty < 0) {
        return { ok: false, status: 400, error: 'La cantidad mínima debe ser un entero mayor o igual a 0.' };
      }
      body.min_quantity = minQty;
    }
  }

  if (data.expected_quantity !== undefined) {
    const expQty = parseInt(data.expected_quantity, 10);
    if (!Number.isInteger(expQty) || expQty < 0) {
      return { ok: false, status: 400, error: 'La cantidad esperada debe ser un entero mayor o igual a 0.' };
    }
    const cleanReason = String(reason || data.reason || '').trim();
    if (!cleanReason) {
      return { ok: false, status: 422, error: 'Indica el motivo por el cual cambia la cantidad esperada.' };
    }
    body.expected_quantity = expQty;
    body.reason = cleanReason;
  }

  if (data.notes !== undefined) {
    body.notes = data.notes ? String(data.notes).trim() : null;
  }

  const res = await request(`/assets/${validId}`, {
    method: 'PUT',
    body,
  });
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/assets/{id}/status
 */
export async function setAssetStatus(id, status, reason = '') {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de activo no válido.' };
  }
  if (!ASSET_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: 'Estado de activo no válido.' };
  }

  const body = { status };
  if (reason && typeof reason === 'string' && reason.trim()) {
    body.reason = reason.trim();
  }

  const res = await request(`/assets/${validId}/status`, {
    method: 'POST',
    body,
  });
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/assets/import (hasta 300 filas)
 */
export async function importAssets(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, status: 400, error: 'Se requiere al menos una fila para importar.' };
  }
  if (rows.length > 300) {
    return { ok: false, status: 400, error: 'No se pueden importar más de 300 filas por lote.' };
  }

  const res = await request('/assets/import', {
    method: 'POST',
    body: { rows },
  });
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/asset-counts
 */
export async function createAssetCount(area, period) {
  if (!ASSET_AREAS.includes(area)) {
    return { ok: false, status: 400, error: 'El área debe ser cocina o salón.' };
  }
  if (period && !PERIOD_REGEX.test(period)) {
    return { ok: false, status: 400, error: 'El periodo debe tener el formato YYYY-MM.' };
  }

  const body = { area };
  if (period) {
    body.period = period;
  }

  const res = await request('/asset-counts', {
    method: 'POST',
    body,
  });
  return normalizeAssetResponse(res);
}

/**
 * PUT /api/v1/asset-counts/{id}/lines
 */
export async function saveAssetCountLines(id, lines = []) {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de conteo no válido.' };
  }
  if (!Array.isArray(lines)) {
    return { ok: false, status: 400, error: 'Se requiere una lista de líneas de conteo.' };
  }

  const cleanLines = [];
  for (const item of lines) {
    const assetId = validateId(item.asset_id);
    const qty = parseInt(item.counted_quantity, 10);
    if (!assetId || !Number.isInteger(qty) || qty < 0) {
      return { ok: false, status: 400, error: 'Línea de conteo inválida (activo o cantidad).' };
    }
    cleanLines.push({ asset_id: assetId, counted_quantity: qty });
  }

  const res = await request(`/asset-counts/${validId}/lines`, {
    method: 'PUT',
    body: { lines: cleanLines },
  });
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/asset-counts/{id}/submit
 */
export async function submitAssetCount(id) {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de conteo no válido.' };
  }

  const res = await request(`/asset-counts/${validId}/submit`, {
    method: 'POST',
  });
  return normalizeAssetResponse(res);
}

/**
 * PUT /api/v1/asset-counts/{id}/explanations
 */
export async function saveAssetExplanations(id, lines = []) {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de conteo no válido.' };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, status: 400, error: 'Se requieren explicaciones para las diferencias.' };
  }

  const cleanLines = [];
  for (const item of lines) {
    const assetId = validateId(item.asset_id);
    const exp = typeof item.explanation === 'string' ? item.explanation.trim() : '';
    if (!assetId || !exp) {
      return { ok: false, status: 400, error: 'La explicación es obligatoria para cada diferencia.' };
    }
    cleanLines.push({ asset_id: assetId, explanation: exp });
  }

  const res = await request(`/asset-counts/${validId}/explanations`, {
    method: 'PUT',
    body: { lines: cleanLines },
  });
  return normalizeAssetResponse(res);
}

/**
 * POST /api/v1/asset-counts/{id}/validate
 */
export async function validateAssetCount(id) {
  const validId = validateId(id);
  if (!validId) {
    return { ok: false, status: 400, error: 'Identificador de conteo no válido.' };
  }

  const res = await request(`/asset-counts/${validId}/validate`, {
    method: 'POST',
  });
  return normalizeAssetResponse(res);
}

/**
 * GET /api/v1/assets/report?period=YYYY-MM&area=
 */
export async function getAssetReport(period = '', area = '') {
  const params = new URLSearchParams();
  if (period && typeof period === 'string' && PERIOD_REGEX.test(period.trim())) {
    params.set('period', period.trim());
  }
  if (area && ASSET_AREAS.includes(area)) {
    params.set('area', area);
  }

  const qs = params.toString();
  const res = await request(qs ? `/assets/report?${qs}` : '/assets/report');
  return normalizeAssetResponse(res);
}
