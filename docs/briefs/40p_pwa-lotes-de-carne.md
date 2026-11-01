# Brief 40p: lotes de carne en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-lotes-de-carne` desde `main` con los Briefs 30p a 33p fusionados. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 40 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\40_lotes-de-carne-y-rotacion.md` y `C:\laragon\www\UaldoBusiness\docs\API-lots.md`, con `API-production.md`, `API-purchases.md` y `API-inventory.md` actualizados.

**Por qué.** El dueño pide trazabilidad por lotes solo para carnes. Al recibir carne, Ualdo da un código corto (`L0001`) que el trabajador **escribe a mano en la funda**. **Sin QR.** Al porcionar, transferir o retirar se usa por defecto el lote más antiguo apto. Elegir otro exige justificación. La carne no apta nunca se recomienda.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/inventory/purchases/ReceivePurchaseDialog.jsx` (Brief 33p); `src/components/inventory/production/*` y `src/hooks/useProductionRunForm.js`; `src/components/inventory/TransferModal.jsx`; `src/components/withdrawals/*` (Brief 32p); `src/services/permissions.js` y `moduleRegistry.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Al recibir carne, la app muestra en grande el código de cada lote para escribirlo en la funda. Al porcionar, transferir o retirar carne, propone el lote que toca y pide el motivo si se elige otro. Una pantalla de lotes muestra los saldos por ubicación, la antigüedad y la trazabilidad completa, y permite marcar un lote como no apto.

## Requerimientos

1. **Cliente** `src/services/lotsClient.js`:
   - `listLots(filters)`, `getNextLot(itemId, location)`, `getLot(id)`, `markLotUnfit(id, reason)` y `setRequiresLot(itemId, value)`.
   - `getLotSettings()` y `updateLotSettings(data)`.
   - Código de lote `^L\d{4,}$` al buscar; motivo de 5 a 300 caracteres.
2. **Recepción.** Si la respuesta de `receivePurchase` trae `lots`, la app muestra `LotCodesDialog.jsx`:
   - Por línea, el corte y el código en tipografía grande y alto contraste, más la instrucción "Escribe este número en cada funda".
   - Botón "Listo, ya los anoté". No se cierra tocando fuera.
3. **Selector de lote** (`LotPicker.jsx`, reutilizable): para un insumo con `requires_lot`, muestra el lote recomendado (`getNextLot`) preseleccionado, con su código, saldo y días. Permite elegir otro de la lista. Si el elegido no es el recomendado, pide el motivo antes de continuar, con el texto "Hay un lote más antiguo ({code}). ¿Por qué usas {code}?". Úsalo en:
   - Producción: lote de entrada. El `422` "Porciona un lote a la vez" se muestra tal cual.
   - Transferencias y retiros de insumos con lote.
   - Merma manual de insumos con lote.
4. **Pantalla "Lotes de carne"** (tarjeta en `moduleRegistry` con `lots.manage` o `inventory.view`, solo si el negocio tiene insumos con lote):
   - `LotsView.jsx`: lotes activos ordenados del más antiguo al más nuevo, con código, corte, fecha de recepción, días (etiqueta de advertencia pasado el plazo configurado), saldos por ubicación y producto (crudo y porciones), y filtros por estado y corte. Búsqueda por código.
   - `LotDetail.jsx`: trazabilidad con proveedor, compra y factura, peso recibido, porcionados (rendimiento y merma), saldos y movimientos paginados con los saltos de FIFO resaltados y su justificación. Costos solo con `inventory.costs`.
   - Con `lots.manage`: "Marcar no apto", con confirmación de dos pasos que explica "Todo el saldo saldrá como merma. No se puede deshacer." y motivo obligatorio.
5. **Configuración** (`settings.manage`): en la ficha del insumo, casilla "Controlar por lotes (solo carnes)" con confirmación ("Se creará un lote inicial con el stock actual"). En Ajustes, los días para el aviso de antigüedad.
6. **Chat.** Con `inventory.view`, si hay insumos con lote: acceso "¿Qué lote uso?", con el texto "¿Qué lote de carne tengo que usar primero?".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Sin QR ni impresión de etiquetas (decisión del dueño).
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: ids `^\d+$`; textos validados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (un solo `LotPicker` para todos los formularios).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones y rutas.
- Recepción con lotes muestra los códigos y no se cierra tocando fuera.
- `LotPicker`: preselecciona el recomendado; elegir otro pide el motivo; sin motivo no se puede continuar.
- Producción, transferencia y retiro envían `lot_id` y `justification`.
- Lista ordenada por antigüedad, con la etiqueta de advertencia pasado el plazo.
- Detalle con los saltos de FIFO resaltados; costos ocultos sin permiso.
- "Marcar no apto" exige dos pasos y motivo.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El código de lote se muestra claro al recibir carne para escribirlo en la funda.
- [ ] Producción, transferencias, retiros y mermas proponen el lote más antiguo y piden motivo si se elige otro.
- [ ] Pantalla de lotes con saldos, antigüedad y trazabilidad.
- [ ] Marcar no apto con confirmación.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
