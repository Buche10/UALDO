import { request, setAuthToken, setStoredUser, getAuthToken, getStoredUser, clearAuthSession } from './apiClient';

export const login = async (email, password, deviceName = 'Mobile PWA') => {
  const result = await request('/login', {
    method: 'POST',
    body: { email, password, device_name: deviceName }
  });

  if (result.ok && result.data?.token) {
    setAuthToken(result.data.token);
    if (result.data.user) {
      setStoredUser(result.data.user);
    }
    return {
      success: true,
      user: result.data.user,
      token: result.data.token
    };
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
  }
  return null;
};

export const getToken = () => getAuthToken();
export const getUser = () => getStoredUser();
export const isAuthenticated = () => Boolean(getAuthToken());
