import React, { useState, useEffect, useCallback } from 'react';
import { Plus, UploadCloud, Search } from 'lucide-react';
import { listAssets, ASSET_CATEGORIES, ASSET_CATEGORY_LABELS } from '../../services/assetsClient';
import AssetCatalogTable from './AssetCatalogTable';
import AssetFormModal from './AssetFormModal';
import AssetStatusModal from './AssetStatusModal';
import AssetImportModal from './AssetImportModal';

export default function AssetCatalogTab({ canManage }) {
  const [assets, setAssets] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAsset, setStatusAsset] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filter = categoryFilter !== 'all' ? { category: categoryFilter } : {};
    const res = await listAssets(filter);
    setLoading(false);
    if (res.ok) setAssets(Array.isArray(res.data) ? res.data : []);
    else setError(res.error || 'Error al cargar el catálogo de activos.');
  }, [categoryFilter]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = assets.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(term) || (item.code && item.code.toLowerCase().includes(term));
  });

  const getPillStyle = (active) => ({
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    background: active ? 'var(--primary)' : 'var(--chip-bg)',
    color: active ? 'var(--on-primary)' : 'var(--text-muted)',
    border: '1px solid var(--border-glass)',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button type="button" onClick={() => setCategoryFilter('all')} style={getPillStyle(categoryFilter === 'all')}>
            Todas
          </button>
          {ASSET_CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategoryFilter(cat)} style={getPillStyle(categoryFilter === cat)}>
              {ASSET_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {canManage && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setImportModalOpen(true)} style={{ padding: '6px 12px', borderRadius: '9999px', background: 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UploadCloud size={14} /> Importar
            </button>
            <button type="button" onClick={() => { setEditingAsset(null); setFormModalOpen(true); }} style={{ padding: '6px 14px', borderRadius: '9999px', background: 'var(--primary)', border: 'none', color: 'var(--on-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Nuevo activo
            </button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '13px' }} />
      </div>

      {error && <div role="alert" style={{ padding: '8px', borderRadius: '6px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px' }}>{error}</div>}

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando catálogo...
        </div>
      ) : (
        <AssetCatalogTable
          assets={filteredAssets}
          canManage={canManage}
          onEdit={(a) => { setEditingAsset(a); setFormModalOpen(true); }}
          onChangeStatus={(a) => { setStatusAsset(a); setStatusModalOpen(true); }}
        />
      )}

      {formModalOpen && (
        <AssetFormModal asset={editingAsset} isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} onSaved={() => loadAssets()} />
      )}
      {statusModalOpen && (
        <AssetStatusModal asset={statusAsset} isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} onUpdated={() => loadAssets()} />
      )}
      {importModalOpen && (
        <AssetImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImported={() => loadAssets()} />
      )}
    </div>
  );
}
