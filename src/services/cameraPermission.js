import { Capacitor } from '@capacitor/core';

export const CAMERA_PERMISSION_DENIED_MESSAGE =
  'Activa el permiso de cámara de Ualdo en Ajustes del teléfono > Aplicaciones > Ualdo > Permisos.';
export const CAMERA_UNAVAILABLE_MESSAGE =
  'No se pudo abrir la cámara. Revisa el permiso e inténtalo otra vez.';

/**
 * Pide el permiso de cámara al WebView nativo antes de abrir la cámara.
 * En el navegador no hace falta: getUserMedia o el selector del sistema lo piden.
 *
 * @param {object} [platform] Plataforma con isNativePlatform (inyectable en tests).
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function ensureCameraAccess(platform = Capacitor) {
  if (!platform?.isNativePlatform?.()) {
    return { ok: true };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, message: CAMERA_UNAVAILABLE_MESSAGE };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
    return {
      ok: false,
      message: denied ? CAMERA_PERMISSION_DENIED_MESSAGE : CAMERA_UNAVAILABLE_MESSAGE,
    };
  }
}
