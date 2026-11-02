import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CAMERA_PERMISSION_DENIED_MESSAGE,
  CAMERA_UNAVAILABLE_MESSAGE,
  ensureCameraAccess,
} from '../cameraPermission';

const nativePlatform = { isNativePlatform: () => true };

const setMediaDevices = (value) => {
  Object.defineProperty(window.navigator, 'mediaDevices', {
    configurable: true,
    value,
  });
};

describe('ensureCameraAccess (Brief 42p)', () => {
  beforeEach(() => {
    setMediaDevices(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.navigator.mediaDevices;
  });

  it('no pide permiso adicional en el navegador', async () => {
    const result = await ensureCameraAccess({ isNativePlatform: () => false });
    expect(result.ok).toBe(true);
  });

  it('pide getUserMedia en Android y libera la cámara al terminar', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    setMediaDevices({ getUserMedia });

    const result = await ensureCameraAccess(nativePlatform);
    expect(result.ok).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(stop).toHaveBeenCalled();
  });

  it('devuelve el mensaje exacto cuando se niega el permiso', async () => {
    const denied = new Error('denegado');
    denied.name = 'NotAllowedError';
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(denied) });

    const result = await ensureCameraAccess(nativePlatform);
    expect(result.ok).toBe(false);
    expect(result.message).toBe(CAMERA_PERMISSION_DENIED_MESSAGE);
  });

  it('devuelve el mensaje genérico ante otros fallos o falta de API', async () => {
    setMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(new Error('fallo')) });
    const failed = await ensureCameraAccess(nativePlatform);
    expect(failed.message).toBe(CAMERA_UNAVAILABLE_MESSAGE);

    setMediaDevices(undefined);
    const missing = await ensureCameraAccess(nativePlatform);
    expect(missing.message).toBe(CAMERA_UNAVAILABLE_MESSAGE);
  });
});
