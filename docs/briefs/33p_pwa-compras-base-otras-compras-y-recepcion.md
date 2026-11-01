# Brief 33p: cantidad base, otras compras y recepción contra factura en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-compras-y-recepcion` desde `main` con los Briefs 30p a 32p fusionados. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 33 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\33_compras-base-otras-compras-y-recepcion.md`, con `docs/API-purchases.md` y `docs/API-supply-requests.md` actualizados.

**Por qué.** El motor ahora tiene:
- Cantidad base por insumo, y marcas `excede_base` y `stock_suficiente` en los pedidos.
- Resultado por ítem pedido (comprado, parcial o no comprado, con motivo).
- Líneas "Otras compras" fuera del catálogo.
- Recepción con el peso real por línea e incidencias de diferencia con su resolución.
- Conciliación diaria: pedido, comprado, facturado y recibido.

Las pantallas de compras (`src/components/inventory/purchases/`, Brief 20p) y de pedidos (`src/components/supplyRequests/`, Briefs 22p y 26p) no conocen nada de esto.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/inventory/purchases/*` (sobre todo `PurchaseDetail.jsx`, `PurchaseLinesEditor.jsx` y `purchaseUi.js`); `src/hooks/usePurchaseForm.js`, `usePurchaseActions.js`, `purchaseLines.js`; `src/services/purchasesClient.js`; `src/components/supplyRequests/*` (`ShoppingListPanel.jsx`, `ApprovedPurchases`, `SupplyRequestDetail.jsx`, `requestUi.js`); `src/services/supplyRequestsClient.js`; `src/services/permissions.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos y cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Administración carga la base y los mínimos de cada insumo, marca qué se compró y qué no, y registra "Otras compras". Quien recibe la mercadería anota el peso real de cada línea y ve al instante si hay diferencia. Administración resuelve las diferencias y consulta la conciliación del día.

## Requerimientos

1. **Clientes.**
   - `purchasesClient.js`:
     - `updatePurchaseParams(itemId, { base_quantity, min_stock, reorder_point })`.
     - `receivePurchase(id, lines)`, que admite `lines` opcional.
     - `resolveLine(purchaseId, lineId, { resolution, note, corrected_quantity })` y `receiveExtra(purchaseId, lineId, quantity)`.
     - `listOtherPurchases({ from, to, page })`, `getReconciliation(date)`, `getPurchasingSettings()` y `updatePurchasingSettings(data)`.
     - Líneas `is_other` en la creación y edición: `free_text_name`, `unit` y `note` obligatoria.
   - `supplyRequestsClient.js`: `savePurchaseOutcome(items)` (hasta 100 ítems, resultado en lista cerrada, motivo obligatorio para `partial` y `not_purchased`).
2. **Parámetros del insumo.** Con `purchases.manage`, en la ficha del insumo del inventario, sección "Compra" con base, mínimo y punto de reposición, y botón "Guardar". Componente `ItemPurchaseParams.jsx`.
3. **Pedidos y lista de compras.**
   - En el detalle del pedido y en la lista de compras, etiquetas "Excede la base ({base})" y "Hay stock" cuando vengan las marcas. Etiquetas neutras, no de error.
   - En la lista de compras de administración, modo "Registrar compra del día": por ítem aprobado, botones "Comprado", "Parcial" y "No comprado". Parcial pide cantidad y motivo; No comprado pide motivo. "Guardar resultados" envía todo junto y muestra cuántos se guardaron. Componente `PurchaseOutcomePanel.jsx`.
4. **Otras compras.**
   - En `PurchaseLinesEditor`, botón "Agregar otra compra" para una línea con nombre libre, unidad, cantidad, importe y motivo, y la etiqueta "Otras compras".
   - Pantalla de solo lectura `OtherPurchasesPanel.jsx`, dentro de Compras: periodo, lista, total y la sección "Se repite: candidatos al catálogo".
5. **Recepción.**
   - `ReceivePurchaseDialog.jsx` reemplaza la confirmación actual de "Recibir".
   - Por línea del catálogo muestra lo facturado y un campo "Recibido" precargado con lo facturado. Las líneas "Otras compras" no piden peso.
   - Si recibido y facturado difieren, la línea muestra en vivo "Diferencia: {x} {unidad}" con aviso neutro.
   - Confirmación en dos pasos.
   - Disponible para `purchases.receive` (jefes incluidos), no solo para administración.
6. **Diferencias.**
   - En el detalle de la compra, si está `received_with_issues`, la sección "Por aclarar" lista cada línea con facturado, recibido, diferencia y valor (con `inventory.costs`).
   - Con `purchases.manage`, botón "Resolver": elegir resolución, nota y, según el caso, cantidad corregida o "Llegó el resto" con su cantidad.
   - Estados con texto claro: "Recibida", "Recibida con diferencias", "En borrador", "Cancelada".
7. **Conciliación.** `ReconciliationPanel.jsx` en Compras, con fecha y una tabla por insumo (pedido, comprado, facturado, recibido) que resalta las filas con alerta. En móvil, cada fila se muestra como tarjeta.
8. **Ajustes** (`settings.manage`): factor de exceso de la base, tolerancia de recepción e importe de aviso de otras compras. Componente `PurchasingSettingsForm.jsx`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Montos con `money.js` y cantidades con `quantityFormat.js`; nunca flotantes para mostrar dinero.
- La app oculta, pero el motor decide; errores del motor con su mensaje.
- Seguridad: ids `^\d+$`; textos validados y recortados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas (divide `PurchaseDetail` si los supera), funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Clientes: rutas, validaciones (otra compra sin motivo, parcial sin motivo) y recepción con y sin `lines`.
- Recepción: la diferencia se calcula en vivo; las líneas de otras compras no piden peso; un jefe ve el botón y `kitchen_staff` no.
- Resolver: cada resolución pide sus campos.
- Resultados de compra: guardado por lote y conteo de éxitos.
- Etiquetas de base y stock en pedidos.
- Conciliación resalta las filas con alerta.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Base y mínimos editables por administración.
- [ ] Registro de comprado, parcial y no comprado con motivo.
- [ ] Otras compras en la compra y en su reporte.
- [ ] Recepción con peso real, diferencias visibles y resolución.
- [ ] Conciliación diaria.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
