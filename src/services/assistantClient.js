import { request } from './apiClient';

export const sendMessage = async (message) => {
  if (!message || !message.trim()) {
    return {
      ok: false,
      status: 400,
      reply: '',
      pendingActions: [],
      message: 'El mensaje no puede estar vacío.'
    };
  }

  if (message.length > 1000) {
    return {
      ok: false,
      status: 400,
      reply: '',
      pendingActions: [],
      message: 'El mensaje no puede superar los 1000 caracteres.'
    };
  }

  const cleanMessage = message.trim();
  const result = await request('/assistant/chat', {
    method: 'POST',
    body: { message: cleanMessage },
    timeout: 30000
  });

  if (result.status === 429) {
    return {
      ok: false,
      status: 429,
      reply: '',
      pendingActions: [],
      message: 'Demasiados mensajes. Por favor espera un momento.'
    };
  }

  if (result.status === 409) {
    return {
      ok: false,
      status: 409,
      reply: '',
      pendingActions: [],
      message: result.data?.message || result.error || 'Conflicto de estado.'
    };
  }

  if (result.isNetworkError || !result.ok) {
    const errorMsg = result.isNetworkError
      ? 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
      : (result.data?.message || result.error || 'Error al comunicarse con el asistente.');
    return {
      ok: false,
      status: result.status,
      reply: '',
      pendingActions: [],
      message: errorMsg
    };
  }

  const reply = result.data?.reply || '';
  const rawPending = result.data?.pending_actions || [];
  const pendingActions = Array.isArray(rawPending) ? rawPending : [];

  return {
    ok: true,
    status: 200,
    reply,
    pendingActions,
    message: ''
  };
};

export const approveAction = async (token) => {
  const result = await request('/assistant/approve', {
    method: 'POST',
    body: { token },
    timeout: 30000
  });

  if (result.status === 409) {
    return {
      ok: false,
      status: 409,
      message: result.data?.message || result.error || 'El pedido ya fue modificado o cancelado anteriormente.'
    };
  }

  if (result.status === 400) {
    return {
      ok: false,
      status: 400,
      message: result.data?.message || result.error || 'La acción no es válida o ha expirado.'
    };
  }

  if (result.isNetworkError || !result.ok) {
    return {
      ok: false,
      status: result.status,
      message: result.isNetworkError
        ? 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
        : (result.data?.message || result.error || 'No se pudo confirmar la acción.')
    };
  }

  return {
    ok: true,
    status: 200,
    message: result.data?.message || 'Acción confirmada.',
    result: result.data?.result || ''
  };
};

export const cancelAction = async (token) => {
  const result = await request('/assistant/cancel', {
    method: 'POST',
    body: { token },
    timeout: 30000
  });

  if (result.isNetworkError || !result.ok) {
    return {
      ok: false,
      status: result.status,
      message: result.isNetworkError
        ? 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
        : (result.data?.message || result.error || 'No se pudo cancelar la acción.')
    };
  }

  return {
    ok: true,
    status: 200,
    message: result.data?.message || 'Acción cancelada.'
  };
};
