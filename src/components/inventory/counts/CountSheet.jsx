import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCountSheet } from '../../../hooks/useCountSheet';
import { cancelCount } from '../../../services/inventoryCountsClient';
import CountSheetRow from './CountSheetRow';
import ApplyCountDialog from './ApplyCountDialog';
import CancelCountDialog from './CancelCountDialog';
import CountSheetHeader from './CountSheetHeader';
import CountSheetActions from './CountSheetActions';
import CountSheetSearchBar from './CountSheetSearchBar';
import SubmitDailyCloseDialog from '../dailyClose/SubmitDailyCloseDialog';
import { isBlankOverSaved } from '../../../hooks/countSheetLines';
import { formatQuantity } from '../../../services/quantityFormat';

function savedNotice(entry) {
  if (!isBlankOverSaved(entry)) return null;
  return `Ya hay ${formatQuantity(entry.initial_saved_qty)} guardada en el motor. Para corregirla, escribe la cantidad correcta (0 si no hay).`;
}

export default function CountSheet({
  countId,
  onBack,
  onAppliedComplete,
  isDailyClose = false,
  onSubmitSuccess,
  backLabel,
}) {
  const [search, setSearch] = useState('');
  const [showSystemQty, setShowSystemQty] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const applyTriggerRef = useRef(null);
  const cancelTriggerRef = useRef(null);
  const submitTriggerRef = useRef(null);

  const {
    items, loadingItems, itemsError, retryLoadItems, loadingProgress,
    countDetail, setCountDetail, quantities, lineErrors, saveStatus,
    lastSavedTime, saveErrorMessage, updateQuantity, savePendingLines, hasPendingChanges,
  } = useCountSheet({ countId });

  const filteredItems = useMemo(() => {
    if (!search?.trim()) return items;
    const term = search.toLowerCase().trim();
    return items.filter((i) => (i.name && i.name.toLowerCase().includes(term)) || (i.code && i.code.toLowerCase().includes(term)));
  }, [items, search]);

  const isAppliedOrCancelled = countDetail?.status === 'applied' || countDetail?.status === 'cancelled';

  const handleBack = async () => {
    if (hasPendingChanges() || saveStatus === 'saving') {
      const ok = await savePendingLines();
      if (!ok) return;
    }
    onBack();
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    const res = await cancelCount(countId);
    setCancelling(false);
    if (res.ok) {
      setShowCancelDialog(false);
      onBack();
    } else {
      setCancelError(res.status === 409 ? 'El conteo ya estaba cerrado.' : res.error || res.data?.message || 'Error al cancelar conteo.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' }}
        >
          <ArrowLeft size={16} />
          <span>{backLabel || (isDailyClose ? 'Volver al cierre' : 'Volver a conteos')}</span>
        </button>

        <CountSheetActions
          saveStatus={saveStatus}
          saveErrorMessage={saveErrorMessage}
          lastSavedTime={lastSavedTime}
          isAppliedOrCancelled={isAppliedOrCancelled}
          isDailyClose={isDailyClose}
          countStatus={countDetail?.status}
          itemsDisabled={Boolean(itemsError || loadingItems)}
          onSavePending={savePendingLines}
          onOpenCancel={() => setShowCancelDialog(true)}
          onOpenApply={() => setShowApplyDialog(true)}
          onOpenSubmit={() => setShowSubmitDialog(true)}
          cancelTriggerRef={cancelTriggerRef}
          applyTriggerRef={applyTriggerRef}
          submitTriggerRef={submitTriggerRef}
        />
      </div>

      <CountSheetHeader countDetail={countDetail} showSystemQty={showSystemQty} onToggleSystemQty={() => setShowSystemQty((prev) => !prev)} />

      {itemsError && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontSize: '12px' }}>
            <AlertCircle size={16} />
            <span>{itemsError}</span>
          </div>
          <button type="button" onClick={retryLoadItems} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>
            Reintentar
          </button>
        </div>
      )}

      <CountSheetSearchBar search={search} onSearchChange={setSearch} />

      {loadingItems ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div>Cargando catálogo completo para conteo...</div>
          <div style={{ width: '100%', maxWidth: '200px', height: '6px', background: 'var(--surface-soft)', borderRadius: '3px', margin: '12px auto 0 auto', overflow: 'hidden' }}>
            <div style={{ width: `${loadingProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s ease' }} />
          </div>
          <div style={{ fontSize: '11px', marginTop: '6px' }}>{loadingProgress}%</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          {itemsError ? 'Catálogo incompleto debido a un error de conexión.' : 'No se encontraron insumos que coincidan con la búsqueda.'}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {filteredItems.map((item) => (
            <CountSheetRow
              key={item.id}
              item={item}
              locationKey={countDetail?.location}
              countedValue={quantities[item.id]?.counted_quantity ?? ''}
              showSystemQty={showSystemQty}
              error={lineErrors[item.id]}
              notice={savedNotice(quantities[item.id])}
              onChange={isAppliedOrCancelled ? undefined : updateQuantity}
              readOnly={isAppliedOrCancelled}
            />
          ))}
        </div>
      )}

      {!isDailyClose ? (
        <>
          <ApplyCountDialog
            isOpen={showApplyDialog}
            countId={countId}
            countDetail={countDetail}
            items={items}
            quantities={quantities}
            savePendingLines={savePendingLines}
            onClose={() => setShowApplyDialog(false)}
            triggerRef={applyTriggerRef}
            onAppliedComplete={(appliedData) => {
              if (appliedData) setCountDetail(appliedData);
              if (onAppliedComplete) onAppliedComplete(appliedData);
            }}
          />
          <CancelCountDialog
            isOpen={showCancelDialog}
            cancelling={cancelling}
            error={cancelError}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={handleConfirmCancel}
            triggerRef={cancelTriggerRef}
          />
        </>
      ) : (
        <SubmitDailyCloseDialog
          isOpen={showSubmitDialog}
          countId={countId}
          savePendingLines={savePendingLines}
          onClose={() => setShowSubmitDialog(false)}
          triggerRef={submitTriggerRef}
          onSubmitSuccess={(data) => {
            if (data) setCountDetail(data);
            if (onSubmitSuccess) onSubmitSuccess(data);
          }}
        />
      )}
    </div>
  );
}
