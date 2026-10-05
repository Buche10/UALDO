// Cliente para el backend de Ualdo Teams (gestión de tareas).
// Autenticación bearer Sanctum dedicada.

const TEAMS_BASE = (import.meta.env.VITE_TEAMS_API_URL || import.meta.env.VITE_NEXO_API_URL || 'http://nexoteams.test/api').replace(/\/+$/, '');

export const getTeamsBaseUrl = () => TEAMS_BASE;

export const getTeamsToken = () => {
  try { return localStorage.getItem('teams_token') || localStorage.getItem('nexo_token'); } catch { return null; }
};

export const setTeamsToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('teams_token', token);
      localStorage.setItem('nexo_token', token);
    } else {
      localStorage.removeItem('teams_token');
      localStorage.removeItem('nexo_token');
    }
  } catch (e) { /* almacenamiento no disponible */ }
};

export const getTeamsUser = () => {
  try {
    const d = localStorage.getItem('teams_user') || localStorage.getItem('nexo_user');
    return d ? JSON.parse(d) : null;
  } catch { return null; }
};

const setTeamsUser = (user) => {
  try {
    if (user) {
      localStorage.setItem('teams_user', JSON.stringify(user));
      localStorage.setItem('nexo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('teams_user');
      localStorage.removeItem('nexo_user');
    }
  } catch (e) { /* noop */ }
};

export const isTeamsAuthenticated = () => !!getTeamsToken();

export const teamsLogout = () => { setTeamsToken(null); setTeamsUser(null); };

export const teamsLogin = async (email, password) => {
  try {
    const res = await fetch(`${TEAMS_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.token) {
      return { ok: false, error: data?.message || `Error ${res.status}` };
    }
    setTeamsToken(data.token);
    setTeamsUser(data.user || { email });
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.message || 'No se pudo conectar con Ualdo Teams. Revisa la URL del servidor.' };
  }
};

export const teamsRequest = async (path, { method = 'GET', body = null, timeout = 12000 } = {}) => {
  const token = getTeamsToken();
  const url = `${TEAMS_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    clearTimeout(timer);

    if (res.status === 401) {
      teamsLogout();
      return { ok: false, status: 401, error: 'Sesión de Ualdo Teams expirada. Inicia sesión de nuevo.' };
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: data?.message || `Error ${res.status}`, data };
    return { ok: true, status: res.status, data };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'Tiempo de espera agotado.' : (err.message || 'Error de conexión'), isNetworkError: true };
  }
};

// Aliases para compatibilidad durante migración
export const getNexoBaseUrl = getTeamsBaseUrl;
export const getNexoToken = getTeamsToken;
export const setNexoToken = setTeamsToken;
export const getNexoUser = getTeamsUser;
export const isNexoAuthenticated = isTeamsAuthenticated;
export const nexoLogout = teamsLogout;
export const nexoLogin = teamsLogin;
export const nexoRequest = teamsRequest;

// Endpoints de la sección Trabajo (Ualdo Teams)
export const fetchProgress = () => teamsRequest('/mobile/progress');
export const fetchTasks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return teamsRequest(`/mobile/tasks${qs ? `?${qs}` : ''}`);
};
export const fetchNotifications = () => teamsRequest('/mobile/notifications');
export const markNotificationRead = (id) => teamsRequest(`/mobile/notifications/${id}/read`, { method: 'POST' });

// Proyectos + miembros del workspace (para el formulario de crear tarea).
export const fetchMeta = () => teamsRequest('/mobile/meta');
// Crear tarea desde la app.
export const createTask = (payload) => teamsRequest('/mobile/tasks', { method: 'POST', body: payload });

export const getTaskLog = (taskId) => teamsRequest(`/mobile/tasks/${taskId}/log`);
export const addTaskNote = (taskId, { content, isKey }) => teamsRequest(`/mobile/tasks/${taskId}/log`, {
  method: "POST",
  body: { kind: "note", content, is_key: !!isKey }
});
export const addTaskHandoff = (taskId, { done, pending, avoid, contact }) => teamsRequest(`/mobile/tasks/${taskId}/log`, {
  method: "POST",
  body: {
    kind: "handoff",
    is_key: true,
    meta: { done, pending, avoid, contact }
  }
});

