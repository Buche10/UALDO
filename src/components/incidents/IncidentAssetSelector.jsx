import React, { useState, useEffect } from 'react';
import { listAssets } from '../../services/assetsClient';

export default function IncidentAssetSelector({ area, selectedAssetId, onSelectAsset }) {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await listAssets({ area });
      if (active && res.ok && Array.isArray(res.data)) {
        setAssets(res.data.filter((a) => a.status !== 'dado_de_baja'));
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [area]);

  const filtered = assets.filter((a) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return a.name.toLowerCase().includes(term) || (a.code && a.code.toLowerCase().includes(term));
  });

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) {
      onSelectAsset(null);
      return;
    }
    const found = assets.find((a) => String(a.id) === String(val));
    onSelectAsset(found || null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor="inc-asset-id" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>
        Objeto o equipo (opcional)
      </label>

      {assets.length > 5 && (
        <input
          type="text"
          placeholder="Buscar en catálogo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            fontSize: '12px',
          }}
        />
      )}

      <select
        id="inc-asset-id"
        value={selectedAssetId || ''}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          color: 'var(--text-main)',
          fontSize: '13px',
        }}
      >
        <option value="">{loading ? 'Cargando activos...' : '-- Ninguno o no listado --'}</option>
        {filtered.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} {a.code ? `(${a.code})` : ''} - {a.status === 'fuera_de_servicio' ? 'Fuera de servicio' : 'Activo'}
          </option>
        ))}
      </select>
    </div>
  );
}
