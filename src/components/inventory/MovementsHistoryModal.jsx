import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { fetchMovements } from '../../services/inventoryClient';

export default function MovementsHistoryModal({ isOpen, item, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setPage(1);
      setMovements([]);
      loadMovements(1, false);
    }
  }, [isOpen, item]);

  const loadMovements = async (pageToLoad, append = false) => {
    setLoading(true);
    setError(null);
    const res = await fetchMovements(item.id, pageToLoad);
    setLoading(false);

    if (res.ok && res.data) {
      const list = res.data.data || [];
      setMovements(prev => append ? [...prev, ...list] : list);
      const meta = res.data.meta || {};
      setHasMore(meta.current_page < meta.last_page);
      setPage(pageToLoad);
    } else {
      setError(res.error || 'Error al cargar el historial.');
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Historial de Movimientos
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              {item.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historial"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {loading && movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Cargando movimientos...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--error)', fontSize: '13px' }}>
              {error}
            </div>
          ) : movements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay movimientos registrados para este insumo.
            </div>
          ) : (
            <>
              {movements.map(m => {
                const isPositive = Number(m.quantity) > 0;
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--surface-soft)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: isPositive ? 'var(--success-soft)' : 'var(--error-soft-strong)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isPositive ? <ArrowDownLeft size={16} color="var(--success)" /> : <ArrowUpRight size={16} color="var(--error)" />}
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {m.reason || (isPositive ? 'Entrada al inventario' : 'Salida de inventario')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {m.created_at ? new Date(m.created_at).toLocaleString('es-EC') : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isPositive ? 'var(--success)' : 'var(--error)' }}>
                        {isPositive ? `+${Number(m.quantity).toFixed(3)}` : Number(m.quantity).toFixed(3)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                        Saldo: {Number(m.balance_after || 0).toFixed(3)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <button
                  type="button"
                  onClick={() => loadMovements(page + 1, true)}
                  disabled={loading}
                  className="glass-card-interactive"
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'var(--chip-bg)',
                    color: 'var(--accent)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
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
