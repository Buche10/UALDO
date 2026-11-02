import React, { useCallback, useEffect, useState } from 'react';
import { FileUp, KeyRound, ScanLine } from 'lucide-react';
import { accessKeyError, normalizeAccessKey, submitAccessKey, uploadInvoiceXml } from '../../../services/purchaseDocumentsClient';
import { styles } from './purchaseUi';
import InvoiceBarcodeScanner from './InvoiceBarcodeScanner';

async function getScannerAvailability() {
  if (typeof window === 'undefined' || typeof window.BarcodeDetector !== 'function') return false;
  const formats = typeof window.BarcodeDetector.getSupportedFormats === 'function'
    ? await window.BarcodeDetector.getSupportedFormats()
    : [];
  return Array.isArray(formats) && formats.includes('code_128');
}

/**
 * Carga de una factura del SRI por XML, clave escrita o código de barras
 * del RIDE (Brief 34ap).
 */
export default function InvoiceSriEntry({ onDocument }) {
  const [mode, setMode] = useState('xml');
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getScannerAvailability()
      .then((available) => { if (!cancelled) setCanScan(available); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const cleanKey = normalizeAccessKey(key);
  const liveKeyError = accessKeyError(key);
  const keyReady = cleanKey.length === 49 && !liveKeyError;

  const changeMode = (next) => {
    setMode(next);
    setError(null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (busy || !file) return;
    setBusy(true);
    setError(null);
    const res = await uploadInvoiceXml(file);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo cargar el XML.');
      return;
    }
    setFile(null);
    onDocument(res.data, Boolean(res.duplicate));
  };

  const handleKeySubmit = async (event) => {
    event.preventDefault();
    if (busy || !keyReady) return;
    setBusy(true);
    setError(null);
    const res = await submitAccessKey(cleanKey);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo consultar la factura.');
      return;
    }
    setKey('');
    onDocument(res.data, Boolean(res.duplicate));
  };

  const handleDetected = useCallback((raw) => { setKey(raw); }, []);
  const closeScanner = useCallback(() => { setScanning(false); }, []);

  return (
    <section aria-labelledby="invoice-entry-title" style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileUp size={16} color="var(--accent)" />
        <h3 id="invoice-entry-title" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Cargar factura del SRI</h3>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" aria-pressed={mode === 'xml'} onClick={() => changeMode('xml')} style={{ ...styles.secondary, flex: 1, padding: '8px', fontSize: '12px', background: mode === 'xml' ? 'var(--primary)' : 'var(--surface-strong)', color: mode === 'xml' ? 'var(--on-primary)' : 'var(--text-main)' }}>
          Subir XML
        </button>
        <button type="button" aria-pressed={mode === 'key'} onClick={() => changeMode('key')} style={{ ...styles.secondary, flex: 1, padding: '8px', fontSize: '12px', background: mode === 'key' ? 'var(--primary)' : 'var(--surface-strong)', color: mode === 'key' ? 'var(--on-primary)' : 'var(--text-main)' }}>
          Clave de acceso
        </button>
      </div>

      {mode === 'xml' ? (
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="invoice-xml-file" style={styles.label}>Archivo XML de la factura</label>
          <input id="invoice-xml-file" type="file" accept=".xml,text/xml,application/xml" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); }} style={styles.input} />
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Solo XML de hasta 1 MB.</p>
          <button type="submit" disabled={busy || !file} className="btn-primary" style={{ padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
            {busy ? 'Subiendo...' : 'Cargar XML'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="invoice-access-key" style={styles.label}>Clave de acceso</label>
          <input id="invoice-access-key" type="text" inputMode="numeric" autoComplete="off" maxLength={60} value={key} onChange={(e) => { setKey(e.target.value); setError(null); }} placeholder="49 dígitos impresos en el RIDE" style={styles.input} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span aria-live="polite" style={{ fontSize: '11px', color: liveKeyError ? 'var(--error)' : 'var(--text-muted)' }}>
              {liveKeyError || `${cleanKey.length} de 49`}
            </span>
            {canScan && !scanning && (
              <button type="button" onClick={() => setScanning(true)} style={{ ...styles.secondary, padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ScanLine size={14} />
                <span>Escanear código de barras</span>
              </button>
            )}
          </div>
          {scanning && <InvoiceBarcodeScanner onDetected={handleDetected} onClose={closeScanner} />}
          <button type="submit" disabled={busy || !keyReady} className="btn-primary" style={{ padding: '10px', borderRadius: '9999px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <KeyRound size={14} />
            <span>{busy ? 'Consultando...' : 'Consultar factura'}</span>
          </button>
        </form>
      )}

      <div aria-live="polite">{error && <div style={styles.errorBox}>{error}</div>}</div>
    </section>
  );
}
