import { getSettings } from './storage';

export const UNAUTHORIZED_SESSION_MESSAGE = 'Tu sesión terminó o tu cargo cambió. Inicia sesión otra vez.';
export const PASSWORD_CHANGE_REQUIRED_EVENT = 'ualdo:password_change_required';
export const PASSWORD_CHANGE_REQUIRED_MESSAGE = 'Cambia tu contraseña temporal para continuar.';

export const getAuthToken = () => {
  try {
    return localStorage.getItem('ualdo_token');
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('ualdo_token', token);
    } else {
      localStorage.removeItem('ualdo_token');
    }
  } catch (e) {}
};

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem('ualdo_user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('ualdo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ualdo_user');
    }
  } catch (e) {}
};

export const clearAuthSession = () => {
  try {
    localStorage.removeItem('ualdo_token');
    localStorage.removeItem('ualdo_user');
  } catch (e) {}
};

export const getApiBaseUrl = () => {
  let baseUrl = '';
  try {
    const settings = getSettings();
    baseUrl = settings.apiBaseUrl;
  } catch (err) {
    if (import.meta.env.PROD) {
      throw new Error('URL de API inválida en producción (debe ser HTTPS).');
    }
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://ualbusiness.test/api/v1';
  }

  if (import.meta.env.PROD && !baseUrl.startsWith('https://')) {
    throw new Error('URL de API inválida en producción (debe ser HTTPS).');
  }

  return baseUrl.replace(/\/+$/, '');
};

const resolveUrl = (path) => {
  const cleanBaseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
};

const handleUnauthorized = () => {
  clearAuthSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ualdo:unauthorized', {
      detail: { message: UNAUTHORIZED_SESSION_MESSAGE },
    }));
  }
};

const handlePasswordChangeRequired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PASSWORD_CHANGE_REQUIRED_EVENT, {
      detail: { message: PASSWORD_CHANGE_REQUIRED_MESSAGE },
    }));
  }
};

const withAuthHeader = (headers = {}) => {
  const token = getAuthToken();
  if (!token) return { ...headers };
  return { ...headers, Authorization: `Bearer ${token}` };
};

export const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 10000,
  } = options;

  let url = '';
  try {
    url = resolveUrl(path);
  } catch (err) {
    return { ok: false, status: 0, error: err.message, isNetworkError: true };
  }

  const reqHeaders = withAuthHeader({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions = {
      method,
      headers: reqHeaders,
      signal: controller.signal,
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      handleUnauthorized();
      return { ok: false, status: 401, error: UNAUTHORIZED_SESSION_MESSAGE };
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (response.status === 403 && data?.code === 'password_change_required') {
      handlePasswordChangeRequired();
      return {
        ok: false,
        status: 403,
        error: data?.message || PASSWORD_CHANGE_REQUIRED_MESSAGE,
        data,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || `Error ${response.status}`,
        data,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con el servidor.' : (err.message || 'Error de conexión'),
      isNetworkError: true,
    };
  }
};

/**
 * Descarga una respuesta en streaming como Blob pasando Bearer token y manejando 401 (Brief 34bp_fix).
 *
 * @param {string} path Ruta relativa al API (e.g. '/purchase-documents/1/file')
 * @param {object} [options={}] Opciones adicionales (timeout)
 * @returns {Promise<{ ok: boolean, status: number, blob?: Blob, error?: string }>}
 */
export const requestBlob = async (path, options = {}) => {
  const { timeout = 30000 } = options;

  let url = '';
  try {
    url = resolveUrl(path);
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }

  const reqHeaders = withAuthHeader();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: reqHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      handleUnauthorized();
      return { ok: false, status: 401, error: UNAUTHORIZED_SESSION_MESSAGE };
    }

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {}
      return { ok: false, status: response.status, error: errorText || `Error ${response.status}` };
    }

    const blob = await response.blob();
    return { ok: true, status: response.status, blob };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con el servidor.' : (err.message || 'Error de conexión'),
    };
  }
};

/**
 * Sube un archivo mediante FormData sin fijar Content-Type a mano (Brief 34ap / 37p).
 *
 * @param {string} path Ruta relativa al API (e.g. '/incidents/1/evidence')
 * @param {File|Blob} file Archivo a subir
 * @param {string} [fieldName='file'] Nombre del campo en el FormData
 * @param {object} [options={}] Opciones adicionales (headers, timeout)
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string, isNetworkError?: boolean }>}
 */
export const uploadFile = async (path, file, fieldName = 'file', options = {}) => {
  const { timeout = 30000, headers = {} } = options;

  let url = '';
  try {
    url = resolveUrl(path);
  } catch (err) {
    return { ok: false, status: 0, error: err.message, isNetworkError: true };
  }

  const reqHeaders = withAuthHeader({
    Accept: 'application/json',
    ...headers,
  });

  const formData = new FormData();
  formData.append(fieldName, file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: reqHeaders,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.status === 401) {
      handleUnauthorized();
      return { ok: false, status: 401, error: UNAUTHORIZED_SESSION_MESSAGE };
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (response.status === 403 && data?.code === 'password_change_required') {
      handlePasswordChangeRequired();
      return {
        ok: false,
        status: 403,
        error: data?.message || PASSWORD_CHANGE_REQUIRED_MESSAGE,
        data,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || `Error ${response.status}`,
        data,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con el servidor.' : (err.message || 'Error de conexión'),
      isNetworkError: true,
    };
  }
};
