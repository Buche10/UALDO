import { request, uploadFile } from './apiClient';

export const MAX_CHAT_ATTACHMENTS = 3;
export const MAX_XML_ATTACHMENT_BYTES = 1024 * 1024;
export const MAX_IMAGE_ATTACHMENT_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const XML_MIME_TYPES = new Set(['text/xml', 'application/xml']);
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const attachmentError = (error) => ({ ok: false, status: 422, error });
const chatError = (message, status = 400) => ({
  ok: false,
  status,
  reply: '',
  pendingActions: [],
  cards: [],
  quickReplies: [],
  message
});

const chatResponse = (data = {}) => {
  const rawReplies = data?.quick_replies || [];
  return {
    ok: true,
    status: 200,
    reply: data?.reply || '',
    pendingActions: Array.isArray(data?.pending_actions) ? data.pending_actions : [],
    cards: Array.isArray(data?.cards) ? data.cards : [],
    quickReplies: Array.isArray(rawReplies)
      ? rawReplies.filter((text) => typeof text === 'string' && text.trim()).map((text) => text.trim())
      : [],
    message: ''
  };
};

/**
 * Valida tipo y tamaño de un adjunto del chat antes de tocar la red.
 * Contrato del Brief 43: XML hasta 1 MB, imagen hasta 8 MB y PDF hasta 10 MB.
 */
export const validateChatAttachment = (file) => {
  if (!file || typeof file.name !== 'string') {
    return attachmentError('Elige un archivo.');
  }

  const name = file.name.toLowerCase();
  const mime = String(file.type || '').toLowerCase();
  const size = Number(file.size) || 0;

  if (name.endsWith('.xml') || XML_MIME_TYPES.has(mime)) {
    if (size > MAX_XML_ATTACHMENT_BYTES) {
      return attachmentError('El archivo XML no puede superar 1 MB.');
    }
    return { ok: true, kind: 'xml' };
  }

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    if (size > MAX_PDF_ATTACHMENT_BYTES) {
      return attachmentError('El PDF no puede superar 10 MB.');
    }
    return { ok: true, kind: 'pdf' };
  }

  if (IMAGE_MIME_TYPES.has(mime)) {
    if (size > MAX_IMAGE_ATTACHMENT_BYTES) {
      return attachmentError('La imagen no puede superar 8 MB.');
    }
    return { ok: true, kind: 'image' };
  }

  return attachmentError('Solo se aceptan imágenes JPG, PNG o WebP, PDF o XML.');
};

/** POST /assistant/attachments (multipart, campo file). */
export const uploadChatAttachment = async (file) => {
  const validation = validateChatAttachment(file);
  if (!validation.ok) return validation;

  const result = await uploadFile('/assistant/attachments', file, 'file', { timeout: 60000 });
  if (result.isNetworkError || !result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.isNetworkError
        ? 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
        : (result.data?.message || result.error || 'No se pudo subir el archivo.'),
    };
  }

  const payload = result.data?.data || result.data || null;
  if (!payload || payload.id === undefined || payload.id === null) {
    return { ok: false, status: result.status, error: 'No se pudo subir el archivo.' };
  }

  return {
    ok: true,
    status: result.status,
    attachment: {
      id: payload.id,
      kind: payload.kind || validation.kind,
      original_name: payload.original_name || file.name,
      size_bytes: payload.size_bytes ?? file.size,
    },
  };
};

export const sendMessage = async (message, attachmentIds = []) => {
  const cleanMessage = typeof message === 'string' ? message.trim() : '';
  const ids = Array.isArray(attachmentIds)
    ? attachmentIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!cleanMessage && ids.length === 0) return chatError('El mensaje no puede estar vacío.');
  if (cleanMessage.length > 1000) return chatError('El mensaje no puede superar los 1000 caracteres.');
  if (ids.length > MAX_CHAT_ATTACHMENTS) return chatError('Puedes adjuntar hasta 3 archivos.');

  const body = { message: cleanMessage };
  if (ids.length > 0) body.attachment_ids = ids;

  const result = await request('/assistant/chat', { method: 'POST', body, timeout: 30000 });

  if (result.status === 429) return chatError('Demasiados mensajes. Por favor espera un momento.', 429);
  if (result.status === 409) return chatError(result.data?.message || result.error || 'Conflicto de estado.', 409);
  if (result.isNetworkError || !result.ok) {
    return chatError(result.isNetworkError
      ? 'No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo.'
      : (result.data?.message || result.error || 'Error al comunicarse con el asistente.'), result.status);
  }

  return chatResponse(result.data);
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
