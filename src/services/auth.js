import { request, setAuthToken, setStoredUser, getAuthToken, getStoredUser, clearAuthSession } from './apiClient';

export const clearUserStorage = (userId) => {
  try {
    if (userId) {
      localStorage.removeItem(`ualdo_chat_${userId}`);
      localStorage.removeItem(`ualdo_privacy_ack_${userId}_v1`);
    } else {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ualdo_chat_') || key.startsWith('ualdo_privacy_ack_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    // ignore local storage errors
  }
};

export const login = async (email, password, deviceName = 'Mobile PWA') => {
  const result = await request('/login', {
    method: 'POST',
    body: { email, password, device_name: deviceName }
  });

  if (result.isNetworkError) {
    return {
      success: false,
      error: 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
    };
  }

  if (result.ok && result.data?.token) {
    const token = result.data.token;
    setAuthToken(token);
    try {
      localStorage.setItem('teams_token', token);
    } catch (e) {}

    const meUser = await fetchMe();
    const finalUser = meUser || result.data.user || null;
    if (finalUser) {
      setStoredUser(finalUser);
      try {
        localStorage.setItem('teams_user', JSON.stringify(finalUser));
      } catch (e) {}
    }

    return {
      success: true,
      user: finalUser,
      token
    };
  }

  return {
    success: false,
    error: 'Correo o contraseña incorrectos.'
  };
};

export const logout = async () => {
  const currentUser = getStoredUser();
  const userId = currentUser?.id;
  try {
    await request('/logout', { method: 'POST' });
  } catch (e) {
    // ignore
  } finally {
    clearAuthSession();
    clearUserStorage(userId);
    try {
      localStorage.removeItem('teams_token');
      localStorage.removeItem('teams_user');
    } catch (e) {}
  }
};

export const fetchMe = async () => {
  const result = await request('/me');
  if (result.ok && (result.data?.user || result.data)) {
    const user = result.data.user || result.data;
    setStoredUser(user);
    try {
      localStorage.setItem('teams_user', JSON.stringify(user));
    } catch (e) {}
    return user;
  }
  if (result.status === 401) {
    const stored = getStoredUser();
    clearAuthSession();
    clearUserStorage(stored?.id);
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
