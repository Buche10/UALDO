import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { listInvoiceDocuments } from '../../../services/purchaseDocumentsClient';
import { money, styles } from './purchaseUi';

const STATUS_LABELS = {
  queued: 'En cola',
  processing: 'Consultando',
  extracted: 'Lista para revisar',
  failed: 'Fallida',
};

function documentLabel(doc) {
  if (doc.confirmed_at) return 'Confirmada';
  return STATUS_LABELS[doc.status] || 'Sin estado';
}

/**
 * Historial corto de facturas cargadas en Compras (Brief 34ap).
 */
export default function InvoiceDocumentsList({ onOpen, refreshKey = 0 }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await listInvoiceDocuments({ page: 1 });
    if (!mountedRef.current) return;
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'No se pudieron cargar las facturas.');
      return;
    }
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    setDocuments(list);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <section aria-labelledby="invoice-history-title" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 id="invoice-history-title" style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={15} color="var(--accent)" />
          <span>Facturas cargadas</span>
        </h3>
        <button type="button" onClick={load} disabled={loading} aria-label="Actualizar facturas cargadas" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div aria-live="polite">{error && <div style={styles.errorBox}>{error}</div>}</div>

      {!loading && documents.length === 0 && !error && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>No hay facturas cargadas.</p>
      )}

      {documents.slice(0, 5).map((doc) => (
        <button key={doc.id} type="button" onClick={() => onOpen(doc)} className="glass-card-interactive" style={{ ...styles.card, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-main)' }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>{doc.extraction?.supplier_name || 'Factura del SRI'}</span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {doc.extraction?.invoice_number || doc.access_key || `Documento ${doc.id}`}
              {doc.extraction?.invoice_date ? `, ${doc.extraction.invoice_date}` : ''}
            </span>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, background: 'var(--chip-bg)', color: 'var(--accent)' }}>{documentLabel(doc)}</span>
            {doc.extraction?.total ? <span style={{ fontSize: '12px', fontWeight: 700 }}>{money(doc.extraction.total)}</span> : null}
          </span>
        </button>
      ))}
    </section>
  );
}
