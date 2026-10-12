# Resumen del Brief 22p: pedidos internos del personal en la app

Rama `feat/pwa-supply-requests`, creada desde `feat/pwa-purchases` (`9f4ae36`). Construido por Claude a pedido
explícito del dueño del producto (2026-10-10), con tests junto a cada pieza y revisado por el agente
`code-reviewer`. Sin commit hasta la aprobación. Contrato del motor: `UaldoBusiness/docs/API-supply-requests.md`.

## 1. Qué se construyó

- **Cliente** (`src/services/supplyRequestsClient.js`): listar, detalle, crear, decidir, marcar comprado y recibido,
  cancelar y la lista de compras. Valida antes de llamar al motor (ids `^\d+$`, estados, prioridad, cantidades con
  coma hasta 100000 y 3 decimales, longitudes, unidad obligatoria en texto libre, motivo obligatorio al rechazar), con
  las claves de error del motor (`items.N.campo`).
- **Entrada:** pestaña "Pedidos" en Negocios para cualquier miembro. Las pestañas de Negocios pasaron a un componente
  con colores por variables (antes tenían blancos y un fondo `rgba` directos).
- **Personal:** ve solo sus pedidos ("Mis pedidos"); pide insumos del catálogo (búsqueda por nombre o código, sin
  servicios) o en texto libre con unidad, con nota por línea, prioridad "Urgente" y nota general; cancela sus pedidos
  pendientes.
- **Dueño:** ve todos los pedidos (empieza en "Pendientes"); aprueba (nota opcional) o rechaza (motivo obligatorio)
  en un diálogo con el campo de texto; marca comprado y recibido; cancela; y tiene la "Lista de compras" consolidada
  del motor (urgentes primero, cantidad, unidad, stock y mínimo).
- **Avisos:** `pedido` y `pedidos` llevan a Negocios, pestaña Pedidos, y abren el detalle del pedido (antes llevaban
  al Asistente). Cada toque en un aviso es una navegación nueva (`nav`): el mismo aviso tocado dos veces vuelve a
  abrir y recargar el pedido; al usarse, la app limpia los parámetros.
- **Reglas:** el detalle siempre se pide al motor (no se repite el error de compras del Brief 20p); un 409 cierra el
  diálogo, muestra el motivo del motor, recarga el pedido y lleva el foco al título; `client_uuid` al abrir,
  reutilizado tras un error de red y renovado tras un 201 o un 200; el formulario queda montado al cambiar de pestaña
  para no perder lo escrito ni su `client_uuid`.
- **Piezas comunes** reutilizadas con compras: `src/components/common/ConfirmDialog.jsx` (ahora acepta campos dentro
  y el campo que recibe el foco, y asocia el mensaje con `aria-describedby`), `src/components/common/uiStyles.js` y
  `src/hooks/useItemSearch.js`. Los archivos de compras los vuelven a exportar, así que nada de compras cambió de
  comportamiento.

## 2. Verificación

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (47 advertencias anteriores; bajaron de 51 al limpiar `EcosystemView`) |
| `npm test` | 79 archivos, 565 tests en verde |
| `npm run test:coverage` | Todos los archivos nuevos con 80 % o más de sentencias y ramas (tabla abajo) |
| `npm run build:prod` | Correcto |
| `grep` de colores directos en los componentes nuevos y en `EcosystemView` | Sin coincidencias |
| Emojis y tildes | Ninguno; ninguna tilde perdida |

Filas de los archivos del brief, copiadas de la salida de `npm run test:coverage`:

```text
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
  ...ystemView.jsx |   98.75 |    94.44 |   66.66 |   98.75 | 73
 ...ponents/common |     100 |    91.66 |     100 |     100 |
  ...irmDialog.jsx |     100 |    91.66 |     100 |     100 | 7-8,66
  uiStyles.js      |     100 |      100 |     100 |     100 |
 ...supplyRequests |     100 |    97.82 |   98.18 |     100 |
  ...emsEditor.jsx |     100 |    95.65 |   91.66 |     100 | 28,87
  ...ListPanel.jsx |     100 |      100 |     100 |     100 |
  ...estDetail.jsx |     100 |    97.18 |     100 |     100 | 64-67
  ...questForm.jsx |     100 |      100 |     100 |     100 |
  ...questList.jsx |     100 |      100 |     100 |     100 |
  ...uestsView.jsx |     100 |    97.82 |     100 |     100 | 67
  requestUi.js     |     100 |      100 |     100 |     100 |
  ...questItems.js |     100 |    96.87 |     100 |     100 | 42
  useItemSearch.js |     100 |     87.5 |     100 |     100 | 26
  ...lyRequests.js |     100 |    93.42 |     100 |     100 | 42,108,161,180
  ...tionRoutes.js |    94.5 |    80.76 |     100 |    94.5 | 27-28,55-56,89
  ...estsClient.js |     100 |    98.52 |     100 |     100 | 21
```

## 3. Revisión del agente `code-reviewer` y correcciones

No encontró nada CRITICAL ni HIGH. Comprobó contra el código del motor que el contrato se cumple (el índice ya trae
las líneas y el solicitante, las acciones devuelven el pedido completo, las acciones por rol y estado coinciden con
la política del motor y el usuario guardado tiene `id`), y que no se repite el error de compras.

| Hallazgo | Corrección |
|---|---|
| **M1:** el mismo aviso tocado dos veces no hacía nada, y un aviso sobre el pedido ya abierto no lo recargaba | Cada navegación desde un aviso lleva un número propio (`nav`); el detalle se vuelve a montar y se pide otra vez al motor |
| **M2:** el id del aviso quedaba guardado y podía reabrir el pedido al volver a Negocios | Al usar el aviso, la vista lo comunica (`onOpenConsumed`) y la app limpia los parámetros |
| **M3:** funciones de más de 50 líneas en el detalle, la vista y el formulario | Se separaron `RequestSummary`, `RequestItems`, `ActionButtons`, `LoadError`, `RequestsHeader`, `RequestsTabs` y `useRequestItems` |
| **M4:** faltaban tests del aviso repetido, de la limpieza de parámetros y del `client_uuid` al cambiar de pestaña | Tests agregados en `SupplyRequestReviewFixes.test.jsx` |
| **L1:** tras un 409 el foco caía en el cuerpo de la página | El foco va al título del pedido tras recargar |
| **L2:** si la recarga tras un 409 fallaba, el detalle viejo seguía sin aviso | Se muestra "No se pudo cargar el estado actual" sobre el detalle |
| **L4:** un 403 o 404 ofrecía "Reintentar" | Solo se ofrece cuando reintentar puede servir; el 404 dice "El pedido no existe en este negocio." |
| **L5:** el mensaje del diálogo no estaba asociado y Tab podía ir a elementos deshabilitados | `aria-describedby` y Tab solo entre elementos habilitados |
| **L7:** un doble toque en el diálogo podía enviar dos veces | Un ref bloquea la segunda petición en el mismo render |

Sin cambios, por decisión: reintentar con el mismo uuid tras editar devuelve el pedido original (igual que en
movimientos, producción y compras); `parseId` con ids enormes (solo llegan de avisos ya saneados).


## 4. Verificación con el motor real (2026-10-10)

Se probó la app contra UaldoBusiness (`feat/production-runs`, `516b494`), no contra respuestas simuladas. Para no
tocar la base local, el motor corrió con `php artisan serve` (puerto 8010) sobre una **copia** de
`database/database.sqlite` en una carpeta temporal, con las migraciones pendientes aplicadas solo a la copia. La app
corrió con Vite (puerto 5174) y `VITE_API_BASE_URL` apuntando a ese motor, en vista de teléfono (375 x 812). Datos
de prueba creados en la copia: un dueño, una persona del personal ("Rosa Cocina"), tres insumos y un servicio.
`AssistantEvalSeeder` del motor no sirvió: falla porque usa la columna `phone` de `businesses`, que ya no existe
(problema del motor, fuera de este brief).

| Paso | Resultado |
|---|---|
| Personal: buscar "campana" (un servicio) | No aparece; ofrece agregarlo en texto libre |
| Personal: buscar por código "ACE" | Aparece "Aceite vegetal (ACE-01)" |
| Personal: texto libre sin unidad | "Indica la unidad (hasta 20 caracteres)." junto a la línea; no se llama al motor |
| Personal: enviar, urgente, aceite 2,5 litro y "Servilletas de papel" 3 paquete | `POST` 201; el motor guarda `client_uuid`, `quantity: 2.5`, la unidad libre y la prioridad; se abre el detalle |
| Personal: filtro "Pendientes" | `GET ?status=pending`; muestra solo pendientes |
| Personal: cancelar su pedido pendiente | Diálogo propio con foco en "Volver"; `POST /2/cancel` 200; sale de "Pendientes" |
| Personal: pedido del dueño | No aparece en su lista; `GET /supply-requests/3` responde 403 |
| Dueño: aviso "Pedido interno urgente" | Marca el aviso leído y abre el detalle de ese pedido en Negocios, Pedidos |
| Dueño: aprobar con nota | El foco va a la nota y se queda ahí mientras se escribe; queda "Aprobado" con la respuesta del dueño |
| Dueño: lista de compras | Aceite (urgente, stock 4 litro, mínimo 10 litro) y servilletas (fuera del catálogo) |
| Dueño: 409 (el pedido se marcó comprado por fuera y luego se intentó en la app) | Cierra el diálogo, muestra el motivo del motor, recarga el estado ("Comprado") y lleva el foco al título |
| Dueño: marcar recibido | `POST /1/received` 200; queda "Recibido" |
| Dueño: rechazar sin motivo, luego con motivo | Sin motivo: "Indica el motivo del rechazo." y no se llama al motor; con motivo: 200 y "Rechazado" |
| Consola del navegador | Solo el 409 provocado a propósito |
| Ancho | Sin desplazamiento horizontal a 375 px |

La base local del motor no cambió (misma fecha y tamaño) y el repo del motor quedó sin cambios.

**Lo que encontró la prueba y se corrigió:**

| Hallazgo | Corrección |
|---|---|
| El detalle solo mostraba la fecha del pedido; el brief pide también las fechas de la decisión, la compra y la recepción | `RequestDates` muestra "Pedido", "Decisión", "Comprado" y "Recibido", solo las que el motor envió. Probado en el navegador con el pedido 1 |
| La fecha terminaba en "p. m.." porque el código agregaba un punto tras una hora que ya termina en punto | La fecha ya no va en la línea del estado |

Dos tests nuevos en `SupplyRequestEdgeCases.test.jsx` (mutaciones 31 y 32).

**Observaciones sin cambio (LOW):**

- Al volver del detalle, la lista no se pide de nuevo al motor: muestra lo que ya tenía, actualizado con lo hecho en
  la app. Un pedido creado desde otro teléfono aparece al cambiar el filtro o al volver a entrar a Pedidos.
- Con cuatro pestañas en Negocios, "Caja & POS" se parte en tres líneas a 375 px.

## 5. Incidente: una mutación quedó aplicada

La primera corrida de mutaciones (sesión anterior) se interrumpió con la mutación 27 aplicada: quitaba
`initialFocusRef` del diálogo del detalle, y dejó el candado del script. Por eso dos tests fallaban al retomar
("rejects with a required reason in the dialog" y "typing the reason never moves the focus to the button behind the
dialog"): no era un error del código entregado. Se restauró la línea original
(`initialFocusRef={config?.note ? noteRef : undefined}`), se comprobó con el script de control que ninguna otra
mutación seguía aplicada y se repitió la corrida completa.

## 6. Mutaciones

Cada mutación se aplicó con un script, se ejecutaron los tests indicados y se restauró el archivo; al terminar, el
script de control confirmó que el texto original de cada mutación está en el repo. Las salidas son las reales de esa
ejecución (2026-10-10), sin editar salvo los símbolos de terminal (`[ok]`, `[x]` y `>`). Resultado:
**32 de 32 detectadas**. Las mutaciones 13 y 28 no se detectaban en la primera corrida; los tests de
`SupplyRequestReviewFixes.test.jsx` las cubren ahora.

### Mutación 1: Aceptar cantidades sobre 100000

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `return number > 0 && number <= MAX_QUANTITY ? value : null;`
- **Mutado:** `return number > 0 ? value : null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 1 failed) 15ms
   [x] supplyRequestsClient > normalizes quantities: comma, positive, up to 100000 and 3 decimals 7ms
     > expected '100000.001' to be null

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:13:26
   Duration  2.08s (transform 69ms, setup 234ms, collect 63ms, tests 15ms, environment 1.24s, prepare 152ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > normalizes quantities: comma, positive, up to 100000 and 3 decimals
AssertionError: expected '100000.001' to be null

- Expected: 
null

+ Received: 
"100000.001"

 > src/services/__tests__/supplyRequestsClient.test.js:27:117
     25|     expect(normalizeRequestQuantity(' 2,5 ')).toBe('2.5');
     26|     expect(normalizeRequestQuantity('100000')).toBe('100000');
     27|     ['0', '100000.001', '1.2345', '-1', 'abc', '', null].forEach((valu…
       |                                                                                                                     ^
     28|   });
     29| 
 > src/services/__tests__/supplyRequestsClient.test.js:27:58

------------------------[1/1]-
```

### Mutación 2: Ids como 1e2 pasan la validación

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `if (!/^\d+$/.test(String(value ?? '').trim())) return null;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 2 failed) 18ms
   [x] supplyRequestsClient > decides with a required reason to reject 8ms
     > expected 200 to be 400 // Object.is equality
   [x] supplyRequestsClient > runs the transitions with validated ids 1ms
     > expected 200 to be 400 // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
   Start at  12:13:30
   Duration  2.22s (transform 70ms, setup 251ms, collect 64ms, tests 18ms, environment 1.32s, prepare 153ms)

------- Failed Tests 2 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > decides with a required reason to reject
AssertionError: expected 200 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 200

 > src/services/__tests__/supplyRequestsClient.test.js:93:60
     91|     expect((await decideRequest(9, 'otra', 'x')).status).toBe(422);
     92|     expect((await decideRequest(9, 'approved', 'x'.repeat(501))).statu…
     93|     expect((await decideRequest('9x', 'approved')).status).toBe(400);
       |                                                            ^
     94|     expect(spy).not.toHaveBeenCalled();
     95| 

------------------------[1/2]-

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > runs the transitions with validated ids
AssertionError: expected 200 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 200

 > src/services/__tests__/supplyRequestsClient.test.js:114:40
    112|     spy.mockClear();
    113|     for (const fn of [getRequest, markPurchased, markReceived, cancelR…
    114|       expect((await fn('1e2')).status).toBe(400);
       |                                        ^
    115|     }
    116|     expect(spy).not.toHaveBeenCalled();

------------------------[2/2]-
```

### Mutación 3: Texto libre sin unidad

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `if (!unit || unit.length > 20)`
- **Mutado:** `if (unit.length > 20)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 1 failed) 19ms
   [x] supplyRequestsClient > reports errors with the engine keys and does not call it 10ms
     > expected [ 'items.0.quantity', …(4) ] to deeply equal [ 'items.0.quantity', …(5) ]

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:13:34
   Duration  2.39s (transform 84ms, setup 259ms, collect 72ms, tests 19ms, environment 1.43s, prepare 178ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > reports errors with the engine keys and does not call it
AssertionError: expected [ 'items.0.quantity', …(4) ] to deeply equal [ 'items.0.quantity', …(5) ]

- Expected
+ Received

  Array [
    "items.0.quantity",
    "items.1.free_text_name",
-   "items.1.unit",
    "items.2.note",
    "items.2.unit",
    "note",
  ]

 > src/services/__tests__/supplyRequestsClient.test.js:75:49
     73|     }, 'uuid');
     74|     expect(res.status).toBe(422);
     75|     expect(Object.keys(res.data.errors).sort()).toEqual([
       |                                                 ^
     76|       'items.0.quantity', 'items.1.free_text_name', 'items.1.unit', 'i…
     77|     ]);

------------------------[1/1]-
```

### Mutación 4: Rechazar sin motivo

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `if (decision === 'rejected' && !text)`
- **Mutado:** `if (false)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 1 failed) 15ms
   [x] supplyRequestsClient > decides with a required reason to reject 6ms
     > Cannot read properties of undefined (reading 'note')

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:13:39
   Duration  2.23s (transform 78ms, setup 244ms, collect 65ms, tests 15ms, environment 1.37s, prepare 169ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > decides with a required reason to reject
TypeError: Cannot read properties of undefined (reading 'note')
 > src/services/__tests__/supplyRequestsClient.test.js:90:67
     88| 
     89|   it('decides with a required reason to reject', async () => {
     90|     expect((await decideRequest(9, 'rejected', '  ')).data.errors.note…
       |                                                                   ^
     91|     expect((await decideRequest(9, 'otra', 'x')).status).toBe(422);
     92|     expect((await decideRequest(9, 'approved', 'x'.repeat(501))).statu…

------------------------[1/1]-
```

### Mutación 5: Pedidos de más de 30 líneas

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `if (items.length > MAX_ITEMS)`
- **Mutado:** `if (false)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 1 failed) 17ms
   [x] supplyRequestsClient > requires between 1 and 30 items and defaults the priority to normal 7ms
     > Cannot read properties of undefined (reading '0')

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:13:43
   Duration  2.24s (transform 82ms, setup 254ms, collect 71ms, tests 17ms, environment 1.32s, prepare 166ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > requires between 1 and 30 items and defaults the priority to normal
TypeError: Cannot read properties of undefined (reading '0')
 > src/services/__tests__/supplyRequestsClient.test.js:85:58
     83|     expect(buildRequestBody({}).errors.items).toBeDefined();
     84|     const many = Array.from({ length: 31 }, (_, i) => ({ inventory_ite…
     85|     expect(buildRequestBody({ items: many }).errors.items[0]).toContai…
       |                                                          ^
     86|     expect(buildRequestBody({ items: [{ inventory_item_id: 1, quantity…
     87|   });

------------------------[1/1]-
```

### Mutación 6: Estado del filtro sin validar

- **Archivo:** `src/services/supplyRequestsClient.js`
- **Original:** `if (REQUEST_STATUSES.includes(status))`
- **Mutado:** `if (status)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/supplyRequestsClient.test.js (7 tests | 1 failed) 19ms
   [x] supplyRequestsClient > lists with valid filters only 11ms
     > expected last "request" call to have been called with [ '/supply-requests' ]

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:13:47
   Duration  2.24s (transform 76ms, setup 248ms, collect 64ms, tests 19ms, environment 1.32s, prepare 187ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/supplyRequestsClient.test.js > supplyRequestsClient > lists with valid filters only
AssertionError: expected last "request" call to have been called with [ '/supply-requests' ]

- Expected
+ Received

  Array [
-   "/supply-requests",
+   "/supply-requests?status=otro",
  ]

 > src/services/__tests__/supplyRequestsClient.test.js:36:17
     34|     expect(spy).toHaveBeenLastCalledWith('/supply-requests?status=pend…
     35|     await listRequests({ status: 'otro', page: 1 });
     36|     expect(spy).toHaveBeenLastCalledWith('/supply-requests');
       |                 ^
     37|     await getShoppingList();
     38|     expect(spy).toHaveBeenLastCalledWith('/supply-requests/shopping-li…

------------------------[1/1]-
```

### Mutación 7: No renovar el client_uuid tras un 201

- **Archivo:** `src/hooks/useSupplyRequests.js`
- **Original:** `uuidRef.current = generateClientUuid(); if (onCreated)`
- **Mutado:** `if (onCreated)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 1 failed) 186ms
   [x] useSupplyRequestForm > reuses the client_uuid after a network error and renews it after a 201 24ms
     > expected 'd2da1a34-1c3a-444a-a3d7-91e4caa8a74a' not to be 'd2da1a34-1c3a-444a-a3d7-91e4caa8a74a' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
   Start at  12:13:51
   Duration  2.47s (transform 105ms, setup 239ms, collect 124ms, tests 186ms, environment 1.32s, prepare 189ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected 'd2da1a34-1c3a-444a-a3d7-91e4caa8a74a' not to be 'd2da1a34-1c3a-444a-a3d7-91e4caa8a74a' // Object.is equality
 > src/hooks/__tests__/supplyRequestHooks.test.js:60:26
     58|     const uuids = spy.mock.calls.map((call) => call[1]);
     59|     expect(uuids[1]).toBe(uuids[0]);
     60|     expect(uuids[2]).not.toBe(uuids[0]);
       |                          ^
     61|     expect(spy.mock.calls[0][0]).toEqual({ priority: 'urgent', note: '…
     62|     expect(onCreated).toHaveBeenNthCalledWith(1, pendingRequest, false…

------------------------[1/1]-
```

### Mutación 8: uuid nuevo en cada envío

- **Archivo:** `src/hooks/useSupplyRequests.js`
- **Original:** `const res = await createRequest(`
- **Mutado:** `uuidRef.current = generateClientUuid();
    const res = await createRequest(`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 1 failed) 202ms
   [x] useSupplyRequestForm > reuses the client_uuid after a network error and renews it after a 201 26ms
     > expected '4204c4ef-2d83-4954-932f-38d79093c40e' to be 'cccfb95a-16a3-402b-a57d-da3e20f5d7b0' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
   Start at  12:13:56
   Duration  2.51s (transform 99ms, setup 264ms, collect 127ms, tests 202ms, environment 1.36s, prepare 149ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected '4204c4ef-2d83-4954-932f-38d79093c40e' to be 'cccfb95a-16a3-402b-a57d-da3e20f5d7b0' // Object.is equality

Expected: "cccfb95a-16a3-402b-a57d-da3e20f5d7b0"
Received: "4204c4ef-2d83-4954-932f-38d79093c40e"

 > src/hooks/__tests__/supplyRequestHooks.test.js:59:22
     57| 
     58|     const uuids = spy.mock.calls.map((call) => call[1]);
     59|     expect(uuids[1]).toBe(uuids[0]);
       |                      ^
     60|     expect(uuids[2]).not.toBe(uuids[0]);
     61|     expect(spy.mock.calls[0][0]).toEqual({ priority: 'urgent', note: '…

------------------------[1/1]-
```

### Mutación 9: Errores de línea sin traducir la posición

- **Archivo:** `src/hooks/supplyRequestItems.js`
- **Original:** `const line = match ? items[Number(match[1])] : null;`
- **Mutado:** `const line = null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 2 failed) 213ms
   [x] supplyRequestItems > maps engine errors to the item sent at that position 15ms
     > expected undefined to deeply equal { Object (name, unit) }
   [x] useSupplyRequestForm > puts 422 errors next to each item and clears an item error when edited 7ms
     > Cannot read properties of undefined (reading 'name')
 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 642ms
   [ok] SupplyRequestForm > shows the general items error and the note error 349ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 779ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2302ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 946ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 700ms

 Test Files  1 failed | 3 passed (4)
      Tests  2 failed | 31 passed (33)
   Start at  12:14:00
   Duration  6.15s (transform 1.22s, setup 2.03s, collect 2.54s, tests 3.94s, environment 9.17s, prepare 873ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > supplyRequestItems > maps engine errors to the item sent at that position
AssertionError: expected undefined to deeply equal { Object (name, unit) }

- Expected: 
Object {
  "name": "Escribe qué necesitas.",
  "unit": "Indica la unidad.",
}

+ Received: 
undefined

 > src/hooks/__tests__/supplyRequestHooks.test.js:35:37
     33|       note: ['Muy larga.'],
     34|     }, items);
     35|     expect(mapped.byItem['free:1']).toEqual({ name: 'Escribe qué neces…
       |                                     ^
     36|     expect(mapped.byItem['cat:42']).toEqual({ inventory_item_id: 'El i…
     37|     expect(mapped.general).toEqual({ items: 'Sin línea.', note: 'Muy l…

------------------------[1/2]-

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestForm > puts 422 errors next to each item and clears an item error when edited
TypeError: Cannot read properties of undefined (reading 'name')
 > src/hooks/__tests__/supplyRequestHooks.test.js:74:48
     72|     await act(async () => { await result.current.submit(); });
     73| 
     74|     expect(result.current.itemErrors['free:1'].name).toBe('Escribe qué…
       |                                                ^
     75|     expect(result.current.errors.items).toBe('Agrega al menos un insum…
     76|     act(() => { result.current.change('free:1', 'name', 'Esponjas'); }…

------------------------[2/2]-
```

### Mutación 10: Error del nombre libre en otro campo

- **Archivo:** `src/hooks/supplyRequestItems.js`
- **Original:** `match[2] === 'free_text_name' ? 'name' : match[2]`
- **Mutado:** `match[2]`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 2 failed) 186ms
   [x] supplyRequestItems > maps engine errors to the item sent at that position 10ms
     > expected { …(2) } to deeply equal { Object (name, unit) }
   [x] useSupplyRequestForm > puts 422 errors next to each item and clears an item error when edited 4ms
     > expected undefined to be 'Escribe qué necesitas.' // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
   Start at  12:14:08
   Duration  2.49s (transform 98ms, setup 241ms, collect 117ms, tests 186ms, environment 1.33s, prepare 149ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > supplyRequestItems > maps engine errors to the item sent at that position
AssertionError: expected { …(2) } to deeply equal { Object (name, unit) }

- Expected
+ Received

  Object {
-   "name": "Escribe qué necesitas.",
+   "free_text_name": "Escribe qué necesitas.",
    "unit": "Indica la unidad.",
  }

 > src/hooks/__tests__/supplyRequestHooks.test.js:35:37
     33|       note: ['Muy larga.'],
     34|     }, items);
     35|     expect(mapped.byItem['free:1']).toEqual({ name: 'Escribe qué neces…
       |                                     ^
     36|     expect(mapped.byItem['cat:42']).toEqual({ inventory_item_id: 'El i…
     37|     expect(mapped.general).toEqual({ items: 'Sin línea.', note: 'Muy l…

------------------------[1/2]-

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestForm > puts 422 errors next to each item and clears an item error when edited
AssertionError: expected undefined to be 'Escribe qué necesitas.' // Object.is equality

- Expected: 
"Escribe qué necesitas."

+ Received: 
undefined

 > src/hooks/__tests__/supplyRequestHooks.test.js:74:54
     72|     await act(async () => { await result.current.submit(); });
     73| 
     74|     expect(result.current.itemErrors['free:1'].name).toBe('Escribe qué…
       |                                                      ^
     75|     expect(result.current.errors.items).toBe('Agrega al menos un insum…
     76|     act(() => { result.current.change('free:1', 'name', 'Esponjas'); }…

------------------------[2/2]-
```

### Mutación 11: Agregar el mismo insumo dos veces

- **Archivo:** `src/hooks/supplyRequestItems.js`
- **Original:** `if (!item?.id || items.some((line) => line.key === catalogKey(item.id))) return items;`
- **Mutado:** `if (!item?.id) return items;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 1 failed) 203ms
   [x] supplyRequestItems > adds catalog items once and free items with their own key, and builds the payload 11ms
     > expected [ 'cat:42', 'cat:42', 'free:1' ] to deeply equal [ 'cat:42', 'free:1' ]

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
   Start at  12:14:13
   Duration  2.51s (transform 98ms, setup 246ms, collect 120ms, tests 203ms, environment 1.33s, prepare 160ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > supplyRequestItems > adds catalog items once and free items with their own key, and builds the payload
AssertionError: expected [ 'cat:42', 'cat:42', 'free:1' ] to deeply equal [ 'cat:42', 'free:1' ]

- Expected
+ Received

  Array [
    "cat:42",
+   "cat:42",
    "free:1",
  ]

 > src/hooks/__tests__/supplyRequestHooks.test.js:14:37
     12|     items = addCatalogItem(items, null);
     13|     items = addFreeItem(items, 1);
     14|     expect(items.map((i) => i.key)).toEqual(['cat:42', 'free:1']);
       |                                     ^
     15| 
     16|     items = updateItem(items, 'cat:42', 'quantity', '5');

------------------------[1/1]-
```

### Mutación 12: Cualquier miembro cancela un pedido ajeno

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `Number(request.requested_by) === Number(userId)`
- **Mutado:** `true`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 515ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 737ms
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 2148ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 819ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 709ms
   [x] SupplyRequestsView for staff > another member sees no actions on a request that is not theirs 52ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
  type="button"
>
  Cancelar
</button> instead

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:14:17
   Duration  5.36s (transform 842ms, setup 1.11s, collect 1.91s, tests 3.40s, environment 5.62s, prepare 589ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for staff > another member sees no actions on a request that is not theirs
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
  type="button"
>
  Cancelar
</button> instead
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:96:68
     94|     fireEvent.click(await screen.findByText('Rosa, 2 insumos'));
     95|     await screen.findByText('Pedido de Rosa');
     96|     expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toB…
       |                                                                    ^
     97|   });
     98| 

------------------------[1/1]-
```

### Mutación 13: El dueño no puede cancelar un aprobado

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `if (request.status === 'approved') return ['purchased', 'cancel'];`
- **Mutado:** `if (request.status === 'approved') return ['purchased'];`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 542ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 823ms
   [x] Brief 22p review fixes > the owner cancels an approved request 122ms
     > Unable to find an accessible element with the role "button" and name "Cancelar"

Here are the accessible roles:

  heading:

  Name "Pedidos internos":
  <h2
    class="section-title"
    style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
  />

  Name "Pedido de Rosa":
  <h3
    style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
    tabindex="-1"
  />

  --------------------------------------------------
  tablist:

  Name "Secciones de pedidos":
  <div
    aria-label="Secciones de pedidos"
    role="tablist"
    style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
  />

  --------------------------------------------------
  tab:

  Name "Pedidos":
  <button
    aria-selected="true"
    role="tab"
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Lista de compras":
  <button
    aria-selected="false"
    role="tab"
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  --------------------------------------------------
  status:

  Name "":
  <div
    aria-live="polite"
    role="status"
  />

  --------------------------------------------------
  tabpanel:

  Name "":
  <div
    role="tabpanel"
  />

  --------------------------------------------------
  button:

  Name "Volver a pedidos":
  <button
    style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
    type="button"
  />

  Name "Marcar comprado":
  <button
    class="btn-primary"
    style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
    type="button"
  />

  --------------------------------------------------
  paragraph:

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
  />

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
  />

  --------------------------------------------------
  term:

  Name "":
  <dt
    style="font-weight: 600;"
  />

  --------------------------------------------------
  definition:

  Name "":
  <dd
    style="margin: 0px;"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Pedidos internos
        </span>
      </h2>
      <div
        aria-label="Secciones de pedidos"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-selected="true"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Pedidos
        </button>
        <button
          aria-selected="false"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Lista de compras
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Aprobado
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
              type="button"
            >
              Marcar comprado
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2208ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 843ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 725ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:14:24
   Duration  5.52s (transform 966ms, setup 1.11s, collect 2.08s, tests 3.57s, environment 5.78s, prepare 629ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > the owner cancels an approved request
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Cancelar"

Here are the accessible roles:

  heading:

  Name "Pedidos internos":
  <h2
    class="section-title"
    style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
  />

  Name "Pedido de Rosa":
  <h3
    style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
    tabindex="-1"
  />

  --------------------------------------------------
  tablist:

  Name "Secciones de pedidos":
  <div
    aria-label="Secciones de pedidos"
    role="tablist"
    style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
  />

  --------------------------------------------------
  tab:

  Name "Pedidos":
  <button
    aria-selected="true"
    role="tab"
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Lista de compras":
  <button
    aria-selected="false"
    role="tab"
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  --------------------------------------------------
  status:

  Name "":
  <div
    aria-live="polite"
    role="status"
  />

  --------------------------------------------------
  tabpanel:

  Name "":
  <div
    role="tabpanel"
  />

  --------------------------------------------------
  button:

  Name "Volver a pedidos":
  <button
    style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
    type="button"
  />

  Name "Marcar comprado":
  <button
    class="btn-primary"
    style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
    type="button"
  />

  --------------------------------------------------
  paragraph:

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
  />

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
  />

  --------------------------------------------------
  term:

  Name "":
  <dt
    style="font-weight: 600;"
  />

  --------------------------------------------------
  definition:

  Name "":
  <dd
    style="margin: 0px;"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Pedidos internos
        </span>
      </h2>
      <div
        aria-label="Secciones de pedidos"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-selected="true"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Pedidos
        </button>
        <button
          aria-selected="false"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Lista de compras
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Aprobado
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
              type="button"
            >
              Marcar comprado
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:94:28
     92|     await screen.findByText('Pedido de Rosa');
     93|     expect(screen.getByRole('button', { name: 'Marcar comprado' })).to…
     94|     fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
       |                            ^
     95|     fireEvent.click(dialog().getByRole('button', { name: 'Cancelar ped…
     96|     await waitFor(() => expect(screen.getByText('Pedido cancelado.')).…

------------------------[1/1]-
```

### Mutación 14: No recargar tras un 409

- **Archivo:** `src/hooks/useSupplyRequests.js`
- **Original:** `if (res.status === 409 && onStale) onStale();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 1 failed) 217ms
   [x] useSupplyRequestDetail and useSupplyRequestActions > runs each action, reports the reason error and reloads after a 409 15ms
     > expected "spy" to be called 1 times, but got 0 times
 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 614ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 1685ms
   [x] Brief 22p review fixes > L1 and L2: after a 409 the focus goes to the heading, and a failed reload is reported 1094ms
     > Unable to find an element with the text: No se pudo cargar el estado actual: Sin conexión. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Pedidos internos
        </span>
      </h2>
      <div
        aria-label="Secciones de pedidos"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-selected="true"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Pedidos
        </button>
        <button
          aria-selected="false"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Lista de compras
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
              type="button"
            >
              Aprobar
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Rechazar
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
          <div
            style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
          >
            <div
              aria-describedby="confirm-dialog-message"
              aria-labelledby="confirm-dialog-title"
              aria-modal="true"
              class="glass-card"
              role="dialog"
              style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
            >
              <h3
                id="confirm-dialog-title"
                style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
              >
                Aprobar pedido
              </h3>
              <div
                style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
              >
                <svg
                  class="lucide lucide-triangle-alert"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  style="flex-shrink: 0; margin-top: 1px;"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                  />
                  <path
                    d="M12 9v4"
                  />
                  <path
                    d="M12 17h.01"
                  />
                </svg>
                <span
                  id="confirm-dialog-message"
                >
                  El pedido pasa a la lista de compras.
                </span>
              </div>
              <div>
                <label
                  for="request-decision-note"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Nota para quien pidió (opcional)
                </label>
                <textarea
                  id="request-decision-note"
                  maxlength="500"
                  rows="3"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                />
              </div>
              <div
                aria-live="polite"
                style="font-size: 12px; color: var(--error);"
              >
                El pedido ya no está pendiente.
              </div>
              <div
                style="display: flex; gap: 10px;"
              >
                <button
                  aria-disabled="false"
                  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                  type="button"
                >
                  Volver
                </button>
                <button
                  aria-disabled="false"
                  class="btn-primary"
                  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                  type="button"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
                type="button"
              >
                Aprobar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Rechazar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  El pedido ya no está pendiente.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 3249ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 929ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 710ms
   [x] SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason 1065ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  aria-describedby="confirm-dialog-message"
  aria-labelledby="confirm-dialog-title"
  aria-modal="true"
  class="glass-card"
  role="dialog"
  style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
>
  <h3
    id="confirm-dialog-title"
    style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
  >
    Aprobar pedido
  </h3>
  <div
    style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
  >
    <svg
      class="lucide lucide-triangle-alert"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      style="flex-shrink: 0; margin-top: 1px;"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      />
      <path
        d="M12 9v4"
      />
      <path
        d="M12 17h.01"
      />
    </svg>
    <span
      id="confirm-dialog-message"
    >
      El pedido pasa a la lista de compras.
    </span>
  </div>
  <div>
    <label
      for="request-decision-note"
      style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
    >
      Nota para quien pidió (opcional)
    </label>
    <textarea
      id="request-decision-note"
      maxlength="500"
      rows="3"
      style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
    />
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  >
    No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
  </div>
  <div
    style="display: flex; gap: 10px;"
  >
    <button
      aria-disabled="false"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
      type="button"
    >
      Volver
    </button>
    <button
      aria-disabled="false"
      class="btn-primary"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
      type="button"
    >
      Aprobar
    </button>
  </div>
</div> instead

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
                type="button"
              >
                Aprobar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Rechazar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  3 failed | 1 passed (4)
      Tests  3 failed | 30 passed (33)
   Start at  12:14:32
   Duration  7.02s (transform 1.38s, setup 1.82s, collect 2.66s, tests 5.76s, environment 8.82s, prepare 873ms)

------- Failed Tests 3 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestDetail and useSupplyRequestActions > runs each action, reports the reason error and reloads after a 409
AssertionError: expected "spy" to be called 1 times, but got 0 times
 > src/hooks/__tests__/supplyRequestHooks.test.js:119:21
    117|     await act(async () => { await result.current.run('purchased'); });
    118|     expect(result.current.error).toContain("de 'pending' a 'purchased'…
    119|     expect(onStale).toHaveBeenCalledTimes(1);
       |                     ^
    120|     await act(async () => { await result.current.run('received'); });
    121|     expect(result.current.error).toBe('El pedido cambió de estado: se …

------------------------[1/3]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > L1 and L2: after a 409 the focus goes to the heading, and a failed reload is reported
TestingLibraryElementError: Unable to find an element with the text: No se pudo cargar el estado actual: Sin conexión. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Pedidos internos
        </span>
      </h2>
      <div
        aria-label="Secciones de pedidos"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-selected="true"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Pedidos
        </button>
        <button
          aria-selected="false"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Lista de compras
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
              type="button"
            >
              Aprobar
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Rechazar
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
          <div
            style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
          >
            <div
              aria-describedby="confirm-dialog-message"
              aria-labelledby="confirm-dialog-title"
              aria-modal="true"
              class="glass-card"
              role="dialog"
              style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
            >
              <h3
                id="confirm-dialog-title"
                style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
              >
                Aprobar pedido
              </h3>
              <div
                style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
              >
                <svg
                  class="lucide lucide-triangle-alert"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  style="flex-shrink: 0; margin-top: 1px;"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                  />
                  <path
                    d="M12 9v4"
                  />
                  <path
                    d="M12 17h.01"
                  />
                </svg>
                <span
                  id="confirm-dialog-message"
                >
                  El pedido pasa a la lista de compras.
                </span>
              </div>
              <div>
                <label
                  for="request-decision-note"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Nota para quien pidió (opcional)
                </label>
                <textarea
                  id="request-decision-note"
                  maxlength="500"
                  rows="3"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                />
              </div>
              <div
                aria-live="polite"
                style="font-size: 12px; color: var(--error);"
              >
                El pedido ya no está pendiente.
              </div>
              <div
                style="display: flex; gap: 10px;"
              >
                <button
                  aria-disabled="false"
                  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                  type="button"
                >
                  Volver
                </button>
                <button
                  aria-disabled="false"
                  class="btn-primary"
                  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                  type="button"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
                type="button"
              >
                Aprobar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Rechazar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  El pedido ya no está pendiente.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:83:11
     81|     fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
     82|     fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
     83|     await waitFor(() => expect(screen.getByText('No se pudo cargar el …
       |           ^
     84|     expect(screen.getByText('El pedido ya no está pendiente.')).toBeIn…
     85|     expect(screen.getByRole('heading', { name: 'Pedido de Rosa' })).to…

------------------------[2/3]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  aria-describedby="confirm-dialog-message"
  aria-labelledby="confirm-dialog-title"
  aria-modal="true"
  class="glass-card"
  role="dialog"
  style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
>
  <h3
    id="confirm-dialog-title"
    style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
  >
    Aprobar pedido
  </h3>
  <div
    style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
  >
    <svg
      class="lucide lucide-triangle-alert"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      style="flex-shrink: 0; margin-top: 1px;"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      />
      <path
        d="M12 9v4"
      />
      <path
        d="M12 17h.01"
      />
    </svg>
    <span
      id="confirm-dialog-message"
    >
      El pedido pasa a la lista de compras.
    </span>
  </div>
  <div>
    <label
      for="request-decision-note"
      style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
    >
      Nota para quien pidió (opcional)
    </label>
    <textarea
      id="request-decision-note"
      maxlength="500"
      rows="3"
      style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
    />
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  >
    No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
  </div>
  <div
    style="display: flex; gap: 10px;"
  >
    <button
      aria-disabled="false"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
      type="button"
    >
      Volver
    </button>
    <button
      aria-disabled="false"
      class="btn-primary"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
      type="button"
    >
      Aprobar
    </button>
  </div>
</div> instead

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
                type="button"
              >
                Aprobar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Rechazar
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:177:66
    175|     fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    176|     fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
    177|     await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeI…
       |                                                                  ^
    178|     await waitFor(() => expect(screen.getByText(/Cancelado./)).toBeInT…
    179|     expect(screen.getByText("No es posible cambiar el estado del pedid…
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[3/3]-
```

### Mutación 15: Doble toque envía dos veces (revisión)

- **Archivo:** `src/hooks/useSupplyRequests.js`
- **Original:** `if (busyRef.current) return false;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 544ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 766ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2205ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 860ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 710ms
 > src/hooks/__tests__/supplyRequestHooks.test.js (8 tests | 2 failed) 6171ms
   [x] useSupplyRequestDetail and useSupplyRequestActions > approves with an optional note and ignores a second action while one is running 5019ms
     > Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
   [x] useSupplyRequestDetail and useSupplyRequestActions > loads the shopping list and reports errors 1029ms
     > Cannot read properties of null (reading 'error')

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div />
  </body>
</html>

 Test Files  1 failed | 3 passed (4)
      Tests  2 failed | 31 passed (33)
   Start at  12:14:41
   Duration  9.69s (transform 1.06s, setup 1.81s, collect 2.34s, tests 9.69s, environment 8.68s, prepare 848ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestDetail and useSupplyRequestActions > approves with an optional note and ignores a second action while one is running
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
------------------------[1/2]-

 FAIL  src/hooks/__tests__/supplyRequestHooks.test.js > useSupplyRequestDetail and useSupplyRequestActions > loads the shopping list and reports errors
TypeError: Cannot read properties of null (reading 'error')

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div />
  </body>
</html>
 > src/hooks/__tests__/supplyRequestHooks.test.js:145:47
    143|       .mockResolvedValueOnce({ ok: true, data: { data: shoppingList } …
    144|     const { result } = renderHook(() => useShoppingList());
    145|     await waitFor(() => expect(result.current.error).toBe('No se pudo …
       |                                               ^
    146|     await act(async () => { await result.current.reload(); });
    147|     expect(result.current.items).toEqual(shoppingList);
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[2/2]-
```

### Mutación 16: Reintentar en un 403 o 404 (revisión)

- **Archivo:** `src/hooks/useSupplyRequests.js`
- **Original:** `setRetryable(res.status !== 403 && res.status !== 404);`
- **Mutado:** `setRetryable(true);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests | 1 failed) 474ms
   [x] ShoppingListPanel and SupplyRequestDetail errors > shows a detail loading error with retry and goes back 30ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
  type="button"
>
  Reintentar
</button> instead
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 694ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2164ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 834ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 705ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:14:53
   Duration  5.34s (transform 967ms, setup 1.03s, collect 2.05s, tests 3.33s, environment 5.53s, prepare 558ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx > ShoppingListPanel and SupplyRequestDetail errors > shows a detail loading error with retry and goes back
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
  type="button"
>
  Reintentar
</button> instead
 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx:95:50
     93|     const first = render(<SupplyRequestDetail requestId={101} isOwner=…
     94|     await waitFor(() => expect(screen.getByText('Solo el dueño o quien…
     95|     expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
       |                                                  ^
     96|     fireEvent.click(screen.getByText('Volver a pedidos'));
     97|     expect(onBack).toHaveBeenCalled();

------------------------[1/1]-
```

### Mutación 17: Diálogo abierto tras un 409

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `setDialog(null); await onStale();`
- **Mutado:** `await onStale();`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 509ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 758ms
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 3203ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 847ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 723ms
   [x] SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason 1084ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  aria-describedby="confirm-dialog-message"
  aria-labelledby="confirm-dialog-title"
  aria-modal="true"
  class="glass-card"
  role="dialog"
  style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
>
  <h3
    id="confirm-dialog-title"
    style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
  >
    Aprobar pedido
  </h3>
  <div
    style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
  >
    <svg
      class="lucide lucide-triangle-alert"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      style="flex-shrink: 0; margin-top: 1px;"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      />
      <path
        d="M12 9v4"
      />
      <path
        d="M12 17h.01"
      />
    </svg>
    <span
      id="confirm-dialog-message"
    >
      El pedido pasa a la lista de compras.
    </span>
  </div>
  <div>
    <label
      for="request-decision-note"
      style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
    >
      Nota para quien pidió (opcional)
    </label>
    <textarea
      id="request-decision-note"
      maxlength="500"
      rows="3"
      style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
    />
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  >
    No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
  </div>
  <div
    style="display: flex; gap: 10px;"
  >
    <button
      aria-disabled="false"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
      type="button"
    >
      Volver
    </button>
    <button
      aria-disabled="false"
      class="btn-primary"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
      type="button"
    >
      Aprobar
    </button>
  </div>
</div> instead

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Cancelado
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            />
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:15:00
   Duration  6.34s (transform 868ms, setup 1.11s, collect 1.92s, tests 4.47s, environment 5.38s, prepare 676ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  aria-describedby="confirm-dialog-message"
  aria-labelledby="confirm-dialog-title"
  aria-modal="true"
  class="glass-card"
  role="dialog"
  style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
>
  <h3
    id="confirm-dialog-title"
    style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
  >
    Aprobar pedido
  </h3>
  <div
    style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
  >
    <svg
      class="lucide lucide-triangle-alert"
      fill="none"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      style="flex-shrink: 0; margin-top: 1px;"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      />
      <path
        d="M12 9v4"
      />
      <path
        d="M12 17h.01"
      />
    </svg>
    <span
      id="confirm-dialog-message"
    >
      El pedido pasa a la lista de compras.
    </span>
  </div>
  <div>
    <label
      for="request-decision-note"
      style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
    >
      Nota para quien pidió (opcional)
    </label>
    <textarea
      id="request-decision-note"
      maxlength="500"
      rows="3"
      style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
    />
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  >
    No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
  </div>
  <div
    style="display: flex; gap: 10px;"
  >
    <button
      aria-disabled="false"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
      type="button"
    >
      Volver
    </button>
    <button
      aria-disabled="false"
      class="btn-primary"
      style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
      type="button"
    >
      Aprobar
    </button>
  </div>
</div> instead

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Pedidos internos
          </span>
        </h2>
        <div
          aria-label="Secciones de pedidos"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-selected="true"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Pedidos
          </button>
          <button
            aria-selected="false"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Lista de compras
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Cancelado
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            />
            <div
              style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
            >
              <div
                aria-describedby="confirm-dialog-message"
                aria-labelledby="confirm-dialog-title"
                aria-modal="true"
                class="glass-card"
                role="dialog"
                style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
              >
                <h3
                  id="confirm-dialog-title"
                  style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
                >
                  Aprobar pedido
                </h3>
                <div
                  style="padding: 10px 12px; border-radius: 10px; background: var(--warning-soft); border: 1px solid var(--warning); display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--warning); line-height: 1.4;"
                >
                  <svg
                    class="lucide lucide-triangle-alert"
                    fill="none"
                    height="16"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    style="flex-shrink: 0; margin-top: 1px;"
                    viewBox="0 0 24 24"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
                    />
                    <path
                      d="M12 9v4"
                    />
                    <path
                      d="M12 17h.01"
                    />
                  </svg>
                  <span
                    id="confirm-dialog-message"
                  >
                    El pedido pasa a la lista de compras.
                  </span>
                </div>
                <div>
                  <label
                    for="request-decision-note"
                    style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                  >
                    Nota para quien pidió (opcional)
                  </label>
                  <textarea
                    id="request-decision-note"
                    maxlength="500"
                    rows="3"
                    style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
                  />
                </div>
                <div
                  aria-live="polite"
                  style="font-size: 12px; color: var(--error);"
                >
                  No es posible cambiar el estado del pedido de 'cancelled' a 'approved'.
                </div>
                <div
                  style="display: flex; gap: 10px;"
                >
                  <button
                    aria-disabled="false"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    aria-disabled="false"
                    class="btn-primary"
                    style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
                    type="button"
                  >
                    Aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:177:66
    175|     fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    176|     fireEvent.click(dialog().getByRole('button', { name: 'Aprobar' }));
    177|     await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeI…
       |                                                                  ^
    178|     await waitFor(() => expect(screen.getByText(/Cancelado./)).toBeInT…
    179|     expect(screen.getByText("No es posible cambiar el estado del pedid…
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[1/1]-
```

### Mutación 18: Foco perdido tras un 409 (revisión)

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `headingRef.current?.focus(); };`
- **Mutado:** `};`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 470ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 745ms
   [x] Brief 22p review fixes > L1 and L2: after a 409 the focus goes to the heading, and a failed reload is reported 110ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Pedido de·
  Rosa
</h3>
Received element with focus:
  <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
  type="button"
>
  Aprobar
</button>
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2132ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 829ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 720ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:15:08
   Duration  5.57s (transform 962ms, setup 1.03s, collect 1.96s, tests 3.35s, environment 6.23s, prepare 637ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > L1 and L2: after a 409 the focus goes to the heading, and a failed reload is reported
Error: expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Pedido de·
  Rosa
</h3>
Received element with focus:
  <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600;"
  type="button"
>
  Aprobar
</button>
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:85:69
     83|     await waitFor(() => expect(screen.getByText('No se pudo cargar el …
     84|     expect(screen.getByText('El pedido ya no está pendiente.')).toBeIn…
     85|     expect(screen.getByRole('heading', { name: 'Pedido de Rosa' })).to…
       |                                                                     ^
     86|   });
     87| 

------------------------[1/1]-
```

### Mutación 19: El mismo aviso no reabre (revisión)

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `}, [openRequest?.id, openRequest?.nav]);`
- **Mutado:** `}, [openRequest?.id]);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 529ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2141ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 863ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 712ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 2 failed) 2680ms
   [x] Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request 1150ms
     > Unable to find an element with the text: Respuesta del dueño: Hay stock. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="display: flex; gap: 8px; align-items: flex-end; justify-content: space-between;"
          >
            <div
              style="flex: 1 1 0%;"
            >
              <label
                for="request-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="request-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todos
                </option>
                <option
                  value="pending"
                >
                  Pendientes
                </option>
                <option
                  value="approved"
                >
                  Aprobados
                </option>
                <option
                  value="purchased"
                >
                  Comprados
                </option>
                <option
                  value="received"
                >
                  Recibidos
                </option>
                <option
                  value="rejected"
                >
                  Rechazados
                </option>
                <option
                  value="cancelled"
                >
                  Cancelados
                </option>
              </select>
            </div>
            <button
              class="btn-primary"
              style="padding: 10px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-plus"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12h14"
                />
                <path
                  d="M12 5v14"
                />
              </svg>
              <span>
                Nuevo pedido
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <button
            class="glass-card-interactive"
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); text-align: left; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; color: var(--text-main);"
            type="button"
          >
            <span
              style="min-width: 0px;"
            >
              <span
                style="display: block; font-size: 14px; font-weight: 700;"
              >
                Rosa
                , 
                2 insumos
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                10/10/26, 9:30 a. m.
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Pendiente
              </span>
              <span
                style="font-size: 11px; font-weight: 700; color: var(--warning);"
              >
                Urgente
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="display: flex; gap: 8px; align-items: flex-end; justify-content: space-between;"
          >
            <div
              style="flex: 1 1 0%;"
            >
              <label
                for="request-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="request-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todos
                </option>
                <option
                  value="pending"
                >
                  Pendientes
                </option>
                <option
                  value="approved"
                >
                  Aprobados
                </option>
                <option
                  value="purchased"
                >
                  Comprados
                </option>
                <option
                  value="received"
                >
                  Recibidos
                </option>
                <option
                  value="rejected"
                >
                  Rechazados
                </option>
                <option
                  value="cancelled"
                >
                  Cancelados
                </option>
              </select>
            </div>
            <button
              class="btn-primary"
              style="padding: 10px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-plus"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12h14"
                />
                <path
                  d="M12 5v14"
                />
              </svg>
              <span>
                Nuevo pedido
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <button
            class="glass-card-interactive"
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); text-align: left; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; color: var(--text-main);"
            type="button"
          >
            <span
              style="min-width: 0px;"
            >
              <span
                style="display: block; font-size: 14px; font-weight: 700;"
              >
                Rosa
                , 
                2 insumos
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                10/10/26, 9:30 a. m.
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Pendiente
              </span>
              <span
                style="font-size: 11px; font-weight: 700; color: var(--warning);"
              >
                Urgente
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
   [x] Brief 22p review fixes > M1: a notification for the request already open reloads it 1029ms
     > Unable to find an element with the text: /Rechazado/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Mis pedidos
          </span>
        </h2>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed | 2 passed (3)
      Tests  2 failed | 23 passed (25)
   Start at  12:15:16
   Duration  7.00s (transform 901ms, setup 1.18s, collect 2.06s, tests 5.35s, environment 5.72s, prepare 575ms)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request
TestingLibraryElementError: Unable to find an element with the text: Respuesta del dueño: Hay stock. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="display: flex; gap: 8px; align-items: flex-end; justify-content: space-between;"
          >
            <div
              style="flex: 1 1 0%;"
            >
              <label
                for="request-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="request-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todos
                </option>
                <option
                  value="pending"
                >
                  Pendientes
                </option>
                <option
                  value="approved"
                >
                  Aprobados
                </option>
                <option
                  value="purchased"
                >
                  Comprados
                </option>
                <option
                  value="received"
                >
                  Recibidos
                </option>
                <option
                  value="rejected"
                >
                  Rechazados
                </option>
                <option
                  value="cancelled"
                >
                  Cancelados
                </option>
              </select>
            </div>
            <button
              class="btn-primary"
              style="padding: 10px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-plus"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12h14"
                />
                <path
                  d="M12 5v14"
                />
              </svg>
              <span>
                Nuevo pedido
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <button
            class="glass-card-interactive"
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); text-align: left; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; color: var(--text-main);"
            type="button"
          >
            <span
              style="min-width: 0px;"
            >
              <span
                style="display: block; font-size: 14px; font-weight: 700;"
              >
                Rosa
                , 
                2 insumos
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                10/10/26, 9:30 a. m.
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Pendiente
              </span>
              <span
                style="font-size: 11px; font-weight: 700; color: var(--warning);"
              >
                Urgente
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="display: flex; gap: 8px; align-items: flex-end; justify-content: space-between;"
          >
            <div
              style="flex: 1 1 0%;"
            >
              <label
                for="request-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="request-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todos
                </option>
                <option
                  value="pending"
                >
                  Pendientes
                </option>
                <option
                  value="approved"
                >
                  Aprobados
                </option>
                <option
                  value="purchased"
                >
                  Comprados
                </option>
                <option
                  value="received"
                >
                  Recibidos
                </option>
                <option
                  value="rejected"
                >
                  Rechazados
                </option>
                <option
                  value="cancelled"
                >
                  Cancelados
                </option>
              </select>
            </div>
            <button
              class="btn-primary"
              style="padding: 10px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-plus"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12h14"
                />
                <path
                  d="M12 5v14"
                />
              </svg>
              <span>
                Nuevo pedido
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <button
            class="glass-card-interactive"
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); text-align: left; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; color: var(--text-main);"
            type="button"
          >
            <span
              style="min-width: 0px;"
            >
              <span
                style="display: block; font-size: 14px; font-weight: 700;"
              >
                Rosa
                , 
                2 insumos
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                10/10/26, 9:30 a. m.
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Pendiente
              </span>
              <span
                style="font-size: 11px; font-weight: 700; color: var(--warning);"
              >
                Urgente
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:32:18
     30|     client.getRequest.mockResolvedValue({ ok: true, data: { data: { ..…
     31|     rerender(<SupplyRequestsView isOwner={false} userId={12} openReque…
     32|     await screen.findByText('Respuesta del dueño: Hay stock');
       |                  ^
     33|     expect(client.getRequest).toHaveBeenCalledTimes(2);
     34|     expect(onOpenConsumed).toHaveBeenCalledTimes(2);

------------------------[1/2]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M1: a notification for the request already open reloads it
TestingLibraryElementError: Unable to find an element with the text: /Rechazado/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Mis pedidos
          </span>
        </h2>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:43:11
     41|     client.getRequest.mockResolvedValue({ ok: true, data: { data: { ..…
     42|     rerender(<SupplyRequestsView isOwner={false} userId={12} openReque…
     43|     await waitFor(() => expect(screen.getByText(/Rechazado/)).toBeInTh…
       |           ^
     44|   });
     45| 

------------------------[2/2]-
```

### Mutación 20: El aviso no recarga un pedido abierto (revisión)

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `key={`${detail.id}-${detail.version}`}`
- **Mutado:** `key={detail.id}`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 505ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2139ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 841ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 706ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 1740ms
   [x] Brief 22p review fixes > M1: a notification for the request already open reloads it 1040ms
     > Unable to find an element with the text: /Rechazado/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Mis pedidos
          </span>
        </h2>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:15:25
   Duration  5.72s (transform 890ms, setup 1.06s, collect 1.87s, tests 4.38s, environment 5.29s, prepare 618ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M1: a notification for the request already open reloads it
TestingLibraryElementError: Unable to find an element with the text: /Rechazado/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <h2
        class="section-title"
        style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
      >
        <svg
          class="lucide lucide-clipboard-list"
          fill="none"
          height="18"
          stroke="var(--accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height="4"
            rx="1"
            ry="1"
            width="8"
            x="8"
            y="2"
          />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path
            d="M12 11h4"
          />
          <path
            d="M12 16h4"
          />
          <path
            d="M8 11h.01"
          />
          <path
            d="M8 16h.01"
          />
        </svg>
        <span>
          Mis pedidos
        </span>
      </h2>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        role="tabpanel"
      >
        <div
          aria-live="polite"
          style=""
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button
            style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
            type="button"
          >
            <svg
              class="lucide lucide-arrow-left"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m12 19-7-7 7-7"
              />
              <path
                d="M19 12H5"
              />
            </svg>
            <span>
              Volver a pedidos
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Pedido de 
              Rosa
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Pendiente
              , urgente
            </p>
            <dl
              style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              <dt
                style="font-weight: 600;"
              >
                Pedido
              </dt>
              <dd
                style="margin: 0px;"
              >
                10/10/26, 9:30 a. m.
              </dd>
            </dl>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
            >
              Para el turno de la noche
            </p>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Aceite Vegetal
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Marca habitual
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              5 litro
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
          >
            <div
              style="min-width: 0px;"
            >
              <div
                style="font-weight: 600; color: var(--text-main);"
              >
                Esponjas verdes
                 (texto libre)
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              10 unidad
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-clipboard-list"
            fill="none"
            height="18"
            stroke="var(--accent)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              height="4"
              rx="1"
              ry="1"
              width="8"
              x="8"
              y="2"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path
              d="M12 11h4"
            />
            <path
              d="M12 16h4"
            />
            <path
              d="M8 11h.01"
            />
            <path
              d="M8 16h.01"
            />
          </svg>
          <span>
            Mis pedidos
          </span>
        </h2>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          role="tabpanel"
        >
          <div
            aria-live="polite"
            style=""
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px;"
          >
            <button
              style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-left"
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m12 19-7-7 7-7"
                />
                <path
                  d="M19 12H5"
                />
              </svg>
              <span>
                Volver a pedidos
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Pedido de 
                Rosa
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Pendiente
                , urgente
              </p>
              <dl
                style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                <dt
                  style="font-weight: 600;"
                >
                  Pedido
                </dt>
                <dd
                  style="margin: 0px;"
                >
                  10/10/26, 9:30 a. m.
                </dd>
              </dl>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
              >
                Para el turno de la noche
              </p>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Aceite Vegetal
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Marca habitual
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                5 litro
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
            >
              <div
                style="min-width: 0px;"
              >
                <div
                  style="font-weight: 600; color: var(--text-main);"
                >
                  Esponjas verdes
                   (texto libre)
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                10 unidad
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%;"
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:43:11
     41|     client.getRequest.mockResolvedValue({ ok: true, data: { data: { ..…
     42|     rerender(<SupplyRequestsView isOwner={false} userId={12} openReque…
     43|     await waitFor(() => expect(screen.getByText(/Rechazado/)).toBeInTh…
       |           ^
     44|   });
     45| 

------------------------[1/1]-
```

### Mutación 21: No avisar que se usó el aviso (revisión)

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `if (onOpenConsumed) onOpenConsumed();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 550ms
 [ok] src/components/__tests__/EcosystemView.test.jsx (3 tests) 622ms
   [ok] EcosystemView (Brief 22p) > shows the Pedidos tab to any member and changes the subview 427ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 2 failed) 945ms
   [x] Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request 134ms
     > expected "spy" to be called 1 times, but got 0 times
   [x] Brief 22p review fixes > M2: Negocios tells the app that the notification params were used 34ms
     > expected "spy" to be called 1 times, but got 0 times
   [ok] Brief 22p review fixes > M4: the client_uuid survives switching tabs after a network error 302ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2286ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 861ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 719ms

 Test Files  1 failed | 3 passed (4)
      Tests  2 failed | 26 passed (28)
   Start at  12:15:33
   Duration  5.81s (transform 1.06s, setup 1.66s, collect 3.29s, tests 4.40s, environment 8.29s, prepare 876ms)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request
AssertionError: expected "spy" to be called 1 times, but got 0 times
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:27:28
     25|     const { rerender } = render(<SupplyRequestsView isOwner={false} us…
     26|     await screen.findByText('Pedido de Rosa');
     27|     expect(onOpenConsumed).toHaveBeenCalledTimes(1);
       |                            ^
     28|     fireEvent.click(screen.getByText('Volver a pedidos'));
     29| 

------------------------[1/2]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M2: Negocios tells the app that the notification params were used
AssertionError: expected "spy" to be called 1 times, but got 0 times
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:51:30
     49|     render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} …
     50|     await screen.findByText('Pedido de Rosa');
     51|     expect(onParamsConsumed).toHaveBeenCalledTimes(1);
       |                              ^
     52|   });
     53| 

------------------------[2/2]-
```

### Mutación 22: Dejar en la lista pedidos de otro filtro

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `if (!status || request.status === status) list.upsert(request); else list.remove(request.id);`
- **Mutado:** `list.upsert(request);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 504ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 753ms
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 2 failed) 2212ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 840ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 725ms
   [x] SupplyRequestsView for the owner > approves, marks purchased and received 189ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  style="display: block; font-size: 14px; font-weight: 700;"
>
  Rosa
  , 
  2 insumos
</span> instead
   [x] SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason 100ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  style="display: block; font-size: 14px; font-weight: 700;"
>
  Rosa
  , 
  2 insumos
</span> instead

 Test Files  1 failed | 2 passed (3)
      Tests  2 failed | 23 passed (25)
   Start at  12:15:41
   Duration  5.76s (transform 966ms, setup 1.20s, collect 2.05s, tests 3.47s, environment 5.93s, prepare 702ms)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > approves, marks purchased and received
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  style="display: block; font-size: 14px; font-weight: 700;"
>
  Rosa
  , 
  2 insumos
</span> instead
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:167:55
    165|     // Volver a "Pendientes": el pedido recibido ya no está en ese fil…
    166|     fireEvent.click(screen.getByText('Volver a pedidos'));
    167|     expect(screen.queryByText('Rosa, 2 insumos')).not.toBeInTheDocumen…
       |                                                       ^
    168|   });
    169| 

------------------------[1/2]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > after a 409 it reloads the real state and explains the reason
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  style="display: block; font-size: 14px; font-weight: 700;"
>
  Rosa
  , 
  2 insumos
</span> instead
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:182:55
    180|     expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBe…
    181|     fireEvent.click(screen.getByText('Volver a pedidos'));
    182|     expect(screen.queryByText('Rosa, 2 insumos')).not.toBeInTheDocumen…
       |                                                       ^
    183|   });
    184| 

------------------------[2/2]-
```

### Mutación 23: Desmontar el formulario al cambiar de pestaña

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `hidden={tab !== 'requests'}> {screen === 'new' &&`
- **Mutado:** `>
        {tab === 'requests' && screen === 'new' &&`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 519ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 809ms
   [x] Brief 22p review fixes > M4: the client_uuid survives switching tabs after a network error 137ms
     > expected 'eb428e37-d4af-4bc9-9fcd-07489255d0b8' to be 'f56b16f1-27b7-4f66-81f7-a36bdb9c49fa' // Object.is equality
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 2258ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 865ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 716ms
   [x] SupplyRequestsView for the owner > shows the consolidated shopping list and keeps a request form when switching tabs 68ms
     > expect(element).toHaveValue(Reposición)

Expected the element to have value:
  Reposición
Received:


 Test Files  2 failed | 1 passed (3)
      Tests  2 failed | 23 passed (25)
   Start at  12:15:48
   Duration  5.61s (transform 1.15s, setup 1.09s, collect 2.41s, tests 3.59s, environment 5.64s, prepare 597ms)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M4: the client_uuid survives switching tabs after a network error
AssertionError: expected 'eb428e37-d4af-4bc9-9fcd-07489255d0b8' to be 'f56b16f1-27b7-4f66-81f7-a36bdb9c49fa' // Object.is equality

Expected: "f56b16f1-27b7-4f66-81f7-a36bdb9c49fa"
Received: "eb428e37-d4af-4bc9-9fcd-07489255d0b8"

 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:71:37
     69|     fireEvent.click(screen.getByText('Enviar pedido'));
     70|     await waitFor(() => expect(screen.getByText('Ya estaba enviado.'))…
     71|     expect(create.mock.calls[1][1]).toBe(create.mock.calls[0][1]);
       |                                     ^
     72|   });
     73| 

------------------------[1/2]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > shows the consolidated shopping list and keeps a request form when switching tabs
Error: expect(element).toHaveValue(Reposición)

Expected the element to have value:
  Reposición
Received:

 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:199:68
    197| 
    198|     fireEvent.click(screen.getByRole('tab', { name: 'Pedidos' }));
    199|     expect(screen.getByLabelText('Nota para el dueño (opcional)')).toH…
       |                                                                    ^
    200|   });
    201| 

------------------------[2/2]-
```

### Mutación 24: Lista de compras visible para el personal

- **Archivo:** `src/components/supplyRequests/SupplyRequestsView.jsx`
- **Original:** `{isOwner && <RequestsTabs`
- **Mutado:** `{<RequestsTabs`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 497ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 911ms
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 1923ms
   [x] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 297ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  aria-selected="false"
  role="tab"
  style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Lista de compras
</button> instead
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 811ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:15:56
   Duration  5.23s (transform 927ms, setup 1.21s, collect 1.99s, tests 3.33s, environment 5.76s, prepare 606ms)

stderr | src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for staff > creates a request with a catalog item and a free text item
Warning: An update to SupplyRequestsView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at SupplyRequestsView (C:\laragon\www\UALDO\src\components\supplyRequests\SupplyRequestsView.jsx:67:31)
Warning: An update to SupplyRequestsView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at SupplyRequestsView (C:\laragon\www\UALDO\src\components\supplyRequests\SupplyRequestsView.jsx:67:31)
Warning: An update to SupplyRequestsView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at SupplyRequestsView (C:\laragon\www\UALDO\src\components\supplyRequests\SupplyRequestsView.jsx:67:31)
Warning: An update to SupplyRequestsView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at SupplyRequestsView (C:\laragon\www\UALDO\src\components\supplyRequests\SupplyRequestsView.jsx:67:31)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for staff > creates a request with a catalog item and a free text item
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  aria-selected="false"
  role="tab"
  style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Lista de compras
</button> instead
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:24:73
     22|     render(<SupplyRequestsView isOwner={false} userId={12} />);
     23|     expect(screen.getByText('Mis pedidos')).toBeInTheDocument();
     24|     expect(screen.queryByRole('tab', { name: 'Lista de compras' })).no…
       |                                                                         ^
     25|     await waitFor(() => expect(client.listRequests).toHaveBeenCalledWi…
     26| 

------------------------[1/1]-
```

### Mutación 25: El aviso de pedido abre el Asistente

- **Archivo:** `src/services/notificationRoutes.js`
- **Original:** `return { tab: 'negocios', subView: 'pedidos', params: cleanParams };`
- **Mutado:** `return { tab: 'asistente', params: cleanParams };`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/notificationRoutes.test.js (9 tests | 1 failed) 29ms
   [x] notificationRoutes security and routing > resolveNotificationRoute > resolves pedidos and pedido to the Pedidos subview of Negocios (Brief 22p) 17ms
     > expected { tab: 'asistente', params: {} } to deeply equal { tab: 'negocios', …(2) }
 > src/components/notifications/__tests__/NotificationsPanel.test.jsx (9 tests | 1 failed) 1632ms
   [x] NotificationsPanel component > marks unread notification as read on click and invokes navigation whitelist route 1049ms
     > expected "spy" to be called with arguments: [ { tab: 'negocios', …(2) } ]

Received: 

  1st spy call:

  Array [
    Object {
      "params": Object {
        "id": 104,
      },
-     "subView": "pedidos",
-     "tab": "negocios",
+     "tab": "asistente",
    },
  ]


Number of calls: 1


Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        class="notifications-panel-backdrop"
        style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1000; display: flex; flex-direction: column; padding-top: calc(16px + var(--safe-top)); padding-right: 16px; padding-bottom: calc(16px + var(--safe-bottom)); padding-left: 16px;"
      >
        <div
          class="glass-card"
          style="flex: 1 1 0%; display: flex; flex-direction: column; max-height: 100%; overflow: hidden; border: 1px solid var(--border-glow); border-radius: 20px;"
        >
          <div
            style="padding: 16px; border-bottom: 1px solid var(--border-glass); display: flex; align-items: center; justify-content: space-between;"
          >
            <div
              style="display: flex; align-items: center; gap: 10px;"
            >
              <div
                style="width: 36px; height: 36px; border-radius: 10px; background: var(--grad-primary); display: flex; align-items: center; justify-content: center;"
              >
                <svg
                  class="lucide lucide-bell"
                  fill="none"
                  height="20"
                  stroke="var(--on-primary)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                  />
                  <path
                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                  />
                </svg>
              </div>
              <div>
                <h2
                  style="font-size: 16px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
                >
                  Centro de Avisos
                </h2>
                <span
                  style="font-size: 11px; color: var(--text-muted);"
                >
                  Novedades y alertas del restaurante
                </span>
              </div>
            </div>
            <button
              aria-label="Cerrar avisos"
              style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center;"
              type="button"
            >
              <svg
                class="lucide lucide-x"
                fill="none"
                height="22"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6 6 18"
                />
                <path
                  d="m6 6 12 12"
                />
              </svg>
            </button>
          </div>
          <div
            style="padding: 12px 16px; border-bottom: 1px solid var(--border-glass); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between;"
          >
            <div
              style="display: flex; gap: 6px; flex-wrap: wrap;"
            >
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
                type="button"
              >
                Sin leer
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                pedidos
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                inventario
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                caja
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                sistema
              </button>
            </div>
            <button
              style="background: transparent; border: medium; color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-check-check"
                fill="none"
                height="14"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6 7 17l-5-5"
                />
                <path
                  d="m22 10-7.5 7.5L13 16"
                />
              </svg>
              <span>
                Marcar leídas
              </span>
            </button>
          </div>
          <div
            style="flex: 1 1 0%; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;"
          >
            <div
              role="button"
              style="background: var(--warning-soft); padding: 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; position: relative; border: 1px solid var(--border-glass);"
              tabindex="0"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;"
              >
                <div
                  style="display: flex; align-items: center; gap: 8px;"
                >
                  <span
                    style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: var(--bg-glass); color: var(--warning); border: 1px solid var(--warning); text-transform: uppercase;"
                  >
                    Atención
                  </span>
                  <span
                    style="font-size: 11px; color: var(--text-subtle); text-transform: capitalize;"
                  >
                    pedidos
                  </span>
                </div>
                <div
                  style="display: flex; align-items: center; gap: 6px;"
                >
                  <span
                    style="font-size: 11px; color: var(--text-muted);"
                  >
                    hace un momento
                  </span>
                </div>
              </div>
              <h4
                style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px;"
              >
                Pedido retrasado
              </h4>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 0px; line-height: 1.4;"
              >
                El pedido 104 esta pendiente de preparacion
              </p>
            </div>
            <div
              role="button"
              style="background: var(--error-soft); padding: 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; position: relative; border: 1px solid var(--border-glass);"
              tabindex="0"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;"
              >
                <div
                  style="display: flex; align-items: center; gap: 8px;"
                >
                  <span
                    style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: var(--bg-glass); color: var(--error); border: 1px solid var(--error); text-transform: uppercase;"
                  >
                    Crítico
                  </span>
                  <span
                    style="font-size: 11px; color: var(--text-subtle); text-transform: capitalize;"
                  >
                    inventario
                  </span>
                </div>
                <div
                  style="display: flex; align-items: center; gap: 6px;"
                >
                  <span
                    style="font-size: 11px; color: var(--text-muted);"
                  >
                    hace un momento
                  </span>
                </div>
              </div>
              <h4
                style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px;"
              >
                Stock Critico: Queso
              </h4>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 0px; line-height: 1.4;"
              >
                &lt;script&gt;alert("xss")&lt;/script&gt;Quedan menos de 2 kg en bodega
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  2 failed (2)
      Tests  2 failed | 16 passed (18)
   Start at  12:16:03
   Duration  4.83s (transform 222ms, setup 791ms, collect 420ms, tests 1.66s, environment 3.74s, prepare 355ms)

------- Failed Tests 2 -------

 FAIL  src/services/__tests__/notificationRoutes.test.js > notificationRoutes security and routing > resolveNotificationRoute > resolves pedidos and pedido to the Pedidos subview of Negocios (Brief 22p)
AssertionError: expected { tab: 'asistente', params: {} } to deeply equal { tab: 'negocios', …(2) }

- Expected
+ Received

  Object {
    "params": Object {},
-   "subView": "pedidos",
-   "tab": "negocios",
+   "tab": "asistente",
  }

 > src/services/__tests__/notificationRoutes.test.js:74:51
     72| 
     73|     it('resolves pedidos and pedido to the Pedidos subview of Negocios…
     74|       expect(resolveNotificationRoute('pedidos')).toEqual({
       |                                                   ^
     75|         tab: 'negocios',
     76|         subView: 'pedidos',

------------------------[1/2]-

 FAIL  src/components/notifications/__tests__/NotificationsPanel.test.jsx > NotificationsPanel component > marks unread notification as read on click and invokes navigation whitelist route
AssertionError: expected "spy" to be called with arguments: [ { tab: 'negocios', …(2) } ]

Received: 

  1st spy call:

  Array [
    Object {
      "params": Object {
        "id": 104,
      },
-     "subView": "pedidos",
-     "tab": "negocios",
+     "tab": "asistente",
    },
  ]


Number of calls: 1


Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        class="notifications-panel-backdrop"
        style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1000; display: flex; flex-direction: column; padding-top: calc(16px + var(--safe-top)); padding-right: 16px; padding-bottom: calc(16px + var(--safe-bottom)); padding-left: 16px;"
      >
        <div
          class="glass-card"
          style="flex: 1 1 0%; display: flex; flex-direction: column; max-height: 100%; overflow: hidden; border: 1px solid var(--border-glow); border-radius: 20px;"
        >
          <div
            style="padding: 16px; border-bottom: 1px solid var(--border-glass); display: flex; align-items: center; justify-content: space-between;"
          >
            <div
              style="display: flex; align-items: center; gap: 10px;"
            >
              <div
                style="width: 36px; height: 36px; border-radius: 10px; background: var(--grad-primary); display: flex; align-items: center; justify-content: center;"
              >
                <svg
                  class="lucide lucide-bell"
                  fill="none"
                  height="20"
                  stroke="var(--on-primary)"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                  />
                  <path
                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                  />
                </svg>
              </div>
              <div>
                <h2
                  style="font-size: 16px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
                >
                  Centro de Avisos
                </h2>
                <span
                  style="font-size: 11px; color: var(--text-muted);"
                >
                  Novedades y alertas del restaurante
                </span>
              </div>
            </div>
            <button
              aria-label="Cerrar avisos"
              style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center;"
              type="button"
            >
              <svg
                class="lucide lucide-x"
                fill="none"
                height="22"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6 6 18"
                />
                <path
                  d="m6 6 12 12"
                />
              </svg>
            </button>
          </div>
          <div
            style="padding: 12px 16px; border-bottom: 1px solid var(--border-glass); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between;"
          >
            <div
              style="display: flex; gap: 6px; flex-wrap: wrap;"
            >
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
                type="button"
              >
                Sin leer
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                pedidos
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                inventario
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                caja
              </button>
              <button
                style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--chip-bg); color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; text-transform: capitalize;"
                type="button"
              >
                sistema
              </button>
            </div>
            <button
              style="background: transparent; border: medium; color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-check-check"
                fill="none"
                height="14"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6 7 17l-5-5"
                />
                <path
                  d="m22 10-7.5 7.5L13 16"
                />
              </svg>
              <span>
                Marcar leídas
              </span>
            </button>
          </div>
          <div
            style="flex: 1 1 0%; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;"
          >
            <div
              role="button"
              style="background: var(--warning-soft); padding: 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; position: relative; border: 1px solid var(--border-glass);"
              tabindex="0"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;"
              >
                <div
                  style="display: flex; align-items: center; gap: 8px;"
                >
                  <span
                    style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: var(--bg-glass); color: var(--warning); border: 1px solid var(--warning); text-transform: uppercase;"
                  >
                    Atención
                  </span>
                  <span
                    style="font-size: 11px; color: var(--text-subtle); text-transform: capitalize;"
                  >
                    pedidos
                  </span>
                </div>
                <div
                  style="display: flex; align-items: center; gap: 6px;"
                >
                  <span
                    style="font-size: 11px; color: var(--text-muted);"
                  >
                    hace un momento
                  </span>
                </div>
              </div>
              <h4
                style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px;"
              >
                Pedido retrasado
              </h4>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 0px; line-height: 1.4;"
              >
                El pedido 104 esta pendiente de preparacion
              </p>
            </div>
            <div
              role="button"
              style="background: var(--error-soft); padding: 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; position: relative; border: 1px solid var(--border-glass);"
              tabindex="0"
            >
              <div
                style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;"
              >
                <div
                  style="display: flex; align-items: center; gap: 8px;"
                >
                  <span
                    style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: var(--bg-glass); color: var(--error); border: 1px solid var(--error); text-transform: uppercase;"
                  >
                    Crítico
                  </span>
                  <span
                    style="font-size: 11px; color: var(--text-subtle); text-transform: capitalize;"
                  >
                    inventario
                  </span>
                </div>
                <div
                  style="display: flex; align-items: center; gap: 6px;"
                >
                  <span
                    style="font-size: 11px; color: var(--text-muted);"
                  >
                    hace un momento
                  </span>
                </div>
              </div>
              <h4
                style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px;"
              >
                Stock Critico: Queso
              </h4>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 0px; line-height: 1.4;"
              >
                &lt;script&gt;alert("xss")&lt;/script&gt;Quedan menos de 2 kg en bodega
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > src/components/notifications/__tests__/NotificationsPanel.test.jsx:76:30
     74|       expect(markReadSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a45…
     75|       // Brief 22p: un aviso de pedido abre su detalle en Negocios, pe…
     76|       expect(handleNavigate).toHaveBeenCalledWith({
       |                              ^
     77|         tab: 'negocios',
     78|         subView: 'pedidos',
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[2/2]-
```

### Mutación 26: Negocios no avisa que se usó el aviso (revisión)

- **Archivo:** `src/components/EcosystemView.jsx`
- **Original:** `onOpenConsumed={onParamsConsumed}`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 595ms
 [ok] src/components/__tests__/EcosystemView.test.jsx (3 tests) 682ms
   [ok] EcosystemView (Brief 22p) > shows the Pedidos tab to any member and changes the subview 456ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 1049ms
   [ok] Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request 323ms
   [x] Brief 22p review fixes > M2: Negocios tells the app that the notification params were used 46ms
     > expected "spy" to be called 1 times, but got 0 times
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2420ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 929ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 751ms

 Test Files  1 failed | 3 passed (4)
      Tests  1 failed | 27 passed (28)
   Start at  12:16:10
   Duration  6.52s (transform 1.14s, setup 1.74s, collect 3.76s, tests 4.75s, environment 10.09s, prepare 928ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > M2: Negocios tells the app that the notification params were used
AssertionError: expected "spy" to be called 1 times, but got 0 times
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:51:30
     49|     render(<EcosystemView subView="pedidos" onSubViewChange={vi.fn()} …
     50|     await screen.findByText('Pedido de Rosa');
     51|     expect(onParamsConsumed).toHaveBeenCalledTimes(1);
       |                              ^
     52|   });
     53| 

------------------------[1/1]-
```

### Mutación 27: Foco fuera del motivo al abrir

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `initialFocusRef={config?.note ? noteRef : undefined}`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 513ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 818ms
   [x] Brief 22p review fixes > typing the reason never moves the focus to the button behind the dialog 62ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="request-decision-note"
  maxlength="500"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
>
  Hay stock
</textarea>
Received element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 2165ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 851ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 715ms
   [x] SupplyRequestsView for the owner > rejects with a required reason in the dialog 64ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="request-decision-note"
  maxlength="500"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
/>
Received element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>

 Test Files  2 failed | 1 passed (3)
      Tests  2 failed | 23 passed (25)
   Start at  12:16:19
   Duration  5.41s (transform 984ms, setup 1.19s, collect 2.03s, tests 3.50s, environment 5.59s, prepare 601ms)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > typing the reason never moves the focus to the button behind the dialog
Error: expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="request-decision-note"
  maxlength="500"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
>
  Hay stock
</textarea>
Received element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:113:20
    111|     fireEvent.change(reason, { target: { value: 'Hay stock' } });
    112|     expect(onFocus).not.toHaveBeenCalled();
    113|     expect(reason).toHaveFocus();
       |                    ^
    114| 
    115|     fireEvent.keyDown(document, { key: 'Escape' });

------------------------[1/2]-

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for the owner > rejects with a required reason in the dialog
Error: expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="request-decision-note"
  maxlength="500"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
/>
Received element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:133:57
    131| 
    132|     fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    133|     expect(screen.getByLabelText('Motivo del rechazo')).toHaveFocus();
       |                                                         ^
    134|     fireEvent.click(dialog().getByRole('button', { name: 'Rechazar' })…
    135|     await waitFor(() => expect(dialog().getByText('Indica el motivo de…

------------------------[2/2]-
```

### Mutación 28: Ref del botón nuevo en cada render

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `triggerRef={dialogTriggerRef}`
- **Mutado:** `triggerRef={{ current: dialog ? triggers.current[dialog] : null }}`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 511ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 934ms
   [x] Brief 22p review fixes > typing the reason never moves the focus to the button behind the dialog 117ms
     > expected "spy" to not be called at all, but actually been called 3 times

Received: 

  1st spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]

  2nd spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]

  3rd spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]


Number of calls: 3

 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2445ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 873ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 726ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:16:26
   Duration  5.68s (transform 984ms, setup 1.07s, collect 2.07s, tests 3.89s, environment 5.63s, prepare 588ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > typing the reason never moves the focus to the button behind the dialog
AssertionError: expected "spy" to not be called at all, but actually been called 3 times

Received: 

  1st spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]

  2nd spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]

  3rd spy call:

    Array [
      FocusEvent {
        "isTrusted": true,
      },
    ]


Number of calls: 3

 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:112:25
    110|     fireEvent.change(reason, { target: { value: 'Ha' } });
    111|     fireEvent.change(reason, { target: { value: 'Hay stock' } });
    112|     expect(onFocus).not.toHaveBeenCalled();
       |                         ^
    113|     expect(reason).toHaveFocus();
    114| 

------------------------[1/1]-
```

### Mutación 29: Mensaje sin asociar al diálogo (revisión)

- **Archivo:** `src/components/common/ConfirmDialog.jsx`
- **Original:** `aria-describedby="confirm-dialog-message"`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 590ms
   [ok] SupplyRequestForm > shows the general items error and the note error 312ms
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests | 1 failed) 820ms
   [x] Brief 22p review fixes > L7: a double tap in the dialog sends one request 65ms
     > expect(element).toHaveAttribute("aria-describedby", "confirm-dialog-message") // element.getAttribute("aria-describedby") === "confirm-dialog-message"

Expected the element to have attribute:
  aria-describedby="confirm-dialog-message"
Received:
  null
 [ok] src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests) 2345ms
   [ok] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 936ms
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 713ms

 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 24 passed (25)
   Start at  12:16:34
   Duration  5.78s (transform 1.17s, setup 1.24s, collect 2.33s, tests 3.76s, environment 5.90s, prepare 644ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx > Brief 22p review fixes > L7: a double tap in the dialog sends one request
Error: expect(element).toHaveAttribute("aria-describedby", "confirm-dialog-message") // element.getAttribute("aria-describedby") === "confirm-dialog-message"

Expected the element to have attribute:
  aria-describedby="confirm-dialog-message"
Received:
  null
 > src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx:130:40
    128|     fireEvent.click(confirm);
    129|     expect(spy).toHaveBeenCalledTimes(1);
    130|     expect(screen.getByRole('dialog')).toHaveAttribute('aria-described…
       |                                        ^
    131|     resolve({ ok: true, data: { data: { ...pendingRequest, status: 'pu…
    132|     await waitFor(() => expect(screen.getByText('Pedido marcado como c…

------------------------[1/1]-
```

### Mutación 30: Ofrecer servicios en la búsqueda

- **Archivo:** `src/hooks/useItemSearch.js`
- **Original:** `setResults(list.filter((item) => item.type !== 'service'));`
- **Mutado:** `setResults(list);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/inventory/purchases/__tests__/PurchaseEdgeCases.test.jsx (2 tests) 191ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests) 807ms
   [ok] SupplyRequestForm > shows the general items error and the note error 375ms
 [ok] src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx (6 tests) 1918ms
   [ok] Suppliers tab > lists, searches and includes inactive suppliers 1222ms
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 2371ms
   [x] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 1092ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 8px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; width: 100%; text-align: left; font-size: 12px;"
  type="button"
>
  Lavado de manteles
</button> instead
   [ok] PurchasesView > shows 422 errors next to their field and line 492ms
 [ok] src/components/supplyRequests/__tests__/SupplyRequestReviewFixes.test.jsx (8 tests) 1325ms
   [ok] Brief 22p review fixes > M1: the same notification tapped again reopens and reloads the request 433ms
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx (10 tests | 1 failed) 2934ms
   [x] SupplyRequestsView for staff > creates a request with a catalog item and a free text item 1079ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 8px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; width: 100%; text-align: left; font-size: 12px;"
  type="button"
>
  Lavado de manteles
</button> instead
   [ok] SupplyRequestsView for staff > shows 422 errors next to the item and the search states 808ms
 [ok] src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests) 3141ms
   [ok] Brief 20p review fixes > H1: the detail comes from the engine with its lines, and editing starts from them 452ms
   [ok] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 508ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 465ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1073ms

 Test Files  2 failed | 5 passed (7)
      Tests  2 failed | 47 passed (49)
   Start at  12:16:42
   Duration  8.96s (transform 2.17s, setup 4.67s, collect 5.55s, tests 12.69s, environment 25.35s, prepare 2.29s)

stderr | src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx > Valuation tab > goes back to inventory
Warning: An update to PurchasesView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchasesView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchasesView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchasesView inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)

stderr | src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M7: switching tabs keeps the new purchase form and what was written
Warning: An update to PurchaseForm inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchaseForm (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchaseForm.jsx:36:25)
    at div
    at div
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchaseForm inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchaseForm (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchaseForm.jsx:36:25)
    at div
    at div
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchaseForm inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchaseForm (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchaseForm.jsx:36:25)
    at div
    at div
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)
Warning: An update to PurchaseForm inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at PurchaseForm (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchaseForm.jsx:36:25)
    at div
    at div
    at PurchasesView (C:\laragon\www\UALDO\src\components\inventory\purchases\PurchasesView.jsx:31:26)

------- Failed Tests 2 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx > SupplyRequestsView for staff > creates a request with a catalog item and a free text item
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 8px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; width: 100%; text-align: left; font-size: 12px;"
  type="button"
>
  Lavado de manteles
</button> instead
 > src/components/supplyRequests/__tests__/SupplyRequestsView.test.jsx:31:58
     29|     fireEvent.change(screen.getByLabelText('Buscar en el catálogo'), {…
     30|     await waitFor(() => expect(screen.getByRole('button', { name: 'Ace…
     31|     expect(screen.queryByText('Lavado de manteles')).not.toBeInTheDocu…
       |                                                          ^
     32|     fireEvent.click(screen.getByRole('button', { name: 'Aceite Vegetal…
     33|     expect(screen.getAllByLabelText('Cantidad')[0]).toHaveFocus();

------------------------[1/2]-

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > creates a draft: supplier, item search without services, lines and the engine total
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 8px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; width: 100%; text-align: left; font-size: 12px;"
  type="button"
>
  Lavado de manteles
</button> instead
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:34:58
     32|     fireEvent.change(screen.getByLabelText('Agregar insumo'), { target…
     33|     await waitFor(() => expect(screen.getByRole('button', { name: 'Lom…
     34|     expect(screen.queryByText('Lavado de manteles')).not.toBeInTheDocu…
       |                                                          ^
     35|     fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM…
     36| 

------------------------[2/2]-
```

### Mutación 31: Sin la fecha de la decisión (verificación con el motor)

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `['decided_at', 'Decisión'],`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests | 1 failed) 401ms
   [x] SupplyRequestDetail dates (engine check) > shows each date the engine sent, without a double period after the time 22ms
     > Unable to find an element with the text: Decisión. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      aria-live="polite"
      style=""
    />
    <div
      style="display: flex; flex-direction: column; gap: 12px;"
    >
      <button
        style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
        type="button"
      >
        <svg
          class="lucide lucide-arrow-left"
          fill="none"
          height="16"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m12 19-7-7 7-7"
          />
          <path
            d="M19 12H5"
          />
        </svg>
        <span>
          Volver a pedidos
        </span>
      </button>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <h3
          style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          tabindex="-1"
        >
          Pedido de 
          Rosa
        </h3>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
        >
          Recibido
          , urgente
        </p>
        <dl
          style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
        >
          <dt
            style="font-weight: 600;"
          >
            Pedido
          </dt>
          <dd
            style="margin: 0px;"
          >
            10/10/26, 9:30 a. m.
          </dd>
          <dt
            style="font-weight: 600;"
          >
            Comprado
          </dt>
          <dd
            style="margin: 0px;"
          >
            11/10/26, 4:15 a. m.
          </dd>
          <dt
            style="font-weight: 600;"
          >
            Recibido
          </dt>
          <dd
            style="margin: 0px;"
          >
            11/10/26, 7:40 a. m.
          </dd>
        </dl>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
        >
          Para el turno de la noche
        </p>
      </div>
      <div
        aria-live="polite"
      />
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Aceite Vegetal
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Marca habitual
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          5 litro
        </div>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Esponjas verdes
             (texto libre)
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          10 unidad
        </div>
      </div>
      <div
        style="display: flex; gap: 8px; flex-wrap: wrap;"
      />
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:16:53
   Duration  2.96s (transform 196ms, setup 258ms, collect 344ms, tests 401ms, environment 1.36s, prepare 160ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx > SupplyRequestDetail dates (engine check) > shows each date the engine sent, without a double period after the time
TestingLibraryElementError: Unable to find an element with the text: Decisión. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      aria-live="polite"
      style=""
    />
    <div
      style="display: flex; flex-direction: column; gap: 12px;"
    >
      <button
        style="align-self: flex-start; background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
        type="button"
      >
        <svg
          class="lucide lucide-arrow-left"
          fill="none"
          height="16"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m12 19-7-7 7-7"
          />
          <path
            d="M19 12H5"
          />
        </svg>
        <span>
          Volver a pedidos
        </span>
      </button>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <h3
          style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          tabindex="-1"
        >
          Pedido de 
          Rosa
        </h3>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
        >
          Recibido
          , urgente
        </p>
        <dl
          style="display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
        >
          <dt
            style="font-weight: 600;"
          >
            Pedido
          </dt>
          <dd
            style="margin: 0px;"
          >
            10/10/26, 9:30 a. m.
          </dd>
          <dt
            style="font-weight: 600;"
          >
            Comprado
          </dt>
          <dd
            style="margin: 0px;"
          >
            11/10/26, 4:15 a. m.
          </dd>
          <dt
            style="font-weight: 600;"
          >
            Recibido
          </dt>
          <dd
            style="margin: 0px;"
          >
            11/10/26, 7:40 a. m.
          </dd>
        </dl>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
        >
          Para el turno de la noche
        </p>
      </div>
      <div
        aria-live="polite"
      />
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Aceite Vegetal
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Marca habitual
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          5 litro
        </div>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Esponjas verdes
             (texto libre)
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          10 unidad
        </div>
      </div>
      <div
        style="display: flex; gap: 8px; flex-wrap: wrap;"
      />
    </div>
  </div>
</body>
 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx:128:19
    126| 
    127|     expect(screen.getByText('Pedido').nextSibling).toHaveTextContent(f…
    128|     expect(screen.getByText('Decisión').nextSibling).toHaveTextContent…
       |                   ^
    129|     expect(screen.getByText('Comprado').nextSibling).toHaveTextContent…
    130|     expect(screen.getByText('Recibido').nextSibling).toHaveTextContent…

------------------------[1/1]-
```

### Mutación 32: Punto doble tras la hora (verificación con el motor)

- **Archivo:** `src/components/supplyRequests/SupplyRequestDetail.jsx`
- **Original:** `{request.priority === 'urgent' ? ', urgente' : ''}`
- **Mutado:** `{request.priority === 'urgent' ? ', urgente' : ''}. {formatDateTime(request.created_at)}.`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx (7 tests | 1 failed) 390ms
   [x] SupplyRequestDetail dates (engine check) > shows each date the engine sent, without a double period after the time 24ms
     > expected 'Volver a pedidosPedido de RosaRecibid…' not to match /\.\./

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  12:16:58
   Duration  2.88s (transform 177ms, setup 264ms, collect 307ms, tests 390ms, environment 1.35s, prepare 166ms)

------- Failed Tests 1 -------

 FAIL  src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx > SupplyRequestDetail dates (engine check) > shows each date the engine sent, without a double period after the time
AssertionError: expected 'Volver a pedidosPedido de RosaRecibid…' not to match /\.\./

- Expected: 
/\.\./

+ Received: 
"Volver a pedidosPedido de RosaRecibido, urgente. 10/10/26, 9:30 a. m..Pedido10/10/26, 9:30 a. m.Decisión10/10/26, 10:00 a. m.Comprado11/10/26, 4:15 a. m.Recibido11/10/26, 7:40 a. m.Para el turno de la nocheAceite VegetalMarca habitual5 litroEsponjas verdes (texto libre)10 unidad"

 > src/components/supplyRequests/__tests__/SupplyRequestEdgeCases.test.jsx:131:43
    129|     expect(screen.getByText('Comprado').nextSibling).toHaveTextContent…
    130|     expect(screen.getByText('Recibido').nextSibling).toHaveTextContent…
    131|     expect(document.body.textContent).not.toMatch(/\.\./);
       |                                           ^
    132|   });
    133| 

------------------------[1/1]-
```

