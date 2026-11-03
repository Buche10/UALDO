import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import AssetCountSheetRow from './AssetCountSheetRow';
import AssetCountSheetActions from './AssetCountSheetActions';
import { saveAssetCountLines, submitAssetCount } from '../../services/assetsClient';
import { ASSET_AREA_LABELS, formatPeriodLabel } from './assetHelpers';

export default function AssetCountSheet({ count, onBack, onSubmitted, onCountUpdated }) {
  const draftKey = count?.id ? `ualdo_asset_draft_${count.id}` : null;

  const [quantities, setQuantities] = useState(() => {
    let localDraft = {};
    if (draftKey) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) localDraft = JSON.parse(saved);
      } catch {}
    }
    const map = {};
    (count?.lines || []).forEach((line) => {
      if (localDraft[line.asset_id] !== undefined && localDraft[line.asset_id] !== '') {
        map[line.asset_id] = String(localDraft[line.asset_id]);
      } else {
        map[line.asset_id] = line.counted_quantity !== null && line.counted_quantity !== undefined
          ? String(line.counted_quantity)
          : '';
      }
    });
    return map;
  });

  const [search, setSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [errorMessage, setErrorMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);

  const lines = count?.lines || [];

  const handleQuantityChange = (assetId, val) => {
    setQuantities((prev) => {
      const next = { ...prev, [assetId]: val };
      if (draftKey) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    dirtyRef.current = true;
    setSaveStatus('dirty');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveLinesNow();
    }, 1200);
  };

  const saveLinesNow = async () => {
    if (!dirtyRef.current) return;
    setSaveStatus('saving');
    setErrorMessage(null);

    const payloadLines = lines.map((l) => {
      const raw = quantities[l.asset_id];
      const parsed = parseInt(raw, 10);
      return {
        asset_id: l.asset_id,
        counted_quantity: Number.isInteger(parsed) && parsed >= 0 ? parsed : 0,
      };
    });

    const res = await saveAssetCountLines(count.id, payloadLines);
    if (res.ok) {
      dirtyRef.current = false;
      setSaveStatus('saved');
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {}
      }
      onCountUpdated?.(res.data);
    } else {
      setSaveStatus('error');
      setErrorMessage(res.error || 'Error al autoguardar líneas.');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    const uncounted = lines.some((l) => quantities[l.asset_id] === '' || quantities[l.asset_id] === undefined);
    if (uncounted) {
      setErrorMessage('Debes contar todos los activos antes de enviar la planilla.');
      return;
    }

    if (dirtyRef.current) {
      await saveLinesNow();
    }

    setSubmitting(true);
    setErrorMessage(null);
    const res = await submitAssetCount(count.id);
    setSubmitting(false);

    if (res.ok) {
      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {}
      }
      onSubmitted?.(res.data);
    } else {
      setErrorMessage(res.error || 'Error al enviar el conteo.');
    }
  };

  const filteredLines = lines.filter((l) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const name = (l.asset_name || '').toLowerCase();
    return name.includes(term) || String(l.asset_id).includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0 }}>
          <ArrowLeft size={16} /> Volver a selección
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          {saveStatus === 'saving' && <span>Guardando...</span>}
          {saveStatus === 'saved' && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px' }}><Check size={12} /> Guardado</span>}
          {saveStatus === 'dirty' && <span style={{ color: 'var(--warning)' }}>Cambios sin guardar</span>}
          {saveStatus === 'error' && <span style={{ color: 'var(--error)' }}>Error al guardar</span>}
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
            Planilla de conteo: {ASSET_AREA_LABELS[count?.area] || count?.area}
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Periodo: {formatPeriodLabel(count?.period)} ({lines.length} activos)
          </div>
        </div>
        <AssetCountSheetActions
          onSaveDraft={saveLinesNow}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>

      {errorMessage && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} /> {errorMessage}
        </div>
      )}

      {lines.length > 5 && (
        <input
          type="text"
          placeholder="Filtrar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredLines.map((line) => (
          <AssetCountSheetRow
            key={line.id || line.asset_id}
            line={line}
            value={quantities[line.asset_id] ?? ''}
            onChange={(val) => handleQuantityChange(line.asset_id, val)}
          />
        ))}
      </div>
    </div>
  );
}
