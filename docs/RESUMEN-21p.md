# Resumen del Brief 21p: producción y porcionado en la app

Rama `feat/pwa-production`, creada desde `feat/pwa-inventory-locations` (`0ba52bb`). Construido por Claude a pedido
explícito del dueño del producto (2026-10-09), con tests escritos junto a cada pieza y revisado por el agente
`code-reviewer`. Sin commit hasta la aprobación. Contrato del motor: `UaldoBusiness/docs/API-production.md`
(Brief 21, `2cab4d9`).

## 1. Qué se construyó

- **Cliente** (`src/services/productionClient.js`): fichas, plan, producciones, registrar y anular. Valida ids,
  ubicaciones, cantidades (`^\d{1,7}(\.\d{1,3})?$`, con coma; entradas mayores que 0) y motivo antes de construir
  rutas; consultas con `URLSearchParams`.
- **Entrada desde Inventario:** botón "Producción" para cualquier miembro. Los botones de la cabecera pasaron a
  `InventoryHeaderActions.jsx` ("Conteos" y "Nuevo Insumo" siguen solo para el dueño).
- **Pantallas** (`src/components/inventory/production/`): lista de producciones con "Cargar más", elegir ficha,
  formulario y detalle.
- **Formulario** (`useProductionRunForm` y `productionForm.js`):
  - ubicación por defecto de la ficha; un campo por entrada y salida con su unidad; principales marcadas;
  - peso de porciones y merma obligatorios según la ficha;
  - solo se envían las líneas escritas (0 incluido);
  - `client_uuid` al abrir, reutilizado tras un error de red, renovado tras un 201 o un 200;
  - `409` con el mensaje del motor; `422` traducido de la posición enviada (`inputs.N`, `outputs.N`) al insumo.
- **Plan del motor** (`useProductionPlan`): si la ficha tiene entrada principal, al escribirla se pide el plan tras
  400 ms, sin pedidos superpuestos y descartando respuestas viejas; cada línea muestra "Esperado: X". Si la ficha
  escala por la suma de entradas, la pantalla avisa que lo esperado se calcula al registrar. Nada se calcula en el
  cliente.
- **Detalle:** rendimiento real contra esperado (diferencia negativa en color de advertencia), pesos, peso sin
  explicar y líneas con lo esperado. Para el dueño, el costo con aviso si está incompleto, y "Anular" con motivo
  obligatorio en un diálogo propio.

Un test encontró un error real durante la construcción: el diálogo de anular borraba el motivo cada vez que cambiaba
el estado "anulando", así que tras un 409 no se podía reintentar. Se separó el reinicio (solo al abrir) del manejo de
Escape.

## 2. Verificación

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (51 advertencias anteriores, ninguna en los archivos nuevos) |
| `npm test` | 67 archivos, 469 tests en verde |
| `npm run test:coverage` | Todos los archivos nuevos con 80 % o más de sentencias y ramas (tabla abajo) |
| `npm run build:prod` | Correcto |
| `grep` de colores directos en `src/components/inventory` | Sin coincidencias |
| Emojis y tildes | Ninguno; ninguna tilde perdida |

Filas de los archivos del brief, copiadas de la salida de `npm run test:coverage`:

```text
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
  ...ntoryView.jsx |   81.81 |    86.95 |      20 |   81.81 | ...,93-95,162-167 
  ...erActions.jsx |     100 |      100 |     100 |     100 |                   
 ...ory/production |   98.96 |    93.54 |   95.45 |   98.96 |                   
  ...LineField.jsx |     100 |    91.66 |     100 |     100 | 27                
  ...RunDetail.jsx |   99.01 |    89.47 |     100 |   99.01 | 38                
  ...onRunForm.jsx |     100 |    90.32 |     100 |     100 | 48,100-103        
  ...onRunList.jsx |     100 |      100 |     100 |     100 |                   
  ...atePicker.jsx |     100 |      100 |     100 |     100 |                   
  ...ctionView.jsx |   93.93 |    93.75 |      75 |   93.93 | 34-37             
  ...ionDialog.jsx |     100 |    94.11 |     100 |     100 | 9-10              
  ...tionFormat.js |     100 |    96.15 |     100 |     100 | 12                
  ...uctionForm.js |     100 |    85.93 |     100 |     100 | ...57-60,82-83,97 
  ...uctionPlan.js |     100 |      100 |     100 |     100 |                   
  ...ionRunForm.js |     100 |    94.11 |      75 |     100 | 63,68             
  ...uctionRuns.js |     100 |    94.11 |     100 |     100 | 43,74             
  ...ductionRun.js |     100 |    94.11 |     100 |     100 | 28                
  ...tionClient.js |     100 |    95.34 |     100 |     100 | 43,71,107,122     
```

## 3. Revisión del agente `code-reviewer` y correcciones

No encontró nada CRITICAL ni HIGH. Confirmó que los costos solo se muestran al dueño, que anular es solo del dueño
(el motor igual responde 403), que las rutas usan ids validados, que no hay cálculos de cantidades en el cliente y
que no hay emojis ni colores directos.

| Hallazgo | Corrección |
|---|---|
| **M1:** tras registrar una producción y pulsar "Cargar más", la página siguiente del motor repetía una producción ya listada | Al agregar una página se descartan las producciones que ya están en la lista |
| **M2:** un pedido de plan en curso seguía actualizando el estado y podía pedir otro plan después de cerrar el formulario | Al desmontar se anula la cantidad vigente: la respuesta se descarta y no se pide nada más |
| **M3:** mientras se escribía, "Esperado" mostraba el plan de la cantidad anterior, y un fallo del plan no se avisaba | Lo esperado se borra al cambiar la cantidad; la pantalla dice "Calculando lo esperado..." y, si falla, "No se pudo calcular lo esperado; puedes registrar igual." |
| **M4:** errores 422 sin campo en pantalla (`location`, `notes`, `template_id`), claves sin subcampo (`outputs.0`) y un error general del motor que podía pisarse; los errores de peso no se borraban al corregir | Esos errores van al aviso general; las claves sin subcampo se traducen; el error general nunca se pisa; corregir un peso borra su error |
| **M5:** tras anular, el foco caía en el cuerpo de la página (el botón ya no existe) y Tab salía del diálogo | El foco vuelve al título de la producción y Tab queda dentro del diálogo |
| **M6:** faltaban tests de idempotencia tras 409, 422, 500 y 200, de desmontar, de respuestas viejas y del mapeo con una entrada en blanco | Tests agregados (ver mutaciones 20 a 28) |
| **L1, L2:** "Sin dato (Sin dato)" y "Esperado: Sin dato kg" | Un solo "Sin dato"; la línea de esperado se oculta si el motor no la calculó |
| **L3:** `'1e2'` pasaba la validación de id y se enviaba 1 | Los ids se validan con `^\d+$` |
| **L4:** un pedido de plan duplicado al reintentar | Solo se vuelve a pedir si el temporizador venció durante el pedido |
| **L5:** contenedores de error que no siempre existían | Contenedores `aria-live` siempre montados |

Al escribir la mutación de M2 se vio que la comprobación de "montado" era redundante (anular la cantidad vigente ya
lo cubre), así que se quitó y se mutó la protección real.

Sin cambios: estilos repetidos entre pantallas (cosmético).

## 4. Mutaciones

Cada mutación se aplicó con un script, se ejecutaron los tests indicados y se restauró el archivo. Las salidas son las reales de esa ejecución (2026-10-09), sin editar salvo los símbolos de terminal (`[ok]`, `[x]` y `>`). Resultado: **28 de 28 detectadas**.

### Mutación 1: Aceptar cualquier formato de cantidad

- **Archivo:** `src/services/productionClient.js`
- **Original:** `return QUANTITY_FORMAT.test(value) ? value : null;`
- **Mutado:** `return value;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/productionClient.test.js (11 tests | 3 failed) 21ms
   [x] productionClient > normalizeProductionQuantity > rejects invalid formats 7ms
     > expected '' to be null
   [x] productionClient > requests the plan with a normalized quantity and rejects zero or invalid 4ms
     > expected true to be false // Object.is equality
   [x] productionClient > recordRun > rejects invalid data without calling the engine 1ms
     > expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  3 failed | 8 passed (11)
   Start at  23:02:11
   Duration  2.31s (transform 68ms, setup 254ms, collect 68ms, tests 21ms, environment 1.61s, prepare 114ms)

------- Failed Tests 3 -------

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > normalizeProductionQuantity > rejects invalid formats
AssertionError: expected '' to be null

- Expected: 
null

+ Received: 
""

 > src/services/__tests__/productionClient.test.js:31:52
     29|     it('rejects invalid formats', () => {
     30|       ['', '1.2345', '-1', 'abc', '1,2,3', '12345678', null, undefined...
     31|         expect(normalizeProductionQuantity(value)).toBeNull();
       |                                                    ^
     32|       });
     33|     });
 > src/services/__tests__/productionClient.test.js:30:73

------------------------[1/3]-

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > requests the plan with a normalized quantity and rejects zero or invalid
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/productionClient.test.js:65:22
     63|     for (const value of ['0', '1.2345', '']) {
     64|       const res = await getPlan(3, value);
     65|       expect(res.ok).toBe(false);
       |                      ^
     66|       expect(res.status).toBe(422);
     67|     }

------------------------[2/3]-

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > recordRun > rejects invalid data without calling the engine
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/productionClient.test.js:129:24
    127|       for (const payload of cases) {
    128|         const res = await recordRun(payload, 'uuid');
    129|         expect(res.ok).toBe(false);
       |                        ^
    130|         expect(res.status).toBe(422);
    131|       }

------------------------[3/3]-
```

### Mutación 2: Aceptar entradas en 0

- **Archivo:** `src/services/productionClient.js`
- **Original:** `if (!itemId || quantity === null || (positive && !isPositive(quantity))) return null;`
- **Mutado:** `if (!itemId || quantity === null) return null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/productionClient.test.js (11 tests | 1 failed) 22ms
   [x] productionClient > recordRun > rejects invalid data without calling the engine 9ms
     > expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:02:16
   Duration  2.19s (transform 91ms, setup 267ms, collect 90ms, tests 22ms, environment 1.36s, prepare 184ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > recordRun > rejects invalid data without calling the engine
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/productionClient.test.js:129:24
    127|       for (const payload of cases) {
    128|         const res = await recordRun(payload, 'uuid');
    129|         expect(res.ok).toBe(false);
       |                        ^
    130|         expect(res.status).toBe(422);
    131|       }

------------------------[1/1]-
```

### Mutación 3: Aceptar ubicaciones fuera de la lista

- **Archivo:** `src/services/productionClient.js`
- **Original:** `if (location && !isValidLocation(location)) return { error: 'Ubicación no válida.' };`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/productionClient.test.js (11 tests | 1 failed) 19ms
   [x] productionClient > recordRun > rejects invalid data without calling the engine 8ms
     > expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:02:20
   Duration  2.14s (transform 68ms, setup 265ms, collect 73ms, tests 19ms, environment 1.37s, prepare 108ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > recordRun > rejects invalid data without calling the engine
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/productionClient.test.js:129:24
    127|       for (const payload of cases) {
    128|         const res = await recordRun(payload, 'uuid');
    129|         expect(res.ok).toBe(false);
       |                        ^
    130|         expect(res.status).toBe(422);
    131|       }

------------------------[1/1]-
```

### Mutación 4: Anular sin motivo

- **Archivo:** `src/services/productionClient.js`
- **Original:** `if (trimmed === '' || trimmed.length > MAX_REASON)`
- **Mutado:** `if (false)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/productionClient.test.js (11 tests | 1 failed) 20ms
   [x] productionClient > voidRun > rejects an empty or too long reason and invalid ids 8ms
     > expected 200 to be 422 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:02:24
   Duration  2.17s (transform 74ms, setup 317ms, collect 78ms, tests 20ms, environment 1.38s, prepare 106ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > voidRun > rejects an empty or too long reason and invalid ids
AssertionError: expected 200 to be 422 // Object.is equality

- Expected
+ Received

- 422
+ 200

 > src/services/__tests__/productionClient.test.js:143:48
    141| 
    142|     it('rejects an empty or too long reason and invalid ids', async ()...
    143|       expect((await voidRun(5, '   ')).status).toBe(422);
       |                                                ^
    144|       expect((await voidRun(5, 'x'.repeat(256))).status).toBe(422);
    145|       expect((await voidRun(-1, 'Error')).status).toBe(400);

------------------------[1/1]-
```

### Mutación 5: No renovar el client_uuid tras un 201

- **Archivo:** `src/hooks/useProductionRunForm.js`
- **Original:** `uuidRef.current = generateClientUuid(); if (onRecorded)`
- **Mutado:** `if (onRecorded)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRunForm.test.js (7 tests | 2 failed) 45ms
   [x] useProductionRunForm > reuses the client_uuid after a network error and renews it after a 201 13ms
     > expected '40040b26-f08e-47f7-a7bc-def98aece00d' not to be '40040b26-f08e-47f7-a7bc-def98aece00d' // Object.is equality
   [x] useProductionRunForm > keeps the client_uuid after 409, 422 and 500, and renews it after an idempotent 200 4ms
     > expected '0cd2a467-de73-427a-aa02-57ec454a2b85' not to be '0cd2a467-de73-427a-aa02-57ec454a2b85' // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
   Start at  23:02:28
   Duration  2.14s (transform 92ms, setup 248ms, collect 118ms, tests 45ms, environment 1.32s, prepare 126ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected '40040b26-f08e-47f7-a7bc-def98aece00d' not to be '40040b26-f08e-47f7-a7bc-def98aece00d' // Object.is equality
 > src/hooks/__tests__/useProductionRunForm.test.js:51:23
     49|     const [first, second, third] = spy.mock.calls.map((call) => call[1...
     50|     expect(second).toBe(first);
     51|     expect(third).not.toBe(first);
       |                       ^
     52|     expect(onRecorded).toHaveBeenCalledWith(recordedRun, false);
     53|     expect(spy.mock.calls[0][0].inputs).toEqual([{ item_id: 1, quantit...

------------------------[1/2]-

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > keeps the client_uuid after 409, 422 and 500, and renews it after an idempotent 200
AssertionError: expected '0cd2a467-de73-427a-aa02-57ec454a2b85' not to be '0cd2a467-de73-427a-aa02-57ec454a2b85' // Object.is equality
 > src/hooks/__tests__/useProductionRunForm.test.js:101:26
     99|     const uuids = spy.mock.calls.map((call) => call[1]);
    100|     expect(new Set(uuids.slice(0, 4)).size).toBe(1);
    101|     expect(uuids[4]).not.toBe(uuids[0]);
       |                          ^
    102|   });
    103| 

------------------------[2/2]-
```

### Mutación 6: uuid nuevo en cada envío

- **Archivo:** `src/hooks/useProductionRunForm.js`
- **Original:** `const res = await recordRun(payload, uuidRef.current);`
- **Mutado:** `uuidRef.current = generateClientUuid();
    const res = await recordRun(payload, uuidRef.current);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRunForm.test.js (7 tests | 2 failed) 49ms
   [x] useProductionRunForm > reuses the client_uuid after a network error and renews it after a 201 17ms
     > expected 'd3bdd2d4-8db5-48d1-928f-de0cb55e22e5' to be '64441ec8-cae3-49b5-aa4e-4333b285aab7' // Object.is equality
   [x] useProductionRunForm > keeps the client_uuid after 409, 422 and 500, and renews it after an idempotent 200 4ms
     > expected 4 to be 1 // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
   Start at  23:02:32
   Duration  2.30s (transform 94ms, setup 267ms, collect 121ms, tests 49ms, environment 1.51s, prepare 106ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected 'd3bdd2d4-8db5-48d1-928f-de0cb55e22e5' to be '64441ec8-cae3-49b5-aa4e-4333b285aab7' // Object.is equality

Expected: "64441ec8-cae3-49b5-aa4e-4333b285aab7"
Received: "d3bdd2d4-8db5-48d1-928f-de0cb55e22e5"

 > src/hooks/__tests__/useProductionRunForm.test.js:50:20
     48| 
     49|     const [first, second, third] = spy.mock.calls.map((call) => call[1...
     50|     expect(second).toBe(first);
       |                    ^
     51|     expect(third).not.toBe(first);
     52|     expect(onRecorded).toHaveBeenCalledWith(recordedRun, false);

------------------------[1/2]-

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > keeps the client_uuid after 409, 422 and 500, and renews it after an idempotent 200
AssertionError: expected 4 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 4

 > src/hooks/__tests__/useProductionRunForm.test.js:100:45
     98|     }
     99|     const uuids = spy.mock.calls.map((call) => call[1]);
    100|     expect(new Set(uuids.slice(0, 4)).size).toBe(1);
       |                                             ^
    101|     expect(uuids[4]).not.toBe(uuids[0]);
    102|   });

------------------------[2/2]-
```

### Mutación 7: Errores 422 sin traducir la posición enviada

- **Archivo:** `src/hooks/productionForm.js`
- **Original:** `const line = payload[match[1]]?.[Number(match[2])];`
- **Mutado:** `const line = null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRunForm.test.js (7 tests | 1 failed) 47ms
   [x] useProductionRunForm > shows the engine message on a 409 and field errors on a 422 10ms
     > expected undefined to be 'Se esperaban 8.000.' // Object.is equality
 > src/hooks/__tests__/productionForm.test.js (7 tests | 2 failed) 4ms
   [x] productionForm > translates engine errors by the position of the line that was sent 1ms
     > expected undefined to be 'Esta ficha no permite ajustar la sali...' // Object.is equality
   [x] productionForm > maps keys without sub-field and positions shifted by a blank earlier line 1ms
     > expected undefined to be 'Falta' // Object.is equality

 Test Files  2 failed (2)
      Tests  3 failed | 11 passed (14)
   Start at  23:02:36
   Duration  2.20s (transform 90ms, setup 273ms, collect 127ms, tests 50ms, environment 1.34s, prepare 117ms)

------- Failed Tests 3 -------

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > translates engine errors by the position of the line that was sent
AssertionError: expected undefined to be 'Esta ficha no permite ajustar la sali...' // Object.is equality

- Expected: 
"Esta ficha no permite ajustar la salida."

+ Received: 
undefined

 > src/hooks/__tests__/productionForm.test.js:74:32
     72|     }, payload);
     73| 
     74|     expect(mapped['output:4']).toBe('Esta ficha no permite ajustar la ...
       |                                ^
     75|     expect(mapped['input:1']).toBe('No es una entrada de la ficha.');
     76|     // El error general del motor no se pisa con el de una línea que n...

------------------------[1/3]-

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > maps keys without sub-field and positions shifted by a blank earlier line
AssertionError: expected undefined to be 'Falta' // Object.is equality

- Expected: 
"Falta"

+ Received: 
undefined

 > src/hooks/__tests__/productionForm.test.js:86:31
     84| 
     85|     const mapped = mapServerErrors({ 'inputs.0': ['Falta'], 'outputs.0...
     86|     expect(mapped['input:1']).toBe('Falta');
       |                               ^
     87|     expect(mapped['input:9']).toBeUndefined();
     88|     expect(mapped['output:2']).toBe('Se esperaban 8.');

------------------------[2/3]-

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > shows the engine message on a 409 and field errors on a 422
AssertionError: expected undefined to be 'Se esperaban 8.000.' // Object.is equality

- Expected: 
"Se esperaban 8.000."

+ Received: 
undefined

 > src/hooks/__tests__/useProductionRunForm.test.js:77:52
     75|     await act(async () => { await result.current.submit(); });
     76|     expect(result.current.error).toBe('Datos inválidos.');
     77|     expect(result.current.fieldErrors['output:2']).toBe('Se esperaban ...
       |                                                    ^
     78|     expect(result.current.fieldErrors.main_output_weight).toContain('N...
     79|     expect(spy).toHaveBeenCalledTimes(2);

------------------------[3/3]-
```

### Mutación 8: Enviar también las líneas vacías

- **Archivo:** `src/hooks/productionForm.js`
- **Original:** `.filter((line) => String(values[keyOf(line.item_id)] || '').trim() !== '')`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/inventory/production/__tests__/ProductionEdgeCases.test.jsx (6 tests) 743ms
   [ok] ProductionRunForm plan status > says it is calculating, then that the plan failed, and shows general engine errors 503ms
 [ok] src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests) 354ms
 > src/components/inventory/production/__tests__/ProductionView.test.jsx (4 tests | 1 failed) 1109ms
   [x] ProductionView > a member picks a template, sees the engine plan, records and sees the result 500ms
     > expected [ { item_id: 2, quantity: '8' }, ...(2) ] to deeply equal [ { item_id: 2, quantity: '8' } ]
   [ok] ProductionView > a sum-scaled template explains that the expected amounts come at the end 536ms
 > src/hooks/__tests__/productionForm.test.js (7 tests | 2 failed) 5ms
   [x] productionForm > sends only written lines in template order, including 0 2ms
     > expected [ { item_id: 2, quantity: '9' }, ...(2) ] to deeply equal [ { item_id: 2, quantity: '9' }, ...(1) ]
   [x] productionForm > maps keys without sub-field and positions shifted by a blank earlier line 1ms
     > expected [ { item_id: 9, ...(1) }, ...(1) ] to deeply equal [ { item_id: 1, quantity: '4' } ]

 Test Files  2 failed | 2 passed (4)
      Tests  3 failed | 24 passed (27)
   Start at  23:02:40
   Duration  4.60s (transform 181ms, setup 257ms, collect 374ms, tests 2.21s, environment 1.37s, prepare 118ms)

------- Failed Tests 3 -------

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > sends only written lines in template order, including 0
AssertionError: expected [ { item_id: 2, quantity: '9' }, ...(2) ] to deeply equal [ { item_id: 2, quantity: '9' }, ...(1) ]

- Expected
+ Received

  Array [
    Object {
      "item_id": 2,
      "quantity": "9",
    },
    Object {
+     "item_id": 3,
+     "quantity": "",
+   },
+   Object {
      "item_id": 4,
      "quantity": "0",
    },
  ]

 > src/hooks/__tests__/productionForm.test.js:62:29
     60|     expect(payload.templateId).toBe(3);
     61|     expect(payload.inputs).toEqual([{ item_id: 1, quantity: '4,5' }]);
     62|     expect(payload.outputs).toEqual([{ item_id: 2, quantity: '9' }, { ...
       |                             ^
     63|   });
     64| 

------------------------[1/3]-

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > maps keys without sub-field and positions shifted by a blank earlier line
AssertionError: expected [ { item_id: 9, ...(1) }, ...(1) ] to deeply equal [ { item_id: 1, quantity: '4' } ]

- Expected
+ Received

  Array [
    Object {
+     "item_id": 9,
+     "quantity": "undefined",
+   },
+   Object {
      "item_id": 1,
      "quantity": "4",
    },
  ]

 > src/hooks/__tests__/productionForm.test.js:83:28
     81|     const template = { ...lomoTemplate, inputs: [{ item_id: 9, unit: '...
     82|     const payload = buildPayload(template, formWith({ 'input:1': '4', ...
     83|     expect(payload.inputs).toEqual([{ item_id: 1, quantity: '4' }]);
       |                            ^
     84| 
     85|     const mapped = mapServerErrors({ 'inputs.0': ['Falta'], 'outputs.0...

------------------------[2/3]-

 FAIL  src/components/inventory/production/__tests__/ProductionView.test.jsx > ProductionView > a member picks a template, sees the engine plan, records and sees the result
AssertionError: expected [ { item_id: 2, quantity: '8' }, ...(2) ] to deeply equal [ { item_id: 2, quantity: '8' } ]

- Expected
+ Received

  Array [
    Object {
      "item_id": 2,
      "quantity": "8",
    },
+   Object {
+     "item_id": 3,
+     "quantity": "",
+   },
+   Object {
+     "item_id": 4,
+     "quantity": "",
+   },
  ]

 > src/components/inventory/production/__tests__/ProductionView.test.jsx:40:45
     38| 
     39|     await waitFor(() => expect(screen.getByText('Producción registrada...
     40|     expect(record.mock.calls[0][0].outputs).toEqual([{ item_id: 2, qua...
       |                                             ^
     41|     expect(screen.getByText('Rendimiento real')).toBeInTheDocument();
     42|     expect(screen.getByText('-10 %')).toBeInTheDocument();

------------------------[3/3]-
```

### Mutación 9: No exigir el peso de las porciones

- **Archivo:** `src/hooks/productionForm.js`
- **Original:** `weightError(form.mainOutputWeight, template.requires_weight_control,`
- **Mutado:** `weightError(form.mainOutputWeight, false,`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRunForm.test.js (7 tests | 1 failed) 45ms
   [x] useProductionRunForm > starts at the template location and does not send when the form is invalid 24ms
     > expected undefined to be defined
 > src/hooks/__tests__/productionForm.test.js (7 tests | 1 failed) 4ms
   [x] productionForm > requires weight and waste only when the template does 2ms
     > expected undefined to be 'Registra el peso de las porciones pri...' // Object.is equality

 Test Files  2 failed (2)
      Tests  2 failed | 12 passed (14)
   Start at  23:02:47
   Duration  2.16s (transform 95ms, setup 254ms, collect 137ms, tests 49ms, environment 1.36s, prepare 109ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > requires weight and waste only when the template does
AssertionError: expected undefined to be 'Registra el peso de las porciones pri...' // Object.is equality

- Expected: 
"Registra el peso de las porciones principales."

+ Received: 
undefined

 > src/hooks/__tests__/productionForm.test.js:50:39
     48|     const missing = formWith({ 'input:1': '4' }, { mainOutputWeight: '...
     49|     const errors = validateForm(lomoTemplate, missing);
     50|     expect(errors.main_output_weight).toBe('Registra el peso de las po...
       |                                       ^
     51|     expect(errors.waste_quantity).toBe('Registra la merma que se tira ...
     52| 

------------------------[1/2]-

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > starts at the template location and does not send when the form is invalid
AssertionError: expected undefined to be defined
 > src/hooks/__tests__/useProductionRunForm.test.js:32:59
     30|     expect(result.current.error).toBe('Revisa los datos marcados.');
     31|     expect(result.current.fieldErrors.inputs).toBeDefined();
     32|     expect(result.current.fieldErrors.main_output_weight).toBeDefined(...
       |                                                           ^
     33|   });
     34| 

------------------------[2/2]-
```

### Mutación 10: Pedir el plan sin esperar 400 ms

- **Archivo:** `src/hooks/useProductionPlan.js`
- **Original:** `const DEBOUNCE_MS = 400;`
- **Mutado:** `const DEBOUNCE_MS = 0;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionPlan.test.js (7 tests | 1 failed) 66ms
   [x] useProductionPlan > waits 400 ms after the last keystroke and shows the engine plan 37ms
     > expected "getPlan" to not be called at all, but actually been called 1 times

Received: 

  1st getPlan call:

    Array [
      3,
      "4.5",
    ]


Number of calls: 1


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  23:02:51
   Duration  2.25s (transform 89ms, setup 295ms, collect 96ms, tests 66ms, environment 1.37s, prepare 125ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > waits 400 ms after the last keystroke and shows the engine plan
AssertionError: expected "getPlan" to not be called at all, but actually been called 1 times

Received: 

  1st getPlan call:

    Array [
      3,
      "4.5",
    ]


Number of calls: 1

 > src/hooks/__tests__/useProductionPlan.test.js:27:21
     25|     rerender({ q: '4,5' });
     26|     await act(async () => { vi.advanceTimersByTime(399); });
     27|     expect(spy).not.toHaveBeenCalled();
       |                     ^
     28| 
     29|     await act(async () => { vi.advanceTimersByTime(1); });

------------------------[1/1]-
```

### Mutación 11: Permitir pedidos de plan superpuestos

- **Archivo:** `src/hooks/useProductionPlan.js`
- **Original:** `if (inFlightRef.current) { pendingRef.current = true; return; }`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionPlan.test.js (7 tests | 2 failed) 43ms
   [x] useProductionPlan > never overlaps requests and ends with the plan of the latest quantity 9ms
     > expected "getPlan" to be called 1 times, but got 2 times
   [x] useProductionPlan > after unmount it neither asks for more plans nor updates state 3ms
     > expected "getPlan" to be called 1 times, but got 2 times

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
   Start at  23:02:55
   Duration  2.41s (transform 94ms, setup 276ms, collect 102ms, tests 43ms, environment 1.53s, prepare 156ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > never overlaps requests and ends with the plan of the latest quantity
AssertionError: expected "getPlan" to be called 1 times, but got 2 times
 > src/hooks/__tests__/useProductionPlan.test.js:56:17
     54|     rerender({ q: '3' });
     55|     await act(async () => { vi.advanceTimersByTime(400); });
     56|     expect(spy).toHaveBeenCalledTimes(1);
       |                 ^
     57| 
     58|     await act(async () => { resolveFirst(planFor('2')); });

------------------------[1/2]-

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > after unmount it neither asks for more plans nor updates state
AssertionError: expected "getPlan" to be called 1 times, but got 2 times
 > src/hooks/__tests__/useProductionPlan.test.js:91:17
     89|     await act(async () => { resolveFirst(planFor('4')); });
     90|     await act(async () => { vi.advanceTimersByTime(1000); });
     91|     expect(spy).toHaveBeenCalledTimes(1);
       |                 ^
     92|   });
     93| 

------------------------[2/2]-
```

### Mutación 12: Aceptar la respuesta de una cantidad vieja

- **Archivo:** `src/hooks/useProductionPlan.js`
- **Original:** `if (requested === latestRef.current) {`
- **Mutado:** `if (true) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionPlan.test.js (7 tests | 2 failed) 46ms
   [x] useProductionPlan > never overlaps requests and ends with the plan of the latest quantity 9ms
     > expected "getPlan" to be called 2 times, but got 1 times
   [x] useProductionPlan > a stale response is discarded and the pending timer asks once for the latest 6ms
     > expected { 'input:1': 2, 'output:2': 4 } to deeply equal {}

 Test Files  1 failed (1)
      Tests  2 failed | 5 passed (7)
   Start at  23:02:59
   Duration  2.13s (transform 80ms, setup 261ms, collect 88ms, tests 46ms, environment 1.34s, prepare 115ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > never overlaps requests and ends with the plan of the latest quantity
AssertionError: expected "getPlan" to be called 2 times, but got 1 times
 > src/hooks/__tests__/useProductionPlan.test.js:59:17
     57| 
     58|     await act(async () => { resolveFirst(planFor('2')); });
     59|     expect(spy).toHaveBeenCalledTimes(2);
       |                 ^
     60|     expect(spy).toHaveBeenLastCalledWith(3, '3');
     61|     expect(result.current.expected).toEqual({ 'input:1': 3, 'output:2'...

------------------------[1/2]-

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > a stale response is discarded and the pending timer asks once for the latest
AssertionError: expected { 'input:1': 2, 'output:2': 4 } to deeply equal {}

- Expected
+ Received

- Object {}
+ Object {
+   "input:1": 2,
+   "output:2": 4,
+ }

 > src/hooks/__tests__/useProductionPlan.test.js:105:37
    103|     rerender({ q: '5' });
    104|     await act(async () => { resolveFirst(planFor('2')); });
    105|     expect(result.current.expected).toEqual({});
       |                                     ^
    106|     expect(spy).toHaveBeenCalledTimes(1);
    107| 

------------------------[2/2]-
```

### Mutación 13: Pedir plan en fichas que escalan por la suma

- **Archivo:** `src/hooks/productionForm.js`
- **Original:** `return (template?.inputs || []).find((line) => line.is_primary) || null;`
- **Mutado:** `return (template?.inputs || []).find((line) => line.is_primary) || (template?.inputs || [])[0] || null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionView.test.jsx (4 tests | 1 failed) 771ms
   [ok] ProductionView > a member picks a template, sees the engine plan, records and sees the result 622ms
   [x] ProductionView > a sum-scaled template explains that the expected amounts come at the end 36ms
     > Unable to find an element with the text: Las cantidades esperadas se calculan al registrar.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-scissors"
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
            <circle
              cx="6"
              cy="6"
              r="3"
            />
            <path
              d="M8.12 8.12 12 12"
            />
            <path
              d="M20 4 8.12 15.88"
            />
            <circle
              cx="6"
              cy="18"
              r="3"
            />
            <path
              d="M14.8 14.8 20 20"
            />
          </svg>
          <span>
            Producción y porcionado
          </span>
        </h2>
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px;"
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
            Inventario
          </span>
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <form
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
            Elegir otra ficha
          </span>
        </button>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
        >
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main); display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-scissors"
              fill="none"
              height="16"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="6"
                cy="6"
                r="3"
              />
              <path
                d="M8.12 8.12 12 12"
              />
              <path
                d="M20 4 8.12 15.88"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path
                d="M14.8 14.8 20 20"
              />
            </svg>
            <span>
              Carne Hamburguesas
            </span>
          </h3>
          <p
            aria-live="polite"
            style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
          >
            Escribe la entrada principal para ver lo esperado.
          </p>
        </div>
        <div
          aria-live="polite"
        />
        <div>
          <label
            for=[...
 > src/hooks/__tests__/productionForm.test.js (7 tests | 1 failed) 7ms
   [x] productionForm > finds the basis input only when the template has a primary one 4ms
     > expected { item_id: 4, ...(4) } to be null

 Test Files  2 failed (2)
      Tests  2 failed | 9 passed (11)
   Start at  23:03:03
   Duration  3.19s (transform 163ms, setup 292ms, collect 305ms, tests 778ms, environment 1.43s, prepare 113ms)

------- Failed Tests 2 -------

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > finds the basis input only when the template has a primary one
AssertionError: expected { item_id: 4, ...(4) } to be null

- Expected: 
null

+ Received: 
Object {
  "is_primary": false,
  "item_id": 4,
  "item_name": "Merma de lomo",
  "quantity": 1,
  "unit": "kg",
}

 > src/hooks/__tests__/productionForm.test.js:25:40
     23|   it('finds the basis input only when the template has a primary one',...
     24|     expect(basisInput(lomoTemplate).item_id).toBe(1);
     25|     expect(basisInput(burgerTemplate)).toBeNull();
       |                                        ^
     26|   });
     27| 

------------------------[1/2]-

 FAIL  src/components/inventory/production/__tests__/ProductionView.test.jsx > ProductionView > a sum-scaled template explains that the expected amounts come at the end
TestingLibraryElementError: Unable to find an element with the text: Las cantidades esperadas se calculan al registrar.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-scissors"
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
            <circle
              cx="6"
              cy="6"
              r="3"
            />
            <path
              d="M8.12 8.12 12 12"
            />
            <path
              d="M20 4 8.12 15.88"
            />
            <circle
              cx="6"
              cy="18"
              r="3"
            />
            <path
              d="M14.8 14.8 20 20"
            />
          </svg>
          <span>
            Producción y porcionado
          </span>
        </h2>
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px;"
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
            Inventario
          </span>
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <form
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
            Elegir otra ficha
          </span>
        </button>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
        >
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main); display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-scissors"
              fill="none"
              height="16"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="6"
                cy="6"
                r="3"
              />
              <path
                d="M8.12 8.12 12 12"
              />
              <path
                d="M20 4 8.12 15.88"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path
                d="M14.8 14.8 20 20"
              />
            </svg>
            <span>
              Carne Hamburguesas
            </span>
          </h3>
          <p
            aria-live="polite"
            style="font-size: 12px; color: var(--text-muted); margin: 4px 0px 0px;"
          >
            Escribe la entrada principal para ver lo esperado.
          </p>
        </div>
        <div
          aria-live="polite"
        />
        <div>
          <label
            for=[...
 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/inventory/production/__tests__/ProductionView.test.jsx:52:19
     50|     fireEvent.click(screen.getByText('Carne Hamburguesas'));
     51| 
     52|     expect(screen.getByText('Las cantidades esperadas se calculan al r...
       |                   ^
     53|     fireEvent.change(screen.getByLabelText('Merma de lomo'), { target:...
     54|     await new Promise((resolve) => setTimeout(resolve, 500));

------------------------[2/2]-
```

### Mutación 14: Mostrar costos al personal

- **Archivo:** `src/components/inventory/production/ProductionRunDetail.jsx`
- **Original:** `const showCost = isOwner && run.cost_status !== undefined;`
- **Mutado:** `const showCost = true;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 485ms
   [x] ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff 181ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  style="font-size: 11px; color: var(--text-muted);"
>
  Costo de las entradas
</div> instead

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:03:08
   Duration  2.72s (transform 132ms, setup 247ms, collect 231ms, tests 485ms, environment 1.36s, prepare 118ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  style="font-size: 11px; color: var(--text-muted);"
>
  Costo de las entradas
</div> instead
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:21:61
     19|     expect(diff).toHaveStyle({ color: 'var(--warning)' });
     20|     expect(screen.getByText('0,05 kg (1,25 %)')).toBeInTheDocument();
     21|     expect(screen.queryByText('Costo de las entradas')).not.toBeInTheD...
       |                                                             ^
     22|     expect(screen.queryByText('Anular')).not.toBeInTheDocument();
     23|   });

------------------------[1/1]-
```

### Mutación 15: Botón Anular para el personal

- **Archivo:** `src/components/inventory/production/ProductionRunDetail.jsx`
- **Original:** `{isOwner && !voided && (`
- **Mutado:** `{!voided && (`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 477ms
   [x] ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff 186ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span>
  Anular
</span> instead

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:03:13
   Duration  2.71s (transform 121ms, setup 258ms, collect 219ms, tests 477ms, environment 1.40s, prepare 111ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span>
  Anular
</span> instead
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:22:46
     20|     expect(screen.getByText('0,05 kg (1,25 %)')).toBeInTheDocument();
     21|     expect(screen.queryByText('Costo de las entradas')).not.toBeInTheD...
     22|     expect(screen.queryByText('Anular')).not.toBeInTheDocument();
       |                                              ^
     23|   });
     24| 

------------------------[1/1]-
```

### Mutación 16: Advertencia con la diferencia positiva

- **Archivo:** `src/components/inventory/production/ProductionRunDetail.jsx`
- **Original:** `Number(run.yield_difference_pct) < 0;`
- **Mutado:** `Number(run.yield_difference_pct) > 0;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 2 failed) 496ms
   [x] ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff 186ms
     > expect(element).toHaveStyle()

- Expected

- color: var(--warning);
+ color: var(--text-main);
   [x] ProductionRunDetail > shows null metrics as "Sin dato" and a positive difference with sign 24ms
     > expect(element).not.toHaveStyle()



 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
   Start at  23:03:18
   Duration  2.84s (transform 123ms, setup 253ms, collect 212ms, tests 496ms, environment 1.51s, prepare 133ms)

------- Failed Tests 2 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > shows the engine metrics and warns a lower yield, without costs or void for staff
Error: expect(element).toHaveStyle()

- Expected

- color: var(--warning);
+ color: var(--text-main);
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:19:18
     17|     expect(screen.getByText('70 %')).toBeInTheDocument();
     18|     const diff = screen.getByText('-10 %');
     19|     expect(diff).toHaveStyle({ color: 'var(--warning)' });
       |                  ^
     20|     expect(screen.getByText('0,05 kg (1,25 %)')).toBeInTheDocument();
     21|     expect(screen.queryByText('Costo de las entradas')).not.toBeInTheD...

------------------------[1/2]-

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > shows null metrics as "Sin dato" and a positive difference with sign
Error: expect(element).not.toHaveStyle()


 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:28:44
     26|     const run = { ...recordedRun, real_yield_pct: 72.5, yield_differen...
     27|     render(<ProductionRunDetail run={run} isOwner={false} onBack={vi.f...
     28|     expect(screen.getByText('+2,5 %')).not.toHaveStyle({ color: 'var(-...
       |                                            ^
     29|     // Un solo "Sin dato" para el peso sin explicar, nunca "Sin dato (...
     30|     expect(screen.queryByText('Sin dato (Sin dato)')).not.toBeInTheDoc...

------------------------[2/2]-
```

### Mutación 17: Borrar el motivo al reintentar la anulación

- **Archivo:** `src/components/inventory/production/VoidProductionDialog.jsx`
- **Original:** `}, [isOpen, triggerRef, fallbackFocusRef]);`
- **Mutado:** `}, [isOpen, triggerRef, fallbackFocusRef, voiding]);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 1533ms
   [x] ProductionRunDetail > the owner voids with a required reason and sees the 409 of the engine 1082ms
     > expected "spy" to be called with arguments: [ ObjectContaining{...} ]

Received: 



Number of calls: 0


Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
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
            Volver a producciones
          </span>
        </button>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
        >
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
            tabindex="-1"
          >
            Lomo porcionado
          </h3>
          <p
            style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
          >
            Cocina
            , 
            9/10/26, 3:30 p. m.
            . 
            Registrada
            .
          </p>
        </div>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"
        >
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Rendimiento real
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              60 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Esperado
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              70 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Diferencia
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--warning);"
            >
              -10 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Peso sin explicar
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,05 kg (1,25 %)
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Entradas
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              4 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Porciones
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              2,4 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Subproductos
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,9 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Merma que se tira
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,65 kg
            </div>
          </div>
        </div>
        <h4
          style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
        >
          Entradas
        </h4>
        <div
          style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
        >
          <div
            style="min-width: 0px;"
          >
            <div
              style="font-weight: 600; color: var(--text-main);"
            >
              Lomo Fino Kg
            </div>
            <div
              style="color: var(--text-muted);"
            >
              Esperado: 
              4
               
              kg
            </div>
          </div>
          <div
            style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
          >
            4
             
            kg
          </div>
        </div>
        <h4
          style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
        >
          Salidas
        </h4>
        <div
          style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
        >
          <div
            style="min-width: 0px;"
          >
            <div
              style="font-weight: 600; color: var(--text-main);"
            >
              Lomo Fino Unidad
               (principal)
            </div>
            <div
              style="color: var(--text-muted);"
            >
              Esperado: 
              8
               
              unit
            </div>
          </div>
          <div
            style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
          >
            8
             
            unit
          </div>
        </div>
        <button
          style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
          type="button"
        >
          <svg
            class="lucide lucide-ban"
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
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path
              d="m4.9 4.9 14.2 14.2"
            />
          </svg>
          <span>
            Anular
          </span>
        </button>
        <div
          style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
        >
          <div
            aria-labelledby="void-production-title"
            aria-modal="true"
            class="glass-card"
            role="dialog"
            style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
          >
            <h3
              id="void-production-title"
              style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
            >
              Anular producción
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
              <span>
                Se devuelve la pieza y se retiran las porciones de la ubicación. No se puede deshacer.
              </span>
            </div>
            <div>
              <label
                for="void-production-reason"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Motivo
              </label>
              <textarea
                id="void-production-reason"
                maxlength="255"
                rows="3"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
              />
            </div>
            <div
              aria-live="polite"
              style="font-size: 12px; color: var(--error);"
            >
              Stock insuficiente para 'Lomo Fino Unidad' en Cocina.
            </div>
            <div
              style="display: flex; gap: 10px;"
            >
              <button
                style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                type="button"
              >
                Volver
              </button>
              <button
                class="btn-primary"
                disabled=""
                style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: default; opacity: 0.6;"
                type="button"
              >
                Anular
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:03:23
   Duration  4.24s (transform 118ms, setup 303ms, collect 212ms, tests 1.53s, environment 1.74s, prepare 124ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > the owner voids with a required reason and sees the 409 of the engine
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{...} ]

Received: 



Number of calls: 0


Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
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
            Volver a producciones
          </span>
        </button>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
        >
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
            tabindex="-1"
          >
            Lomo porcionado
          </h3>
          <p
            style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
          >
            Cocina
            , 
            9/10/26, 3:30 p. m.
            . 
            Registrada
            .
          </p>
        </div>
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"
        >
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Rendimiento real
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              60 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Esperado
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              70 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Diferencia
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--warning);"
            >
              -10 %
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Peso sin explicar
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,05 kg (1,25 %)
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Entradas
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              4 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Porciones
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              2,4 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Subproductos
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,9 kg
            </div>
          </div>
          <div>
            <div
              style="font-size: 11px; color: var(--text-muted);"
            >
              Merma que se tira
            </div>
            <div
              style="font-size: 14px; font-weight: 700; color: var(--text-main);"
            >
              0,65 kg
            </div>
          </div>
        </div>
        <h4
          style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
        >
          Entradas
        </h4>
        <div
          style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
        >
          <div
            style="min-width: 0px;"
          >
            <div
              style="font-weight: 600; color: var(--text-main);"
            >
              Lomo Fino Kg
            </div>
            <div
              style="color: var(--text-muted);"
            >
              Esperado: 
              4
               
              kg
            </div>
          </div>
          <div
            style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
          >
            4
             
            kg
          </div>
        </div>
        <h4
          style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
        >
          Salidas
        </h4>
        <div
          style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
        >
          <div
            style="min-width: 0px;"
          >
            <div
              style="font-weight: 600; color: var(--text-main);"
            >
              Lomo Fino Unidad
               (principal)
            </div>
            <div
              style="color: var(--text-muted);"
            >
              Esperado: 
              8
               
              unit
            </div>
          </div>
          <div
            style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
          >
            8
             
            unit
          </div>
        </div>
        <button
          style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
          type="button"
        >
          <svg
            class="lucide lucide-ban"
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
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path
              d="m4.9 4.9 14.2 14.2"
            />
          </svg>
          <span>
            Anular
          </span>
        </button>
        <div
          style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1250; display: flex; align-items: center; justify-content: center; padding: 16px;"
        >
          <div
            aria-labelledby="void-production-title"
            aria-modal="true"
            class="glass-card"
            role="dialog"
            style="width: 100%; max-width: 420px; padding: 22px; border-radius: 16px; border: 1px solid var(--border-glow); background: var(--bg-glass); display: flex; flex-direction: column; gap: 14px;"
          >
            <h3
              id="void-production-title"
              style="font-size: 17px; font-weight: 700; margin: 0px; color: var(--text-main);"
            >
              Anular producción
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
              <span>
                Se devuelve la pieza y se retiran las porciones de la ubicación. No se puede deshacer.
              </span>
            </div>
            <div>
              <label
                for="void-production-reason"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Motivo
              </label>
              <textarea
                id="void-production-reason"
                maxlength="255"
                rows="3"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
              />
            </div>
            <div
              aria-live="polite"
              style="font-size: 12px; color: var(--error);"
            >
              Stock insuficiente para 'Lomo Fino Unidad' en Cocina.
            </div>
            <div
              style="display: flex; gap: 10px;"
            >
              <button
                style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
                type="button"
              >
                Volver
              </button>
              <button
                class="btn-primary"
                disabled=""
                style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: default; opacity: 0.6;"
                type="button"
              >
                Anular
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:98:42
     96| 
     97|     fireEvent.click(confirm);
     98|     await waitFor(() => expect(onVoided).toHaveBeenCalledWith(expect.o...
       |                                          ^
     99|     expect(spy).toHaveBeenLastCalledWith(41, 'Se registró dos veces');
    100|     expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[1/1]-
```

### Mutación 18: Producción no se abre desde Inventario

- **Archivo:** `src/components/InventoryView.jsx`
- **Original:** `if (showProductionView) {`
- **Mutado:** `if (false) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/__tests__/InventoryView.test.jsx (6 tests | 1 failed) 1626ms
   [x] InventoryView component permissions and actions > staff sees "Producción" and opens the production view, without owner actions 1073ms
     > Unable to find an element with the text: Producción y porcionado. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <div>
          <h2
            class="section-title"
            style="margin: 0px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-package"
              fill="none"
              height="20"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
              />
              <path
                d="M12 22V12"
              />
              <path
                d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
              />
              <path
                d="m7.5 4.27 9 5.15"
              />
            </svg>
            <span>
              Inventario del Motor
            </span>
          </h2>
          <p
            style="font-size: 12px; color: var(--text-muted);"
          >
            Fuente de verdad del restaurante (
            1
             insumos, 
            0
             con stock bajo).
          </p>
        </div>
        <div
          style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
        >
          <button
            class="glass-card-interactive"
            style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
            type="button"
          >
            <svg
              class="lucide lucide-scissors"
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
              <circle
                cx="6"
                cy="6"
                r="3"
              />
              <path
                d="M8.12 8.12 12 12"
              />
              <path
                d="M20 4 8.12 15.88"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path
                d="M14.8 14.8 20 20"
              />
            </svg>
            <span>
              Producción
            </span>
          </button>
        </div>
      </div>
      <div
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Todos
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Stock Bajo
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Alertas
        </button>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="position: relative;"
        >
          <svg
            class="lucide lucide-search"
            fill="none"
            height="16"
            stroke="var(--text-muted)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path
              d="m21 21-4.3-4.3"
            />
          </svg>
          <input
            class="glass-input"
            placeholder="Buscar por nombre o SKU..."
            style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
            type="text"
            value=""
          />
        </div>
        <div
          style="display: flex; justify-content: flex-end; align-items: center;"
        >
          <label
            style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
          >
            <input
              role="switch"
              style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
              type="checkbox"
            />
            <span>
              Mostrar inactivos
            </span>
          </label>
        </div>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <div
              style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
            >
              <span
                style="font-size: 14px; font-weight: 600; color: var(--text-main);"
              >
                Pechuga de Pollo
              </span>
            </div>
            <div
              style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
            >
              10.500
               
              kg
            </div>
          </div>
          <div
            style="display: flex; gap: 6px;"
          >
            <button
              style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
              title="Ver historial de movimientos"
              type="button"
            >
              <svg
                class="lucide lucide-history"
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
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                />
                <path
                  d="M3 3v5h5"
                />
                <path
                  d="M12 7v5l4 2"
                />
              </svg>
            </button>
            <button
              style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <span>
                Transferir
              </span>
            </button>
            <button
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-right-left"
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
                  d="m16 3 4 4-4 4"
                />
                <path
                  d="M20 7H4"
                />
                <path
                  d="m8 21-4-4 4-4"
                />
                <path
                  d="M4 17h16"
                />
              </svg>
              <span>
                Mover
              </span>
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
        <div
          style="display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <h2
              class="section-title"
              style="margin: 0px; display: flex; align-items: center; gap: 8px;"
            >
              <svg
                class="lucide lucide-package"
                fill="none"
                height="20"
                stroke="var(--accent)"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
                />
                <path
                  d="M12 22V12"
                />
                <path
                  d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
                />
                <path
                  d="m7.5 4.27 9 5.15"
                />
              </svg>
              <span>
                Inventario del Motor
              </span>
            </h2>
            <p
              style="font-size: 12px; color: var(--text-muted);"
            >
              Fuente de verdad del restaurante (
              1
               insumos, 
              0
               con stock bajo).
            </p>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
          >
            <button
              class="glass-card-interactive"
              style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
              type="button"
            >
              <svg
                class="lucide lucide-scissors"
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
                <circle
                  cx="6"
                  cy="6"
                  r="3"
                />
                <path
                  d="M8.12 8.12 12 12"
                />
                <path
                  d="M20 4 8.12 15.88"
                />
                <circle
                  cx="6"
                  cy="18"
                  r="3"
                />
                <path
                  d="M14.8 14.8 20 20"
                />
              </svg>
              <span>
                Producción
              </span>
            </button>
          </div>
        </div>
        <div
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Todos
          </button>
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Stock Bajo
          </button>
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Alertas
          </button>
        </div>
        <div
          style="display: flex; flex-direction: column; gap: 8px;"
        >
          <div
            style="position: relative;"
          >
            <svg
              class="lucide lucide-search"
              fill="none"
              height="16"
              stroke="var(--text-muted)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path
                d="m21 21-4.3-4.3"
              />
            </svg>
            <input
              class="glass-input"
              placeholder="Buscar por nombre o SKU..."
              style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              type="text"
              value=""
            />
          </div>
          <div
            style="display: flex; justify-content: flex-end; align-items: center;"
          >
            <label
              style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
            >
              <input
                role="switch"
                style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
                type="checkbox"
              />
              <span>
                Mostrar inactivos
              </span>
            </label>
          </div>
        </div>
        <div
          style="display: flex; flex-direction: column; gap: 8px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
          >
            <div>
              <div
                style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
              >
                <span
                  style="font-size: 14px; font-weight: 600; color: var(--text-main);"
                >
                  Pechuga de Pollo
                </span>
              </div>
              <div
                style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
              >
                10.500
                 
                kg
              </div>
            </div>
            <div
              style="display: flex; gap: 6px;"
            >
              <button
                style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
                title="Ver historial de movimientos"
                type="button"
              >
                <svg
                  class="lucide lucide-history"
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
                    d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M12 7v5l4 2"
                  />
                </svg>
              </button>
              <button
                style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                type="button"
              >
                <span>
                  Transferir
                </span>
              </button>
              <button
                style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                type="button"
              >
                <svg
                  class="lucide lucide-arrow-right-left"
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
                    d="m16 3 4 4-4 4"
                  />
                  <path
                    d="M20 7H4"
                  />
                  <path
                    d="m8 21-4-4 4-4"
                  />
                  <path
                    d="M4 17h16"
                  />
                </svg>
                <span>
                  Mover
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  23:03:29
   Duration  4.09s (transform 300ms, setup 243ms, collect 529ms, tests 1.63s, environment 1.32s, prepare 111ms)

------- Failed Tests 1 -------

 FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > staff sees "Producción" and opens the production view, without owner actions
TestingLibraryElementError: Unable to find an element with the text: Producción y porcionado. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <div>
          <h2
            class="section-title"
            style="margin: 0px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-package"
              fill="none"
              height="20"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
              />
              <path
                d="M12 22V12"
              />
              <path
                d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
              />
              <path
                d="m7.5 4.27 9 5.15"
              />
            </svg>
            <span>
              Inventario del Motor
            </span>
          </h2>
          <p
            style="font-size: 12px; color: var(--text-muted);"
          >
            Fuente de verdad del restaurante (
            1
             insumos, 
            0
             con stock bajo).
          </p>
        </div>
        <div
          style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
        >
          <button
            class="glass-card-interactive"
            style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
            type="button"
          >
            <svg
              class="lucide lucide-scissors"
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
              <circle
                cx="6"
                cy="6"
                r="3"
              />
              <path
                d="M8.12 8.12 12 12"
              />
              <path
                d="M20 4 8.12 15.88"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
              />
              <path
                d="M14.8 14.8 20 20"
              />
            </svg>
            <span>
              Producción
            </span>
          </button>
        </div>
      </div>
      <div
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Todos
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Stock Bajo
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Alertas
        </button>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="position: relative;"
        >
          <svg
            class="lucide lucide-search"
            fill="none"
            height="16"
            stroke="var(--text-muted)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path
              d="m21 21-4.3-4.3"
            />
          </svg>
          <input
            class="glass-input"
            placeholder="Buscar por nombre o SKU..."
            style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
            type="text"
            value=""
          />
        </div>
        <div
          style="display: flex; justify-content: flex-end; align-items: center;"
        >
          <label
            style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
          >
            <input
              role="switch"
              style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
              type="checkbox"
            />
            <span>
              Mostrar inactivos
            </span>
          </label>
        </div>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <div
              style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
            >
              <span
                style="font-size: 14px; font-weight: 600; color: var(--text-main);"
              >
                Pechuga de Pollo
              </span>
            </div>
            <div
              style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
            >
              10.500
               
              kg
            </div>
          </div>
          <div
            style="display: flex; gap: 6px;"
          >
            <button
              style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
              title="Ver historial de movimientos"
              type="button"
            >
              <svg
                class="lucide lucide-history"
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
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                />
                <path
                  d="M3 3v5h5"
                />
                <path
                  d="M12 7v5l4 2"
                />
              </svg>
            </button>
            <button
              style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <span>
                Transferir
              </span>
            </button>
            <button
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-right-left"
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
                  d="m16 3 4 4-4 4"
                />
                <path
                  d="M20 7H4"
                />
                <path
                  d="m8 21-4-4 4-4"
                />
                <path
                  d="M4 17h16"
                />
              </svg>
              <span>
                Mover
              </span>
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
        <div
          style="display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <h2
              class="section-title"
              style="margin: 0px; display: flex; align-items: center; gap: 8px;"
            >
              <svg
                class="lucide lucide-package"
                fill="none"
                height="20"
                stroke="var(--accent)"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
                />
                <path
                  d="M12 22V12"
                />
                <path
                  d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
                />
                <path
                  d="m7.5 4.27 9 5.15"
                />
              </svg>
              <span>
                Inventario del Motor
              </span>
            </h2>
            <p
              style="font-size: 12px; color: var(--text-muted);"
            >
              Fuente de verdad del restaurante (
              1
               insumos, 
              0
               con stock bajo).
            </p>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
          >
            <button
              class="glass-card-interactive"
              style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
              type="button"
            >
              <svg
                class="lucide lucide-scissors"
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
                <circle
                  cx="6"
                  cy="6"
                  r="3"
                />
                <path
                  d="M8.12 8.12 12 12"
                />
                <path
                  d="M20 4 8.12 15.88"
                />
                <circle
                  cx="6"
                  cy="18"
                  r="3"
                />
                <path
                  d="M14.8 14.8 20 20"
                />
              </svg>
              <span>
                Producción
              </span>
            </button>
          </div>
        </div>
        <div
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Todos
          </button>
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Stock Bajo
          </button>
          <button
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Alertas
          </button>
        </div>
        <div
          style="display: flex; flex-direction: column; gap: 8px;"
        >
          <div
            style="position: relative;"
          >
            <svg
              class="lucide lucide-search"
              fill="none"
              height="16"
              stroke="var(--text-muted)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path
                d="m21 21-4.3-4.3"
              />
            </svg>
            <input
              class="glass-input"
              placeholder="Buscar por nombre o SKU..."
              style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              type="text"
              value=""
            />
          </div>
          <div
            style="display: flex; justify-content: flex-end; align-items: center;"
          >
            <label
              style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
            >
              <input
                role="switch"
                style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
                type="checkbox"
              />
              <span>
                Mostrar inactivos
              </span>
            </label>
          </div>
        </div>
        <div
          style="display: flex; flex-direction: column; gap: 8px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
          >
            <div>
              <div
                style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
              >
                <span
                  style="font-size: 14px; font-weight: 600; color: var(--text-main);"
                >
                  Pechuga de Pollo
                </span>
              </div>
              <div
                style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
              >
                10.500
                 
                kg
              </div>
            </div>
            <div
              style="display: flex; gap: 6px;"
            >
              <button
                style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
                title="Ver historial de movimientos"
                type="button"
              >
                <svg
                  class="lucide lucide-history"
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
                    d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path
                    d="M3 3v5h5"
                  />
                  <path
                    d="M12 7v5l4 2"
                  />
                </svg>
              </button>
              <button
                style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                type="button"
              >
                <span>
                  Transferir
                </span>
              </button>
              <button
                style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
                type="button"
              >
                <svg
                  class="lucide lucide-arrow-right-left"
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
                    d="m16 3 4 4-4 4"
                  />
                  <path
                    d="M20 7H4"
                  />
                  <path
                    d="m8 21-4-4 4-4"
                  />
                  <path
                    d="M4 17h16"
                  />
                </svg>
                <span>
                  Mover
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/__tests__/InventoryView.test.jsx:83:11
     81| 
     82|     fireEvent.click(screen.getByRole('button', { name: /Producción/i }...
     83|     await waitFor(() => expect(screen.getByText('Producción y porciona...
       |           ^
     84|     expect(listRuns).toHaveBeenCalled();
     85|   });

------------------------[1/1]-
```

### Mutación 19: Producción solo para el dueño

- **Archivo:** `src/components/inventory/InventoryHeaderActions.jsx`
- **Original:** `<button type="button" className="glass-card-interactive" onClick={onProduction} style={secondaryButton}> <Scissors size={16} /> <span>Producción</span> </button> {isOwner && ( <>`
- **Mutado:** `{isOwner && (
        <>
      <button type="button" className="glass-card-interactive" onClick={onProduction} style={secondaryButton}>
        <Scissors size={16} />
        <span>Producción</span>
      </button>`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/__tests__/InventoryView.test.jsx (6 tests | 1 failed) 622ms
   [x] InventoryView component permissions and actions > staff sees "Producción" and opens the production view, without owner actions 125ms
     > Unable to find an accessible element with the role "button" and name `/Producción/i`

Here are the accessible roles:

  heading:

  Name "Inventario del Motor":
  <h2
    class="section-title"
    style="margin: 0px; display: flex; align-items: center; gap: 8px;"
  />

  --------------------------------------------------
  paragraph:

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted);"
  />

  --------------------------------------------------
  button:

  Name "Todos":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Stock Bajo":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Alertas":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Ver historial de movimientos":
  <button
    style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
    title="Ver historial de movimientos"
    type="button"
  />

  Name "Transferir":
  <button
    style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
    type="button"
  />

  Name "Mover":
  <button
    style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
    type="button"
  />

  --------------------------------------------------
  textbox:

  Name "":
  <input
    class="glass-input"
    placeholder="Buscar por nombre o SKU..."
    style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
    type="text"
    value=""
  />

  --------------------------------------------------
  switch:

  Name "Mostrar inactivos":
  <input
    role="switch"
    style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
    type="checkbox"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <div>
          <h2
            class="section-title"
            style="margin: 0px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-package"
              fill="none"
              height="20"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
              />
              <path
                d="M12 22V12"
              />
              <path
                d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
              />
              <path
                d="m7.5 4.27 9 5.15"
              />
            </svg>
            <span>
              Inventario del Motor
            </span>
          </h2>
          <p
            style="font-size: 12px; color: var(--text-muted);"
          >
            Fuente de verdad del restaurante (
            1
             insumos, 
            0
             con stock bajo).
          </p>
        </div>
        <div
          style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
        />
      </div>
      <div
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Todos
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Stock Bajo
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Alertas
        </button>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="position: relative;"
        >
          <svg
            class="lucide lucide-search"
            fill="none"
            height="16"
            stroke="var(--text-muted)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path
              d="m21 21-4.3-4.3"
            />
          </svg>
          <input
            class="glass-input"
            placeholder="Buscar por nombre o SKU..."
            style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
            type="text"
            value=""
          />
        </div>
        <div
          style="display: flex; justify-content: flex-end; align-items: center;"
        >
          <label
            style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
          >
            <input
              role="switch"
              style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
              type="checkbox"
            />
            <span>
              Mostrar inactivos
            </span>
          </label>
        </div>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <div
              style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
            >
              <span
                style="font-size: 14px; font-weight: 600; color: var(--text-main);"
              >
                Pechuga de Pollo
              </span>
            </div>
            <div
              style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
            >
              10.500
               
              kg
            </div>
          </div>
          <div
            style="display: flex; gap: 6px;"
          >
            <button
              style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
              title="Ver historial de movimientos"
              type="button"
            >
              <svg
                class="lucide lucide-history"
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
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                />
                <path
                  d="M3 3v5h5"
                />
                <path
                  d="M12 7v5l4 2"
                />
              </svg>
            </button>
            <button
              style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <span>
                Transferir
              </span>
            </button>
            <button
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-right-left"
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
                  d="m16 3 4 4-4 4"
                />
                <path
                  d="M20 7H4"
                />
                <path
                  d="m8 21-4-4 4-4"
                />
                <path
                  d="M4 17h16"
                />
              </svg>
              <span>
                Mover
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  23:03:34
   Duration  3.20s (transform 315ms, setup 253ms, collect 563ms, tests 622ms, environment 1.35s, prepare 114ms)

------- Failed Tests 1 -------

 FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > staff sees "Producción" and opens the production view, without owner actions
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name `/Producción/i`

Here are the accessible roles:

  heading:

  Name "Inventario del Motor":
  <h2
    class="section-title"
    style="margin: 0px; display: flex; align-items: center; gap: 8px;"
  />

  --------------------------------------------------
  paragraph:

  Name "":
  <p
    style="font-size: 12px; color: var(--text-muted);"
  />

  --------------------------------------------------
  button:

  Name "Todos":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Stock Bajo":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Alertas":
  <button
    style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
    type="button"
  />

  Name "Ver historial de movimientos":
  <button
    style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
    title="Ver historial de movimientos"
    type="button"
  />

  Name "Transferir":
  <button
    style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
    type="button"
  />

  Name "Mover":
  <button
    style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
    type="button"
  />

  --------------------------------------------------
  textbox:

  Name "":
  <input
    class="glass-input"
    placeholder="Buscar por nombre o SKU..."
    style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
    type="text"
    value=""
  />

  --------------------------------------------------
  switch:

  Name "Mostrar inactivos":
  <input
    role="switch"
    style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
    type="checkbox"
  />

  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <div>
          <h2
            class="section-title"
            style="margin: 0px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-package"
              fill="none"
              height="20"
              stroke="var(--accent)"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
              />
              <path
                d="M12 22V12"
              />
              <path
                d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
              />
              <path
                d="m7.5 4.27 9 5.15"
              />
            </svg>
            <span>
              Inventario del Motor
            </span>
          </h2>
          <p
            style="font-size: 12px; color: var(--text-muted);"
          >
            Fuente de verdad del restaurante (
            1
             insumos, 
            0
             con stock bajo).
          </p>
        </div>
        <div
          style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;"
        />
      </div>
      <div
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Todos
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Stock Bajo
        </button>
        <button
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Alertas
        </button>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="position: relative;"
        >
          <svg
            class="lucide lucide-search"
            fill="none"
            height="16"
            stroke="var(--text-muted)"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path
              d="m21 21-4.3-4.3"
            />
          </svg>
          <input
            class="glass-input"
            placeholder="Buscar por nombre o SKU..."
            style="width: 100%; padding: 10px 10px 10px 36px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
            type="text"
            value=""
          />
        </div>
        <div
          style="display: flex; justify-content: flex-end; align-items: center;"
        >
          <label
            style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; color: var(--text-muted); user-select: none;"
          >
            <input
              role="switch"
              style="cursor: pointer; accent-color: var(--primary); width: 14px; height: 14px;"
              type="checkbox"
            />
            <span>
              Mostrar inactivos
            </span>
          </label>
        </div>
      </div>
      <div
        style="display: flex; flex-direction: column; gap: 8px;"
      >
        <div
          style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); opacity: 1; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <div
              style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
            >
              <span
                style="font-size: 14px; font-weight: 600; color: var(--text-main);"
              >
                Pechuga de Pollo
              </span>
            </div>
            <div
              style="font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 2px;"
            >
              10.500
               
              kg
            </div>
          </div>
          <div
            style="display: flex; gap: 6px;"
          >
            <button
              style="padding: 8px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-muted); cursor: pointer;"
              title="Ver historial de movimientos"
              type="button"
            >
              <svg
                class="lucide lucide-history"
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
                  d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                />
                <path
                  d="M3 3v5h5"
                />
                <path
                  d="M12 7v5l4 2"
                />
              </svg>
            </button>
            <button
              style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <span>
                Transferir
              </span>
            </button>
            <button
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--primary-2); background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-arrow-right-left"
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
                  d="m16 3 4 4-4 4"
                />
                <path
                  d="M20 7H4"
                />
                <path
                  d="m8 21-4-4 4-4"
                />
                <path
                  d="M4 17h16"
                />
              </svg>
              <span>
                Mover
              </span>
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
 > src/components/__tests__/InventoryView.test.jsx:82:28
     80|     expect(screen.queryByRole('button', { name: /Conteos/i })).not.toB...
     81| 
     82|     fireEvent.click(screen.getByRole('button', { name: /Producción/i }...
       |                            ^
     83|     await waitFor(() => expect(screen.getByText('Producción y porciona...
     84|     expect(listRuns).toHaveBeenCalled();

------------------------[1/1]-
```

### Mutación 20: Duplicar producciones al cargar más (revisión)

- **Archivo:** `src/hooks/useProductionRuns.js`
- **Original:** `...list.filter((run) => !prev.some((known) => known.id === run.id))`
- **Mutado:** `...list`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRuns.test.js (9 tests | 1 failed) 419ms
   [x] useProductionRuns > does not duplicate a run registered here when loading the next page 90ms
     > expected [ 99, 41, 99, 41 ] to deeply equal [ 99, 41 ]

 Test Files  1 failed (1)
      Tests  1 failed | 8 passed (9)
   Start at  23:03:39
   Duration  2.54s (transform 88ms, setup 261ms, collect 100ms, tests 419ms, environment 1.36s, prepare 122ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useProductionRuns.test.js > useProductionRuns > does not duplicate a run registered here when loading the next page
AssertionError: expected [ 99, 41, 99, 41 ] to deeply equal [ 99, 41 ]

- Expected
+ Received

  Array [
    99,
    41,
+   99,
+   41,
  ]

 > src/hooks/__tests__/useProductionRuns.test.js:38:50
     36|     act(() => { result.current.upsertRun({ ...recordedRun, id: 99 }); ...
     37|     await act(async () => { await result.current.loadMore(); });
     38|     expect(result.current.runs.map((r) => r.id)).toEqual([99, 41]);
       |                                                  ^
     39|   });
     40| 

------------------------[1/1]-
```

### Mutación 21: No anular la cantidad vigente al desmontar (revisión)

- **Archivo:** `src/hooks/useProductionPlan.js`
- **Original:** `useEffect(() => () => { latestRef.current = null; }, []);`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionPlan.test.js (7 tests | 1 failed) 48ms
   [x] useProductionPlan > after unmount it neither asks for more plans nor updates state 10ms
     > expected "getPlan" to be called 1 times, but got 2 times

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  23:03:44
   Duration  2.19s (transform 73ms, setup 342ms, collect 83ms, tests 48ms, environment 1.35s, prepare 112ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > after unmount it neither asks for more plans nor updates state
AssertionError: expected "getPlan" to be called 1 times, but got 2 times
 > src/hooks/__tests__/useProductionPlan.test.js:91:17
     89|     await act(async () => { resolveFirst(planFor('4')); });
     90|     await act(async () => { vi.advanceTimersByTime(1000); });
     91|     expect(spy).toHaveBeenCalledTimes(1);
       |                 ^
     92|   });
     93| 

------------------------[1/1]-
```

### Mutación 22: Mostrar lo esperado de otra cantidad mientras se escribe (revisión)

- **Archivo:** `src/hooks/useProductionPlan.js`
- **Original:** `setExpected({}); setFailed(false);`
- **Mutado:** `setFailed(false);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionPlan.test.js (7 tests | 1 failed) 43ms
   [x] useProductionPlan > clears the previous plan as soon as the quantity changes and marks it as loading 10ms
     > expected { 'input:1': 4, 'output:2': 8 } to deeply equal {}

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  23:03:48
   Duration  2.13s (transform 78ms, setup 262ms, collect 87ms, tests 43ms, environment 1.35s, prepare 121ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useProductionPlan.test.js > useProductionPlan > clears the previous plan as soon as the quantity changes and marks it as loading
AssertionError: expected { 'input:1': 4, 'output:2': 8 } to deeply equal {}

- Expected
+ Received

- Object {}
+ Object {
+   "input:1": 4,
+   "output:2": 8,
+ }

 > src/hooks/__tests__/useProductionPlan.test.js:71:37
     69| 
     70|     rerender({ q: '40' });
     71|     expect(result.current.expected).toEqual({});
       |                                     ^
     72|     expect(result.current.loading).toBe(true);
     73|     await act(async () => { vi.advanceTimersByTime(400); });

------------------------[1/1]-
```

### Mutación 23: Pisar el error general del motor (revisión)

- **Archivo:** `src/hooks/productionForm.js`
- **Original:** `} else if (!mapped[match[1]]) {`
- **Mutado:** `} else {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/productionForm.test.js (7 tests | 1 failed) 15ms
   [x] productionForm > translates engine errors by the position of the line that was sent 9ms
     > expected 'Sin línea' to be 'Registra al menos una salida principa...' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  23:03:52
   Duration  2.26s (transform 71ms, setup 251ms, collect 77ms, tests 15ms, environment 1.46s, prepare 128ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/productionForm.test.js > productionForm > translates engine errors by the position of the line that was sent
AssertionError: expected 'Sin línea' to be 'Registra al menos una salida principa...' // Object.is equality

Expected: "Registra al menos una salida principal mayor que 0."
Received: "Sin línea"

 > src/hooks/__tests__/productionForm.test.js:77:28
     75|     expect(mapped['input:1']).toBe('No es una entrada de la ficha.');
     76|     // El error general del motor no se pisa con el de una línea que n...
     77|     expect(mapped.outputs).toBe('Registra al menos una salida principa...
       |                            ^
     78|   });
     79| 

------------------------[1/1]-
```

### Mutación 24: Perder el foco tras anular (revisión)

- **Archivo:** `src/components/inventory/production/VoidProductionDialog.jsx`
- **Original:** `else fallbackEl?.focus();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 501ms
   [x] ProductionRunDetail > after voiding, the focus goes to the heading because the button is gone 105ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Lomo porcionado
</h3>
Received element with focus:
  <body>
  <div>
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
          Volver a producciones
        </span>
      </button>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <h3
          style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          tabindex="-1"
        >
          Lomo porcionado
        </h3>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
        >
          Cocina
          ,·
          9/10/26, 3:30 p. m.
          .·
          Anulada
          .
        </p>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"
      >
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Rendimiento real
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            60 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Esperado
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            70 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Diferencia
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--warning);"
          >
            -10 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Peso sin explicar
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,05 kg (1,25 %)
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Entradas
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            4 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Porciones
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            2,4 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Subproductos
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,9 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Merma que se tira
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,65 kg
          </div>
        </div>
      </div>
      <h4
        style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
      >
        Entradas
      </h4>
      <div
        style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Lomo Fino Kg
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Esperado:·
            4··············
            kg
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          4············
          kg
        </div>
      </div>
      <h4
        style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
      >
        Salidas
      </h4>
      <div
        style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Lomo Fino Unidad
             (principal)
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Esperado:·
            8··············
            unit
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          8············
          unit
        </div>
      </div>
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:03:56
   Duration  2.79s (transform 128ms, setup 248ms, collect 219ms, tests 501ms, environment 1.40s, prepare 129ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > after voiding, the focus goes to the heading because the button is gone
Error: expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Lomo porcionado
</h3>
Received element with focus:
  <body>
  <div>
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
          Volver a producciones
        </span>
      </button>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <h3
          style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          tabindex="-1"
        >
          Lomo porcionado
        </h3>
        <p
          style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
        >
          Cocina
          ,·
          9/10/26, 3:30 p. m.
          .·
          Anulada
          .
        </p>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: grid; grid-template-columns: 1fr 1fr; gap: 10px;"
      >
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Rendimiento real
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            60 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Esperado
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            70 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Diferencia
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--warning);"
          >
            -10 %
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Peso sin explicar
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,05 kg (1,25 %)
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Entradas
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            4 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Porciones
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            2,4 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Subproductos
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,9 kg
          </div>
        </div>
        <div>
          <div
            style="font-size: 11px; color: var(--text-muted);"
          >
            Merma que se tira
          </div>
          <div
            style="font-size: 14px; font-weight: 700; color: var(--text-main);"
          >
            0,65 kg
          </div>
        </div>
      </div>
      <h4
        style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
      >
        Entradas
      </h4>
      <div
        style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Lomo Fino Kg
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Esperado:·
            4··············
            kg
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          4············
          kg
        </div>
      </div>
      <h4
        style="font-size: 13px; font-weight: 700; margin: 4px 0px 0px; color: var(--text-main);"
      >
        Salidas
      </h4>
      <div
        style="padding: 8px 10px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; gap: 10px; font-size: 12px;"
      >
        <div
          style="min-width: 0px;"
        >
          <div
            style="font-weight: 600; color: var(--text-main);"
          >
            Lomo Fino Unidad
             (principal)
          </div>
          <div
            style="color: var(--text-muted);"
          >
            Esperado:·
            8··············
            unit
          </div>
        </div>
        <div
          style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
        >
          8············
          unit
        </div>
      </div>
    </div>
  </div>
</body>
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:52:70
     50| 
     51|     await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeI...
     52|     expect(screen.getByRole('heading', { name: 'Lomo porcionado' })).t...
       |                                                                      ^
     53|   });
     54| 

------------------------[1/1]-
```

### Mutación 25: Tab sale del diálogo de anular (revisión)

- **Archivo:** `src/components/inventory/production/VoidProductionDialog.jsx`
- **Original:** `else if (e.key === 'Tab') trapTab(e, dialogRef.current);`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 470ms
   [x] ProductionRunDetail > keeps Tab inside the void dialog 51ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="void-production-reason"
  maxlength="255"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
>
  Error
</textarea>
Received element with focus:
  <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer; opacity: 1;"
  type="button"
>
  Anular
</button>

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:04:01
   Duration  2.80s (transform 127ms, setup 316ms, collect 215ms, tests 470ms, environment 1.44s, prepare 114ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > keeps Tab inside the void dialog
Error: expect(element).toHaveFocus()

Expected element with focus:
  <textarea
  id="void-production-reason"
  maxlength="255"
  rows="3"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px; resize: vertical;"
>
  Error
</textarea>
Received element with focus:
  <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer; opacity: 1;"
  type="button"
>
  Anular
</button>
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:64:45
     62|     confirm.focus();
     63|     fireEvent.keyDown(document, { key: 'Tab' });
     64|     expect(screen.getByLabelText('Motivo')).toHaveFocus();
       |                                             ^
     65|     fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
     66|     expect(confirm).toHaveFocus();

------------------------[1/1]-
```

### Mutación 26: Ids como 1e2 pasan la validación (revisión)

- **Archivo:** `src/services/productionClient.js`
- **Original:** `if (!/^\d+$/.test(String(value ?? '').trim())) return null;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/productionClient.test.js (11 tests | 1 failed) 20ms
   [x] productionClient > validates ids before building template and run routes 9ms
     > expected 200 to be 400 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
   Start at  23:04:06
   Duration  2.22s (transform 69ms, setup 258ms, collect 69ms, tests 20ms, environment 1.47s, prepare 135ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/productionClient.test.js > productionClient > validates ids before building template and run routes
AssertionError: expected 200 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 200

 > src/services/__tests__/productionClient.test.js:46:40
     44|     for (const fn of [getTemplate, getRun]) {
     45|       // '1e2' es un entero para Number pero parseInt daría 1: se rech...
     46|       expect((await fn('1e2')).status).toBe(400);
       |                                        ^
     47|       const res = await fn('1; DROP');
     48|       expect(res.ok).toBe(false);

------------------------[1/1]-
```

### Mutación 27: No borrar el error del peso al corregirlo (revisión)

- **Archivo:** `src/hooks/useProductionRunForm.js`
- **Original:** `const errorKey = FIELD_ERROR_KEYS[field] || field;`
- **Mutado:** `const errorKey = field;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useProductionRunForm.test.js (7 tests | 1 failed) 46ms
   [x] useProductionRunForm > clears the error of a weight when it is edited 10ms
     > expected 'No puede pesar más que las entradas.' to be undefined

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  23:04:10
   Duration  2.16s (transform 93ms, setup 256ms, collect 116ms, tests 46ms, environment 1.39s, prepare 110ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useProductionRunForm.test.js > useProductionRunForm > clears the error of a weight when it is edited
AssertionError: expected 'No puede pesar más que las entradas.' to be undefined

- Expected: 
undefined

+ Received: 
"No puede pesar más que las entradas."

 > src/hooks/__tests__/useProductionRunForm.test.js:111:59
    109|     expect(result.current.fieldErrors.main_output_weight).toBeDefined(...
    110|     act(() => { result.current.setField('mainOutputWeight', '2'); });
    111|     expect(result.current.fieldErrors.main_output_weight).toBeUndefine...
       |                                                           ^
    112|     act(() => { result.current.setField('notes', 'x'); });
    113|   });

------------------------[1/1]-
```

### Mutación 28: Mostrar Sin dato (Sin dato) (revisión)

- **Archivo:** `src/components/inventory/production/ProductionRunDetail.jsx`
- **Original:** `if (run.unaccounted_weight === null || run.unaccounted_weight === undefined) return 'Sin dato';`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx (10 tests | 1 failed) 540ms
   [x] ProductionRunDetail > shows null metrics as "Sin dato" and a positive difference with sign 26ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  style="font-size: 14px; font-weight: 700; color: var(--text-main);"
>
  Sin dato (Sin dato)
</div> instead

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  23:04:14
   Duration  2.87s (transform 125ms, setup 254ms, collect 226ms, tests 540ms, environment 1.42s, prepare 131ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx > ProductionRunDetail > shows null metrics as "Sin dato" and a positive difference with sign
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
  style="font-size: 14px; font-weight: 700; color: var(--text-main);"
>
  Sin dato (Sin dato)
</div> instead
 > src/components/inventory/production/__tests__/ProductionRunDetail.test.jsx:30:59
     28|     expect(screen.getByText('+2,5 %')).not.toHaveStyle({ color: 'var(-...
     29|     // Un solo "Sin dato" para el peso sin explicar, nunca "Sin dato (...
     30|     expect(screen.queryByText('Sin dato (Sin dato)')).not.toBeInTheDoc...
       |                                                           ^
     31|     expect(screen.getByText('Peso sin explicar').nextSibling).toHaveTe...
     32|   });

------------------------[1/1]-
```

## 5. Pendiente

- Prueba manual en el teléfono contra el motor (rama `feat/production-runs`): registrar un lomo porcionado, ver el plan mientras se escribe, provocar un 409 con más lomo del que hay en cocina y anular como dueño.
- Pantallas de compras y proveedores (Brief 20 del motor).
