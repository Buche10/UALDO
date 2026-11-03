import React, { useEffect, useState } from 'react';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { invoiceFileBlob } from '../../../services/purchaseDocumentsClient';
import { styles } from './purchaseUi';

/**
 * Vista previa de imagen o PDF de la factura/recibo (Brief 34bp).
 */
export default function InvoiceFilePreview({ documentId, source, mime }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isImage = source === 'image' || Boolean(mime && mime.startsWith('image/'));
  const isPdf = source === 'pdf' || mime === 'application/pdf';

  useEffect(() => {
    if (!documentId || !isImage) return undefined;

    let cancelled = false;
    let createdUrl = null;

    setLoading(true);
    setError(null);

    invoiceFileBlob(documentId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setError('No se pudo cargar la imagen.');
          setLoading(false);
          return;
        }
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar la imagen.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [documentId, isImage]);

  const handleOpenPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await invoiceFileBlob(documentId);
      setLoading(false);
      if (!blob) {
        setError('No se pudo descargar el PDF.');
        return;
      }
      const pdfUrl = URL.createObjectURL(blob);
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(pdfUrl, '_blank');
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    } catch {
      setLoading(false);
      setError('No se pudo descargar el PDF.');
    }
  };

  if (!isImage && !isPdf) return null;

  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={14} color="var(--accent)" />
          <span>Vista previa del documento</span>
        </span>
      </div>

      {isImage && (
        <>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', padding: '12px 0' }}>
              <Loader2 size={14} className="spin" />
              <span>Cargando imagen...</span>
            </div>
          )}
          {objectUrl && (
            <img
              src={objectUrl}
              alt="Foto del recibo"
              style={{
                width: '100%',
                maxHeight: '260px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--surface-soft)',
              }}
            />
          )}
        </>
      )}

      {isPdf && (
        <button
          type="button"
          disabled={loading}
          onClick={handleOpenPdf}
          className="btn-secondary"
          style={{ ...styles.secondary, padding: '8px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <FileText size={14} color="var(--accent)" />}
          <span>Ver PDF</span>
        </button>
      )}

      {error && <span style={{ fontSize: '11px', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}
