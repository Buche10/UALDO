# Brief 20p: compras, proveedores y valor del inventario en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama `feat/pwa-purchases`, creada desde `feat/pwa-production` (Brief 21p en `70d9f86`). No toques el
motor.

**Construye:** Claude, por pedido explícito del dueño del producto (2026-10-09).

**Por qué.** El motor ya tiene el Brief 20 (`a2a5311` en `UaldoBusiness`): proveedores, compras con lo pagado por
línea, recepción que mete el stock en la ubicación y actualiza el costo promedio, y la valorización del inventario.
En DobleFilo hubo 187 compras sin proveedor ni costo; el dueño decidió empezar a registrarlos (2026-10-08). Sin
pantallas, solo se puede hacer por API.

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-purchases.md` (léelo completo). Todo es **solo del dueño**: el
personal recibe 403.
- Proveedores: `GET /suppliers?search=&include_inactive=` (50 por página), `POST /suppliers`, `PUT /suppliers/{id}`
  (incluido `is_active`). Nombre único sin distinguir mayúsculas; `tax_id` RUC de 13 dígitos o cédula de 10.
- Compras: `GET /purchases?status=&supplier_id=&from=&to=` (20), `POST /purchases` (borrador con `client_uuid`;
  `201` o `200`), `GET /purchases/{id}`, `PUT /purchases/{id}/lines` (reemplaza todas), `POST .../receive`,
  `POST .../cancel`. Una compra recibida o cancelada responde `409` a cualquier cambio. Cada línea:
  `{ item_id, quantity, line_total, note? }`, con `line_total` = lo pagado por esa línea (hasta 2 decimales).
- Valor: `GET /inventory/valuation` con `by_location`, `total` e `items_without_cost`.

**Reglas que se mantienen:** cero emojis; colores solo con variables; montos y cantidades como texto validado,
nunca calculados en el cliente (el total y el costo unitario vienen del motor); `null` como "Sin dato"; todo por
`apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; idempotencia como `useMovementSubmit`.

## Objetivo

Que el dueño registre proveedores y compras desde el teléfono, las reciba (el stock entra en la ubicación y el
costo del insumo se actualiza) y vea cuánto vale su inventario por ubicación.

## Requerimientos

1. **Cliente** `src/services/purchasesClient.js` con todas las llamadas del contrato. Valida ids, ubicaciones, fecha
   (`AAAA-MM-DD`), cantidades (`^\d{1,7}(\.\d{1,3})?$`, mayor que 0, con coma), montos (`normalizeAmount` de
   `money.js`), RUC o cédula, correo y teléfono antes de llamar. Consultas con `URLSearchParams`.
2. **Entrada:** en la cabecera de Inventario, botón "Compras" **solo para el dueño**, que abre
   `inventory/purchases/PurchasesView.jsx` con tres pestañas: Compras, Proveedores y Valor.
3. **Compras:**
   - lista con proveedor, fecha, factura, total del motor y estado ("Borrador", "Recibida", "Cancelada"), filtro por
     estado y "Cargar más";
   - "Nueva compra": proveedor (activo), ubicación de destino (Bodega por defecto), fecha (hoy), factura, notas y
     líneas. Cada línea se agrega buscando el insumo por nombre o código; lleva cantidad, total pagado y nota;
   - antes de guardar no se muestra ningún total: "El total y el costo unitario los calcula el motor al guardar";
   - `client_uuid` al abrir, reutilizado tras un error de red, renovado tras un 201 o un 200; los `422`
     (`lines.N.*`, `invoice_number`, `supplier_id`) junto a su campo o línea;
   - detalle: líneas con cantidad, total pagado y costo unitario del motor, y el total. En borrador: "Editar
     líneas", "Recibir" y "Cancelar", cada una con confirmación propia. Recibir explica que el stock entra en la
     ubicación y que se actualiza el costo promedio. Un `409` dice que la compra ya estaba cerrada.
4. **Proveedores:** lista con búsqueda e "Incluir inactivos", alta y edición (nombre, RUC o cédula, contacto,
   teléfono, correo, notas, activo). El `422` de nombre duplicado junto al nombre.
5. **Valor:** total y por ubicación, con aviso si hay insumos con stock sin costo.
6. Agrega `src/services/purchasesClient.js` a `coverage.include`.

## Restricciones técnicas

- CERO EMOJIS. Íconos solo en SVG (`lucide-react`). Español con tildes.
- Marca: `docs/ualdo-brand.md`; colores solo con variables.
- Accesibilidad: cada campo con `label`; errores en contenedores `aria-live` siempre montados; diálogos con
  `role="dialog"`, Escape, foco dentro y retorno del foco.
- Componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones, lógica en hooks.
- Sin dependencias nuevas. No toques el login, el chat, la caja, Trabajo, los conteos ni producción.

## Tests

Vitest con Testing Library y `request` simulado. Cada test debe fallar si se revierte lo que protege. Cobertura de
80 % o más de sentencias y ramas en los archivos nuevos. Mutaciones reales en `docs/RESUMEN-20p.md`.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory; echo "exit=$?"
```

## Criterios de aceptación

- [ ] Solo el dueño ve "Compras"; el personal no hace ninguna petición de compras.
- [ ] El dueño crea un proveedor, registra una compra con varias líneas, la edita, la recibe y la cancela, con
      idempotencia y confirmaciones propias.
- [ ] Total y costos unitarios solo del motor; ningún cálculo de montos en el cliente.
- [ ] Errores 409 y 422 junto a su campo o línea.
- [ ] Valor del inventario por ubicación con aviso de insumos sin costo.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
