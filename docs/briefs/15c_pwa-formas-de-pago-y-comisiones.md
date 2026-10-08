# Brief 15c-PWA: formas de pago de RunFood y tasas de comisión

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama base `feat/pwa-cash-close` (Brief 15b en `119c03b`). Crea la rama
`feat/pwa-cash-config` desde ahí. **No toques** el repo del motor.

**Por qué.** Con el 15b, el dueño ya revisa la caja del motor desde la app. Pero dos motivos de revisión no los
puede resolver desde el teléfono:
- `formas_sin_mapear`: una forma de pago de RunFood que no está asignada a ninguna cubeta del Libro diario;
- `falta_comision`: una tarjeta sin tasa de comisión vigente, así que su neto no se puede estimar.

Hoy el detalle del día del 15b dice que "se resuelven desde el motor". Este brief agrega las dos pantallas. En
paralelo, el **Brief 15c-motor** (repo del motor) hace que guardar un mapeo o una tasa **reevalúe solos** los días
abiertos y agrega `POST /restaurant/cash-close/{fecha}/reevaluar`. Si al construir este brief ese endpoint todavía
no existe en tu motor local, los tests lo simulan igual: el contrato está abajo.

**Estado actual de la PWA, verificado por el auditor:**
- **`src/components/CashCloseView.jsx`** (114 líneas): contenedor de la subvista `cashclose`. Contiene la lista
  (`cashclose/CashCloseList.jsx`) y el detalle (`cashclose/CashCloseDetail.jsx`), que muestra los motivos con la
  acción sugerida de un mapa local.
- **`src/services/cashCloseClient.js`:** cliente de caja con `isValidDate` y una lista blanca de claves. Extiéndelo
  o crea uno nuevo, sin duplicar la validación.
- **`src/services/money.js`:** `formatUsd`. **No se calcula dinero en el cliente.**
- **Patrones a reutilizar:**
  - `useCashMovementSubmit` y `useMovementSubmit`;
  - los modales sin `alert` ni `confirm`;
  - las variables CSS de `src/styles/main.css`;
  - la guardia `securityGuard.test.js`;
  - `coverage.include` en `vite.config.js`.

**Pendiente del 15b, que se corrige aquí:**
- **(a)** El test `bloquea al personal sin is_owner sin realizar peticiones a la API`
  (`src/components/__tests__/CashCloseView.test.jsx`) no detecta la regresión. El auditor quitó
  `if (!isOwner) return;` de la carga y los 6 tests pasaron, porque el test comprueba la llamada antes de que corra
  la carga asíncrona.
- **(b)** No existen los hooks `useCashClose` y `useCashMovements` que pedía el 15b. La lógica quedó dentro de
  `CashMovementsPanel.jsx` (239 líneas) y `CashCloseReviewForm.jsx` (234).
- **(c)** `src/services/auth.js` rodea la guardia armando la clave con
  `['ualdo', 'cash', 'close', 'history'].join('_')`.

**Contratos del motor.** Léelos en `C:\laragon\www\UaldoBusiness\docs\API-cash-close.md`, secciones 4, 5 y 7. Todo
es **solo para el dueño**: el personal recibe 403 y un registro de otro negocio 404.

- **`GET /api/v1/restaurant/cash-close/payment-mappings`:**
  - responde `{ data: [mapeo] }`;
  - cada mapeo trae `id`, `runfood_forma_pago_id`, `descripcion_runfood`, `es_efectivo`, `es_tarjeta`, `bucket`,
    `suggested_bucket` (o `null`), `suggested_note` (o `null`), `confirmado`, `confirmed_at` y `ultimo_arqueo`;
  - `ultimo_arqueo` es `{ monto, business_date, captured_at }` o `null`.
- **`PUT /api/v1/restaurant/cash-close/payment-mappings/{id}`:**
  - cuerpo `{ bucket }`, que es una de `efectivo`, `pichincha`, `de_una`, `internacional`, `credito`, `debito`,
    `diners`, `pedidos_ya`, `decoracion_efectivo`, `decoracion_tarjeta`, `decoracion_transferencia` e `ignorar`;
  - `sin_mapear` **no** es un destino válido y responde 422;
  - responde `200` con el mapeo, `404` si es de otro negocio y `422`.
- **`POST /api/v1/restaurant/cash-close/payment-mappings/{id}/aceptar-sugerencia`:** responde `200` con el mapeo, o
  `422` si no hay sugerencia.
- **`GET /api/v1/restaurant/cash-close/commission-rates`:**
  - `current`: las cuatro tarjetas (`credito`, `debito`, `diners` y `pedidos_ya`), cada una con `card_type`,
    `label`, `rate_bp`, `retention_bp` y `effective_from`; los tres últimos son `null` si no hay tasa vigente;
  - `history`: `{ id, card_type, rate_bp, retention_bp, effective_from }`, de la vigencia más reciente a la más
    antigua.
- **`PUT /api/v1/restaurant/cash-close/commission-rates`:**
  - cuerpo `{ card_type, rate_bp, retention_bp, effective_from }`;
  - `rate_bp` y `retention_bp` son enteros entre 0 y 3000 puntos básicos (1 bp = 0,01 %);
  - responde con la misma forma del `GET`, o `422`;
  - una vigencia nueva no reescribe el pasado: si coincide la fecha exacta, se actualiza esa vigencia.
- **`POST /api/v1/restaurant/cash-close/{fecha}/reevaluar`** (Brief 15c-motor): responde `200 { data: cierre }`,
  `409` si el día está cerrado o no tiene datos de RunFood, y `404`.

**Lee primero:**
- `docs/ualdo-brand.md`;
- el runbook del motor `docs/runbooks/RUNBOOK-cierre-ciego-runfood.md`, secciones 2 y 6;
- `src/components/CashCloseView.jsx`, `src/components/cashclose/*`, `src/services/cashCloseClient.js`,
  `src/services/money.js`, `src/components/EcosystemView.jsx`, `src/services/auth.js` y
  `src/services/__tests__/securityGuard.test.js`.

## Objetivo

Que el dueño pueda, desde la app:
- asignar cada forma de pago de RunFood a su cubeta, o aceptar la sugerencia;
- configurar las tasas de comisión y retención por tarjeta con su vigencia;
- volver a evaluar un día;
- llegar a esas pantallas directamente desde el motivo de revisión que las necesita.

Además, cerrar los tres pendientes del 15b.

## Requerimientos

### Parte A: clientes

1. **`src/services/cashConfigClient.js`**, sobre `request`:
   - `listPaymentMappings()`, `assignBucket(id, bucket)` y `acceptSuggestion(id)`;
   - `getCommissionRates()` y `saveCommissionRate({ card_type, rate_bp, retention_bp, effective_from })`.

   **Validaciones antes de la petición**, que devuelven un error sin llamar:
   - `id` es un entero positivo;
   - `bucket` está en la lista blanca, que **excluye** `sin_mapear`;
   - `card_type` está en la lista blanca;
   - `rate_bp` y `retention_bp` son enteros de 0 a 3000;
   - `effective_from` es una fecha válida (reutiliza `isValidDate` de `cashCloseClient.js`, sin copiarla).
2. **`reevaluateClose(fecha)`** se agrega a `cashCloseClient.js`, con la misma validación de fecha.
3. **Porcentaje a puntos básicos**, en `src/services/money.js`:
   - `percentToBp(raw)`: acepta `"4,48"` o `"4.48"` con 2 decimales como máximo, entre 0 y 30, y devuelve el
     **entero** de puntos básicos (`448`). Hazlo con aritmética de texto (parte entera por 100 más los decimales
     completados a 2 cifras), **sin multiplicar floats**. Devuelve `null` si no es válido.
   - `bpToPercent(bp)`: `448` da `"4,48 %"` y `null` da "Sin tasa".

### Parte B: pantallas (dentro de `src/components/cashconfig/`)

4. **Acceso:**
   - dentro de la subvista de caja, un botón "Configurar caja" en la lista de días (`CashCloseList`), que abre
     `CashConfigView.jsx` con dos pestañas: "Formas de pago" y "Comisiones";
   - solo el dueño; el personal no hace ninguna petición (ver el test del punto 1).
5. **Formas de pago (`PaymentMappingsPanel.jsx`):**
   - **Lista:** primero las **sin asignar** (`bucket === 'sin_mapear'`), destacadas con `--warning-soft`; después
     las asignadas.
   - **Cada fila:** descripción de RunFood con su número, "Efectivo" o "Tarjeta" si corresponde, la cubeta actual
     con su etiqueta en español y el último monto del arqueo con su fecha (`formatUsd`), o "Sin movimientos
     recientes".
   - **Si hay sugerencia y no está confirmada:** "Sugerido: <cubeta>", con la nota si existe (por ejemplo, la forma
     combinada `105 TARJETA DE CREDITO/DEBITO`), y el botón "Aceptar sugerencia".
   - **"Cambiar":**
     - abre un selector con las 12 cubetas válidas y sus etiquetas: Efectivo, Pichincha, De Una, Internacional,
       Crédito, Débito, Diners, Pedidos Ya, Decoración en efectivo, Decoración con tarjeta, Decoración por
       transferencia e "Ignorar (no cuenta en la caja)";
     - pide confirmación si la forma ya estaba **confirmada**: "Cambiar la cubeta de una forma ya confirmada
       afecta a los días abiertos";
     - "Ignorar" exige una confirmación propia: "Esta forma de pago no se sumará en ningún cierre".
   - **Tras guardar,** actualiza la fila con la respuesta del servidor y muestra "Guardado. Los días abiertos se
     vuelven a evaluar en unos segundos."
6. **Comisiones (`CommissionRatesPanel.jsx`):**
   - **Tabla de tasas vigentes:** una fila por tarjeta, con `label`, comisión, retención (con `bpToPercent`) y
     "Desde <fecha>". Las tarjetas sin tasa vigente se destacan con "Sin tasa: su neto queda pendiente".
   - **"Nueva tasa"** por tarjeta: comisión % y retención % (con `percentToBp`) y "Vigente desde" (por defecto,
     hoy; no más de 90 días en el futuro).
     - Explica en una línea que una tasa nueva no cambia los días anteriores a su vigencia, y que los días abiertos
       se vuelven a evaluar.
     - Antes de guardar, pide confirmación mostrando los dos porcentajes y la fecha.
   - **"Historial"** por tarjeta: las vigencias anteriores (`history`), solo de lectura.
   - **Nota fija** del Libro: "La retención se calcula sobre el bruto. Confírmalo con tu contador." Es un pendiente
     de confirmar con el dueño, documentado en el motor.
   - **No hay valores por defecto:** el Libro trae un ejemplo (crédito 4,48 % + 2 %), pero **no** se prellena.
7. **Desde el motivo al arreglo** (`CashCloseDetail.jsx`):
   - en los motivos `formas_sin_mapear` y `falta_comision`, reemplaza "se resuelven desde el motor" por un botón,
     "Asignar formas de pago" o "Configurar comisiones", que abre `CashConfigView` en la pestaña correspondiente;
   - al volver, recarga el día.
8. **"Volver a evaluar"** (`CashCloseDetail.jsx`):
   - solo en días que no están `cerrado` y tienen `snapshot`, un botón que llama a `reevaluateClose(fecha)` y
     reemplaza el detalle con `data`;
   - un 409 muestra el mensaje del servidor;
   - mientras está en curso, el botón queda deshabilitado.

### Parte C: pendientes del 15b

9. **(a) Test del personal:** reescríbelo para que espere a que se asienten los efectos (`await waitFor` o
   `act(async ...)`) antes de afirmar que no hubo petición, y aplica lo mismo al test equivalente de
   `CashConfigView`. Debe fallar si se quita `if (!isOwner) return;`.
10. **(b) Hooks:**
    - extrae `src/hooks/useCashClose.js` (carga del día, revisión, netos, reapertura y reevaluación) y
      `src/hooks/useCashMovements.js` (lista, paginación, alta y anulación, usando `useCashMovementSubmit`);
    - `CashMovementsPanel.jsx` y `CashCloseReviewForm.jsx` deben quedar por debajo de 200 líneas;
    - el comportamiento no cambia y sus tests siguen en verde.
11. **(c) Guardia:**
    - en `auth.js`, escribe la clave literal `ualdo_cash_close_history`;
    - en `securityGuard.test.js`, agrega una **excepción explícita y comentada**: ese token se permite **solo** en
      `src/services/auth.js` y solo dentro de una llamada `localStorage.removeItem(...)`. Cualquier otro uso sigue
      prohibido.
12. **Cobertura:** agrega a `coverage.include` `src/components/cashconfig/**`, `src/services/cashConfigClient.js` y
    los hooks nuevos.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, datos de prueba, documentación, commits o nombres de archivo. Tampoco símbolos decorativos de terminal pegados en la documentación. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`. Colores solo con variables de `src/styles/main.css`; Poppins, botones
  pastilla, español con tildes. El `grep` de la verificación final sale vacío.
- **Dinero y tasas:**
  - ningún cálculo de dinero en el cliente;
  - los porcentajes se convierten a puntos básicos sin floats;
  - `null` se muestra como "Sin tasa" o "Pendiente", nunca como 0.
- **Seguridad:**
  - todo pasa por `apiClient`;
  - las descripciones de RunFood y las notas del servidor son texto plano;
  - ids y fechas validados antes de construir rutas;
  - nada en `localStorage`;
  - sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- **Accesibilidad:** cada campo con su `label`; errores con `aria-live`; los modales se cierran con Escape y
  devuelven el foco.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50 y sin mutaciones de estado. Hooks
  `usePaymentMappings` y `useCommissionRates` para la lógica de las dos pestañas.
- Sin dependencias nuevas. No toques el motor, las tareas, el chat ni el login, salvo `auth.js` (punto 11).

## Tests

Usa Vitest con Testing Library, con `request` simulado. **Cada test debe fallar si se revierte lo que protege.**
Anota en `docs/RESUMEN-15c.md` al menos **ocho** mutaciones, cada una con el cambio exacto y la **salida real
completa del test que falla**, pegada sin editar ni resumir. Sin símbolos de terminal: reemplázalos por `[ok]`, `[x]`
y `>`. En el 15b la tabla tenía una línea resumida por mutación, y una no coincidía con la salida real. El auditor
repetirá cada una.

1. **Personal:** sin `is_owner`, ni `CashCloseView` ni `CashConfigView` hacen peticiones, **después** de esperar los
   efectos. Mutación: quitar `if (!isOwner) return;` (debe fallar ahora).
2. **`cashConfigClient`:**
   - `bucket = 'sin_mapear'` no se envía, y una cubeta desconocida tampoco;
   - `id` no entero no se envía;
   - `rate_bp` igual a 3001 o con decimales no se envía.

   Mutación: quitar `sin_mapear` de la exclusión.
3. **`percentToBp`:**
   - `"4,48"` da 448, `"2"` da 200, `"0,5"` da 50 y `"30"` da 3000;
   - `"30,01"`, `"-1"`, `"4,485"` y `"abc"` dan `null`;
   - el resultado es siempre un entero.

   Mutación: calcular con `parseFloat(x) * 100` y redondear (debe fallar algún caso de borde que elijas y
   documentes).
4. **Formas de pago:**
   - las sin asignar aparecen primero;
   - "Aceptar sugerencia" llama a `aceptar-sugerencia` y actualiza la fila;
   - cambiar una forma confirmada pide confirmación;
   - "Ignorar" pide su confirmación propia;
   - una descripción `<script>alert(1)</script>` se muestra como texto.
5. **Comisiones:**
   - una tarjeta sin tasa muestra "Sin tasa";
   - "Nueva tasa" envía los puntos básicos correctos y la fecha;
   - un 422 muestra el error por campo;
   - el formulario no viene prellenado con el ejemplo del Libro.
6. **Desde el motivo:** en un día con `falta_comision`, el botón abre "Comisiones"; al volver, se recarga el día.
7. **Volver a evaluar:** solo aparece en días abiertos con snapshot; llama a `reevaluar` y muestra la respuesta, y
   un 409 muestra el mensaje del servidor. Mutación: mostrarlo también en días cerrados.
8. **Guardia:**
   - `ualdo_cash_close_history` en `auth.js` dentro de `removeItem` pasa;
   - el mismo token en un archivo temporal de `src`, o en `auth.js` fuera de `removeItem`, hace fallar la guardia.

   Mutación: ampliar la excepción a todo `src`.
9. **Hooks extraídos:** los tests existentes de `CashMovementsPanel` y `CashCloseReviewForm` siguen en verde, y hay
   tests propios de `useCashClose` y `useCashMovements`.
10. **Regresión:** los 199 tests existentes siguen en verde, sin borrar aserciones.
11. **Cobertura:** `npm run test:coverage` con al menos 80 % de sentencias y de ramas en los archivos del punto 12.
    Pega la tabla por archivo **tal cual**.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/cashconfig src/components/cashclose; echo "exit=$?"
grep -rn "join('_')" src/services/auth.js; echo "exit=$?"
wc -l src/components/cashconfig/*.jsx src/components/cashclose/*.jsx src/hooks/useCash*.js src/hooks/usePaymentMappings.js src/hooks/useCommissionRates.js
git status --short
```

## Criterios de aceptación

- [ ] El dueño asigna formas de pago (o acepta sugerencias) y configura tasas por tarjeta con su vigencia, sin valores por defecto y con historial.
- [ ] Los motivos `formas_sin_mapear` y `falta_comision` llevan directo a la pantalla que los resuelve, y "Volver a evaluar" funciona en días abiertos con snapshot.
- [ ] Los porcentajes viajan como puntos básicos enteros calculados sin floats; `sin_mapear` nunca se envía como destino.
- [ ] Solo el dueño accede; el test del personal ahora detecta la regresión.
- [ ] Existen `useCashClose` y `useCashMovements`; `CashMovementsPanel` y `CashCloseReviewForm` tienen menos de 200 líneas.
- [ ] La guardia tiene una excepción explícita y acotada para la limpieza de `auth.js`, sin rodeos.
- [ ] `docs/RESUMEN-15c.md` tiene al menos ocho mutaciones con su salida real completa y la tabla de cobertura por archivo.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.
