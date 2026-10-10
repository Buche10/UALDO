import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, ClipboardCheck, X } from 'lucide-react';
import { fetchMovements } from '../../services/inventoryClient';
import { locationLabel } from '../../services/inventoryLocations';

function getMovementTypeDetails(type, isPositive) {
  if (type === 'transfer_out') {
    return { title: 'Transferencia (salida)', icon: ArrowRightLeft, iconBg: 'var(--warning-soft)', iconColor: 'var(--warning)', isPositive: false };
  }
  if (type === 'transfer_in') {
    return { title: 'Transferencia (entrada)', icon: ArrowRightLeft, iconBg: 'var(--success-soft)', iconColor: 'var(--success)', isPositive: true };
  }
  if (type === 'count') {
    return { title: 'Conteo', icon: ClipboardCheck, iconBg: 'var(--storage-ambient-bg)', iconColor: 'var(--accent)', isPositive };
  }
  return {
    title: isPositive ? 'Entrada al inventario' : 'Salida de inventario',
    icon: isPositive ? ArrowDownLeft : ArrowUpRight,
    iconBg: isPositive ? 'var(--success-soft)' : 'var(--error-soft-strong)',
    iconColor: isPositive ? 'var(--success)' : 'var(--error)',
    isPositive,
  };
}

function organizeMovements(movements) {
  const groupsMap = new Map();
  movements.forEach((m) => {
    if (m.transfer_group) {
      if (!groupsMap.has(m.transfer_group)) groupsMap.set(m.transfer_group, []);
      groupsMap.get(m.transfer_group).push(m);
    }
  });

  const processed = new Set();
  const organized = [];
  movements.forEach((m) => {
    if (m.transfer_group && groupsMap.get(m.transfer_group)?.length === 2) {
      if (!processed.has(m.transfer_group)) {
        processed.add(m.transfer_group);
        const pair = groupsMap.get(m.transfer_group);
        const outM = pair.find((p) => Number(p.quantity) < 0 || p.type === 'transfer_out') || pair[0];
        const inM = pair.find((p) => Number(p.quantity) > 0 || p.type === 'transfer_in') || pair[1];
        organized.push({ type: 'transfer_pair', groupId: m.transfer_group, fromLocation: outM.location, toLocation: inM.location, items: [outM, inM] });
      }
    } else if (!m.transfer_group || !groupsMap.get(m.transfer_group) || groupsMap.get(m.transfer_group).length !== 2) {
      organized.push({ type: 'single', movement: m });
    }
  });
  return organized;
}

function MovementItemRow({ m, isNested = false }) {
  const isPositive = Number(m.quantity) > 0;
  const details = getMovementTypeDetails(m.type, isPositive);
  const IconComponent = details.icon;
  const locLabel = locationLabel(m.location);
  const hasLocBal = m.location_balance_after !== undefined && m.location_balance_after !== null;

  return (
    <div
      style={{
        padding: '10px 12px',
        background: isNested ? 'transparent' : 'var(--surface-soft)',
        borderRadius: isNested ? '0' : '10px',
        border: isNested ? 'none' : '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: details.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconComponent size={16} color={details.iconColor} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>{details.title}</span>
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--chip-bg)', color: 'var(--accent)', fontWeight: 600 }}>
              {locLabel}
            </span>
          </div>
          {m.reason && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {m.reason}
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
            {m.created_at ? new Date(m.created_at).toLocaleString('es-EC') : ''}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: details.isPositive ? 'var(--success)' : 'var(--error)' }}>
          {details.isPositive ? `+${Number(m.quantity).toFixed(3)}` : Number(m.quantity).toFixed(3)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
          Saldo: {Number(m.balance_after || 0).toFixed(3)}
          {hasLocBal && (
            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
              Ubicación: {Number(m.location_balance_after).toFixed(3)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MovementsHistoryModal({ isOpen, item, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadMovements = useCallback(async (pageToLoad, append = false) => {
    if (!item?.id) return;
    setLoading(true);
    setError(null);
    const res = await fetchMovements(item.id, pageToLoad);
    setLoading(false);
    if (res.ok && res.data) {
      const list = res.data.data || [];
      setMovements((prev) => (append ? [...prev, ...list] : list));
      const meta = res.data.meta || {};
      setHasMore(meta.current_page < meta.last_page);
      setPage(pageToLoad);
    } else {
      setError(res.error || 'Error al cargar el historial.');
    }
  }, [item?.id]);

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      setMovements([]);
      loadMovements(1, false);
    }
  }, [isOpen, item, loadMovements]);

  if (!isOpen || !item) return null;
  const organized = organizeMovements(movements);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="movements-modal-title" className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glow)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 id="movements-modal-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Historial de Movimientos
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{item.name}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar historial" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {loading && movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando movimientos...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--error)', fontSize: '13px' }}>{error}</div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>No hay movimientos registrados para este insumo.</div>
          ) : (
            <>
              {organized.map((entry, idx) => {
                if (entry.type === 'transfer_pair') {
                  return (
                    <div key={`group-${entry.groupId}-${idx}`} style={{ borderRadius: '10px', background: 'var(--surface-strong)', border: '1px solid var(--border-glow)', borderLeft: '3px solid var(--accent)', overflow: 'hidden' }}>
                      <div style={{ padding: '6px 10px', background: 'var(--chip-bg)', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ArrowRightLeft size={13} />
                        <span>{locationLabel(entry.fromLocation)} a {locationLabel(entry.toLocation)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--border-glass)' }}>
                        {entry.items.map((m) => (
                          <MovementItemRow key={m.id} m={m} isNested={true} />
                        ))}
                      </div>
                    </div>
                  );
                }
                return <MovementItemRow key={entry.movement.id} m={entry.movement} />;
              })}
              {hasMore && (
                <button type="button" onClick={() => loadMovements(page + 1, true)} disabled={loading} className="glass-card-interactive" style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
                  {loading ? 'Cargando...' : 'Cargar más'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
