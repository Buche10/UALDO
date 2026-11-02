import React, { useState } from 'react';
import { ArrowLeft, Tags, RefreshCw } from 'lucide-react';
import { useLotsList } from '../../hooks/useLotsList';
import { useLotItems } from '../../hooks/useLotItems';
import { useLotSettings } from '../../hooks/useLotSettings';
import { DEFAULT_AGE_ALERT_DAYS } from '../../services/lotsClient';
import LotsToolbar from './LotsToolbar';
import LotCard from './LotCard';
import LotDetail from './LotDetail';

/** Pantalla de lotes de carne: FIFO, saldos y antigüedad (Brief 40p). */
export default function LotsView({ onBack, canManage = false, canSeeCosts = false }) {
  const [status, setStatus] = useState('activo');
  const [itemId, setItemId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { items: lotItems } = useLotItems();
  const { ageAlertDays } = useLotSettings(canManage);
  const {
    lots, loading, loadingMore, error, hasMore, loadMore, reload,
  } = useLotsList({ status: status === 'todos' ? undefined : status, itemId });

  if (selectedId) {
    return (
      <LotDetail
        lotId={selectedId}
        canManage={canManage}
        canSeeCosts={canSeeCosts}
        onBack={() => setSelectedId(null)}
        onChanged={reload}
      />
    );
  }

  const term = search.trim().toUpperCase();
  const visible = term ? lots.filter((lot) => String(lot.code || '').toUpperCase().includes(term)) : lots;
  const threshold = ageAlertDays || DEFAULT_AGE_ALERT_DAYS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tags size={18} color="var(--accent)" />
          <span>Lotes de carne</span>
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={reload} aria-label="Actualizar lotes" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <RefreshCw size={16} />
          </button>
          <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
        Del más antiguo al más nuevo. Usa primero el lote recomendado; si eliges otro, explica el motivo.
      </p>

      <LotsToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        itemId={itemId}
        onItemId={setItemId}
        items={lotItems}
      />

      <div aria-live="polite">
        {error && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando lotes...</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          {term ? 'No hay lotes con ese código.' : 'No hay lotes para mostrar con estos filtros.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visible.map((lot) => (
            <LotCard key={lot.id} lot={lot} alertDays={threshold} onOpen={setSelectedId} />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className="glass-card-interactive" style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          {loadingMore ? 'Cargando más...' : 'Cargar más lotes'}
        </button>
      )}
    </div>
  );
}
