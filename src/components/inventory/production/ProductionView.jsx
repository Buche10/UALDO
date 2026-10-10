import React, { useState } from 'react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { useProductionRuns } from '../../../hooks/useProductionRuns';
import ProductionRunList from './ProductionRunList';
import ProductionTemplatePicker from './ProductionTemplatePicker';
import ProductionRunForm from './ProductionRunForm';
import ProductionRunDetail from './ProductionRunDetail';

/**
 * Producción y porcionado (Brief 21p). Cualquier miembro registra y consulta;
 * el dueño además ve costos y anula.
 *
 * Pantallas: lista, elegir ficha, formulario y detalle.
 */
export default function ProductionView({ isOwner, onBack }) {
  const [screen, setScreen] = useState('list');
  const [template, setTemplate] = useState(null);
  const [run, setRun] = useState(null);
  const [notice, setNotice] = useState(null);
  const { runs, loading, error, hasMore, loadMore, reload, upsertRun } = useProductionRuns();

  const openRun = (selected) => {
    setRun(selected);
    setScreen('detail');
  };

  const handleRecorded = (recorded, idempotent) => {
    upsertRun(recorded);
    setNotice(idempotent ? 'Ya estaba registrada.' : 'Producción registrada.');
    openRun(recorded);
  };

  const handleVoided = (updated) => {
    upsertRun(updated);
    setRun(updated);
    setNotice('Producción anulada.');
  };

  const backToList = () => {
    setNotice(null);
    setScreen('list');
  };

  let content;
  if (screen === 'pick') {
    content = <ProductionTemplatePicker onBack={backToList} onPick={(picked) => { setTemplate(picked); setScreen('form'); }} />;
  } else if (screen === 'form' && template) {
    content = <ProductionRunForm key={template.id} template={template} onBack={() => setScreen('pick')} onRecorded={handleRecorded} />;
  } else if (screen === 'detail' && run) {
    content = <ProductionRunDetail run={run} isOwner={isOwner} onBack={backToList} onVoided={handleVoided} />;
  } else {
    content = (
      <ProductionRunList
        runs={runs}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onReload={reload}
        onOpen={openRun}
        onNew={() => { setNotice(null); setScreen('pick'); }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h2 className="section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={18} color="var(--accent)" />
          <span>Producción y porcionado</span>
        </h2>
        <button type="button" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <ArrowLeft size={16} />
          <span>Inventario</span>
        </button>
      </div>

      <div role="status" aria-live="polite">
        {notice && (
          <div style={{ padding: '10px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
            {notice}
          </div>
        )}
      </div>

      {content}
    </div>
  );
}
