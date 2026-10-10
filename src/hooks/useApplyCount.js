import { useState } from 'react';
import { applyCount, getCount } from '../services/inventoryCountsClient';

/**
 * Hook para la confirmación, aplicación y visualización de resultados de un conteo físico.
 */
export function useApplyCount({ countId, onAppliedSuccess, savePendingLines }) {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [appliedDetail, setAppliedDetail] = useState(null);

  const confirmAndApply = async () => {
    setError(null);
    setApplying(true);

    // 1. Guardar cualquier cambio pendiente antes de aplicar
    if (savePendingLines) {
      const savedOk = await savePendingLines();
      if (!savedOk) {
        setApplying(false);
        setError('No se pudo guardar el avance pendiente antes de aplicar.');
        return { ok: false };
      }
    }

    // 2. Aplicar conteo en el motor
    const res = await applyCount(countId);
    if (!res.ok) {
      setApplying(false);
      if (res.status === 409) {
        setError(res.data?.message || 'El conteo ya estaba cerrado o aplicado.');
      } else if (res.status === 422) {
        setError(res.data?.message || res.error || 'No se puede aplicar el conteo. Revisa las líneas o insumos.');
      } else {
        setError(res.error || res.data?.message || 'Error al aplicar el conteo.');
      }
      return { ok: false };
    }

    // 3. Consultar detalle del conteo aplicado para obtener las diferencias del motor
    const detailRes = await getCount(countId);
    setApplying(false);

    let detailData = res.data?.data || null;
    if (detailRes.ok && detailRes.data?.data) {
      detailData = detailRes.data.data;
    }

    setAppliedDetail(detailData);
    if (onAppliedSuccess) {
      onAppliedSuccess(detailData);
    }

    return { ok: true, data: detailData };
  };

  return {
    applying,
    error,
    appliedDetail,
    confirmAndApply,
  };
}
