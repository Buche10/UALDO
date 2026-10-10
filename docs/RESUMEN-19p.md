# Resumen de implementación: Briefs 19p, 19p_fix y 19p_fix2

Ubicaciones, transferencias y conteo físico de reapertura en la PWA. Los Briefs 19p y 19p_fix los construyó el
usuario; el 19p_fix2 lo construyó Claude a pedido explícito del usuario (2026-10-09), con tests primero. Sin commit
hasta la aprobación.

## 1. Qué se construyó

### 1.1. Brief 19p
- **Ubicaciones válidas** (`src/services/inventoryLocations.js`): `warehouse`, `kitchen` y `lounge`, Cocina por
  defecto. `MovementModal` y los clientes nunca envían otro valor; la guardia de `securityGuard.test.js` impide
  `bodega` y `salon`.
- **Stock por ubicación** en el listado, con coma decimal de `es-EC`, y **historial** con ubicación, saldo de la
  ubicación, transferencias como par ("Bodega a Cocina") y conteos.
- **Transferencias** (`TransferModal` y `useTransferSubmit`) con idempotencia por `client_uuid` y validación de lo
  disponible en el origen.
- **Conteos de reapertura** (solo el dueño): lista, nuevo conteo, planilla a ciegas con guardado automático en el
  motor, aplicar con confirmación y diferencias del motor, y cancelar el borrador.

### 1.2. Brief 19p_fix
- Una línea editada durante un guardado sigue pendiente y se envía después.
- Errores 422 por tanda traducidos al insumo correcto (`lineErrors` por `item_id`, con el desplazamiento de la tanda).
- Cancelar un borrador con diálogo propio accesible; la planilla queda en solo lectura tras aplicar.
- Umbral de 20 insumos distintos, carga parcial del catálogo con "Reintentar", `null` como "Sin dato", separadores
  con estilo, diálogos con `role="dialog"`, Escape y retorno de foco.

### 1.3. Brief 19p_fix2
- **Salir sin perder cambios:** "Volver a conteos" decide por las líneas pendientes (`hasPendingChanges`), no por el
  estado. Con un guardado fallido vuelve a guardar y, si falla, no sale; con un guardado en curso espera.
- **Guardados en cola** (`useCountSheet.savePendingLines`): sin guardado en curso arranca ya; con uno en curso espera
  y guarda lo que quedó pendiente. Nunca hay dos peticiones a la vez. Así también funcionan "Aplicar" y el paso a
  segundo plano durante un guardado.
- **Reglas de línea** en `src/hooks/countSheetLines.js`: una línea está pendiente solo si difiere de lo guardado y no
  está en blanco. Las cantidades mal escritas se marcan junto al insumo, no se envían y no bloquean las demás; el
  estado dice "Hay cantidades por corregir".
- **Cantidad guardada en blanco:** el motor no permite quitar una línea. Si el dueño borra una cantidad ya guardada,
  la planilla explica junto al insumo que el motor la conserva, y el resumen de "Aplicar" la cuenta como contada.
- **Guardado automático** separado en `src/hooks/useCountSheetAutosave.js`, y el estado del guardado en
  `CountSheetSaveStatus.jsx`, que recalcula "Guardado hace N min" cada 30 segundos.
- **Cliente:** el formato inválido también devuelve `lineErrors`; las comas se cambian todas (`replace(/,/g, '.')`).
- **Tests nuevos:** rendimiento sobre el `CountSheet` real con 240 insumos (`CountSheetPerformance.test.jsx`, que
  reemplaza al test anterior que usaba su propio `memo`), salida segura y texto plano en la planilla
  (`CountSheetSafety.test.jsx`), cola de guardados, línea inválida, línea igual a la guardada y segundo plano durante
  un guardado (`useCountSheet.test.js`), y el resumen de "Aplicar" (`ApplyCountDialog.test.jsx`).

## 2. Verificación

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (51 advertencias anteriores, ninguna en los archivos de conteo) |
| `npm test` | 59 archivos, 407 tests en verde |
| `npm run test:coverage` | Tabla abajo; todos los archivos nuevos con 80 % o más de sentencias y ramas |
| `npm run build:prod` | Correcto |
| `grep` de colores directos en `src/components/inventory` | Sin coincidencias |
| `grep` de `bodega`/`salon` como valores | Sin coincidencias |
| `localStorage` en la planilla | Sin uso |
| Emojis y tildes | Ninguno; ninguna tilde perdida |

Tabla de cobertura, copiada de la salida de `npm run test:coverage` (solo se cambiaron los símbolos de terminal):

```text
% Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.74 |    86.22 |   81.79 |   96.74 |                   
 build             |     100 |      100 |     100 |     100 |                   
  ...ateProdEnv.js |     100 |      100 |     100 |     100 |                   
 src/components    |   87.65 |    88.37 |   39.28 |   87.65 |                   
  ...CloseView.jsx |   73.63 |    84.84 |      50 |   73.63 | ...16-118,131-133 
  ...eFiloCard.jsx |     100 |    93.75 |      80 |     100 | 134-136           
  ...ntoryView.jsx |   83.87 |    85.71 |   15.38 |   83.87 | ...,86-88,184-189 
 ...ents/assistant |   91.51 |    70.43 |   83.33 |   91.51 |                   
  ...stantChat.jsx |   78.72 |    86.66 |      60 |   78.72 | ...,65-77,151-159 
  ...ageBubble.jsx |   96.77 |       80 |     100 |   96.77 | 8                 
  ...ctionCard.jsx |   95.65 |       80 |     100 |   95.65 | 17-18,24-25       
  ...acyNotice.jsx |   89.47 |    55.55 |     100 |   89.47 | 12-13,26-27       
  ...tionChips.jsx |     100 |       75 |     100 |     100 | 23                
  ...nversation.js |   98.62 |    59.57 |     100 |   98.62 | 100,119           
 ...ents/cashclose |   97.05 |    86.44 |   68.18 |   97.05 |                   
  ...edActions.jsx |   97.88 |    81.08 |   76.92 |   97.88 | 60-62             
  ...oseDetail.jsx |   98.88 |    89.74 |   66.66 |   98.88 | 50-51             
  ...CloseList.jsx |   88.77 |    85.18 |   83.33 |   88.77 | ...19-131,155-156 
  ...anualForm.jsx |     100 |    89.28 |   33.33 |     100 | 81-86             
  ...eviewForm.jsx |   98.17 |    83.92 |   93.33 |   98.17 | 84-86             
  ...entsPanel.jsx |     100 |    88.09 |      75 |     100 | ...21,124,129,152 
 ...nts/cashconfig |   99.15 |    93.39 |   70.58 |   99.15 |                   
  ...onfigView.jsx |     100 |      100 |   66.66 |     100 |                   
  ...atesPanel.jsx |   99.49 |    92.85 |      75 |   99.49 | 217               
  ...ingsPanel.jsx |   98.42 |    90.69 |   66.66 |   98.42 | 63-65             
 ...ents/inventory |   99.22 |    88.88 |      75 |   99.22 |                   
  ...lertsList.jsx |     100 |      100 |     100 |     100 |                   
  ...ntoryList.jsx |     100 |    93.33 |     100 |     100 | 29,34,241         
  ...chToolbar.jsx |     100 |      100 |   66.66 |     100 |                   
  ...eateModal.jsx |   98.88 |    81.81 |    37.5 |   98.88 | 36-37             
  ...mentModal.jsx |   96.72 |    78.57 |      50 |   96.72 | 110-112,162-164   
  ...toryModal.jsx |     100 |    89.02 |     100 |     100 | ...17,123,125,129 
  ...sferModal.jsx |     100 |    91.11 |     100 |     100 | 157-162,176,196   
 ...ventory/counts |   94.79 |    88.54 |   78.94 |   94.79 |                   
  ...untDialog.jsx |   99.05 |    87.71 |     100 |   99.05 | 52-53             
  ...untDialog.jsx |   96.89 |      100 |      50 |   96.89 | 23-26             
  CountSheet.jsx   |   91.48 |    86.84 |   63.63 |   91.48 | 145-158,217-219   
  ...eetHeader.jsx |     100 |    82.35 |     100 |     100 | 10,17             
  ...tSheetRow.jsx |     100 |    85.71 |     100 |     100 | 57,70,108         
  ...aveStatus.jsx |     100 |    88.46 |     100 |     100 | 9-10,17           
  CountsView.jsx   |   83.51 |    80.95 |      70 |   83.51 | ...,59-71,209-217 
  ...ountModal.jsx |     100 |    96.55 |     100 |     100 | 40                
 .../notifications |    98.7 |    80.35 |      80 |    98.7 |                   
  ...ationItem.jsx |   96.15 |    81.81 |   83.33 |   96.15 | 19-20,61-62       
  ...ionsPanel.jsx |     100 |    79.41 |      75 |     100 | ...29-131,144,208 
 src/hooks         |   98.71 |    84.11 |   98.61 |   98.71 |                   
  ...SheetLines.js |     100 |    94.44 |     100 |     100 | 32,45             
  useApplyCount.js |     100 |      100 |     100 |     100 |                   
  useCashClose.js  |     100 |    63.15 |     100 |     100 | ...07-113,125-131 
  ...mentSubmit.js |     100 |    84.61 |     100 |     100 | 91-92,100         
  ...hMovements.js |   98.44 |    90.62 |     100 |   98.44 | 116-117           
  ...ssionRates.js |     100 |    62.06 |     100 |     100 | ...17-118,126-131 
  useCountSheet.js |   98.77 |    84.84 |     100 |   98.77 | 83-84             
  ...etAutosave.js |     100 |      100 |     100 |     100 |                   
  useCounts.js     |     100 |     82.5 |     100 |     100 | 29,37,41,59,69    
  ...entoryList.js |   98.37 |       85 |     100 |   98.37 | 92-93             
  ...mentSubmit.js |   88.42 |    71.42 |     100 |   88.42 | 13-21,92-93       
  ...ifications.js |     100 |    85.71 |     100 |     100 | 33,35,37,54,66    
  ...ntMappings.js |     100 |    80.85 |     100 |     100 | ...1,81,89,95,102 
  ...sferSubmit.js |     100 |     93.1 |     100 |     100 | 44,87             
  ...nreadCount.js |    97.5 |    93.75 |      80 |    97.5 | 96-98             
 src/services      |   97.41 |    88.19 |     100 |   97.41 |                   
  ...tantClient.js |     100 |    63.82 |     100 |     100 | ...06-114,131,138 
  auth.js          |   98.03 |    84.84 |     100 |   98.03 | 20-21             
  ...loseClient.js |   91.21 |     92.5 |     100 |   91.21 | ...26-131,171-176 
  ...nfigClient.js |   96.31 |       95 |     100 |   96.31 | 156-161           
  ...entsClient.js |     100 |    93.93 |     100 |     100 | 76,104            
  ...toryClient.js |   99.07 |    86.11 |     100 |   99.07 | 40-41             
  ...untsClient.js |   97.44 |    95.52 |     100 |   97.44 | 103-107           
  ...yLocations.js |     100 |      100 |     100 |     100 |                   
  money.js         |   98.03 |    97.67 |     100 |   98.03 | 34-35             
  ...tionRoutes.js |   94.44 |    80.76 |     100 |   94.44 | 26-27,54-55,88    
  ...ionsClient.js |     100 |      100 |     100 |     100 |                   
  teamsClient.js   |   98.58 |    85.07 |     100 |   98.58 | 76-77             
-------------------|---------|----------|---------|---------|-------------------
```

## 3. Prueba manual contra el motor

No se hizo en estas sesiones: el motor no se tocó y no se levantó contra la PWA. Toda la verificación es la suite automatizada con `request` simulado según `C:laragonwwwUaldoBusinessdocsAPI-inventory.md`. Queda pendiente probar en el teléfono: una salida en cocina, una transferencia de bodega a cocina y un conteo de cocina con 10 insumos, cerrando la app a mitad del conteo.

## 4. Mutaciones

Cada mutación se aplicó con un script, se ejecutó el archivo de tests indicado y se restauró el archivo. Las salidas son las reales de esa ejecución (2026-10-09), sin editar salvo los símbolos de terminal (`[ok]`, `[x]` y `>`). Las versiones anteriores de este resumen tenían salidas copiadas y mutaciones repetidas; se reemplazaron todas. Resultado: **24 de 24 detectadas**.

### Mutación 1: Ubicación por defecto en Bodega

- **Archivo:** `src/services/inventoryLocations.js`
- **Original:** `export const DEFAULT_LOCATION = 'kitchen';`
- **Mutado:** `export const DEFAULT_LOCATION = 'warehouse';`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/inventoryLocations.test.js (3 tests | 1 failed) 9ms
   [x] inventoryLocations service > defines canonical inventory locations with Spanish labels and correct keys 8ms
     > expected 'warehouse' to be 'kitchen' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  22:28:53
   Duration  1.87s (transform 32ms, setup 233ms, collect 20ms, tests 9ms, environment 1.26s, prepare 97ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/inventoryLocations.test.js > inventoryLocations service > defines canonical inventory locations with Spanish labels and correct keys
AssertionError: expected 'warehouse' to be 'kitchen' // Object.is equality

Expected: "kitchen"
Received: "warehouse"

 > src/services/__tests__/inventoryLocations.test.js:16:30
     14|       { value: 'lounge', label: 'Salón' },
     15|     ]);
     16|     expect(DEFAULT_LOCATION).toBe('kitchen');
       |                              ^
     17|   });
     18| 

------------------------[1/1]-
```

### Mutación 2: isValidLocation acepta cualquier valor

- **Archivo:** `src/services/inventoryLocations.js`
- **Original:** `return typeof value === 'string' && VALID_SET.has(value.trim());`
- **Mutado:** `return true;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/inventoryLocations.test.js (3 tests | 1 failed) 9ms
   [x] inventoryLocations service > validates canonical location values correctly 6ms
     > expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  22:28:57
   Duration  1.90s (transform 32ms, setup 233ms, collect 19ms, tests 9ms, environment 1.31s, prepare 105ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/inventoryLocations.test.js > inventoryLocations service > validates canonical location values correctly
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/inventoryLocations.test.js:27:39
     25|     expect(isValidLocation(' kitchen ')).toBe(true);
     26| 
     27|     expect(isValidLocation('bodega')).toBe(false);
       |                                       ^
     28|     expect(isValidLocation('salon')).toBe(false);
     29|     expect(isValidLocation('patio')).toBe(false);

------------------------[1/1]-
```

### Mutación 3: createCount sin validar la ubicación

- **Archivo:** `src/services/inventoryCountsClient.js`
- **Original:** `if (!isValidLocation(trimmedLoc)) {`
- **Mutado:** `if (false && !isValidLocation(trimmedLoc)) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/inventoryCountsClient.test.js (24 tests | 1 failed) 687ms
   [x] inventoryCountsClient service > createCount > rejects invalid location with status 422 672ms
     > expected 404 to be 422 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 23 passed (24)
   Start at  22:29:00
   Duration  2.66s (transform 72ms, setup 242ms, collect 73ms, tests 687ms, environment 1.31s, prepare 100ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/inventoryCountsClient.test.js > inventoryCountsClient service > createCount > rejects invalid location with status 422
AssertionError: expected 404 to be 422 // Object.is equality

- Expected
+ Received

- 422
+ 404

 > src/services/__tests__/inventoryCountsClient.test.js:66:26
     64| 
     65|       expect(res.ok).toBe(false);
     66|       expect(res.status).toBe(422);
       |                          ^
     67|       expect(res.error).toContain('no válida');
     68|       expect(spy).not.toHaveBeenCalled();

------------------------[1/1]-
```

### Mutación 4: Tandas de 500 en lugar de 200

- **Archivo:** `src/services/inventoryCountsClient.js`
- **Original:** `const BATCH_SIZE = 200;`
- **Mutado:** `const BATCH_SIZE = 500;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/inventoryCountsClient.test.js (24 tests | 3 failed) 28ms
   [x] inventoryCountsClient service > saveCountLines > batches lines in chunks of 200 8ms
     > expected "request" to be called 2 times, but got 1 times
   [x] inventoryCountsClient service > saveCountLines > generates three requests of 200, 200, and 50 lines for 450 lines 1ms
     > expected "request" to be called 3 times, but got 1 times
   [x] inventoryCountsClient service > saveCountLines > translates 422 errors of a batch to lineErrors mapped by item_id using batch offset 2ms
     > expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  3 failed | 21 passed (24)
   Start at  22:29:05
   Duration  1.96s (transform 76ms, setup 242ms, collect 80ms, tests 28ms, environment 1.28s, prepare 98ms)

------- Failed Tests 3 -------

 FAIL  src/services/__tests__/inventoryCountsClient.test.js > inventoryCountsClient service > saveCountLines > batches lines in chunks of 200
AssertionError: expected "request" to be called 2 times, but got 1 times
 > src/services/__tests__/inventoryCountsClient.test.js:212:19
    210|       const res = await saveCountLines(7, lines);
    211|       expect(res.ok).toBe(true);
    212|       expect(spy).toHaveBeenCalledTimes(2);
       |                   ^
    213|       expect(spy.mock.calls[0][1].body.lines.length).toBe(200);
    214|       expect(spy.mock.calls[1][1].body.lines.length).toBe(5);

------------------------[1/3]-

 FAIL  src/services/__tests__/inventoryCountsClient.test.js > inventoryCountsClient service > saveCountLines > generates three requests of 200, 200, and 50 lines for 450 lines
AssertionError: expected "request" to be called 3 times, but got 1 times
 > src/services/__tests__/inventoryCountsClient.test.js:230:19
    228|       const res = await saveCountLines(7, lines);
    229|       expect(res.ok).toBe(true);
    230|       expect(spy).toHaveBeenCalledTimes(3);
       |                   ^
    231|       expect(spy.mock.calls[0][1].body.lines.length).toBe(200);
    232|       expect(spy.mock.calls[1][1].body.lines.length).toBe(200);

------------------------[2/3]-

 FAIL  src/services/__tests__/inventoryCountsClient.test.js > inventoryCountsClient service > saveCountLines > translates 422 errors of a batch to lineErrors mapped by item_id using batch offset
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/services/__tests__/inventoryCountsClient.test.js:279:22
    277| 
    278|       const res = await saveCountLines(10, lines);
    279|       expect(res.ok).toBe(false);
       |                      ^
    280|       expect(res.status).toBe(422);
    281|       expect(spy).toHaveBeenCalledTimes(2);

------------------------[3/3]-
```

### Mutación 5: Transferir con origen igual a destino

- **Archivo:** `src/hooks/useTransferSubmit.js`
- **Original:** `if (from === to) {`
- **Mutado:** `if (false && from === to) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useTransferSubmit.test.js (13 tests | 1 failed) 59ms
   [x] useTransferSubmit hook > validates that origin and destination must be different 21ms
     > expected null to be 'El origen y el destino deben ser dife...' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
   Start at  22:29:08
   Duration  2.04s (transform 79ms, setup 249ms, collect 88ms, tests 59ms, environment 1.32s, prepare 101ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useTransferSubmit.test.js > useTransferSubmit hook > validates that origin and destination must be different
AssertionError: expected null to be 'El origen y el destino deben ser dife...' // Object.is equality

- Expected: 
"El origen y el destino deben ser diferentes."

+ Received: 
null

 > src/hooks/__tests__/useTransferSubmit.test.js:35:44
     33|     });
     34| 
     35|     expect(result.current.validationError).toBe('El origen y el destin...
       |                                            ^
     36|     expect(result.current.submitting).toBe(false);
     37|   });

------------------------[1/1]-
```

### Mutación 6: Transferir más de lo disponible en el origen

- **Archivo:** `src/hooks/useTransferSubmit.js`
- **Original:** `if (reqNum > availNum) {`
- **Mutado:** `if (false && reqNum > availNum) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useTransferSubmit.test.js (13 tests | 1 failed) 595ms
   [x] useTransferSubmit hook > validates that quantity does not exceed origin stock 560ms
     > the given combination of arguments (null and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
   Start at  22:29:12
   Duration  2.68s (transform 76ms, setup 274ms, collect 91ms, tests 595ms, environment 1.40s, prepare 101ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useTransferSubmit.test.js > useTransferSubmit hook > validates that quantity does not exceed origin stock
AssertionError: the given combination of arguments (null and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
 > src/hooks/__tests__/useTransferSubmit.test.js:68:44
     66|     });
     67| 
     68|     expect(result.current.validationError).toContain('supera el dispon...
       |                                            ^
     69|   });
     70| 

------------------------[1/1]-
```

### Mutación 7: Incluir servicios en la planilla

- **Archivo:** `src/hooks/useCountSheet.js`
- **Original:** `.filter((i) => i.type !== 'service')`
- **Mutado:** `.filter(() => true)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 1 failed) 76ms
   [x] useCountSheet hook > loads inventory items excluding service types and loads count detail 36ms
     > expected 3 to be 2 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 18 passed (19)
   Start at  22:29:17
   Duration  2.09s (transform 97ms, setup 235ms, collect 119ms, tests 76ms, environment 1.29s, prepare 115ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > loads inventory items excluding service types and loads count detail
AssertionError: expected 3 to be 2 // Object.is equality

- Expected
+ Received

- 2
+ 3

 > src/hooks/__tests__/useCountSheet.test.js:59:41
     57|     });
     58| 
     59|     expect(result.current.items.length).toBe(2);
       |                                         ^
     60|     expect(result.current.items.some(i => i.type === 'service')).toBe(...
     61|     expect(result.current.countDetail).toEqual(mockCount);

------------------------[1/1]-
```

### Mutación 8: Borradores al final de la lista

- **Archivo:** `src/hooks/useCounts.js`
- **Original:** `if (a.status === 'draft' && b.status !== 'draft') return -1;`
- **Mutado:** `if (a.status === 'draft' && b.status !== 'draft') return 1;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCounts.test.js (7 tests | 1 failed) 654ms
   [x] useCounts hook > loads counts on mount for owner and sorts drafts first 13ms
     > expected 1 to be 2 // Object.is equality
   [ok] useCounts hook > supports pagination via loadMore 617ms

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  22:29:20
   Duration  2.69s (transform 64ms, setup 243ms, collect 74ms, tests 654ms, environment 1.34s, prepare 105ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useCounts.test.js > useCounts hook > loads counts on mount for owner and sorts drafts first
AssertionError: expected 1 to be 2 // Object.is equality

- Expected
+ Received

- 2
+ 1

 > src/hooks/__tests__/useCounts.test.js:53:41
     51|     expect(result.current.counts.length).toBe(3);
     52|     // draft (id: 2) must be first
     53|     expect(result.current.counts[0].id).toBe(2);
       |                                         ^
     54|     expect(result.current.hasMore).toBe(true);
     55|   });

------------------------[1/1]-
```

### Mutación 9: Botones del dueño visibles para el personal

- **Archivo:** `src/components/InventoryView.jsx`
- **Original:** `{isOwner && (`
- **Mutado:** `{(true) && (`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/__tests__/InventoryView.test.jsx (5 tests | 2 failed) 454ms
   [x] InventoryView component permissions and actions > does NOT render "Nuevo Insumo" button when user is regular staff without owner capability 60ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="padding: 8px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
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
    Nuevo Insumo
  </span>
</button> instead
   [x] InventoryView component permissions and actions > renders "Conteos" button for owner and switches to CountsView, while non-owner does not see it 43ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="glass-card-interactive"
  style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
  type="button"
>
  <svg
    class="lucide lucide-clipboard-list"
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
    Conteos
  </span>
</button> instead

 Test Files  1 failed (1)
      Tests  2 failed | 3 passed (5)
   Start at  22:29:25
   Duration  2.81s (transform 244ms, setup 280ms, collect 427ms, tests 454ms, environment 1.32s, prepare 100ms)

------- Failed Tests 2 -------

 FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > does NOT render "Nuevo Insumo" button when user is regular staff without owner capability
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="padding: 8px 14px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px;"
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
    Nuevo Insumo
  </span>
</button> instead
 > src/components/__tests__/InventoryView.test.jsx:66:73
     64|     });
     65| 
     66|     expect(screen.queryByRole('button', { name: /Nuevo Insumo/i })).no...
       |                                                                         ^
     67|   });
     68| 

------------------------[1/2]-

 FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > renders "Conteos" button for owner and switches to CountsView, while non-owner does not see it
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="glass-card-interactive"
  style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
  type="button"
>
  <svg
    class="lucide lucide-clipboard-list"
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
    Conteos
  </span>
</button> instead
 > src/components/__tests__/InventoryView.test.jsx:119:68
    117|       expect(screen.getByText('Inventario del Motor')).toBeInTheDocume...
    118|     });
    119|     expect(screen.queryByRole('button', { name: /Conteos/i })).not.toB...
       |                                                                    ^
    120|     unmount();
    121| 

------------------------[2/2]-
```

### Mutación 10: Transferir en insumos de servicio

- **Archivo:** `src/components/inventory/InventoryList.jsx`
- **Original:** `{item.type !== 'service' && onSelectForTransfer && (`
- **Mutado:** `{onSelectForTransfer && (`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/__tests__/InventoryList.test.jsx (12 tests | 1 failed) 343ms
   [x] InventoryList component > renders Transferir button for standard items and hides it for service items 38ms
     > expected 2 to be 1 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 11 passed (12)
   Start at  22:29:29
   Duration  2.45s (transform 88ms, setup 242ms, collect 154ms, tests 343ms, environment 1.35s, prepare 106ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/__tests__/InventoryList.test.jsx > InventoryList component > renders Transferir button for standard items and hides it for service items
AssertionError: expected 2 to be 1 // Object.is equality

- Expected
+ Received

- 1
+ 2

 > src/components/inventory/__tests__/InventoryList.test.jsx:389:36
    387| 
    388|     const transferButtons = screen.getAllByRole('button', { name: /^Tr...
    389|     expect(transferButtons.length).toBe(1);
       |                                    ^
    390| 
    391|     fireEvent.click(transferButtons[0]);

------------------------[1/1]-
```

### Mutación 11: MovementModal arranca en bodega (brief original)

- **Archivo:** `src/components/inventory/MovementModal.jsx`
- **Original:** `useState(DEFAULT_LOCATION)`
- **Mutado:** `useState('bodega')`
- **Original:** `setLocation(DEFAULT_LOCATION)`
- **Mutado:** `setLocation('bodega')`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/__tests__/MovementModal.test.jsx (7 tests | 1 failed) 400ms
   [x] MovementModal component > sends kind, quantity and location "kitchen" by default, without offering bodega or salon 13ms
     > expected 'warehouse' to be 'kitchen' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  22:29:34
   Duration  2.60s (transform 103ms, setup 247ms, collect 120ms, tests 400ms, environment 1.43s, prepare 133ms)

stderr | src/components/inventory/__tests__/MovementModal.test.jsx > MovementModal component > handles 409 conflict when client_uuid was used by another item, displays generic message and generates fresh UUID for next submission
[Inventory] Conflicto de client_uuid entre insumos

------- Failed Tests 1 -------

 FAIL  src/components/inventory/__tests__/MovementModal.test.jsx > MovementModal component > sends kind, quantity and location "kitchen" by default, without offering bodega or salon
AssertionError: expected 'warehouse' to be 'kitchen' // Object.is equality

Expected: "kitchen"
Received: "warehouse"

 > src/components/inventory/__tests__/MovementModal.test.jsx:212:34
    210| 
    211|     const locationSelect = screen.getByLabelText(/Ubicación/i);
    212|     expect(locationSelect.value).toBe('kitchen');
       |                                  ^
    213| 
    214|     // Comprobar que las opciones son exclusivamente warehouse, kitche...

------------------------[1/1]-
```

### Mutación 12: uuid nuevo en cada envío de transferencia

- **Archivo:** `src/hooks/useTransferSubmit.js`
- **Original:** `setSubmitting(true);`
- **Mutado:** `clientUuidRef.current = generateClientUuid(); setSubmitting(true);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useTransferSubmit.test.js (13 tests | 1 failed) 65ms
   [x] useTransferSubmit hook > reuses the same client_uuid on retry after network error and generates fresh uuid after 201 (killing mutation) 11ms
     > expected '261bb5c2-6581-48cf-80de-04ee28456d89' to be '879e0a4f-ac2a-4319-b0e7-bfa379eef97c' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
   Start at  22:29:38
   Duration  2.06s (transform 77ms, setup 246ms, collect 89ms, tests 65ms, environment 1.32s, prepare 110ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useTransferSubmit.test.js > useTransferSubmit hook > reuses the same client_uuid on retry after network error and generates fresh uuid after 201 (killing mutation)
AssertionError: expected '261bb5c2-6581-48cf-80de-04ee28456d89' to be '879e0a4f-ac2a-4319-b0e7-bfa379eef97c' // Object.is equality

Expected: "879e0a4f-ac2a-4319-b0e7-bfa379eef97c"
Received: "261bb5c2-6581-48cf-80de-04ee28456d89"

 > src/hooks/__tests__/useTransferSubmit.test.js:315:26
    313| 
    314|     const uuidAttempt2 = spy.mock.calls[1][1];
    315|     expect(uuidAttempt2).toBe(uuidAttempt1);
       |                          ^
    316| 
    317|     // 3rd attempt: after 201 success in attempt 2, uuid MUST be renew...

------------------------[1/1]-
```

### Mutación 13: Quitar la comprobación del dueño en useCounts

- **Archivo:** `src/hooks/useCounts.js`
- **Original:** `if (!isOwner) return;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCounts.test.js (7 tests | 1 failed) 908ms
   [x] useCounts hook > does not load counts if user is not owner and calling reload/loadMore does nothing (killing mutation) 773ms
     > expected "listCounts" to not be called at all, but actually been called 2 times

Received: 

  1st listCounts call:

    Array [
      Object {
        "location": "",
        "page": 1,
        "status": "",
      },
    ]

  2nd listCounts call:

    Array [
      Object {
        "location": "",
        "page": 2,
        "status": "",
      },
    ]


Number of calls: 2


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  22:29:42
   Duration  2.97s (transform 71ms, setup 255ms, collect 76ms, tests 908ms, environment 1.34s, prepare 125ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useCounts.test.js > useCounts hook > does not load counts if user is not owner and calling reload/loadMore does nothing (killing mutation)
AssertionError: expected "listCounts" to not be called at all, but actually been called 2 times

Received: 

  1st listCounts call:

    Array [
      Object {
        "location": "",
        "page": 1,
        "status": "",
      },
    ]

  2nd listCounts call:

    Array [
      Object {
        "location": "",
        "page": 2,
        "status": "",
      },
    ]


Number of calls: 2

 > src/hooks/__tests__/useCounts.test.js:25:21
     23|     });
     24| 
     25|     expect(spy).not.toHaveBeenCalled();
       |                     ^
     26|   });
     27| 

------------------------[1/1]-
```

### Mutación 14: Enviar todas las líneas en cada guardado

- **Archivo:** `src/hooks/countSheetLines.js`
- **Original:** `if (!isLineDirty(entry)) return;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 5 failed) 89ms
   [x] useCountSheet hook > sends only dirty lines, sends "0" explicitly, and skips blank lines (killing mutation) 14ms
     > expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 1, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
        "counted_quantity": "0",
        "item_id": 1,
      },
+     Object {
+       "counted_quantity": "",
+       "item_id": 2,
+     },
+     Object {
+       "counted_quantity": "5",
+       "item_id": 3,
+     },
    ],
  ]


Number of calls: 1

   [x] useCountSheet hook > queues a save requested during another and sends what was edited meanwhile 4ms
     > expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]
   [x] useCountSheet hook > a line is pending only when it differs from what is saved 2ms
     > expected "saveCountLines" to not be called at all, but actually been called 1 times

Received: 

  1st saveCountLines call:

    Array [
      10,
      Array [
        Object {
          "counted_quantity": "",
          "item_id": 1,
        },
        Object {
          "counted_quantity": "",
          "item_id": 2,
        },
      ],
    ]


Number of calls: 1

   [x] useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends 3ms
     > expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]
   [x] useCountSheet hook > does not start a second save while one is in progress 2ms
     > expected "saveCountLines" to be called 1 times, but got 2 times

 Test Files  1 failed (1)
      Tests  5 failed | 14 passed (19)
   Start at  22:29:46
   Duration  2.16s (transform 100ms, setup 240ms, collect 123ms, tests 89ms, environment 1.33s, prepare 115ms)

------- Failed Tests 5 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > sends only dirty lines, sends "0" explicitly, and skips blank lines (killing mutation)
AssertionError: expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 1, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
        "counted_quantity": "0",
        "item_id": 1,
      },
+     Object {
+       "counted_quantity": "",
+       "item_id": 2,
+     },
+     Object {
+       "counted_quantity": "5",
+       "item_id": 3,
+     },
    ],
  ]


Number of calls: 1

 > src/hooks/__tests__/useCountSheet.test.js:373:21
    371|     // EXACT check: only item 1 with counted_quantity '0' must be sent.
    372|     // If mutation changes if (entry.isDirty) to if (true), item 3 wou...
    373|     expect(saveSpy).toHaveBeenCalledWith(10, [
       |                     ^
    374|       { item_id: 1, counted_quantity: '0' },
    375|     ]);

------------------------[1/5]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > queues a save requested during another and sends what was edited meanwhile
AssertionError: expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]

- Expected
+ Received

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "8",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "3",
        "item_id": 2,
      },
    ],
  ]

 > src/hooks/__tests__/useCountSheet.test.js:452:21
    450| 
    451|     expect(saveSpy).toHaveBeenCalledTimes(2);
    452|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
       |                     ^
    453|     expect(await second).toBe(true);
    454|     expect(result.current.hasPendingChanges()).toBe(false);

------------------------[2/5]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > a line is pending only when it differs from what is saved
AssertionError: expected "saveCountLines" to not be called at all, but actually been called 1 times

Received: 

  1st saveCountLines call:

    Array [
      10,
      Array [
        Object {
          "counted_quantity": "",
          "item_id": 1,
        },
        Object {
          "counted_quantity": "",
          "item_id": 2,
        },
      ],
    ]


Number of calls: 1

 > src/hooks/__tests__/useCountSheet.test.js:508:25
    506|     await act(async () => { ok = await result.current.savePendingLines...
    507|     expect(ok).toBe(true);
    508|     expect(saveSpy).not.toHaveBeenCalled();
       |                         ^
    509|   });
    510| 

------------------------[3/5]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends
AssertionError: expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]

- Expected
+ Received

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "8",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "7",
        "item_id": 2,
      },
    ],
  ]

 > src/hooks/__tests__/useCountSheet.test.js:540:21
    538| 
    539|     expect(saveSpy).toHaveBeenCalledTimes(2);
    540|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
       |                     ^
    541|   });
    542| 

------------------------[4/5]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > does not start a second save while one is in progress
AssertionError: expected "saveCountLines" to be called 1 times, but got 2 times
 > src/hooks/__tests__/useCountSheet.test.js:595:21
    593|     // Nada quedó pendiente: el segundo guardado no envió nada.
    594|     expect(await p2).toBe(true);
    595|     expect(saveSpy).toHaveBeenCalledTimes(1);
       |                     ^
    596|   });
    597| 

------------------------[5/5]-
```

### Mutación 15: Diferencia calculada en el cliente

- **Archivo:** `src/components/inventory/counts/ApplyCountDialog.jsx`
- **Original:** `const diffVal = line.difference;`
- **Mutado:** `const diffVal = (line.counted_quantity !== null && line.system_quantity !== null) ? Number(line.counted_quantity) - Number(line.system_quantity) : line.difference;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx (7 tests | 1 failed) 1363ms
   [x] ApplyCountDialog component > applies count and renders diffs from backend response, sorted by absolute diff with nulls last 1082ms
     > Unable to find an element with the text: +99. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;"
    >
      <div
        aria-labelledby="apply-dialog-title"
        aria-modal="true"
        class="glass-card"
        role="dialog"
        style="width: 100%; max-width: 500px; padding: 24px; border-radius: 16px; border: 1px solid var(--border-glow); max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-glass);"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
        >
          <h3
            id="apply-dialog-title"
            style="font-size: 18px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
          >
            Resultado del Conteo Aplicado
          </h3>
          <button
            aria-label="Cerrar diálogo"
            style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-x"
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
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
          aria-live="polite"
          style="min-height: 0px; padding: 0px; border-radius: 8px; background: transparent; color: var(--error); font-size: 12px; margin-bottom: 0px; border: medium;"
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px; flex: 1 1 0%; min-height: 0px;"
        >
          <div
            style="padding: 10px; border-radius: 8px; background: var(--success-soft); border: 1px solid var(--border-success); font-size: 12px; color: var(--success); font-weight: 600;"
          >
            Conteo aplicado exitosamente en el motor.
          </div>
          <div
            style="display: flex; gap: 8px; flex: 1 1 0%; overflow-y: auto; flex-direction: column; padding-right: 4px;"
          >
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Harina de trigo
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    8
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    10
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--success);"
                >
                  +2
                </span>
              </div>
            </div>
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Azúcar morena
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    10
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    5
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--error);"
                >
                  -5
                </span>
              </div>
            </div>
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Sal marina
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    Sin dato
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    Sin dato
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--text-muted);"
                >
                  Sin dato
                </span>
              </div>
            </div>
          </div>
          <button
            class="btn-primary"
            style="padding: 12px; border-radius: 9999px; font-weight: 600; cursor: pointer; margin-top: 10px;"
            type="button"
          >
            Cerrar y Regresar
          </button>
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
        style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;"
      >
        <div
          aria-labelledby="apply-dialog-title"
          aria-modal="true"
          class="glass-card"
          role="dialog"
          style="width: 100%; max-width: 500px; padding: 24px; border-radius: 16px; border: 1px solid var(--border-glow); max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-glass);"
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h3
              id="apply-dialog-title"
              style="font-size: 18px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
            >
              Resultado del Conteo Aplicado
            </h3>
            <button
              aria-label="Cerrar diálogo"
              style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-x"
                fill="none"
                height="20"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="20"
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
            aria-live="polite"
            style="min-height: 0px; padding: 0px; border-radius: 8px; background: transparent; color: var(--error); font-size: 12px; margin-bottom: 0px; border: medium;"
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px; flex: 1 1 0%; min-height: 0px;"
          >
            <div
              style="padding: 10px; border-radius: 8px; background: var(--success-soft); border: 1px solid var(--border-success); font-size: 12px; color: var(--success); font-weight: 600;"
            >
              Conteo aplicado exitosamente en el motor.
            </div>
            <div
              style="display: flex; gap: 8px; flex: 1 1 0%; overflow-y: auto; flex-direction: column; padding-right: 4px;"
            >
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Harina de trigo
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      8
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      10
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--success);"
                  >
                    +2
                  </span>
                </div>
              </div>
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Azúcar morena
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      10
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      5
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--error);"
                  >
                    -5
                  </span>
                </div>
              </div>
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Sal marina
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      Sin dato
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      Sin dato
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--text-muted);"
                  >
                    Sin dato
                  </span>
                </div>
              </div>
            </div>
            <button
              class="btn-primary"
              style="padding: 12px; border-radius: 9999px; font-weight: 600; cursor: pointer; margin-top: 10px;"
              type="button"
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  22:29:50
   Duration  3.75s (transform 114ms, setup 248ms, collect 199ms, tests 1.36s, environment 1.47s, prepare 169ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx > ApplyCountDialog component > applies count and renders diffs from backend response, sorted by absolute diff with nulls last
TestingLibraryElementError: Unable to find an element with the text: +99. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;"
    >
      <div
        aria-labelledby="apply-dialog-title"
        aria-modal="true"
        class="glass-card"
        role="dialog"
        style="width: 100%; max-width: 500px; padding: 24px; border-radius: 16px; border: 1px solid var(--border-glow); max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-glass);"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
        >
          <h3
            id="apply-dialog-title"
            style="font-size: 18px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
          >
            Resultado del Conteo Aplicado
          </h3>
          <button
            aria-label="Cerrar diálogo"
            style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-x"
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
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
          aria-live="polite"
          style="min-height: 0px; padding: 0px; border-radius: 8px; background: transparent; color: var(--error); font-size: 12px; margin-bottom: 0px; border: medium;"
        />
        <div
          style="display: flex; flex-direction: column; gap: 12px; flex: 1 1 0%; min-height: 0px;"
        >
          <div
            style="padding: 10px; border-radius: 8px; background: var(--success-soft); border: 1px solid var(--border-success); font-size: 12px; color: var(--success); font-weight: 600;"
          >
            Conteo aplicado exitosamente en el motor.
          </div>
          <div
            style="display: flex; gap: 8px; flex: 1 1 0%; overflow-y: auto; flex-direction: column; padding-right: 4px;"
          >
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Harina de trigo
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    8
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    10
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--success);"
                >
                  +2
                </span>
              </div>
            </div>
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Azúcar morena
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    10
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    5
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--error);"
                >
                  -5
                </span>
              </div>
            </div>
            <div
              style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
            >
              <div>
                <div
                  style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                >
                  Sal marina
                </div>
                <div
                  style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                >
                  <span>
                    Sistema: 
                    Sin dato
                  </span>
                  <span
                    aria-hidden="true"
                    style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                  />
                  <span>
                    Contado: 
                    Sin dato
                     
                    kg
                  </span>
                </div>
              </div>
              <div
                style="text-align: right;"
              >
                <span
                  style="font-size: 12px; font-weight: 700; color: var(--text-muted);"
                >
                  Sin dato
                </span>
              </div>
            </div>
          </div>
          <button
            class="btn-primary"
            style="padding: 12px; border-radius: 9999px; font-weight: 600; cursor: pointer; margin-top: 10px;"
            type="button"
          >
            Cerrar y Regresar
          </button>
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
        style="position: fixed; inset: 0px; background: var(--overlay); backdrop-filter: blur(8px); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px;"
      >
        <div
          aria-labelledby="apply-dialog-title"
          aria-modal="true"
          class="glass-card"
          role="dialog"
          style="width: 100%; max-width: 500px; padding: 24px; border-radius: 16px; border: 1px solid var(--border-glow); max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-glass);"
        >
          <div
            style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;"
          >
            <h3
              id="apply-dialog-title"
              style="font-size: 18px; font-weight: 700; margin: 0px; color: var(--text-main); font-family: var(--font-heading);"
            >
              Resultado del Conteo Aplicado
            </h3>
            <button
              aria-label="Cerrar diálogo"
              style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; padding: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-x"
                fill="none"
                height="20"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="20"
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
            aria-live="polite"
            style="min-height: 0px; padding: 0px; border-radius: 8px; background: transparent; color: var(--error); font-size: 12px; margin-bottom: 0px; border: medium;"
          />
          <div
            style="display: flex; flex-direction: column; gap: 12px; flex: 1 1 0%; min-height: 0px;"
          >
            <div
              style="padding: 10px; border-radius: 8px; background: var(--success-soft); border: 1px solid var(--border-success); font-size: 12px; color: var(--success); font-weight: 600;"
            >
              Conteo aplicado exitosamente en el motor.
            </div>
            <div
              style="display: flex; gap: 8px; flex: 1 1 0%; overflow-y: auto; flex-direction: column; padding-right: 4px;"
            >
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Harina de trigo
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      8
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      10
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--success);"
                  >
                    +2
                  </span>
                </div>
              </div>
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Azúcar morena
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      10
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      5
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--error);"
                  >
                    -5
                  </span>
                </div>
              </div>
              <div
                style="padding: 10px 12px; border-radius: 8px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center;"
              >
                <div>
                  <div
                    style="font-size: 13px; font-weight: 600; color: var(--text-main);"
                  >
                    Sal marina
                  </div>
                  <div
                    style="font-size: 11px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center;"
                  >
                    <span>
                      Sistema: 
                      Sin dato
                    </span>
                    <span
                      aria-hidden="true"
                      style="display: inline-block; width: 3px; height: 3px; border-radius: 50%; background: var(--text-subtle); margin: 0px 6px;"
                    />
                    <span>
                      Contado: 
                      Sin dato
                       
                      kg
                    </span>
                  </div>
                </div>
                <div
                  style="text-align: right;"
                >
                  <span
                    style="font-size: 12px; font-weight: 700; color: var(--text-muted);"
                  >
                    Sin dato
                  </span>
                </div>
              </div>
            </div>
            <button
              class="btn-primary"
              style="padding: 12px; border-radius: 9999px; font-weight: 600; cursor: pointer; margin-top: 10px;"
              type="button"
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx:154:11
    152|     fireEvent.click(confirmBtn);
    153| 
    154|     await waitFor(() => {
       |           ^
    155|       expect(screen.getByText('Resultado del Conteo Aplicado')).toBeIn...
    156|       expect(screen.getByText('Conteo aplicado exitosamente en el moto...

------------------------[1/1]-
```

### Mutación 16: Marcar guardada una línea editada durante el guardado

- **Archivo:** `src/hooks/countSheetLines.js`
- **Original:** `if (current && normalizeCountValue(current.counted_quantity) === sentValue) {`
- **Mutado:** `if (current) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 1 failed) 83ms
   [x] useCountSheet hook > keeps line dirty and sends updated value on next save if edited during in-flight save 12ms
     > expected false to be true // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 18 passed (19)
   Start at  22:29:56
   Duration  2.14s (transform 97ms, setup 236ms, collect 117ms, tests 83ms, environment 1.34s, prepare 115ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > keeps line dirty and sends updated value on next save if edited during in-flight save
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 > src/hooks/__tests__/useCountSheet.test.js:304:51
    302| 
    303|     // It must still be dirty!
    304|     expect(result.current.quantities[1]?.isDirty).toBe(true);
       |                                                   ^
    305|     expect(result.current.saveStatus).toBe('dirty');
    306| 

------------------------[1/1]-
```

### Mutación 17: Volver solo guarda con estado "dirty" (19p_fix2)

- **Archivo:** `src/components/inventory/counts/CountSheet.jsx`
- **Original:** `if (hasPendingChanges() || saveStatus === 'saving') {`
- **Mutado:** `if (saveStatus === 'dirty') {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx (5 tests | 1 failed) 1329ms
   [x] CountSheet safety > after a failed save, going back saves again and stays if it fails again 1175ms
     > expected "saveCountLines" to be called 2 times, but got 1 times

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px; height: 100%;"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;"
        >
          <button
            style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
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
              Volver a conteos
            </span>
          </button>
          <div
            style="display: flex; align-items: center; gap: 8px;"
          >
            <span
              aria-live="polite"
              role="status"
              style="font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: var(--error-soft); color: var(--error);"
            >
              Sin conexión
            </span>
            <button
              class="glass-card-interactive"
              style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-save"
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
                  d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                />
                <path
                  d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
                />
                <path
                  d="M7 3v4a1 1 0 0 0 1 1h7"
                />
              </svg>
              <span>
                Guardar avance
              </span>
            </button>
            <button
              class="glass-card-interactive"
              style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-circle-x"
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
                  d="m15 9-6 6"
                />
                <path
                  d="m9 9 6 6"
                />
              </svg>
              <span>
                Cancelar conteo
              </span>
            </button>
            <button
              class="btn-primary"
              style="padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 1;"
              type="button"
            >
              <svg
                class="lucide lucide-circle-check"
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
                  d="m9 12 2 2 4-4"
                />
              </svg>
              <span>
                Aplicar
              </span>
            </button>
  ...

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  22:30:00
   Duration  3.79s (transform 159ms, setup 269ms, collect 275ms, tests 1.33s, environment 1.47s, prepare 132ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx > CountSheet safety > after a failed save, going back saves again and stays if it fails again
AssertionError: expected "saveCountLines" to be called 2 times, but got 1 times

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px; height: 100%;"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;"
        >
          <button
            style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
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
              Volver a conteos
            </span>
          </button>
          <div
            style="display: flex; align-items: center; gap: 8px;"
          >
            <span
              aria-live="polite"
              role="status"
              style="font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: var(--error-soft); color: var(--error);"
            >
              Sin conexión
            </span>
            <button
              class="glass-card-interactive"
              style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-save"
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
                  d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                />
                <path
                  d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
                />
                <path
                  d="M7 3v4a1 1 0 0 0 1 1h7"
                />
              </svg>
              <span>
                Guardar avance
              </span>
            </button>
            <button
              class="glass-card-interactive"
              style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
              type="button"
            >
              <svg
                class="lucide lucide-circle-x"
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
                  d="m15 9-6 6"
                />
                <path
                  d="m9 9 6 6"
                />
              </svg>
              <span>
                Cancelar conteo
              </span>
            </button>
            <button
              class="btn-primary"
              style="padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 1;"
              type="button"
            >
              <svg
                class="lucide lucide-circle-check"
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
                  d="m9 12 2 2 4-4"
                />
              </svg>
              <span>
                Aplicar
              </span>
            </button>
  ...
 > src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx:43:41
     41| 
     42|     fireEvent.click(screen.getByText('Volver a conteos'));
     43|     await waitFor(() => expect(saveSpy).toHaveBeenCalledTimes(2));
       |                                         ^
     44|     expect(onBack).not.toHaveBeenCalled();
     45|   });
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[1/1]-
```

### Mutación 18: Quitar React.memo de CountSheetRow (19p_fix2)

- **Archivo:** `src/components/inventory/counts/CountSheetRow.jsx`
- **Original:** `export default memo(CountSheetRow);`
- **Mutado:** `export default CountSheetRow;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/counts/__tests__/CountSheetPerformance.test.jsx (1 test | 1 failed) 519ms
   [x] CountSheet performance with 240 items > typing in one row re-renders only that row of the real sheet 518ms
     > expected "formatQuantity" to be called 1 times, but got 240 times

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  22:30:05
   Duration  2.83s (transform 150ms, setup 264ms, collect 275ms, tests 519ms, environment 1.38s, prepare 119ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/counts/__tests__/CountSheetPerformance.test.jsx > CountSheet performance with 240 items > typing in one row re-renders only that row of the real sheet
AssertionError: expected "formatQuantity" to be called 1 times, but got 240 times
 > src/components/inventory/counts/__tests__/CountSheetPerformance.test.jsx:48:28
     46|     // Una sola fila vuelve a renderizar. Sin React.memo en CountSheet...
     47|     // un updateQuantity inestable, serían 240.
     48|     expect(formatQuantity).toHaveBeenCalledTimes(1);
       |                            ^
     49|   });
     50| });

------------------------[1/1]-
```

### Mutación 19: Enviar líneas con formato inválido (19p_fix2)

- **Archivo:** `src/hooks/countSheetLines.js`
- **Original:** `if (error) { invalid[id] = [error]; return; }`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 1 failed) 89ms
   [x] useCountSheet hook > sends valid lines and keeps an invalid one pending with its error 13ms
     > expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 2, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "1.2345",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "5",
        "item_id": 2,
      },
    ],
  ]


Number of calls: 1


 Test Files  1 failed (1)
      Tests  1 failed | 18 passed (19)
   Start at  22:30:10
   Duration  2.22s (transform 95ms, setup 243ms, collect 119ms, tests 89ms, environment 1.40s, prepare 113ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > sends valid lines and keeps an invalid one pending with its error
AssertionError: expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 2, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "1.2345",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "5",
        "item_id": 2,
      },
    ],
  ]


Number of calls: 1

 > src/hooks/__tests__/useCountSheet.test.js:474:21
    472|     await act(async () => { ok = await result.current.savePendingLines...
    473| 
    474|     expect(saveSpy).toHaveBeenCalledWith(10, [{ item_id: 2, counted_qu...
       |                     ^
    475|     expect(ok).toBe(false);
    476|     expect(result.current.lineErrors[1]).toEqual(['Usa solo números, c...

------------------------[1/1]-
```

### Mutación 20: Ensuciar una línea igual a la guardada (19p_fix2)

- **Archivo:** `src/hooks/countSheetLines.js`
- **Original:** `return current !== '' && current !== normalizeCountValue(entry.initial_saved_qty);`
- **Mutado:** `return current !== '';`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 7 failed) 87ms
   [x] useCountSheet hook > saves pending lines to the backend and marks them clean 14ms
     > expected false to be true // Object.is equality
   [x] useCountSheet hook > keeps line dirty and sends updated value on next save if edited during in-flight save 3ms
     > expected false to be true // Object.is equality
   [x] useCountSheet hook > sends only dirty lines, sends "0" explicitly, and skips blank lines (killing mutation) 5ms
     > expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 1, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
        "counted_quantity": "0",
        "item_id": 1,
      },
+     Object {
+       "counted_quantity": "5",
+       "item_id": 3,
+     },
    ],
  ]


Number of calls: 1

   [x] useCountSheet hook > queues a save requested during another and sends what was edited meanwhile 3ms
     > expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]
   [x] useCountSheet hook > a line is pending only when it differs from what is saved 2ms
     > expected true to be false // Object.is equality
   [x] useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends 3ms
     > expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]
   [x] useCountSheet hook > does not start a second save while one is in progress 2ms
     > expected false to be true // Object.is equality

 Test Files  1 failed (1)
      Tests  7 failed | 12 passed (19)
   Start at  22:30:14
   Duration  2.21s (transform 95ms, setup 244ms, collect 117ms, tests 87ms, environment 1.38s, prepare 115ms)

------- Failed Tests 7 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > saves pending lines to the backend and marks them clean
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 > src/hooks/__tests__/useCountSheet.test.js:129:21
    127|     });
    128| 
    129|     expect(success).toBe(true);
       |                     ^
    130|     expect(saveSpy).toHaveBeenCalledWith(10, [
    131|       { item_id: 1, counted_quantity: '8.5' },

------------------------[1/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > keeps line dirty and sends updated value on next save if edited during in-flight save
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 > src/hooks/__tests__/useCountSheet.test.js:313:31
    311|     });
    312| 
    313|     expect(secondSaveSuccess).toBe(true);
       |                               ^
    314|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 1, counte...
    315|     expect(result.current.quantities[1]?.isDirty).toBe(false);

------------------------[2/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > sends only dirty lines, sends "0" explicitly, and skips blank lines (killing mutation)
AssertionError: expected "saveCountLines" to be called with arguments: [ 10, [ { item_id: 1, ...(1) } ] ]

Received: 

  1st saveCountLines call:

  Array [
    10,
    Array [
      Object {
        "counted_quantity": "0",
        "item_id": 1,
      },
+     Object {
+       "counted_quantity": "5",
+       "item_id": 3,
+     },
    ],
  ]


Number of calls: 1

 > src/hooks/__tests__/useCountSheet.test.js:373:21
    371|     // EXACT check: only item 1 with counted_quantity '0' must be sent.
    372|     // If mutation changes if (entry.isDirty) to if (true), item 3 wou...
    373|     expect(saveSpy).toHaveBeenCalledWith(10, [
       |                     ^
    374|       { item_id: 1, counted_quantity: '0' },
    375|     ]);

------------------------[3/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > queues a save requested during another and sends what was edited meanwhile
AssertionError: expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]

- Expected
+ Received

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "8",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "3",
        "item_id": 2,
      },
    ],
  ]

 > src/hooks/__tests__/useCountSheet.test.js:452:21
    450| 
    451|     expect(saveSpy).toHaveBeenCalledTimes(2);
    452|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
       |                     ^
    453|     expect(await second).toBe(true);
    454|     expect(result.current.hasPendingChanges()).toBe(false);

------------------------[4/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > a line is pending only when it differs from what is saved
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > src/hooks/__tests__/useCountSheet.test.js:492:50
    490|     // Item 1 tiene 5.5 guardado: escribir lo mismo (con coma) no lo e...
    491|     act(() => { result.current.updateQuantity(1, '5,5'); });
    492|     expect(result.current.quantities[1].isDirty).toBe(false);
       |                                                  ^
    493| 
    494|     // Dejar en blanco una línea nunca guardada no la ensucia.

------------------------[5/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends
AssertionError: expected last "saveCountLines" call to have been called with [ 10, [ { item_id: 2, ...(1) } ] ]

- Expected
+ Received

  Array [
    10,
    Array [
      Object {
+       "counted_quantity": "8",
+       "item_id": 1,
+     },
+     Object {
        "counted_quantity": "7",
        "item_id": 2,
      },
    ],
  ]

 > src/hooks/__tests__/useCountSheet.test.js:540:21
    538| 
    539|     expect(saveSpy).toHaveBeenCalledTimes(2);
    540|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
       |                     ^
    541|   });
    542| 

------------------------[6/7]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > does not start a second save while one is in progress
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 > src/hooks/__tests__/useCountSheet.test.js:594:22
    592| 
    593|     // Nada quedó pendiente: el segundo guardado no envió nada.
    594|     expect(await p2).toBe(true);
       |                      ^
    595|     expect(saveSpy).toHaveBeenCalledTimes(1);
    596|   });

------------------------[7/7]-
```

### Mutación 21: Descartar el guardado pedido durante otro (19p_fix2)

- **Archivo:** `src/hooks/useCountSheet.js`
- **Original:** `const next = previous ? previous.catch(() => false).then(() => runSave()) : runSave();`
- **Mutado:** `const next = previous ? Promise.resolve(false) : runSave();`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/useCountSheet.test.js (19 tests | 3 failed) 84ms
   [x] useCountSheet hook > queues a save requested during another and sends what was edited meanwhile 11ms
     > expected "saveCountLines" to be called 2 times, but got 1 times
   [x] useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends 3ms
     > expected "saveCountLines" to be called 2 times, but got 1 times
   [x] useCountSheet hook > does not start a second save while one is in progress 3ms
     > expected false to be true // Object.is equality

 Test Files  1 failed (1)
      Tests  3 failed | 16 passed (19)
   Start at  22:30:18
   Duration  2.12s (transform 98ms, setup 265ms, collect 116ms, tests 84ms, environment 1.29s, prepare 113ms)

------- Failed Tests 3 -------

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > queues a save requested during another and sends what was edited meanwhile
AssertionError: expected "saveCountLines" to be called 2 times, but got 1 times
 > src/hooks/__tests__/useCountSheet.test.js:451:21
    449|     });
    450| 
    451|     expect(saveSpy).toHaveBeenCalledTimes(2);
       |                     ^
    452|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
    453|     expect(await second).toBe(true);

------------------------[1/3]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > saves pending lines when the tab is hidden during a save, after that save ends
AssertionError: expected "saveCountLines" to be called 2 times, but got 1 times
 > src/hooks/__tests__/useCountSheet.test.js:539:21
    537|     });
    538| 
    539|     expect(saveSpy).toHaveBeenCalledTimes(2);
       |                     ^
    540|     expect(saveSpy).toHaveBeenLastCalledWith(10, [{ item_id: 2, counte...
    541|   });

------------------------[2/3]-

 FAIL  src/hooks/__tests__/useCountSheet.test.js > useCountSheet hook > does not start a second save while one is in progress
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 > src/hooks/__tests__/useCountSheet.test.js:594:22
    592| 
    593|     // Nada quedó pendiente: el segundo guardado no envió nada.
    594|     expect(await p2).toBe(true);
       |                      ^
    595|     expect(saveSpy).toHaveBeenCalledTimes(1);
    596|   });

------------------------[3/3]-
```

### Mutación 22: Contar como contado solo lo escrito en el campo (19p_fix2)

- **Archivo:** `src/hooks/countSheetLines.js`
- **Original:** `return saved !== '' || (current !== '' && countValueError(current) === null);`
- **Mutado:** `return current !== '';`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx (7 tests | 1 failed) 415ms
   [x] ApplyCountDialog component > counts what is saved in the engine: a cleared saved line is counted, an invalid pending one is not 28ms
     > expect(element).toHaveTextContent()

Expected element to have text content:
  2
Received:
  1

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  22:30:22
   Duration  2.71s (transform 116ms, setup 284ms, collect 208ms, tests 415ms, environment 1.42s, prepare 122ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx > ApplyCountDialog component > counts what is saved in the engine: a cleared saved line is counted, an invalid pending one is not
Error: expect(element).toHaveTextContent()

Expected element to have text content:
  2
Received:
  1
 > src/components/inventory/counts/__tests__/ApplyCountDialog.test.jsx:82:63
     80| 
     81|     // Contados: 1 y 3 (guardados aunque el campo esté en blanco). No ...
     82|     expect(screen.getByText('Insumos contados:').nextSibling).toHaveTe...
       |                                                               ^
     83|     expect(screen.getByText('No contados (se conservan):').nextSibling...
     84|   });

------------------------[1/1]-
```

### Mutación 23: Sin aviso de cantidad ya guardada (19p_fix2)

- **Archivo:** `src/components/inventory/counts/CountSheet.jsx`
- **Original:** `notice={savedNotice(quantities[item.id])}`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx (5 tests | 1 failed) 276ms
   [x] CountSheet safety > clearing a saved quantity explains that the engine keeps it 28ms
     > Unable to find an element with the text: /Ya hay 4 guardada en el motor/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px; height: 100%;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;"
      >
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
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
            Volver a conteos
          </span>
        </button>
        <div
          style="display: flex; align-items: center; gap: 8px;"
        >
          <span
            aria-live="polite"
            role="status"
            style="font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
          >
            Guardado hace un momento
          </span>
          <button
            class="glass-card-interactive"
            style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-save"
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
                d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
              />
              <path
                d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
              />
              <path
                d="M7 3v4a1 1 0 0 0 1 1h7"
              />
            </svg>
            <span>
              Guardar avance
            </span>
          </button>
          <button
            class="glass-card-interactive"
            style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-circle-x"
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
                d="m15 9-6 6"
              />
              <path
                d="m9 9 6 6"
              />
            </svg>
            <span>
              Cancelar conteo
            </span>
          </button>
          <button
            class="btn-primary"
            style="padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 1;"
            type="button"
          >
            <svg
              class="lucide lucide-circle-check"
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
                d="m9 12 2 2 4-4"
              />
            </svg>
            <span>
              Aplicar
            </span>
          </button>
        </div>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <div
          style="display: flex; justify...

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  22:30:27
   Duration  2.46s (transform 158ms, setup 248ms, collect 285ms, tests 276ms, environment 1.27s, prepare 112ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx > CountSheet safety > clearing a saved quantity explains that the engine keeps it
TestingLibraryElementError: Unable to find an element with the text: /Ya hay 4 guardada en el motor/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
<body>
  <div>
    <div
      style="display: flex; flex-direction: column; gap: 14px; height: 100%;"
    >
      <div
        style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;"
      >
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; padding: 4px 0px;"
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
            Volver a conteos
          </span>
        </button>
        <div
          style="display: flex; align-items: center; gap: 8px;"
        >
          <span
            aria-live="polite"
            role="status"
            style="font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
          >
            Guardado hace un momento
          </span>
          <button
            class="glass-card-interactive"
            style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-save"
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
                d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
              />
              <path
                d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
              />
              <path
                d="M7 3v4a1 1 0 0 0 1 1h7"
              />
            </svg>
            <span>
              Guardar avance
            </span>
          </button>
          <button
            class="glass-card-interactive"
            style="padding: 6px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
            type="button"
          >
            <svg
              class="lucide lucide-circle-x"
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
                d="m15 9-6 6"
              />
              <path
                d="m9 9 6 6"
              />
            </svg>
            <span>
              Cancelar conteo
            </span>
          </button>
          <button
            class="btn-primary"
            style="padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 1;"
            type="button"
          >
            <svg
              class="lucide lucide-circle-check"
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
                d="m9 12 2 2 4-4"
              />
            </svg>
            <span>
              Aplicar
            </span>
          </button>
        </div>
      </div>
      <div
        style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
      >
        <div
          style="display: flex; justify...
 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/inventory/counts/__tests__/CountSheetSafety.test.jsx:86:19
     84| 
     85|     fireEvent.change(screen.getByLabelText('Tomate'), { target: { valu...
     86|     expect(screen.getByText(/Ya hay 4 guardada en el motor/)).toBeInTh...
       |                   ^
     87| 
     88|     fireEvent.click(screen.getByText('Volver a conteos'));

------------------------[1/1]-
```

### Mutación 24: Errores de tanda sin desplazamiento (19p_fix)

- **Archivo:** `src/services/inventoryCountsClient.js`
- **Original:** `const targetItem = batch[idx];`
- **Mutado:** `const targetItem = { item_id: idx };`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/inventoryCountsClient.test.js (24 tests | 1 failed) 26ms
   [x] inventoryCountsClient service > saveCountLines > translates 422 errors of a batch to lineErrors mapped by item_id using batch offset 9ms
     > expected undefined to deeply equal [ Array(1) ]

 Test Files  1 failed (1)
      Tests  1 failed | 23 passed (24)
   Start at  22:30:31
   Duration  2.04s (transform 78ms, setup 264ms, collect 82ms, tests 26ms, environment 1.29s, prepare 111ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/inventoryCountsClient.test.js > inventoryCountsClient service > saveCountLines > translates 422 errors of a batch to lineErrors mapped by item_id using batch offset
AssertionError: expected undefined to deeply equal [ Array(1) ]

- Expected: 
Array [
  "El insumo no existe en este negocio o no se puede contar.",
]

+ Received: 
undefined

 > src/services/__tests__/inventoryCountsClient.test.js:283:35
    281|       expect(spy).toHaveBeenCalledTimes(2);
    282|       expect(res.lineErrors).toBeDefined();
    283|       expect(res.lineErrors[304]).toEqual(['El insumo no existe en est...
       |                                   ^
    284|     });
    285|   });

------------------------[1/1]-
```

## 5. Pendiente

- **Motor:** un endpoint para quitar una línea de un borrador de conteo. Hoy, dejar en blanco una cantidad guardada no la borra: la planilla lo explica junto al insumo.
- **Motor:** el listado de conteos no trae la cantidad de líneas; la PWA no la inventa.
- Prueba manual en el teléfono contra el motor (sección 3).
