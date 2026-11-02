import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { saveAssetExplanations, validateAssetCount } from '../../services/assetsClient';
import { canValidateAssetArea, ASSET_AREA_LABELS, formatPeriodLabel } from './assetHelpers';

export default function AssetExplanationsForm({ count, user, onBack, onValidated, onExplanationsSaved }) {
  const [explanations, setExplanations] = useState(() => {
    const map = {};
    (count?.lines || []).forEach((line) => {
      if (line.difference !== 0) {
        map[line.asset_id] = line.explanation || '';
      }
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const lines = count?.lines || [];
  const diffLines = lines.filter((l) => l.difference !== 0);
  const canValidate = canValidateAssetArea(user, count?.area);

  const allExplained = diffLines.every((l) => (explanations[l.asset_id] || '').trim().length > 0);

  const handleExplanationChange = (assetId, val) => {
    setExplanations((prev) => ({ ...prev, [assetId]: val }));
    setSuccessNotice(null);
  };

  const handleSaveExplanations = async () => {
    if (diffLines.length === 0) return true;
    setSaving(true);
    setError(null);
    setSuccessNotice(null);

    const payload = diffLines.map((l) => ({
      asset_id: l.asset_id,
      explanation: (explanations[l.asset_id] || '').trim(),
    }));

    const res = await saveAssetExplanations(count.id, payload);
    setSaving(false);

    if (res.ok) {
      setSuccessNotice('Explicaciones guardadas.');
      onExplanationsSaved?.(res.data);
      return true;
    } else {
      setError(res.error || 'Error al guardar explicaciones.');
      return false;
    }
  };

  const handleValidate = async () => {
    if (!allExplained) {
      setError('Todas las diferencias deben tener una explicación antes de validar.');
      return;
    }

    const saved = await handleSaveExplanations();
    if (!saved) return;

    setValidating(true);
    setError(null);
    const res = await validateAssetCount(count.id);
    setValidating(false);

    if (res.ok) {
      onValidated?.(res.data);
    } else {
      setError(res.error || 'Error al validar el conteo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: 0 }}>
        <ArrowLeft size={16} /> Volver a selección
      </button>

      <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--surface-soft)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)', fontWeight: 600 }}>
            Conteo enviado: {ASSET_AREA_LABELS[count?.area] || count?.area} ({formatPeriodLabel(count?.period)})
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {diffLines.length === 0 ? 'Sin diferencias detectadas.' : `${diffLines.length} activo(s) con diferencias.`}
          </div>
        </div>

        {canValidate && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || saving || !allExplained}
            title={!allExplained ? 'Completa todas las explicaciones' : ''}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              background: allExplained ? 'var(--success)' : 'var(--track-bg)',
              color: allExplained ? 'var(--on-primary)' : 'var(--text-subtle)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: allExplained && !validating ? 'pointer' : 'not-allowed',
            }}
          >
            {validating ? 'Validando...' : 'Validar conteo'}
          </button>
        )}
      </div>

      {error && <div role="alert" style={{ padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}
      {successNotice && <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--surface-soft)', color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> {successNotice}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {lines.map((line) => {
          const hasDiff = line.difference !== 0;
          return (
            <div key={line.asset_id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: hasDiff ? '1px solid var(--border-warning)' : '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {line.asset_name || `Activo #${line.asset_id}`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: hasDiff ? 'var(--warning)' : 'var(--success)' }}>
                  {hasDiff ? `Diferencia: ${line.difference > 0 ? `+${line.difference}` : line.difference}` : 'Exacto'}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                <span>Esperado: <strong>{line.expected_quantity ?? '-'}</strong></span>
                <span>Contado: <strong>{line.counted_quantity ?? '-'}</strong></span>
              </div>

              {hasDiff && (
                <div>
                  <label htmlFor={`asset-exp-${line.asset_id}`} style={{ display: 'block', fontSize: '11px', color: 'var(--warning)', fontWeight: 600, marginBottom: '3px' }}>
                    Explicación obligatoria:
                  </label>
                  <input
                    id={`asset-exp-${line.asset_id}`}
                    type="text"
                    placeholder="Motivo de la diferencia..."
                    value={explanations[line.asset_id] || ''}
                    onChange={(e) => handleExplanationChange(line.asset_id, e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-input, var(--bg-dark))', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {diffLines.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button type="button" onClick={handleSaveExplanations} disabled={saving} style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer' }}>
            {saving ? 'Guardando...' : 'Guardar explicaciones'}
          </button>
        </div>
      )}
    </div>
  );
}
