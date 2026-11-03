import React from 'react';
import { AlertCircle, ArrowLeft, FileWarning, Loader2 } from 'lucide-react';
import { useInvoiceDocument } from '../../../hooks/useInvoiceDocument';
import { styles } from './purchaseUi';
import InvoiceReviewForm from './InvoiceReviewForm';
import InvoiceFilePreview from './InvoiceFilePreview';

const BACK_LABEL = 'Volver a compras';

function ManualEntryButton({ onManualEntry }) {
  return (
    <button type="button" onClick={onManualEntry} className="btn-secondary" style={{ ...styles.secondary, padding: '10px', fontSize: '13px' }}>
      Cargar la compra a mano
    </button>
  );
}

function Waiting({ error, source }) {
  const isReceipt = source === 'image' || source === 'pdf';
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px' }}>
      <Loader2 size={22} className="spin" color="var(--accent)" aria-hidden="true" />
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
        {isReceipt ? 'Leyendo el recibo' : 'Consultando la factura'}
      </p>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        {isReceipt
          ? 'Estamos leyendo los datos del recibo. No cierres esta pantalla.'
          : 'El SRI puede tardar unos segundos. No cierres esta pantalla.'}
      </p>
      <div aria-live="polite">{error && <span style={{ fontSize: '11px', color: 'var(--warning)' }}>{error}</span>}</div>
    </div>
  );
}

function Failure({ message, onRetry, onManualEntry }) {
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
        <FileWarning size={18} />
        <span style={{ fontSize: '14px', fontWeight: 700 }}>No se pudo leer la factura</span>
      </div>
      <div role="alert" style={styles.errorBox}>{message}</div>
      <button type="button" onClick={onRetry} className="btn-secondary" style={{ ...styles.secondary, padding: '10px', fontSize: '13px' }}>
        Reintentar
      </button>
      <ManualEntryButton onManualEntry={onManualEntry} />
    </div>
  );
}

/**
 * Espera y revisión de una factura o recibo cargado (Brief 34ap / 34bp).
 */
export default function InvoiceReview({ documentId, duplicate, onBack, onConfirmed, onManualEntry, onOpenPurchase }) {
  const invoice = useInvoiceDocument(documentId);
  const document = invoice.document;
  const waiting = ['loading', 'queued', 'processing'].includes(invoice.status);

  let content;
  if (waiting) {
    content = <Waiting error={invoice.networkError ? invoice.error : null} source={document?.source} />;
  } else if (invoice.status === 'failed' || invoice.status === 'timeout' || invoice.status === 'error') {
    content = <Failure message={invoice.error} onRetry={invoice.retry} onManualEntry={onManualEntry} />;
  } else if (document?.confirmed_at) {
    content = (
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Esta factura ya se confirmó</span>
        </div>
        {document.purchase_id && (
          <button type="button" onClick={() => onOpenPurchase(document.purchase_id)} className="btn-primary" style={{ padding: '10px', borderRadius: '9999px', fontWeight: 600 }}>
            Ver compra
          </button>
        )}
      </div>
    );
  } else if (document?.extraction) {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {duplicate && (
          <div role="status" style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--warning-soft)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600 }}>
            Esta factura ya se cargó
          </div>
        )}
        <InvoiceFilePreview documentId={document.id} source={document.source} mime={document.mime} />
        <InvoiceReviewForm document={document} onConfirmed={onConfirmed} />
      </div>
    );
  } else {
    content = <Failure message="La factura llegó sin datos para revisar." onRetry={invoice.retry} onManualEntry={onManualEntry} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button type="button" onClick={onBack} style={styles.back}><ArrowLeft size={16} /><span>{BACK_LABEL}</span></button>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>Revisar factura</h3>
      {content}
    </div>
  );
}
