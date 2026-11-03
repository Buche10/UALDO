import React, { useRef, useState } from 'react';
import { Camera, FileText, Loader2 } from 'lucide-react';
import { uploadInvoiceFile } from '../../../services/purchaseDocumentsClient';
import { resizeImageFile } from '../../../services/imageAttachments';
import { styles } from './purchaseUi';

const HELP_TEXT = 'Si es factura electrónica, mejor usa la clave de acceso: los datos salen exactos del SRI.';

/**
 * Carga de foto o PDF de un recibo con reducción en el navegador (Brief 34bp).
 */
export default function InvoicePhotoButton({ onDocument }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleSelectFile = () => {
    if (busy) return;
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const rawFile = event.target.files?.[0];
    event.target.value = '';
    if (!rawFile) return;

    setBusy(true);
    setError(null);

    try {
      const fileToUpload = await resizeImageFile(rawFile);
      const res = await uploadInvoiceFile(fileToUpload);
      setBusy(false);

      if (!res.ok) {
        setError(res.error || 'No se pudo subir el archivo.');
        return;
      }

      onDocument?.(res.data, Boolean(res.duplicate));
    } catch {
      setBusy(false);
      setError('Ocurrió un error al preparar el archivo.');
    }
  };

  return (
    <section aria-labelledby="invoice-photo-title" style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Camera size={16} color="var(--accent)" />
        <h3 id="invoice-photo-title" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Foto o PDF del recibo
        </h3>
      </div>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        {HELP_TEXT}
      </p>

      <input
        ref={inputRef}
        id="invoice-photo-file-input"
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={handleSelectFile}
        className="btn-primary"
        style={{ padding: '10px', borderRadius: '9999px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        {busy ? (
          <>
            <Loader2 size={14} className="spin" />
            <span>Subiendo recibo...</span>
          </>
        ) : (
          <>
            <FileText size={14} />
            <span>Tomar foto o elegir PDF</span>
          </>
        )}
      </button>

      <div aria-live="polite">
        {error && <div role="alert" style={styles.errorBox}>{error}</div>}
      </div>
    </section>
  );
}
