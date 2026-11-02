import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatUsd } from '../../../services/money';
import { submitDeclaration } from '../../../services/cashCloseClient';
import DeclarationMethodRow from './DeclarationMethodRow';
import DeclarationCauseFields from './DeclarationCauseFields';

function parseDec(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function CashDeclarationForm({ declaration, fecha, onSuccess }) {
  const mediosList = Array.isArray(declaration?.medios) ? declaration.medios : [];
  const efectivoItem = mediosList.find((m) => m.medio === 'efectivo');
  const nonCashMedios = mediosList.filter((m) => m.medio !== 'efectivo');

  const [efectivoContado, setEfectivoContado] = useState(
    efectivoItem?.declarado !== null && efectivoItem?.declarado !== undefined ? String(efectivoItem.declarado) : ''
  );
  const [mediosValues, setMediosValues] = useState(() => {
    const initial = {};
    for (const m of nonCashMedios) {
      initial[m.medio] = m.declarado !== null && m.declarado !== undefined ? String(m.declarado) : '';
    }
    return initial;
  });

  const [recountMode, setRecountMode] = useState(Boolean(declaration?.recount_count > 0));
  const [recountMessage, setRecountMessage] = useState(null);
  const [showCauseSelector, setShowCauseSelector] = useState(Boolean(declaration?.recount_count >= 1));
  const [differenceCause, setDifferenceCause] = useState(declaration?.difference_cause || '');
  const [differenceExplanation, setDifferenceExplanation] = useState(declaration?.difference_explanation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const cashEsperado = efectivoItem?.esperado ?? 0;
  const cashVal = parseDec(efectivoContado);
  const cashDiff = cashVal !== null ? cashVal - cashEsperado : 0;

  let totalDiff = cashDiff;
  const nonCashDiffs = {};
  for (const m of nonCashMedios) {
    const val = parseDec(mediosValues[m.medio]);
    const diff = val !== null ? val - (m.esperado || 0) : 0;
    nonCashDiffs[m.medio] = diff;
    totalDiff += diff;
  }

  const validateSubmission = () => {
    if (parseDec(efectivoContado) === null) return 'Ingresa el monto de efectivo contado.';
    if (showCauseSelector) {
      if (!differenceCause) return 'Selecciona la causa de la diferencia.';
      if (['otro', 'faltante_sin_explicar'].includes(differenceCause) && !differenceExplanation.trim()) {
        return 'La explicación es obligatoria para esta causa.';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const err = validateSubmission();
    if (err) { setFormError(err); return; }

    const payload = {
      efectivo_contado: efectivoContado,
      medios: nonCashMedios.map((m) => ({ medio: m.medio, monto: mediosValues[m.medio] !== '' ? mediosValues[m.medio] : '0.00' })),
    };
    if (showCauseSelector && differenceCause) {
      payload.difference_cause = differenceCause;
      if (differenceExplanation.trim()) payload.difference_explanation = differenceExplanation.trim();
    }

    setIsSubmitting(true);
    const res = await submitDeclaration(fecha, payload);
    setIsSubmitting(false);

    if (res.ok) {
      const isRev = res.data?.data?.estado === 'revision' || res.data?.estado === 'revision';
      onSuccess?.(isRev ? 'Cierre en revisión.' : 'Cierre enviado. Cuadró.');
      return;
    }
    if (res.isRecount || res.recount) {
      setRecountMode(true);
      setRecountMessage(res.message || 'Hay una diferencia en el cierre. Vuelve a contar antes de seguir.');
      return;
    }
    if (res.status === 422 && recountMode) {
      setShowCauseSelector(true);
      setFormError(res.error || 'Indica la causa y explicación de la diferencia.');
      return;
    }
    setFormError(res.error || 'Error al enviar la declaración.');
  };

  const buttonLabel = isSubmitting ? 'Enviando...' : showCauseSelector ? 'Enviar con justificación' : recountMode ? 'Enviar recuento' : 'Enviar cierre';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {recountMessage && (
        <div role="alert" style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--warning-soft)', border: '1px solid var(--border-warning)', color: 'var(--warning)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{recountMessage}</span>
        </div>
      )}

      <DeclarationMethodRow
        medio="efectivo"
        etiqueta="Efectivo contado"
        esperado={cashEsperado}
        value={efectivoContado}
        diff={cashDiff}
        onChange={(_, val) => setEfectivoContado(val)}
      />

      {nonCashMedios.map((m) => (
        <DeclarationMethodRow
          key={m.medio}
          medio={m.medio}
          etiqueta={m.etiqueta || m.medio}
          esperado={m.esperado}
          value={mediosValues[m.medio] || ''}
          diff={nonCashDiffs[m.medio] || 0}
          onChange={(k, val) => setMediosValues((prev) => ({ ...prev, [k]: val }))}
        />
      ))}

      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-soft)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Diferencia total calculada</span>
        <strong style={{ fontSize: '14px', color: Math.abs(totalDiff) > 0.009 ? 'var(--warning)' : 'var(--success)' }}>
          {formatUsd(totalDiff)}
        </strong>
      </div>

      {showCauseSelector && (
        <DeclarationCauseFields
          differenceCause={differenceCause}
          differenceExplanation={differenceExplanation}
          onCauseChange={setDifferenceCause}
          onExplanationChange={setDifferenceExplanation}
        />
      )}

      {formError && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
        style={{
          padding: '12px 24px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--bg-dark)',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isSubmitting && <RefreshCw size={14} className="spin" />}
        <span>{buttonLabel}</span>
      </button>
    </form>
  );
}
