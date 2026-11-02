import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { normalizeAccessKey } from '../../../services/purchaseDocumentsClient';
import {
  CAMERA_PERMISSION_DENIED_MESSAGE,
  CAMERA_UNAVAILABLE_MESSAGE,
} from '../../../services/cameraPermission';
import { styles } from './purchaseUi';

const DETECT_INTERVAL_MS = 500;

/**
 * Escáner de código de barras con BarcodeDetector (Brief 34ap).
 * La cámara se libera al cerrar o al desmontar el componente.
 */
export default function InvoiceBarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectedRef = useRef(false);
  const detectedCallbackRef = useRef(onDetected);
  const closeCallbackRef = useRef(onClose);
  const [error, setError] = useState(null);

  useEffect(() => { detectedCallbackRef.current = onDetected; }, [onDetected]);
  useEffect(() => { closeCallbackRef.current = onClose; }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const stopCamera = () => {
      if (timer) clearInterval(timer);
      timer = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const readCode = async (detector) => {
      if (cancelled || detectedRef.current || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        const raw = codes?.[0]?.rawValue;
        if (!raw || cancelled || detectedRef.current) return;
        detectedRef.current = true;
        stopCamera();
        detectedCallbackRef.current(normalizeAccessKey(raw));
        closeCallbackRef.current();
      } catch {
        // El detector puede fallar en un fotograma; se reintenta en el siguiente.
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play?.();
          } catch {
            // Algunos navegadores de prueba no implementan play; el detector sigue.
          }
        }
        const detector = new window.BarcodeDetector({ formats: ['code_128'] });
        timer = setInterval(() => readCode(detector), DETECT_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) {
          const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
          setError(denied ? CAMERA_PERMISSION_DENIED_MESSAGE : CAMERA_UNAVAILABLE_MESSAGE);
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Escaneando el código de barras</span>
        <button type="button" onClick={onClose} aria-label="Cerrar escáner" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <X size={16} />
        </button>
      </div>
      <video ref={videoRef} muted playsInline style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', background: 'var(--bg-dark)' }} />
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Apunta la cámara al código de barras del RIDE.
      </p>
      <div aria-live="polite">{error && <div style={styles.errorBox}>{error}</div>}</div>
    </div>
  );
}
