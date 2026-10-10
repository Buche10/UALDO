import { useEffect, useRef, useState } from 'react';
import { getPlan, normalizeProductionQuantity } from '../services/productionClient';
import { expectedFromPlan } from './productionForm';

const DEBOUNCE_MS = 400;

/**
 * Plan del motor para la cantidad de la entrada principal (Brief 21p).
 *
 * - Al cambiar la cantidad, lo esperado anterior se borra y `loading` indica
 *   que se está calculando: nunca se muestran números de otra cantidad.
 * - Espera 400 ms desde la última pulsación.
 * - Nunca hay dos pedidos a la vez: si el temporizador vence con un pedido en
 *   curso, se pide otra vez al terminar, con la cantidad más reciente.
 * - Una respuesta de una cantidad que ya no es la actual se descarta.
 * - Al desmontar no se actualiza el estado ni se piden más planes.
 */
export function useProductionPlan(templateId, basisQuantity) {
  const [expected, setExpected] = useState({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const latestRef = useRef(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const templateRef = useRef(templateId);

  // Al desmontar ya no hay cantidad vigente: una respuesta en curso se
  // descarta y no se piden más planes ni se actualiza el estado.
  useEffect(() => () => {
    latestRef.current = null;
  }, []);

  useEffect(() => {
    const quantity = normalizeProductionQuantity(basisQuantity);
    latestRef.current = templateId && quantity !== null && Number(quantity) > 0 ? quantity : null;
    templateRef.current = templateId;
    setExpected({});
    setFailed(false);
    setLoading(latestRef.current !== null);
    if (latestRef.current === null) return undefined;

    const fetchPlan = async () => {
      if (inFlightRef.current) {
        pendingRef.current = true;
        return;
      }
      const requested = latestRef.current;
      if (requested === null) return;
      inFlightRef.current = true;
      pendingRef.current = false;
      const res = await getPlan(templateRef.current, requested);
      inFlightRef.current = false;
      if (requested === latestRef.current) {
        setExpected(res.ok ? expectedFromPlan(res.data?.data) : {});
        setFailed(!res.ok);
        setLoading(false);
      } else if (pendingRef.current) {
        fetchPlan();
      }
    };

    const timer = setTimeout(fetchPlan, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [templateId, basisQuantity]);

  return { expected, loading, failed };
}
