# Brief 19-PWA: ubicaciones, transferencias y conteo de reapertura en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama base `feat/pwa-catalog-release` (Brief 18p_fix en `e898da8`). Crea la rama
`feat/pwa-inventory-locations` desde ahí. **No toques** el motor.

**Por qué.** El motor ya tiene el Brief 19 (commit `71572fd` en `UaldoBusiness`, rama `feat/inventory-locations`):
- stock por ubicación (bodega, cocina y salón);
- transferencias entre ubicaciones;
- conteos físicos por ubicación.

El local está en remodelación y va a reabrir con un **conteo físico por ubicación**, que el dueño hará desde el
teléfono. La app todavía no tiene esas pantallas.

**Problema urgente (corregirlo es el punto 1):**
- `src/components/inventory/MovementModal.jsx:17` arranca con `location = 'bodega'`, y el selector (líneas 145 a 153)
  ofrece `bodega`, `kitchen` y `salon`.
- Desde el Brief 19, el motor **solo acepta** `warehouse`, `kitchen` y `lounge`, y responde **422** a cualquier otro
  valor.
- **Hoy, todo movimiento registrado desde la app con la ubicación por defecto falla.**

**Estado actual de la PWA, verificado por el auditor:**
- **Inventario:**
  - `InventoryView.jsx` (222 líneas) y `inventory/InventoryList.jsx` (230): el listado muestra solo el total
    (`item.stock`).
  - `inventory/MovementModal.jsx` (211) con `hooks/useMovementSubmit.js`: movimiento con idempotencia; este es el
    patrón a reutilizar.
  - `inventory/MovementsHistoryModal.jsx` (180): historial.
  - `hooks/useInventoryList.js` y `services/inventoryClient.js`.
- **Sesión:** `user.capabilities.is_owner` indica si el usuario es el dueño (ver `CashCloseView.jsx`, que ya lo usa).
- **Reglas que ya cumple la app y que se mantienen:**
  - cero emojis;
  - colores solo con variables de `src/styles/main.css`;
  - montos y cantidades como texto validado;
  - sin `alert`, `confirm` ni `dangerouslySetInnerHTML`;
  - guardia `securityGuard.test.js`;
  - cobertura con `coverage.include` en `vite.config.js`.

**Contrato del motor.** Léelo completo en `C:\laragon\www\UaldoBusiness\docs\API-inventory.md`, sección 3.

- **Ubicaciones:** `warehouse` (Bodega), `kitchen` (Cocina) y `lounge` (Salón).
  - `GET /api/v1/inventory/locations` devuelve `{ data: [{ value, label }] }`.
  - Sin ubicación, el motor usa cocina.
- **`GET /api/v1/inventory`:** cada insumo trae `stock_by_location: { warehouse, kitchen, lounge }`, números con
  hasta 3 decimales. `stock` sigue siendo el total.
- **`GET /api/v1/inventory/{item}/stock`:** `{ item_id, total, locations: [{ location, label, quantity }] }`.
- **`POST /api/v1/inventory/{item}/movements`:** igual que antes, con `location` en `warehouse`, `kitchen` o
  `lounge`.
  - Una `salida` responde **409** si **esa ubicación** no tiene stock, aunque otra sí.
  - El `conteo` fija la cantidad **de la ubicación**.
  - Un `client_uuid` ya usado por una transferencia responde 409.
- **Historial** (`GET /api/v1/inventory/{item}/movements`): cada línea trae además `location`,
  `location_balance_after` y `transfer_group`. Los tipos nuevos son `transfer_out`, `transfer_in` y `count`.
- **`POST /api/v1/inventory/transfers`** (cualquier miembro):
  - cuerpo: `{ item_id, from_location, to_location, quantity, reason?, client_uuid? }`, con la cantidad como texto
    (hasta 3 decimales, mayor que 0);
  - respuestas:
    - `201 { status: 'created', transfer_group, out, in, item }`;
    - `200 { status: 'idempotent', ... }`;
    - `409` por stock insuficiente en el origen, o por un `client_uuid` de otro insumo;
    - `404` si el insumo es de otro negocio;
    - `422` por ubicación inválida, origen igual a destino, cantidad inválida o insumo de tipo servicio.
- **Conteos** (`/api/v1/inventory/counts`, **solo el dueño**: el personal recibe 403):
  - `GET /inventory/counts?location=&status=`: paginado de 20, con `data: [conteo]` y `meta`;
  - `POST /inventory/counts { location, notes? }`: 201 con `{ data: conteo }` en borrador (`draft`);
  - `GET /inventory/counts/{id}`: el conteo con sus `lines`;
  - `PUT /inventory/counts/{id}/lines { lines: [{ item_id, counted_quantity, note? }] }`:
    - crea o reemplaza **solo** las líneas enviadas, hasta 500 por petición; acepta coma decimal;
    - un insumo de servicio o de otro negocio responde 422;
  - `POST /inventory/counts/{id}/apply`: fija la cantidad de cada insumo en la ubicación y guarda
    `system_quantity` y `difference`; 422 si no hay líneas o si un insumo ya no se puede contar;
  - `POST /inventory/counts/{id}/cancel`;
  - un conteo aplicado o cancelado responde **409** a cualquier cambio;
  - forma de un conteo:
    `{ id, location, location_label, status, notes, applied_at, cancelled_at, created_at, lines: [{ id, item_id, item_name, unit, counted_quantity, system_quantity, difference, note }] }`;
  - **el conteo es absoluto:** un movimiento hecho entre la carga y la aplicación queda reemplazado.

**Lee primero:**
- `docs/ualdo-brand.md` y `C:\laragon\www\UaldoBusiness\docs\API-inventory.md` (secciones 2.4 y 3);
- `src/components/inventory/MovementModal.jsx`, `src/hooks/useMovementSubmit.js`, `src/services/inventoryClient.js`,
  `src/components/InventoryView.jsx`, `src/components/inventory/InventoryList.jsx`,
  `src/components/inventory/MovementsHistoryModal.jsx` y `src/components/CashCloseView.jsx` (cómo se resuelve el
  dueño);
- `src/services/money.js` (patrón de normalización de texto) y `vite.config.js`.

## Objetivo

Que la app registre movimientos con ubicaciones válidas y muestre el stock por ubicación. Que cualquier miembro
pueda transferir entre ubicaciones. Y que el dueño haga el conteo de reapertura por ubicación desde el teléfono,
guardando el avance en el motor y aplicándolo con confirmación.

## Requerimientos

### Parte A: ubicaciones válidas (urgente)

1. **`src/services/inventoryLocations.js`:**
   - la lista fija `INVENTORY_LOCATIONS = [{ value: 'warehouse', label: 'Bodega' }, { value: 'kitchen', label: 'Cocina' }, { value: 'lounge', label: 'Salón' }]`;
   - `DEFAULT_LOCATION = 'kitchen'`;
   - `isValidLocation(value)`;
   - `locationLabel(value)`, que devuelve "Sin ubicación" para `null` (movimientos anteriores al Brief 19).

   Las etiquetas pueden venir de `GET /inventory/locations` si quieres, pero la lista fija es la base y nunca se
   envía un valor que no esté en ella.
2. **`MovementModal`:**
   - el selector usa esa lista y arranca en **Cocina**;
   - `inventoryClient.registerMovement` rechaza sin hacer la petición una ubicación fuera de la lista;
   - la ayuda bajo el selector explica: "La salida y el conteo se aplican solo a esta ubicación".
3. **Mensajes de error:** un 409 por stock insuficiente muestra el mensaje del servidor, que ya indica la ubicación.

### Parte B: stock por ubicación

4. **`InventoryList`:** bajo el total de cada insumo, una línea compacta con las tres ubicaciones, por ejemplo
   "Bodega 5,75 · Cocina 4,25 · Salón 0", tomada de `stock_by_location`.
   - Con hasta 3 decimales, sin ceros sobrantes y con coma decimal de `es-EC`.
   - Si el campo no viene (un motor anterior), no se muestra la línea.
   - El separador visual es un elemento con estilo, no un carácter decorativo.
5. **Historial (`MovementsHistoryModal`):**
   - la etiqueta de la ubicación de cada línea;
   - "Transferencia (salida)" y "Transferencia (entrada)" para los tipos nuevos, y "Conteo" para `count`;
   - el saldo de la ubicación (`location_balance_after`) junto al saldo total;
   - las dos líneas de una misma transferencia (mismo `transfer_group`) se distinguen visualmente como un par.

### Parte C: transferencias (cualquier miembro)

6. **Cliente** `inventoryClient.transferStock({ itemId, from, to, quantity, reason }, clientUuid)`:
   - valida que `itemId` sea un entero positivo, que las dos ubicaciones estén en la lista y sean distintas, y que la
     cantidad cumpla `^\d{1,7}(\.\d{1,3})?$` y sea mayor que 0 (acepta coma decimal);
   - la cantidad viaja como texto.
7. **`inventory/TransferModal.jsx`**, que se abre desde la tarjeta del insumo con el botón "Transferir":
   - origen (por defecto, Bodega), destino (por defecto, Cocina), cantidad y motivo;
   - muestra la cantidad disponible en el origen (de `stock_by_location`) y **no** permite enviar una cantidad mayor
     (el servidor lo vuelve a validar);
   - origen y destino no pueden ser iguales;
   - la lógica va en el hook `src/hooks/useTransferSubmit.js`, con la misma regla de `client_uuid` que
     `useMovementSubmit`: se genera al abrir, se reutiliza tras un error de red y se renueva tras un 201 o un 200;
   - un 200 idempotente se muestra como "Ya estaba registrada"; un 409 muestra el mensaje del servidor; un 422
     muestra los errores por campo;
   - al terminar, refresca el insumo en el listado.
   - No ofrece "Transferir" para insumos de tipo servicio.

### Parte D: conteo de reapertura (solo el dueño)

8. **Acceso:**
   - en `InventoryView`, para el dueño, un botón "Conteos" que abre `inventory/counts/CountsView.jsx`;
   - el personal no ve el botón y no hace ninguna petición a `/inventory/counts`; el servidor igual responde 403.
9. **Cliente** `src/services/inventoryCountsClient.js`:
   - `listCounts({ location, status, page })`, `createCount(location, notes)` y `getCount(id)`;
   - `saveCountLines(id, lines)`, que divide en tandas de hasta 200 líneas;
   - `applyCount(id)` y `cancelCount(id)`;
   - valida los ids (enteros positivos), las ubicaciones (en la lista) y las cantidades (texto de 0 en adelante, hasta
     3 decimales, acepta coma);
   - todo con `URLSearchParams` para la consulta.
10. **`CountsView`:**
    - lista de conteos con ubicación, estado ("Borrador", "Aplicado", "Cancelado"), fecha y cantidad de líneas, más
      el botón "Nuevo conteo", que pide la ubicación y una nota opcional;
    - los borradores van primero y se abren para seguir contando.
11. **Planilla de conteo** (`inventory/counts/CountSheet.jsx`):
    - **lista todos los insumos activos que no son servicios**: carga todas las páginas de `GET /inventory` en
      segundo plano, mostrando el progreso. Son unos 240 en el local;
    - búsqueda por nombre o código, y orden por categoría y nombre;
    - un campo de cantidad por insumo, con la unidad;
    - **conteo a ciegas por defecto**: no muestra la cantidad del sistema mientras se cuenta. Un interruptor "Ver
      cantidad del sistema" la muestra, sacada de `stock_by_location` de esa ubicación;
    - **guardar el avance** en el motor:
      - con el botón "Guardar avance";
      - y además automáticamente cada 20 líneas modificadas o a los 60 segundos de inactividad, con la pestaña
        visible;
      - solo se envían las líneas cambiadas desde el último guardado;
      - el estado ("Guardado hace 1 min", "Cambios sin guardar") siempre es visible;
    - las cantidades ya guardadas en el motor se cargan al abrir un borrador, de modo que el dueño puede seguir otro
      día o desde otro teléfono;
    - **no guardes cantidades en `localStorage`**: el avance vive en el motor;
    - un insumo en blanco no se envía; un 0 explícito sí (significa "no hay");
    - errores por línea (422 del servidor) junto al insumo.
12. **Aplicar** (`inventory/counts/ApplyCountDialog.jsx`):
    - antes de aplicar, guarda lo pendiente;
    - un resumen con la ubicación, la cantidad de insumos contados y la de **no contados** (que quedan como están),
      más una advertencia en texto: "El conteo es absoluto: reemplaza el stock de esta ubicación por lo contado.
      Aplícalo con el local sin ventas en curso.";
    - confirmación explícita;
    - **tras aplicar**, el detalle muestra por insumo lo contado, lo que tenía el sistema y la diferencia (de la
      respuesta, sin calcular en el cliente), ordenado por la diferencia absoluta, la mayor primero;
    - un 422 indica qué insumo ya no se puede contar, y un 409 explica que el conteo ya estaba cerrado.
13. **Cancelar un borrador**, con confirmación.

### Parte E: guardia y cobertura

14. Agrega a `securityGuard.test.js` los tokens prohibidos `'bodega'` y `'salon'` como valores de ubicación. Para no
    afectar a los textos visibles, la prueba busca solo los literales `value="bodega"`, `value="salon"`,
    `location: 'bodega'` y `location: 'salon'`.
15. Agrega a `coverage.include` los archivos nuevos (`src/services/inventoryLocations.js`,
    `src/services/inventoryCountsClient.js`, `src/components/inventory/TransferModal.jsx`,
    `src/components/inventory/counts/**` y los hooks nuevos).

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, documentación, commits o nombres de archivo. Tampoco símbolos decorativos de terminal pegados en la documentación. Íconos solo en SVG (`lucide-react`).
- **Español con tildes** en la interfaz, los documentos y los mensajes de commit. Antes de entregar, compara las
  líneas con tildes que borraste contra las que agregaste: no quites ninguna.
- **Marca:** sigue `docs/ualdo-brand.md`. Colores solo con variables de `src/styles/main.css`; este `grep` debe salir
  vacío:

  ```
  grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory
  ```
- **Cantidades:**
  - viajan como texto validado, y ninguna se calcula en el cliente: los saldos y las diferencias son los del motor;
  - "Disponible en el origen" es un dato del motor y no una resta;
  - `null` se muestra como "Sin dato", nunca como 0.
- **Seguridad:**
  - todo pasa por `apiClient`;
  - nombres, códigos y notas son texto plano;
  - ids y ubicaciones se validan antes de construir rutas;
  - sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- **Accesibilidad:** cada campo con su `label` (en la planilla, el `label` es el nombre del insumo); errores con
  `aria-live`; los modales se cierran con Escape y devuelven el foco; en la planilla, el teclado numérico del
  teléfono (`inputMode="decimal"`).
- **Rendimiento:**
  - la planilla con unos 240 insumos se mantiene fluida: sin volver a renderizar la lista completa en cada
    pulsación;
  - el guardado automático no se superpone (una sola petición a la vez);
  - todos los temporizadores se limpian.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones de estado, y hooks para
  la lógica: `useTransferSubmit`, `useCounts`, `useCountSheet` y `useApplyCount`.
- Sin dependencias nuevas. No toques el login, el chat, la caja ni Trabajo.

## Tests

Usa Vitest con Testing Library, con `request` simulado y temporizadores falsos donde haga falta. **Cada test debe
fallar si se revierte lo que protege.** Anota en `docs/RESUMEN-19p.md` al menos **diez** mutaciones, cada una con el
cambio exacto y la **salida real completa** del test que falla, sin símbolos de terminal (reemplázalos por `[ok]`,
`[x]` y `>`). El auditor repetirá cada una.

1. **Ubicación de los movimientos:** el `MovementModal` envía `kind`, `quantity` y `location: 'kitchen'` por
   defecto; `bodega` y `salon` no se pueden elegir ni enviar. Mutación: volver a `'bodega'` como valor por defecto.
2. **Stock por ubicación:** la tarjeta muestra las tres cantidades con coma decimal y sin ceros sobrantes; sin
   `stock_by_location` no muestra la línea.
3. **Historial:** las etiquetas de transferencia y conteo, la ubicación, el saldo de la ubicación y el par de una
   transferencia.
4. **Transferencia:**
   - no se envía con origen igual a destino, ni con cantidad mayor que la disponible, ni con 4 decimales;
   - la cantidad viaja como texto ("2,5" se envía como "2.5").
5. **Idempotencia de la transferencia:** el reintento tras un error de red reutiliza el `client_uuid`, y tras un 201
   se renueva. Un 200 muestra "Ya estaba registrada". Mutación: un uuid nuevo en cada envío.
6. **Servicios:** un insumo de servicio no muestra "Transferir".
7. **Personal:** sin `is_owner` no aparece "Conteos" y no hay peticiones a `/inventory/counts`, comprobado después
   de que se asienten los efectos. Mutación: quitar la comprobación.
8. **Planilla:**
   - carga todas las páginas del inventario;
   - el conteo a ciegas oculta la cantidad del sistema hasta activar el interruptor;
   - un insumo en blanco no se envía y un 0 sí;
   - al reabrir un borrador, las cantidades guardadas aparecen cargadas.
9. **Guardado automático** (temporizadores falsos):
   - a las 20 líneas modificadas guarda solo las cambiadas;
   - a los 60 segundos de inactividad guarda;
   - nunca hay dos guardados a la vez;
   - con la pestaña oculta no guarda.

   Mutación: enviar todas las líneas en cada guardado.
10. **Tandas:** 450 líneas se envían en tres peticiones (200, 200 y 50).
11. **Aplicar:**
    - guarda lo pendiente antes de aplicar;
    - muestra la cantidad de no contados y la advertencia del conteo absoluto;
    - tras aplicar, el detalle sale de la respuesta, ordenado por diferencia absoluta;
    - un 409 y un 422 muestran su mensaje.

    Mutación: calcular la diferencia en el cliente.
12. **Texto plano:** un nombre de insumo `<img src=x onerror=alert(1)>` se muestra como texto en la planilla y en el
    detalle.
13. **Guardia:** escribir `location: 'bodega'` en un archivo temporal de `src` hace fallar la guardia; el archivo se
    borra después.
14. **Regresión:** los 277 tests existentes siguen en verde, sin borrar aserciones.
15. **Cobertura:** al menos 80 % de sentencias y de ramas en los archivos nuevos. Pega la tabla por archivo **tal
    cual**.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory; echo "exit=$?"
grep -rnE "value=\"(bodega|salon)\"|location: '(bodega|salon)'" src --include=*.jsx --include=*.js | grep -v __tests__; echo "exit=$?"
wc -l src/components/inventory/*.jsx src/components/inventory/counts/*.jsx src/hooks/useTransferSubmit.js src/hooks/useCounts.js src/hooks/useCountSheet.js src/hooks/useApplyCount.js
git status --short
```

**Prueba manual opcional** contra el motor local, en la rama `feat/inventory-locations`, con el catálogo importado
según el Brief 18:
1. Registra una salida en cocina.
2. Transfiere de bodega a cocina.
3. Crea un conteo de cocina, carga 10 insumos, guarda, cierra la app, vuelve a abrirla y aplica.

Documéntala en el resumen.

## Criterios de aceptación

- [ ] Los movimientos se registran con ubicaciones válidas (cocina por defecto); `bodega` y `salon` ya no se envían, y la guardia lo impide.
- [ ] El listado muestra el stock por ubicación, y el historial muestra la ubicación, el saldo de la ubicación, las transferencias como par y los conteos.
- [ ] Cualquier miembro transfiere entre ubicaciones con idempotencia y validación de lo disponible en el origen.
- [ ] El dueño crea conteos por ubicación y cuenta a ciegas los unos 240 insumos, con guardado automático en el motor que permite seguir otro día; aplica con confirmación y ve las diferencias del motor.
- [ ] El personal no ve los conteos ni hace peticiones a ellos.
- [ ] Nada de cantidades en `localStorage` ni cálculos de cantidades en el cliente.
- [ ] Componentes de menos de 250 líneas; colores solo con variables (el `grep` sale vacío); español con tildes y sin tildes perdidas.
- [ ] `docs/RESUMEN-19p.md` tiene al menos diez mutaciones con su salida real completa y la tabla de cobertura.
- [ ] Cero emojis; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
