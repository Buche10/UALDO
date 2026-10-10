/**
 * Utilidad de formato de cantidades para inventario según Brief 19/19p.
 * - null o undefined se muestra como "Sin dato".
 * - Formato en es-EC con coma decimal, hasta 3 decimales y sin ceros sobrantes.
 */
export function formatQuantity(val) {
  if (val === null || val === undefined || val === '') {
    return 'Sin dato';
  }

  const num = typeof val === 'number' ? val : Number(String(val).replace(',', '.'));
  if (Number.isNaN(num)) {
    return 'Sin dato';
  }

  return new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num);
}
