/**
 * Catálogo cerrado de causas para diferencias en el cierre diario (Brief 31 / 31p).
 */
export const DAILY_CLOSE_CAUSES = Object.freeze([
  { value: 'error_de_conteo', label: 'Error de conteo' },
  { value: 'merma_no_registrada', label: 'Merma no registrada' },
  { value: 'consumo_no_registrado', label: 'Consumo no registrado' },
  { value: 'devolucion', label: 'Devolución' },
  { value: 'error_de_registro', label: 'Error de registro' },
  { value: 'otro', label: 'Otro' },
]);

export function getCauseLabel(cause) {
  const match = DAILY_CLOSE_CAUSES.find((c) => c.value === cause);
  return match ? match.label : (cause || 'Sin causa');
}
