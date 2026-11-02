import { getSettings } from './storage';

export const UNAUTHORIZED_SESSION_MESSAGE = 'Tu sesión terminó o tu cargo cambió. Inicia sesión otra vez.';

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

export const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 10000
  } = options;

  let cleanBaseUrl = '';
  try {
    cleanBaseUrl = getApiBaseUrl();
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message,
      isNetworkError: true
    };
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${cleanBaseUrl}${cleanPath}`;

  const token = getAuthToken();

  const reqHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions = {
      method,
      headers: reqHeaders,
      signal: controller.signal
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ualdo:unauthorized', {
          detail: { message: UNAUTHORIZED_SESSION_MESSAGE }
        }));
      }
      return {
        ok: false,
        status: 401,
        error: UNAUTHORIZED_SESSION_MESSAGE
      };
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || `Error ${response.status}`,
        data
      };
    }

    return {
      ok: true,
      status: response.status,
      data
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado al conectar con el servidor.' : (err.message || 'Error de conexión'),
      isNetworkError: true
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

  let cleanBaseUrl = '';
  try {
    cleanBaseUrl = getApiBaseUrl();
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message,
      isNetworkError: true,
    };
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${cleanBaseUrl}${cleanPath}`;

  const token = getAuthToken();
  const reqHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

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
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ualdo:unauthorized', {
          detail: { message: UNAUTHORIZED_SESSION_MESSAGE },
        }));
      }
      return {
        ok: false,
        status: 401,
        error: UNAUTHORIZED_SESSION_MESSAGE,
      };
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || `Error ${response.status}`,
        data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
    };
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
