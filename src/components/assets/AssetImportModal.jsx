import React, { useState } from 'react';
import { X, UploadCloud, AlertCircle } from 'lucide-react';
import { parseAssetsCsv } from '../../services/csvParser';
import { importAssets } from '../../services/assetsClient';

function formatMotorErrors(data) {
  if (!data?.errors || typeof data.errors !== 'object') return [];
  const list = [];
  for (const [key, msgs] of Object.entries(data.errors)) {
    const match = key.match(/^rows\.(\d+)\.(.+)$/);
    const msg = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
    if (match) {
      const rowNum = parseInt(match[1], 10) + 1;
      const field = match[2];
      list.push(`Fila ${rowNum} (${field}): ${msg}`);
    } else {
      list.push(`${key}: ${msg}`);
    }
  }
  return list;
}

export default function AssetImportModal({ isOpen, onClose, onImported }) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [motorErrors, setMotorErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setCsvText(text);
      processCsv(text);
    };
    reader.readAsText(file);
  };

  const processCsv = (text) => {
    setMotorErrors([]);
    setGeneralError(null);
    const { rows, errors } = parseAssetsCsv(text);
    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setCsvText(val);
    processCsv(val);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0 || parseErrors.length > 0) return;
    setSubmitting(true);
    setGeneralError(null);
    setMotorErrors([]);

    const res = await importAssets(parsedRows);
    setSubmitting(false);

    if (!res.ok) {
      const errors = formatMotorErrors(res.data);
      if (errors.length > 0) {
        setMotorErrors(errors);
      } else {
        setGeneralError(res.error || 'Error al importar los activos.');
      }
      return;
    }

    onImported?.(res.data?.imported || parsedRows.length);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--grad-surface)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-dialog)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>Importar activos por CSV</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Formato: <code>categoria,nombre,codigo,esperado,minimo</code>. Categorías: vajilla, cristaleria, equipo_salon, equipo_cocina.
        </p>

        <div>
          <label htmlFor="csv-file-input" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer' }}>
            <UploadCloud size={14} /> Seleccionar archivo CSV
            <input id="csv-file-input" type="file" accept=".csv,text/csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div>
          <label htmlFor="csv-text-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>O pega el texto CSV:</label>
          <textarea id="csv-text-input" rows={4} placeholder="categoria,nombre,codigo,esperado,minimo..." value={csvText} onChange={handleTextChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px', fontFamily: 'monospace' }} />
        </div>

        {parseErrors.length > 0 && (
          <div role="alert" style={{ maxHeight: '100px', overflowY: 'auto', padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>
            {parseErrors.map((err, idx) => <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {err}</div>)}
          </div>
        )}

        {motorErrors.length > 0 && (
          <div role="alert" style={{ maxHeight: '120px', overflowY: 'auto', padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Errores del servidor:</div>
            {motorErrors.map((err, idx) => <div key={idx}>• {err}</div>)}
          </div>
        )}

        {generalError && <div role="alert" style={{ padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{generalError}</div>}

        {parsedRows.length > 0 && parseErrors.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
            <strong>{parsedRows.length}</strong> activos listos para importar (muestra previa de hasta 3):
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {parsedRows.slice(0, 3).map((r, i) => (
                <div key={i} style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
                  {r.name} ({r.category}) • Esperado: {r.expected_quantity} • Mín: {r.min_quantity ?? '-'}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleConfirmImport} disabled={submitting || parsedRows.length === 0 || parseErrors.length > 0} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontWeight: 600, cursor: (submitting || parsedRows.length === 0 || parseErrors.length > 0) ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
            {submitting ? 'Importando...' : `Importar ${parsedRows.length} activos`}
          </button>
        </div>
      </div>
    </div>
  );
}
