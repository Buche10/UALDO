import { getSettings } from './storage';

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

export const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 10000
  } = options;

  let baseUrl = '';
  try {
    const settings = getSettings();
    baseUrl = settings.apiBaseUrl;
  } catch (err) {
    if (import.meta.env.PROD) {
      return {
        ok: false,
        status: 0,
        error: 'URL de API inválida en producción (debe ser HTTPS).',
        isNetworkError: true
      };
    }
    baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://ualbusiness.test/api/v1';
  }

  if (import.meta.env.PROD && !baseUrl.startsWith('https://')) {
    return {
      ok: false,
      status: 0,
      error: 'URL de API inválida en producción (debe ser HTTPS).',
      isNetworkError: true
    };
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
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

    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      clearAuthSession();
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('ualdo:unauthorized'));
      }
      return {
        ok: false,
        status: 401,
        error: 'Sesión expirada o no autorizada. Por favor inicia sesión de nuevo.'
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
