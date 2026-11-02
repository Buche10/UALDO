import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tags, AlertCircle, RefreshCw } from 'lucide-react';
import { getNextLot, listLots } from '../../services/lotsClient';
import { lotJustificationPrompt } from '../../services/lotSelection';
import { formatQuantity } from '../../services/quantityFormat';
import { daysSinceReceived } from './lotFormat';
import LotSelectField from './LotSelectField';
import LotJustificationField from './LotJustificationField';

const boxStyle = {
  padding: '10px 12px',
  borderRadius: '10px',
  background: 'var(--surface-soft)',
  border: '1px solid var(--border-glass)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

function selectionFor(lotId, lots, recommended, justification = '') {
  const chosen = lots.find((lot) => Number(lot.id) === Number(lotId));
  return {
    lotId: lotId ? Number(lotId) : '',
    justification,
    needsJustification: Boolean(recommended && lotId && Number(lotId) !== Number(recommended.lot_id)),
    recommendedCode: recommended?.code || null,
    recommendedLotId: recommended?.lot_id || null,
    chosenCode: chosen?.code || null,
  };
}

/**
 * Selector reutilizable de lote (Brief 40p): propone el más antiguo apto con
 * saldo y exige motivo cuando se elige otro.
 */
export default function LotPicker({ itemId, itemName, unit = '', location, requiresLot, value, onChange, disabled = false, error = null }) {
  const [lots, setLots] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const selectionRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    selectionRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  useEffect(() => {
    if (!itemId || requiresLot === false) {
      setLots([]);
      setRecommended(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      getNextLot(itemId, location),
      listLots({ itemId, status: 'activo', location }),
    ]).then(([nextRes, listRes]) => {
      if (!active) return;
      setLoading(false);
      if (!nextRes.ok || !listRes.ok) {
        setLoadError(nextRes.error || listRes.error || 'No se pudieron cargar los lotes.');
        return;
      }
      const next = nextRes.data?.data || null;
      const rows = listRes.data?.data || [];
      const merged = next && !rows.some((lot) => Number(lot.id) === Number(next.lot_id))
        ? [{ id: next.lot_id, code: next.code, received_on: next.received_on, balances: [{ quantity: next.quantity, location, item: itemName }] }, ...rows]
        : rows;
      setRecommended(next);
      setLots(merged);

      const currentId = Number(selectionRef.current?.lotId);
      const currentExists = merged.some((lot) => Number(lot.id) === currentId);
      if (next && !currentExists) onChangeRef.current?.(selectionFor(next.lot_id, merged, next));
    });

    return () => {
      active = false;
    };
  }, [itemId, location, requiresLot, reloadKey, itemName]);

  const handleSelect = useCallback((rawId) => {
    onChangeRef.current?.(selectionFor(rawId ? Number(rawId) : '', lots, recommended));
  }, [lots, recommended]);

  const handleJustification = useCallback((justification) => {
    const current = selectionRef.current || {};
    onChangeRef.current?.({
      ...selectionFor(current.lotId, lots, recommended, justification),
      chosenCode: current.chosenCode,
    });
  }, [lots, recommended]);

  if (!itemId || requiresLot === false) return null;
  if (loading) return <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cargando lotes...</div>;
  if (loadError) {
    return (
      <div style={boxStyle} role="alert">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--error)' }}>
          <AlertCircle size={14} />
          <span>{loadError}</span>
        </span>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
          <RefreshCw size={13} />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }
  if (lots.length === 0) {
    if (requiresLot !== true) return null;
    return <div style={{ fontSize: '12px', color: 'var(--warning)' }}>No hay lotes activos con saldo en esta ubicación.</div>;
  }

  const selectedId = value?.lotId ? String(value.lotId) : '';
  const selectedLot = lots.find((lot) => Number(lot.id) === Number(selectedId));
  const recommendedLot = recommended
    ? lots.find((lot) => Number(lot.id) === Number(recommended.lot_id)) || recommended
    : null;
  const jumpMessage = value?.needsJustification && recommended?.code && selectedLot?.code
    ? lotJustificationPrompt(recommended.code, selectedLot.code)
    : null;
  const justification = value?.justification || '';

  return (
    <div style={boxStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Tags size={14} color="var(--accent)" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
          {itemName ? `Lote de ${itemName}` : 'Lote de entrada'}
        </span>
      </div>

      {recommendedLot && (
        <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>
          <strong style={{ color: 'var(--accent)' }}>Recomendado: {recommendedLot.code}</strong>
          <span style={{ color: 'var(--text-muted)' }}>
            {' '}· Saldo {formatQuantity(recommendedLot.balances?.[0]?.quantity)} {unit} · {daysSinceReceived(recommendedLot.received_on) ?? 0} días
          </span>
        </div>
      )}

      <LotSelectField itemId={itemId} lots={lots} selectedId={selectedId} selectedLot={selectedLot} unit={unit} disabled={disabled} onSelect={handleSelect} />

      {jumpMessage && (
        <LotJustificationField
          itemId={itemId}
          message={jumpMessage}
          value={justification}
          invalid={Boolean(justification.length > 0 && justification.trim().length < 5)}
          disabled={disabled}
          onChange={handleJustification}
        />
      )}

      {error && <span style={{ fontSize: '11px', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
}
