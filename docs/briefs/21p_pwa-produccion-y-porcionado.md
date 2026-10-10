# Brief 21p: producción y porcionado en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama `feat/pwa-production`, creada desde `feat/pwa-inventory-locations` (Briefs 19p en `0ba52bb`).
No toques el motor.

**Construye:** Claude, por pedido explícito del dueño del producto (2026-10-09).

**Por qué.** El motor ya tiene el Brief 21 (`2cab4d9` en `UaldoBusiness`, rama `feat/production-runs`): la cocina
registra un porcionado desde una ficha importada de DobleFilo, el stock baja de la pieza y sube en las porciones, el
motor mide el rendimiento y avisa al dueño, y el costo de la pieza pasa a las porciones. La app no tiene pantallas
para eso. En DobleFilo se hacían unas 15 producciones al mes (lomo, bondiola, bife, picanha).

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-production.md` (léelo completo). Resumen:
- `GET /production-templates` (fichas activas con `inputs` y `outputs`; cada entrada trae `is_primary`, cada salida
  `is_main`), `GET /production-templates/{id}` y `GET /production-templates/{id}/plan?input_quantity=` (cantidades
  esperadas).
- `POST /production-runs` `{ template_id, location?, inputs: [{item_id, quantity}], outputs: [{item_id, quantity}],
  main_output_weight?, waste_quantity?, notes?, client_uuid? }`: `201` creada, `200` idempotente, `409` stock
  insuficiente en la ubicación, `422` con errores por campo (`inputs.N.quantity`, `outputs.N.item_id`, `outputs`,
  `main_output_weight`, ...).
- `GET /production-runs?template_id=&status=&page=` (paginado de 20) y `GET /production-runs/{id}`: métricas
  (`real_yield_pct`, `expected_yield_pct`, `yield_difference_pct`, `unaccounted_weight`, `unaccounted_pct`, pesos) y
  líneas con `expected_quantity`. Solo para el dueño: `cost_status`, `input_cost`, y `cost_cents` y `unit_cost` por
  línea.
- `POST /production-runs/{id}/void` `{ reason }` (solo el dueño): `409` si una porción ya se usó o ya estaba anulada.
- Cualquier miembro registra y consulta.

**Reglas de la app que se mantienen:** cero emojis; colores solo con variables de `src/styles/main.css`; cantidades
como texto validado y nunca calculadas en el cliente; `null` como "Sin dato"; todo por `apiClient`; sin `alert`,
`confirm` ni `dangerouslySetInnerHTML`; idempotencia como `useMovementSubmit`.

## Objetivo

Que cualquier miembro registre un porcionado desde el teléfono eligiendo la ficha, vea las cantidades esperadas
mientras escribe, y vea el rendimiento real del motor al terminar. Que el dueño vea los costos y pueda anular una
producción con motivo.

## Requerimientos

1. **Cliente** `src/services/productionClient.js`: `listTemplates`, `getTemplate`, `getPlan`, `listRuns`, `getRun`,
   `recordRun(payload, clientUuid)` y `voidRun(id, reason)`. Valida ids (enteros positivos), ubicaciones (la lista de
   `inventoryLocations`), cantidades (`^\d{1,7}(\.\d{1,3})?$`, acepta coma; entradas mayores que 0) y motivo (1 a
   255). Consultas con `URLSearchParams`.
2. **Entrada:** en `InventoryView`, un botón "Producción" para **cualquier miembro** que abre
   `inventory/production/ProductionView.jsx`.
3. **Lista de producciones:** ficha, ubicación, fecha, rendimiento real y estado ("Registrada" o "Anulada"), con
   "Cargar más". Botón "Nuevo porcionado".
4. **Elegir la ficha:** lista de fichas activas con su rendimiento esperado.
5. **Formulario** (`ProductionRunForm.jsx` con el hook `useProductionRunForm`):
   - ubicación (por defecto, la de la ficha);
   - un campo por entrada y por salida, con su unidad (`inputMode="decimal"`, `label` con el nombre del insumo);
     las salidas principales marcadas;
   - "Peso de las porciones (kg)" y "Merma que se tira (kg)", obligatorios según la ficha;
   - notas;
   - **plan del motor:** si la ficha tiene entrada principal, al escribir su cantidad se pide el plan (con espera de
     400 ms y sin pedidos superpuestos) y cada línea muestra "Esperado: X". Si la ficha escala por la suma de
     entradas, se indica que lo esperado se calcula al registrar. Nada se calcula en el cliente;
   - solo se envían las entradas con cantidad y las salidas escritas (0 incluido);
   - `client_uuid`: se genera al abrir, se reutiliza tras un error de red y se renueva tras un 201 o un 200;
   - `409`: el mensaje del motor; `422`: cada error junto a su campo (traduciendo `inputs.N` y `outputs.N` al insumo
     enviado en esa posición) y los generales arriba.
6. **Detalle** (`ProductionRunDetail.jsx`): al registrar y desde la lista. Rendimiento real contra esperado (la
   diferencia negativa en color de advertencia), pesos, peso sin explicar y, por línea, lo esperado y lo real. Para
   el dueño, el costo (con aviso si está incompleto). Botón "Anular" solo para el dueño.
7. **Anular** (`VoidProductionDialog.jsx`): motivo obligatorio, confirmación propia, `role="dialog"`, Escape y
   retorno del foco; `409` muestra el mensaje del motor.
8. Agrega `src/services/productionClient.js` a `coverage.include` en `vite.config.js`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción. Íconos solo en SVG (`lucide-react`).
- Español con tildes; no quites ninguna.
- Marca: `docs/ualdo-brand.md`; colores solo con variables; botones pastilla.
- Seguridad: todo por `apiClient`; ids y ubicaciones validados antes de construir rutas; texto plano.
- Accesibilidad: cada campo con `label`; errores con `aria-live` en contenedores que existen siempre; diálogos con
  Escape y retorno del foco.
- Diseño: componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones de estado, lógica en hooks.
- Sin dependencias nuevas. No toques el login, el chat, la caja, Trabajo ni los conteos.

## Tests

Vitest con Testing Library, `request` simulado y temporizadores falsos. Cada test debe fallar si se revierte lo que
protege. Cobertura de 80 % o más de sentencias y ramas en los archivos nuevos. Mutaciones reales en
`docs/RESUMEN-21p.md`.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory; echo "exit=$?"
```

## Criterios de aceptación

- [ ] Cualquier miembro abre Producción, elige una ficha y registra un porcionado con idempotencia.
- [ ] El plan del motor aparece mientras se escribe la entrada principal, sin cálculos en el cliente.
- [ ] Los errores 409 y 422 aparecen junto a su campo o arriba.
- [ ] El detalle muestra rendimiento, pesos y líneas; los costos solo al dueño; anular solo el dueño, con motivo.
- [ ] Cero emojis, colores por variables, componentes de menos de 250 líneas.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
