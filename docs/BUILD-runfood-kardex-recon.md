# Reconocimiento Real del Kardex de RunFood (Fase 0.3)

> **Estado:** Documento de Trabajo Vivo (Actualizado con inspección real de BD `RUNFOODN`).
> **Objetivo:** Definir la consulta SELECT estricta en SQL Server `RUNFOODN` para la ingesta del consumo real de insumos hacia Ualdo.

---

## 1. Estructura Real Confirmada en SQL Server (`RUNFOODN`)

Tras consultar la base de datos `RUNFOODN`, la tabla de detalle de movimientos de inventario expone la siguiente estructura real:

| Columna Real | Tipo | Descripción | Mapeo Canónico Ualdo |
|---|---|---|---|
| `id` | BigInt / Int | Clave primaria única del registro | `runfood_movement_id` (Idempotencia DB) |
| `articulo` | Int | ID del insumo/artículo (`ARTICULO.id` con `esComponente = 1`) | `articulo_id` |
| `cabecera` | BigInt / Int | FK a `MOVIMIENTOCABECERA.id` | `movimiento_cabecera_id` |
| `cantidad` | Decimal(12,4) | Cantidad descontada en la unidad de RunFood | `quantity` |
| `bodega` | Int | ID de bodega o cocina | `location` |
| `fecha` | DateTime | Timestamp oficial de la transacción | `fecha_movimiento` |

---

## 2. Query SQL Server READ-ONLY (SELECT Canónico)

La ingesta autónoma desde Laravel (`InventoryReconciliationService`) ejecutará la siguiente consulta optimizada read-only sobre `RUNFOODN`:

```sql
SELECT 
    d.id AS runfood_movement_id,
    d.articulo AS articulo_id,
    a.descripcion AS articulo_nombre,
    ABS(d.cantidad) AS quantity,
    COALESCE(a.unidad, 'UNIDAD') AS unit,
    c.tipoMovimiento AS tipo_movimiento,
    c.fecha AS fecha_movimiento,
    b.nombre AS location
FROM MOVIMIENTODETALLE d WITH (NOLOCK)
INNER JOIN MOVIMIENTOCABECERA c WITH (NOLOCK) ON d.cabecera = c.id
INNER JOIN ARTICULO a WITH (NOLOCK) ON d.articulo = a.id
LEFT JOIN BODEGA b WITH (NOLOCK) ON d.bodega = b.id
WHERE a.esComponente = 1
  AND c.fecha > :last_synced_at
ORDER BY c.fecha ASC;
```

---

## 3. Topología de Red y Checkpoint

- **Host / IP Local:** `192.168.100.10:1000` (Requiere reserva DHCP estática y desactivación de suspensión en la PC del local).
- **Garantía de Idempotencia:** Guardado en `inventory_transactions.external_movement_id` con restricción `UNIQUE` por workspace en la base de datos de UaldoBusiness.
