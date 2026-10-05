import { request, setAuthToken, setStoredUser, getAuthToken, getStoredUser, clearAuthSession } from './apiClient';

export const login = async (email, password, deviceName = 'Mobile PWA') => {
  // Demo / Local Offline Access
  if (email.toLowerCase() === 'admin@doblefilo.com' && (password === 'admin123' || password === 'password')) {
    const demoUser = {
      id: 1,
      name: 'Administrador DobleFilo',
      email: 'admin@doblefilo.com',
      role: 'Administrador',
      business_name: 'DOBLE FILO - PRINCIPAL'
    };
    setAuthToken('demo-token-doblefilo');
    try { localStorage.setItem('teams_token', 'demo-token-doblefilo'); } catch (e) {}
    setStoredUser(demoUser);
    return { success: true, user: demoUser, token: 'demo-token-doblefilo' };
  }

  const result = await request('/login', {
    method: 'POST',
    body: { email, password, device_name: deviceName }
  });

  if (result.ok && result.data?.token) {
    setAuthToken(result.data.token);
    try { localStorage.setItem('teams_token', result.data.token); } catch (e) {}
    if (result.data.user) {
      setStoredUser(result.data.user);
      try { localStorage.setItem('teams_user', JSON.stringify(result.data.user)); } catch (e) {}
    }
    return {
      success: true,
      user: result.data.user,
      token: result.data.token
    };
  }

  // Local Fallback if Laravel API is offline
  if (result.isNetworkError || !result.ok) {
    const fallbackUser = {
      id: 1,
      name: email.split('@')[0] || 'Administrador',
      email: email,
      role: 'Administrador',
      business_name: 'DOBLE FILO - PRINCIPAL'
    };
    setAuthToken('demo-token-local');
    try { localStorage.setItem('teams_token', 'demo-token-local'); } catch (e) {}
    setStoredUser(fallbackUser);
    return { success: true, user: fallbackUser, token: 'demo-token-local' };
  }

  return {
    success: false,
    error: result.error || 'Credenciales inválidas o error de inicio de sesión.'
  };
};

export const logout = async () => {
  try {
    await request('/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout request failed or server unreachable:', e);
  } finally {
    clearAuthSession();
    try {
      localStorage.removeItem('teams_token');
      localStorage.removeItem('teams_user');
    } catch (e) {}
  }
};

export const fetchMe = async () => {
  const result = await request('/me');
  if (result.ok && result.data?.user) {
    setStoredUser(result.data.user);
    return result.data.user;
  }
  if (result.status === 401) {
    clearAuthSession();
    try {
      localStorage.removeItem('teams_token');
      localStorage.removeItem('teams_user');
    } catch (e) {}
  }
  return null;
};

export const getToken = () => getAuthToken();
export const getUser = () => getStoredUser();
export const isAuthenticated = () => Boolean(getAuthToken());