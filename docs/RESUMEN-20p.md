# Resumen del Brief 20p: compras, proveedores y valor del inventario en la app

Rama `feat/pwa-purchases`, creada desde `feat/pwa-production` (`70d9f86`). Construido por Claude a pedido explícito
del dueño del producto (2026-10-09 y 2026-10-10), con tests junto a cada pieza y revisado por el agente
`code-reviewer`. Primer commit `077cb9e`; las correcciones de la revisión van en un commit aparte. Contrato del
motor: `UaldoBusiness/docs/API-purchases.md` (Brief 20, `a2a5311`).

## 1. Qué se construyó

- **Cliente** (`src/services/purchasesClient.js`): proveedores, compras, recepción, cancelación, reemplazo de líneas
  y valorización. Valida ids (`^\d+$`), ubicaciones, fechas reales, cantidades (mayores que 0, hasta 3 decimales,
  con coma), montos (`normalizeAmount`), RUC o cédula, teléfono y correo antes de llamar al motor, con las mismas
  claves de error que el motor (`lines.N.campo`).
- **Entrada:** botón "Compras" en la cabecera de Inventario, solo para el dueño. El personal no ve el botón y no se
  monta nada que pida compras.
- **Compras** (`inventory/purchases/`): lista con filtro por estado y "Cargar más"; nueva compra con búsqueda de
  proveedor, destino, fecha, factura, notas y líneas (insumo buscado por nombre o código, sin servicios; cantidad;
  total pagado; nota); detalle pedido al motor con las líneas, el costo unitario y el total del motor; editar
  líneas, recibir y cancelar con confirmación propia accesible.
- **Proveedores:** búsqueda con espera de 300 ms, "Incluir inactivos", alta, edición y desactivación; el 422 de
  nombre duplicado junto al nombre.
- **Valor:** total y por ubicación, con aviso de insumos con stock sin costo.
- **Reglas:** ningún monto se calcula en el cliente; `client_uuid` al abrir, reutilizado tras un error de red y
  renovado tras un 201 o un 200; contenedores `aria-live` siempre montados; diálogos con `role="dialog"`, Escape,
  Tab dentro y retorno del foco.
- **Configuración de tests** (`vite.config.js`): se quitó `singleFork`. Con todos los archivos en un solo proceso,
  la corrida con cobertura de esta rama fallaba siempre en 4 tests de caja que dependen del tiempo (un aviso que se
  borra a los 4 s y límites de 5 s), aunque pasaban solos, en la suite sin cobertura y en el commit anterior
  (`70d9f86`, comprobado en una copia aparte). Sin `singleFork` pasan con y sin cobertura. Los tests de caja siguen
  siendo frágiles (esperan un solo ciclo de promesas) y no se tocaron: están fuera del alcance.

Durante la construcción, los tests encontraron que el aviso tras recibir, cancelar o guardar líneas nunca aparecía
(el detalle no pasaba la acción a la vista) y que el detalle se volvía a montar al cambiar de estado (se perdía el
foco). Ambos se corrigieron antes del primer commit.

## 2. Verificación

| Comando | Resultado |
|---|---|
| `npm run lint` | 0 errores (51 advertencias anteriores, ninguna en los archivos nuevos) |
| `npm test` | 73 archivos, 522 tests en verde |
| `npm run test:coverage` | Todos los archivos nuevos con 80 % o más de sentencias y ramas (tabla abajo) |
| `npm run build:prod` | Correcto |
| `grep` de colores directos en `src/components/inventory` | Sin coincidencias |
| Emojis y tildes | Ninguno; ninguna tilde perdida |

Filas de los archivos del brief, copiadas de la salida de `npm run test:coverage`:

```text
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
stderr | src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M7: switching tabs keeps the new purchase form and what was written
stderr | src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx > Valuation tab > goes back to inventory
  ...ntoryView.jsx |   82.35 |    88.88 |   23.52 |   82.35 | ...99-101,169-174 
  ...erActions.jsx |     100 |      100 |     100 |     100 |                   
 ...tory/purchases |   99.83 |    92.01 |   92.85 |   99.83 |                   
  ...irmDialog.jsx |     100 |    90.32 |     100 |     100 | 6-7,62            
  ...aseDetail.jsx |     100 |    88.63 |     100 |     100 | 37,50-53,89-92    
  PurchaseForm.jsx |     100 |    90.47 |   66.66 |     100 | 44,54             
  ...nesEditor.jsx |     100 |    88.23 |      90 |     100 | 30,45-52          
  PurchaseList.jsx |     100 |    94.44 |     100 |     100 | 65                
  ...hasesView.jsx |     100 |    93.75 |     100 |     100 | 41,61             
  SupplierForm.jsx |     100 |      100 |     100 |     100 |                   
  ...iersPanel.jsx |   98.03 |    86.95 |   85.71 |   98.03 | 49                
  ...tionPanel.jsx |     100 |    94.11 |     100 |     100 | 19                
  purchaseUi.js    |     100 |      100 |     100 |     100 |                   
  purchaseLines.js |     100 |    94.87 |     100 |     100 | 27,47             
  usePagedList.js  |     100 |    94.44 |   66.66 |     100 | 39,41             
  ...aseActions.js |     100 |    97.14 |     100 |     100 | 25                
  ...chasesData.js |     100 |     85.1 |     100 |     100 | 38,49-51,77       
  ...asesClient.js |     100 |     97.8 |     100 |     100 | 76,160            
```

## 3. Revisión del agente `code-reviewer` y correcciones

El agente encontró un HIGH, que ya estaba en el primer commit (`077cb9e`):

- **H1: el detalle usaba la compra de la lista, que el motor manda sin líneas.** El dueño veía la compra vacía y,
  si pulsaba "Editar líneas" y guardaba, el `PUT /lines` reemplazaba todas las líneas: las anteriores se perdían
  sin aviso. Los tests no lo vieron porque los datos de prueba de la lista sí traían líneas.
  **Corrección:** el detalle siempre se pide al motor (`usePurchaseDetail` con `getPurchase`), con estado de carga,
  error y "Reintentar". Los datos de prueba de la lista ahora no traen líneas, como el motor real.

| Hallazgo | Corrección |
|---|---|
| **M1:** tras un 409 el detalle seguía en borrador, con Recibir y Cancelar visibles | Tras un 409 se recarga la compra del motor y se actualiza la lista |
| **M2:** el selector de proveedor solo mostraba los primeros 50 y ocultaba los errores de carga | Búsqueda de proveedor en el formulario, el elegido se conserva aunque cambie la búsqueda, y el error de carga se muestra |
| **M3:** al cambiar el filtro se veían compras del filtro anterior, y una compra recibida seguía bajo "Borradores" | La lista se vacía al cambiar el filtro y solo conserva compras que lo cumplen |
| **M4:** los errores de la cabecera no se borraban al corregir el campo | Corregir un campo borra su error; un nuevo envío limpia los anteriores |
| **M5:** la búsqueda de insumos no decía si fallaba o no encontraba nada, y el foco se perdía al agregar | "No se pudo buscar: revisa la conexión.", "Sin resultados para..." y el foco pasa a la cantidad de la línea nueva |
| **M6:** mientras procesaba, los botones quedaban `disabled` y Tab salía del diálogo | Los botones usan `aria-disabled` y el foco queda dentro |
| **M7:** cambiar de pestaña desmontaba el formulario de nueva compra y su `client_uuid` (riesgo de duplicar tras un error de red) | La pestaña Compras queda montada y oculta; las pestañas tienen `tabpanel` y `aria-controls` |
| **LOW:** fechas imposibles (`2026-13-45`) y el error general de líneas perdido al editar | Se validan fechas reales; el error general de las líneas se muestra en la edición |

Sin cambios, por decisión: reintentar con el mismo uuid tras editar devuelve la compra original (igual que en
movimientos y producción); sin campo de error para la nota de cada línea; "Descartar cambios" sin confirmación.

Sobre `singleFork`, el agente confirmó que no tiene efectos secundarios: `securityGuard.test.js` es el único que
escribe temporales en `src` y es también el único que lo recorre, en un mismo proceso.

## 4. Mutaciones

Cada mutación se aplicó con un script, se ejecutaron los tests indicados y se restauró el archivo. Las salidas son las reales de esa ejecución (2026-10-10), sin editar salvo los símbolos de terminal (`[ok]`, `[x]` y `>`). Resultado: **37 de 38 detectadas**.

- La que sobrevive ("Abrir Compras para el personal", mutación 26) quita `&& isOwner` de `InventoryView`. Es una comprobación redundante a propósito: el personal no ve el botón, así que no hay forma de llegar a esa pantalla y el cambio no es observable. Se deja como defensa en profundidad.
- Una corrida anterior se lanzó mientras otra seguía activa: los dos scripts compitieron y uno dejó `PurchaseLinesEditor.jsx` sin la línea que mueve el foco. Se detectó comprobando los 38 puntos contra el código, se restauró y el script ahora tiene un candado (fuera del repo) y una comprobación final de que ningún archivo quedó mutado. Esta es la corrida limpia.

### Mutación 1: Aceptar cantidades en 0

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `return QUANTITY_FORMAT.test(value) && Number(value) > 0 ? value : null;`
- **Mutado:** `return QUANTITY_FORMAT.test(value) ? value : null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 2 failed) 19ms
   [x] purchasesClient > normalizes quantities: comma, positive and 3 decimals 7ms
     > expected '0' to be null
   [x] purchasesClient > purchases > reports errors with the engine keys and does not call it 3ms
     > expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
   Start at  06:56:22
   Duration  2.12s (transform 77ms, setup 238ms, collect 94ms, tests 19ms, environment 1.25s, prepare 156ms)

------- Failed Tests 2 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > normalizes quantities: comma, positive and 3 decimals
AssertionError: expected '0' to be null

- Expected: 
null

+ Received: 
"0"

 > src/services/__tests__/purchasesClient.test.js:29:104
     27|   it('normalizes quantities: comma, positive and 3 decimals', () => {
     28|     expect(normalizePurchaseQuantity(' 10,5 ')).toBe('10.5');
     29|     ['0', '1.2345', '-1', 'abc', '', null].forEach((value) => expect(n...
       |                                                                                                        ^
     30|   });
     31| 
 > src/services/__tests__/purchasesClient.test.js:29:44

------------------------[1/2]-

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > reports errors with the engine keys and does not call it
AssertionError: expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

- Expected
+ Received

  Array [
    "lines.0.line_total",
-   "lines.0.quantity",
    "lines.1.item_id",
    "location",
    "purchased_on",
    "supplier_id",
  ]

 > src/services/__tests__/purchasesClient.test.js:110:51
    108|       }, 'uuid');
    109|       expect(res.status).toBe(422);
    110|       expect(Object.keys(res.data.errors).sort()).toEqual([
       |                                                   ^
    111|         'lines.0.line_total', 'lines.0.quantity', 'lines.1.item_id', '...
    112|       ]);

------------------------[2/2]-
```

### Mutación 2: Ids como 1e2 pasan la validación

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `if (!/^\d+$/.test(String(value ?? '').trim())) return null;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 2 failed) 26ms
   [x] purchasesClient > suppliers > updates only the fields sent, including is_active 9ms
     > expected 200 to be 400 // Object.is equality
   [x] purchasesClient > purchases > replaces lines, receives and cancels with validated ids 1ms
     > expected 200 to be 400 // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
   Start at  06:56:26
   Duration  2.16s (transform 77ms, setup 244ms, collect 89ms, tests 26ms, environment 1.27s, prepare 155ms)

------- Failed Tests 2 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > suppliers > updates only the fields sent, including is_active
AssertionError: expected 200 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 200

 > src/services/__tests__/purchasesClient.test.js:58:72
     56|       expect(spy).toHaveBeenLastCalledWith('/suppliers/4', { method: '...
     57|       expect(buildSupplierBody({ name: '' }, { partial: true }).errors...
     58|       expect((await updateSupplier('4x', { is_active: true })).status)...
       |                                                                        ^
     59|       expect((await updateSupplier(4, { email: 'mal' })).status).toBe(...
     60|     });

------------------------[1/2]-

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > replaces lines, receives and cancels with validated ids
AssertionError: expected 200 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 200

 > src/services/__tests__/purchasesClient.test.js:147:42
    145|       spy.mockClear();
    146|       for (const fn of [getPurchase, receivePurchase, cancelPurchase])...
    147|         expect((await fn('1e2')).status).toBe(400);
       |                                          ^
    148|       }
    149|       expect((await replacePurchaseLines(0, base.lines)).status).toBe(...

------------------------[2/2]-
```

### Mutación 3: Aceptar un RUC con cualquier formato

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `const TAX_ID_FORMAT = /^(\d{10}|\d{13})$/;`
- **Mutado:** `const TAX_ID_FORMAT = /^.*$/;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 1 failed) 28ms
   [x] purchasesClient > suppliers > validates name, tax id, phone and email before creating 12ms
     > expected [ 'email', 'name', 'phone' ] to deeply equal [ 'email', 'name', 'phone', 'tax_id' ]

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:56:30
   Duration  2.06s (transform 75ms, setup 232ms, collect 89ms, tests 28ms, environment 1.20s, prepare 142ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > suppliers > validates name, tax id, phone and email before creating
AssertionError: expected [ 'email', 'name', 'phone' ] to deeply equal [ 'email', 'name', 'phone', 'tax_id' ]

- Expected
+ Received

  Array [
    "email",
    "name",
    "phone",
-   "tax_id",
  ]

 > src/services/__tests__/purchasesClient.test.js:43:51
     41|       const res = await createSupplier({ name: ' ', tax_id: '123', pho...
     42|       expect(res.status).toBe(422);
     43|       expect(Object.keys(res.data.errors).sort()).toEqual(['email', 'n...
       |                                                   ^
     44|       expect((await createSupplier({ name: 'x'.repeat(121) })).data.er...
     45|       expect(spy).not.toHaveBeenCalled();

------------------------[1/1]-
```

### Mutación 4: Permitir el mismo insumo dos veces

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `if (!itemId || seen.has(itemId))`
- **Mutado:** `if (!itemId)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 1 failed) 19ms
   [x] purchasesClient > purchases > reports errors with the engine keys and does not call it 8ms
     > expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:56:34
   Duration  2.16s (transform 73ms, setup 226ms, collect 89ms, tests 19ms, environment 1.28s, prepare 159ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > reports errors with the engine keys and does not call it
AssertionError: expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

- Expected
+ Received

  Array [
    "lines.0.line_total",
    "lines.0.quantity",
-   "lines.1.item_id",
    "location",
    "purchased_on",
    "supplier_id",
  ]

 > src/services/__tests__/purchasesClient.test.js:110:51
    108|       }, 'uuid');
    109|       expect(res.status).toBe(422);
    110|       expect(Object.keys(res.data.errors).sort()).toEqual([
       |                                                   ^
    111|         'lines.0.line_total', 'lines.0.quantity', 'lines.1.item_id', '...
    112|       ]);

------------------------[1/1]-
```

### Mutación 5: Aceptar ubicaciones fuera de la lista

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `if (location && !isValidLocation(location)) errors.location = ['Ubicación no válida.'];`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 1 failed) 20ms
   [x] purchasesClient > purchases > reports errors with the engine keys and does not call it 8ms
     > expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:56:38
   Duration  2.25s (transform 81ms, setup 263ms, collect 92ms, tests 20ms, environment 1.32s, prepare 156ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > reports errors with the engine keys and does not call it
AssertionError: expected [ 'lines.0.line_total', ...(4) ] to deeply equal [ 'lines.0.line_total', ...(5) ]

- Expected
+ Received

  Array [
    "lines.0.line_total",
    "lines.0.quantity",
    "lines.1.item_id",
-   "location",
    "purchased_on",
    "supplier_id",
  ]

 > src/services/__tests__/purchasesClient.test.js:110:51
    108|       }, 'uuid');
    109|       expect(res.status).toBe(422);
    110|       expect(Object.keys(res.data.errors).sort()).toEqual([
       |                                                   ^
    111|         'lines.0.line_total', 'lines.0.quantity', 'lines.1.item_id', '...
    112|       ]);

------------------------[1/1]-
```

### Mutación 6: Enviar compras con más de 200 líneas

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `if (lines.length > MAX_LINES)`
- **Mutado:** `if (false)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 1 failed) 18ms
   [x] purchasesClient > purchases > requires between 1 and 200 lines 6ms
     > Cannot read properties of undefined (reading '0')

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:56:42
   Duration  2.25s (transform 90ms, setup 257ms, collect 107ms, tests 18ms, environment 1.32s, prepare 176ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > requires between 1 and 200 lines
TypeError: Cannot read properties of undefined (reading '0')
 > src/services/__tests__/purchasesClient.test.js:130:51
    128|       expect(buildPurchaseLines(null).errors.lines).toBeDefined();
    129|       const many = Array.from({ length: 201 }, (_, i) => ({ item_id: i...
    130|       expect(buildPurchaseLines(many).errors.lines[0]).toContain('200'...
       |                                                   ^
    131|     });
    132| 

------------------------[1/1]-
```

### Mutación 7: No renovar el client_uuid tras un 201

- **Archivo:** `src/hooks/usePurchaseForm.js`
- **Original:** `uuidRef.current = generateClientUuid(); if (onCreated)`
- **Mutado:** `if (onCreated)`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 357ms
   [x] usePurchaseForm > reuses the client_uuid after a network error and renews it after a 201 15ms
     > expected 'e0940e0b-049d-4d12-9f7a-7584ba558a87' not to be 'e0940e0b-049d-4d12-9f7a-7584ba558a87' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:56:46
   Duration  2.73s (transform 117ms, setup 249ms, collect 168ms, tests 357ms, environment 1.37s, prepare 182ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected 'e0940e0b-049d-4d12-9f7a-7584ba558a87' not to be 'e0940e0b-049d-4d12-9f7a-7584ba558a87' // Object.is equality
 > src/hooks/__tests__/purchaseHooks.test.js:110:26
    108|     const uuids = spy.mock.calls.map((call) => call[1]);
    109|     expect(uuids[1]).toBe(uuids[0]);
    110|     expect(uuids[2]).not.toBe(uuids[0]);
       |                          ^
    111|     expect(onCreated).toHaveBeenNthCalledWith(1, draftPurchase, false);
    112|     expect(onCreated).toHaveBeenNthCalledWith(2, draftPurchase, true);

------------------------[1/1]-
```

### Mutación 8: uuid nuevo en cada envío

- **Archivo:** `src/hooks/usePurchaseForm.js`
- **Original:** `const res = await createPurchase(`
- **Mutado:** `uuidRef.current = generateClientUuid();
    const res = await createPurchase(`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 356ms
   [x] usePurchaseForm > reuses the client_uuid after a network error and renews it after a 201 16ms
     > expected 'ef5d1d33-8dd0-4e4d-82f2-0a7569d9b944' to be '89772211-eaf3-49f6-b5c2-7c329b505585' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:56:51
   Duration  2.85s (transform 130ms, setup 276ms, collect 185ms, tests 356ms, environment 1.39s, prepare 210ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseForm > reuses the client_uuid after a network error and renews it after a 201
AssertionError: expected 'ef5d1d33-8dd0-4e4d-82f2-0a7569d9b944' to be '89772211-eaf3-49f6-b5c2-7c329b505585' // Object.is equality

Expected: "89772211-eaf3-49f6-b5c2-7c329b505585"
Received: "ef5d1d33-8dd0-4e4d-82f2-0a7569d9b944"

 > src/hooks/__tests__/purchaseHooks.test.js:109:22
    107| 
    108|     const uuids = spy.mock.calls.map((call) => call[1]);
    109|     expect(uuids[1]).toBe(uuids[0]);
       |                      ^
    110|     expect(uuids[2]).not.toBe(uuids[0]);
    111|     expect(onCreated).toHaveBeenNthCalledWith(1, draftPurchase, false);

------------------------[1/1]-
```

### Mutación 9: Errores de línea sin traducir la posición

- **Archivo:** `src/hooks/purchaseLines.js`
- **Original:** `const line = match ? lines[Number(match[1])] : null;`
- **Mutado:** `const line = null;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/inventory/purchases/__tests__/PurchaseEdgeCases.test.jsx (2 tests) 126ms
 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 3 failed) 412ms
   [x] purchaseLines > maps engine errors to the line sent at that position 19ms
     > expected undefined to deeply equal { Object (quantity, line_total) }
   [x] usePurchaseForm > puts 422 errors next to each line or field and clears a line error when edited 5ms
     > Cannot read properties of undefined (reading 'quantity')
   [x] usePurchaseActions > saves lines and returns line errors from the engine 8ms
     > expected { ok: false, lineErrors: {}, ...(1) } to deeply equal { ok: false, ...(2) }
 [ok] src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx (6 tests) 1591ms
   [ok] Suppliers tab > lists, searches and includes inactive suppliers 1141ms
 [ok] src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests) 1998ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 1108ms
   [ok] PurchasesView > shows 422 errors next to their field and line 431ms
 [ok] src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests) 2863ms
   [ok] Brief 20p review fixes > H1: the detail comes from the engine with its lines, and editing starts from them 331ms
   [ok] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 469ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 445ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1038ms

 Test Files  1 failed | 4 passed (5)
      Tests  3 failed | 39 passed (42)
   Start at  06:56:55
   Duration  7.55s (transform 547ms, setup 2.79s, collect 2.17s, tests 6.99s, environment 14.15s, prepare 1.36s)

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

------- Failed Tests 3 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > purchaseLines > maps engine errors to the line sent at that position
AssertionError: expected undefined to deeply equal { Object (quantity, line_total) }

- Expected: 
Object {
  "line_total": "Monto inválido.",
  "quantity": "Cantidad inválida.",
}

+ Received: 
undefined

 > src/hooks/__tests__/purchaseHooks.test.js:39:38
     37|       invoice_number: ['Esa factura ya está registrada.'],
     38|     }, lines);
     39|     expect(mapped.byLine['line:47']).toEqual({ quantity: 'Cantidad inv...
       |                                      ^
     40|     expect(mapped.general).toEqual({ lines: 'Sin línea.', invoice_numb...
     41|   });

------------------------[1/3]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseForm > puts 422 errors next to each line or field and clears a line error when edited
TypeError: Cannot read properties of undefined (reading 'quantity')
 > src/hooks/__tests__/purchaseHooks.test.js:126:49
    124|     expect(result.current.error).toBe('Datos inválidos.');
    125|     expect(result.current.errors.invoice_number).toBe('Esa factura ya ...
    126|     expect(result.current.lineErrors['line:31'].quantity).toBe('Cantid...
       |                                                 ^
    127|     act(() => { result.current.onChange('line:31', 'quantity', '5'); }...
    128|     expect(result.current.lineErrors['line:31'].quantity).toBeUndefine...

------------------------[2/3]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseActions > saves lines and returns line errors from the engine
AssertionError: expected { ok: false, lineErrors: {}, ...(1) } to deeply equal { ok: false, ...(2) }

- Expected
+ Received

  Object {
-   "general": null,
-   "lineErrors": Object {
-     "line:31": Object {
-       "line_total": "Monto inválido.",
-     },
-   },
+   "general": "Monto inválido.",
+   "lineErrors": Object {},
    "ok": false,
  }

 > src/hooks/__tests__/purchaseHooks.test.js:165:21
    163|     let outcome;
    164|     await act(async () => { outcome = await result.current.saveLines(l...
    165|     expect(outcome).toEqual({ ok: false, lineErrors: { 'line:31': { li...
       |                     ^
    166|     await act(async () => { outcome = await result.current.saveLines(l...
    167|     expect(outcome).toEqual({ ok: true, lineErrors: {}, general: null ...

------------------------[3/3]-
```

### Mutación 10: Agregar el mismo insumo dos veces

- **Archivo:** `src/hooks/purchaseLines.js`
- **Original:** `if (!item?.id || lines.some((line) => line.item.id === item.id)) return lines;`
- **Mutado:** `if (!item?.id) return lines;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 350ms
   [x] purchaseLines > adds each item once, updates, removes and builds the payload without summing 12ms
     > expected [ { key: 'line:31', ...(4) }, ...(1) ] to have a length of 1 but got 2

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:05
   Duration  2.88s (transform 119ms, setup 266ms, collect 164ms, tests 350ms, environment 1.40s, prepare 206ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > purchaseLines > adds each item once, updates, removes and builds the payload without summing
AssertionError: expected [ { key: 'line:31', ...(4) }, ...(1) ] to have a length of 1 but got 2

- Expected
+ Received

- 1
+ 2

 > src/hooks/__tests__/purchaseHooks.test.js:17:19
     15|     lines = addItem(lines, { id: 31, name: 'Lomo fino', unit: 'kg' });
     16|     lines = addItem(lines, null);
     17|     expect(lines).toHaveLength(1);
       |                   ^
     18|     lines = updateLine(lines, 'line:31', 'quantity', '5,5');
     19|     lines = updateLine(lines, 'line:31', 'line_total', '80');

------------------------[1/1]-
```

### Mutación 11: Duplicar elementos al cargar más

- **Archivo:** `src/hooks/usePagedList.js`
- **Original:** `...list.filter((item) => !prev.some((known) => known.id === item.id))`
- **Mutado:** `...list`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 362ms
   [x] usePagedList > loads more without duplicates, ignores a second load more and upserts 86ms
     > expected [ 1, 1, 2 ] to deeply equal [ 1, 2 ]

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:10
   Duration  3.23s (transform 124ms, setup 278ms, collect 173ms, tests 362ms, environment 1.77s, prepare 221ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePagedList > loads more without duplicates, ignores a second load more and upserts
AssertionError: expected [ 1, 1, 2 ] to deeply equal [ 1, 2 ]

- Expected
+ Received

  Array [
    1,
+   1,
    2,
  ]

 > src/hooks/__tests__/purchaseHooks.test.js:72:51
     70|     });
     71|     expect(fetch).toHaveBeenCalledTimes(2);
     72|     expect(result.current.items.map((i) => i.id)).toEqual([1, 2]);
       |                                                   ^
     73| 
     74|     act(() => { result.current.upsert({ id: 2, name: 'nuevo' }); });

------------------------[1/1]-
```

### Mutación 12: Aceptar la respuesta de una carga vieja

- **Archivo:** `src/hooks/usePagedList.js`
- **Original:** `if (requestId !== requestRef.current) return;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 356ms
   [x] usePagedList > a new first page replaces a load in progress and the old answer is discarded 104ms
     > expected [ { id: 1 } ] to deeply equal [ { id: 2 } ]

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:15
   Duration  2.95s (transform 120ms, setup 277ms, collect 159ms, tests 356ms, environment 1.44s, prepare 199ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePagedList > a new first page replaces a load in progress and the old answer is discarded
AssertionError: expected [ { id: 1 } ] to deeply equal [ { id: 2 } ]

- Expected
+ Received

  Array [
    Object {
-     "id": 2,
+     "id": 1,
    },
  ]

 > src/hooks/__tests__/purchaseHooks.test.js:56:34
     54|     await waitFor(() => expect(result.current.items).toEqual([{ id: 2 ...
     55|     await act(async () => { resolveOld(pageOf([{ id: 1 }])); });
     56|     expect(result.current.items).toEqual([{ id: 2 }]);
       |                                  ^
     57|   });
     58| 

------------------------[1/1]-
```

### Mutación 13: Buscar insumos con una letra

- **Archivo:** `src/hooks/usePurchasesData.js`
- **Original:** `if (query.length < 2) {`
- **Mutado:** `if (query.length < 1) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 343ms
   [x] usePurchasesData > searches active non-service items after 300 ms and at least 2 letters 14ms
     > expected "listInventory" to not be called at all, but actually been called 1 times

Received: 

  1st listInventory call:

    Array [
      Object {
        "search": "l",
      },
    ]


Number of calls: 1


 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:19
   Duration  2.76s (transform 114ms, setup 242ms, collect 156ms, tests 343ms, environment 1.41s, prepare 228ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > searches active non-service items after 300 ms and at least 2 letters
AssertionError: expected "listInventory" to not be called at all, but actually been called 1 times

Received: 

  1st listInventory call:

    Array [
      Object {
        "search": "l",
      },
    ]


Number of calls: 1

 > src/hooks/__tests__/purchaseHooks.test.js:196:21
    194|     const { result, rerender } = renderHook(({ term }) => useItemSearc...
    195|     await act(async () => { vi.advanceTimersByTime(500); });
    196|     expect(spy).not.toHaveBeenCalled();
       |                     ^
    197| 
    198|     rerender({ term: 'lo' });

------------------------[1/1]-
```

### Mutación 14: Ofrecer servicios en la búsqueda

- **Archivo:** `src/hooks/usePurchasesData.js`
- **Original:** `setResults(list.filter((item) => item.type !== 'service'));`
- **Mutado:** `setResults(list);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/inventory/purchases/__tests__/PurchaseEdgeCases.test.jsx (2 tests) 127ms
 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 405ms
   [x] usePurchasesData > searches active non-service items after 300 ms and at least 2 letters 27ms
     > expected [ 31, 50 ] to deeply equal [ 31 ]
 [ok] src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx (6 tests) 1472ms
   [ok] Suppliers tab > lists, searches and includes inactive suppliers 1015ms
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1876ms
   [x] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 908ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  style="padding: 8px 12px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; width: 100%; text-align: left; font-size: 12px;"
  type="button"
>
  Lavado de manteles
</button> instead
   [ok] PurchasesView > shows 422 errors next to their field and line 478ms
 [ok] src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests) 2694ms
   [ok] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 417ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 461ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1032ms

 Test Files  2 failed | 3 passed (5)
      Tests  2 failed | 40 passed (42)
   Start at  06:57:24
   Duration  7.28s (transform 676ms, setup 2.66s, collect 2.11s, tests 6.57s, environment 14.32s, prepare 1.31s)

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

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > searches active non-service items after 300 ms and at least 2 letters
AssertionError: expected [ 31, 50 ] to deeply equal [ 31 ]

- Expected
+ Received

  Array [
    31,
+   50,
  ]

 > src/hooks/__tests__/purchaseHooks.test.js:203:53
    201|     await act(async () => { vi.advanceTimersByTime(1); });
    202|     expect(spy).toHaveBeenCalledWith({ search: 'lo' });
    203|     expect(result.current.results.map((i) => i.id)).toEqual([31]);
       |                                                     ^
    204|   });
    205| 

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
     32|     fireEvent.change(screen.getByLabelText('Agregar insumo'), { target...
     33|     await waitFor(() => expect(screen.getByRole('button', { name: 'Lom...
     34|     expect(screen.queryByText('Lavado de manteles')).not.toBeInTheDocu...
       |                                                          ^
     35|     fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM...
     36| 

------------------------[2/2]-
```

### Mutación 15: Aceptar la respuesta de una búsqueda vieja

- **Archivo:** `src/hooks/usePurchasesData.js`
- **Original:** `if (latestRef.current !== query) return;`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 348ms
   [x] usePurchasesData > discards a search answer for an older term 10ms
     > expected [ { id: 31, name: 'Lomo fino', ...(3) } ] to deeply equal []

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:33
   Duration  2.82s (transform 120ms, setup 269ms, collect 164ms, tests 348ms, environment 1.36s, prepare 184ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > discards a search answer for an older term
AssertionError: expected [ { id: 31, name: 'Lomo fino', ...(3) } ] to deeply equal []

- Expected
+ Received

- Array []
+ Array [
+   Object {
+     "code": "LOM-1",
+     "id": 31,
+     "name": "Lomo fino",
+     "type": "supply",
+     "unit": "kg",
+   },
+ ]

 > src/hooks/__tests__/purchaseHooks.test.js:215:36
    213|     rerender({ term: 'arr' });
    214|     await act(async () => { resolveOld({ ok: true, data: { items: inve...
    215|     expect(result.current.results).toEqual([]);
       |                                    ^
    216|     await act(async () => { vi.advanceTimersByTime(300); });
    217|     expect(result.current.results).toEqual([]);

------------------------[1/1]-
```

### Mutación 16: Sin explicar el 409

- **Archivo:** `src/hooks/usePurchaseActions.js`
- **Original:** `res.status === 409 ? CLOSED_MESSAGE :`
- **Mutado:** `false ? CLOSED_MESSAGE :`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 364ms
   [x] usePurchaseActions > receives and cancels, explaining a 409 14ms
     > expected 'No se pudo completar la acción.' to be 'La compra ya estaba recibida o cancel...' // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed | 17 passed (18)
   Start at  06:57:38
   Duration  3.06s (transform 122ms, setup 275ms, collect 166ms, tests 364ms, environment 1.58s, prepare 227ms)

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseActions > receives and cancels, explaining a 409
AssertionError: expected 'No se pudo completar la acción.' to be 'La compra ya estaba recibida o cancel...' // Object.is equality

Expected: "La compra ya estaba recibida o cancelada: no se puede cambiar."
Received: "No se pudo completar la acción."

 > src/hooks/__tests__/purchaseHooks.test.js:149:34
    147|     expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ s...
    148|     await act(async () => { await result.current.cancel(); });
    149|     expect(result.current.error).toBe('La compra ya estaba recibida o ...
       |                                  ^
    150|     await act(async () => { await result.current.cancel(); });
    151|     expect(result.current.error).toBe('Error 500');

------------------------[1/1]-
```

### Mutación 17: Dos acciones a la vez

- **Archivo:** `src/hooks/usePurchaseActions.js`
- **Original:** `if (busy) return { ok: false };`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 7 failed) 6305ms
   [x] usePurchaseActions > ignores a second action while one is running 5012ms
     > Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
   [x] usePurchasesData > searches active non-service items after 300 ms and at least 2 letters 13ms
     > expected "listInventory" to be called with arguments: [ { search: 'lo' } ]

Received: 



Number of calls: 0

   [x] usePurchasesData > discards a search answer for an older term 3ms
     > resolveOld is not a function
   [x] usePurchasesData > asks for suppliers once after the typing stops 3ms
     > expected "listSuppliers" to be called 1 times, but got 0 times
   [x] usePurchasesData > debounces a value 3ms
     > expected null to be 'a' // Object.is equality
   [x] useSupplierSave and useValuation > creates or updates and keeps 422 errors by field 1ms
     > Cannot read properties of null (reading 'save')
   [x] useSupplierSave and useValuation > loads the valuation and reports errors 1019ms
     > Cannot read properties of null (reading 'error')

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div />
  </body>
</html>

 Test Files  1 failed (1)
      Tests  7 failed | 11 passed (18)
   Start at  06:57:42
   Duration  8.86s (transform 117ms, setup 295ms, collect 159ms, tests 6.31s, environment 1.45s, prepare 201ms)

------- Failed Tests 7 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchaseActions > ignores a second action while one is running
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
------------------------[1/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > searches active non-service items after 300 ms and at least 2 letters
AssertionError: expected "listInventory" to be called with arguments: [ { search: 'lo' } ]

Received: 



Number of calls: 0

 > src/hooks/__tests__/purchaseHooks.test.js:202:17
    200|     expect(spy).not.toHaveBeenCalled();
    201|     await act(async () => { vi.advanceTimersByTime(1); });
    202|     expect(spy).toHaveBeenCalledWith({ search: 'lo' });
       |                 ^
    203|     expect(result.current.results.map((i) => i.id)).toEqual([31]);
    204|   });

------------------------[2/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > discards a search answer for an older term
TypeError: resolveOld is not a function
 > src/hooks/__tests__/purchaseHooks.test.js:214:29
    212|     await act(async () => { vi.advanceTimersByTime(300); });
    213|     rerender({ term: 'arr' });
    214|     await act(async () => { resolveOld({ ok: true, data: { items: inve...
       |                             ^
    215|     expect(result.current.results).toEqual([]);
    216|     await act(async () => { vi.advanceTimersByTime(300); });
 > node_modules/@testing-library/react/dist/act-compat.js:47:24
 > act node_modules/react/cjs/react.development.js:2512:16
 > Proxy.<anonymous> node_modules/@testing-library/react/dist/act-compat.js:46:25
 > src/hooks/__tests__/purchaseHooks.test.js:214:11

------------------------[3/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > asks for suppliers once after the typing stops
AssertionError: expected "listSuppliers" to be called 1 times, but got 0 times
 > src/hooks/__tests__/purchaseHooks.test.js:224:17
    222|     const { rerender } = renderHook(({ search }) => useSuppliers({ sea...
    223|     await act(async () => { await Promise.resolve(); });
    224|     expect(spy).toHaveBeenCalledTimes(1);
       |                 ^
    225| 
    226|     rerender({ search: 'c' });

------------------------[4/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > debounces a value
AssertionError: expected null to be 'a' // Object.is equality

- Expected: 
"a"

+ Received: 
null

 > src/hooks/__tests__/purchaseHooks.test.js:239:28
    237|     const { result, rerender } = renderHook(({ v }) => useDebouncedVal...
    238|     rerender({ v: 'ab' });
    239|     expect(result.current).toBe('a');
       |                            ^
    240|     await act(async () => { vi.advanceTimersByTime(300); });
    241|     expect(result.current).toBe('ab');

------------------------[5/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > useSupplierSave and useValuation > creates or updates and keeps 422 errors by field
TypeError: Cannot read properties of null (reading 'save')
 > src/hooks/__tests__/purchaseHooks.test.js:254:50
    252|     const { result } = renderHook(() => useSupplierSave({ onSaved }));
    253| 
    254|     await act(async () => { await result.current.save(null, { name: 'C...
       |                                                  ^
    255|     expect(result.current.errors.name).toBe('Ya existe un proveedor co...
    256|     await act(async () => { await result.current.save(4, { is_active: ...
 > node_modules/@testing-library/react/dist/act-compat.js:47:24
 > act node_modules/react/cjs/react.development.js:2512:16
 > Proxy.<anonymous> node_modules/@testing-library/react/dist/act-compat.js:46:25
 > src/hooks/__tests__/purchaseHooks.test.js:254:11

------------------------[6/7]-

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > useSupplierSave and useValuation > loads the valuation and reports errors
TypeError: Cannot read properties of null (reading 'error')

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div />
  </body>
</html>
 > src/hooks/__tests__/purchaseHooks.test.js:266:47
    264|       .mockResolvedValueOnce({ ok: true, data: { total: 87.6 } });
    265|     const { result } = renderHook(() => useValuation());
    266|     await waitFor(() => expect(result.current.error).toBe('No se pudo ...
       |                                               ^
    267|     await act(async () => { await result.current.reload(); });
    268|     expect(result.current.valuation).toEqual({ total: 87.6 });
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[7/7]-
```

### Mutación 18: Sin aviso tras recibir (no pasar la acción)

- **Archivo:** `src/components/inventory/purchases/PurchaseDetail.jsx`
- **Original:** `if (onUpdated) onUpdated(updated, action);`
- **Mutado:** `if (onUpdated) onUpdated(updated);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 3 failed) 4401ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 678ms
   [ok] PurchasesView > shows 422 errors next to their field and line 378ms
   [x] PurchasesView > receives a draft after confirming and explains a 409 inside the dialog 1116ms
     > Unable to find an element with the text: Compra recibida: el stock y los costos se actualizaron.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Recibida
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
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
        <div
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Recibida
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
   [x] PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside 1125ms
     > Unable to find an element with the text: Compra cancelada.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Cancelada
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
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
        <div
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Cancelada
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
   [x] PurchasesView > edits the lines of a draft and shows line errors from the engine 1074ms
     > Unable to find an element with the text: Líneas guardadas.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Borrador
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-pencil"
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
                  d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                />
                <path
                  d="m15 5 4 4"
                />
              </svg>
              <span>
                Editar líneas
              </span>
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
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
                Cancelar
              </span>
            </button>
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-package-check"
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
                  d="m16 16 2 2 4-4"
                />
                <path
                  d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                />
                <path
                  d="m7.5 4.27 9 5.15"
                />
                <polyline
                  points="3.29 7 12 12 20.71 7"
                />
                <line
                  x1="12"
                  x2="12"
                  y1="22"
                  y2="12"
                />
              </svg>
              <span>
                Recibir
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
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Borrador
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
                type="button"
              >
                <svg
                  class="lucide lucide-pencil"
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
                    d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                  />
                  <path
                    d="m15 5 4 4"
                  />
                </svg>
                <span>
                  Editar líneas
                </span>
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
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
                  Cancelar
                </span>
              </button>
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
                type="button"
              >
                <svg
                  class="lucide lucide-package-check"
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
                    d="m16 16 2 2 4-4"
                  />
                  <path
                    d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                  />
                  <path
                    d="m7.5 4.27 9 5.15"
                  />
                  <polyline
                    points="3.29 7 12 12 20.71 7"
                  />
                  <line
                    x1="12"
                    x2="12"
                    y1="22"
                    y2="12"
                  />
                </svg>
                <span>
                  Recibir
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
      Tests  3 failed | 3 passed (6)
   Start at  06:57:53
   Duration  6.86s (transform 192ms, setup 265ms, collect 343ms, tests 4.40s, environment 1.29s, prepare 167ms)

------- Failed Tests 3 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > receives a draft after confirming and explains a 409 inside the dialog
TestingLibraryElementError: Unable to find an element with the text: Compra recibida: el stock y los costos se actualizaron.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Recibida
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
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
        <div
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Recibida
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:82:11
     80| 
     81|     fireEvent.click(dialogButton('Recibir'));
     82|     await waitFor(() => expect(screen.getByText('Compra recibida: el s...
       |           ^
     83|     expect(receive).toHaveBeenCalledWith(9);
     84|     expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBe...

------------------------[1/3]-

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside
TestingLibraryElementError: Unable to find an element with the text: Compra cancelada.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Cancelada
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
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
        <div
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Cancelada
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:109:11
    107|     expect(confirm).toHaveFocus();
    108|     fireEvent.click(confirm);
    109|     await waitFor(() => expect(screen.getByText('Compra cancelada.'))....
       |           ^
    110|   });
    111| 

------------------------[2/3]-

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > edits the lines of a draft and shows line errors from the engine
TestingLibraryElementError: Unable to find an element with the text: Líneas guardadas.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Borrador
              . 
              2026-10-09
              . Destino: 
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total: 
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5
                 
                kg
                 a 
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5
                 
                kg
                 a 
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
            </div>
          </div>
          <div
            style="display: flex; gap: 8px; flex-wrap: wrap;"
          >
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-pencil"
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
                  d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                />
                <path
                  d="m15 5 4 4"
                />
              </svg>
              <span>
                Editar líneas
              </span>
            </button>
            <button
              style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
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
                Cancelar
              </span>
            </button>
            <button
              class="btn-primary"
              style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
              type="button"
            >
              <svg
                class="lucide lucide-package-check"
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
                  d="m16 16 2 2 4-4"
                />
                <path
                  d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                />
                <path
                  d="m7.5 4.27 9 5.15"
                />
                <polyline
                  points="3.29 7 12 12 20.71 7"
                />
                <line
                  x1="12"
                  x2="12"
                  y1="22"
                  y2="12"
                />
              </svg>
              <span>
                Recibir
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
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
                Volver a compras
              </span>
            </button>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <h3
                style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
                tabindex="-1"
              >
                Carnes del Valle
              </h3>
              <p
                style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
              >
                Borrador
                . 
                2026-10-09
                . Destino: 
                Bodega
                .
                 Factura 001-002-000123456.
              </p>
              <p
                style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
              >
                Total: 
                USD 87,60
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
                  Lomo fino
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  5
                   
                  kg
                   a 
                  USD 15,00
                   c/u
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 75,00
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
                  Arroz
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  10,5
                   
                  kg
                   a 
                  USD 1,20
                   c/u
                </div>
                <div
                  style="color: var(--text-muted);"
                >
                  Saco
                </div>
              </div>
              <div
                style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
              >
                USD 12,60
              </div>
            </div>
            <div
              style="display: flex; gap: 8px; flex-wrap: wrap;"
            >
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--text-main); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
                type="button"
              >
                <svg
                  class="lucide lucide-pencil"
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
                    d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
                  />
                  <path
                    d="m15 5 4 4"
                  />
                </svg>
                <span>
                  Editar líneas
                </span>
              </button>
              <button
                style="padding: 10px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--error); font-weight: 600; cursor: pointer; flex: 1 1 0%; display: flex; align-items: center; justify-content: center; gap: 6px;"
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
                  Cancelar
                </span>
              </button>
              <button
                class="btn-primary"
                style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
                type="button"
              >
                <svg
                  class="lucide lucide-package-check"
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
                    d="m16 16 2 2 4-4"
                  />
                  <path
                    d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                  />
                  <path
                    d="m7.5 4.27 9 5.15"
                  />
                  <polyline
                    points="3.29 7 12 12 20.71 7"
                  />
                  <line
                    x1="12"
                    x2="12"
                    y1="22"
                    y2="12"
                  />
                </svg>
                <span>
                  Recibir
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
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:126:11
    124|     await waitFor(() => expect(screen.getByText('Cantidad inválida.'))...
    125|     fireEvent.click(screen.getByText('Guardar líneas'));
    126|     await waitFor(() => expect(screen.getByText('Líneas guardadas.'))....
       |           ^
    127|     expect(save).toHaveBeenCalledTimes(2);
    128| 

------------------------[3/3]-
```

### Mutación 19: Perder el foco tras recibir

- **Archivo:** `src/components/inventory/purchases/ConfirmDialog.jsx`
- **Original:** `else fallbackEl?.focus();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1619ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 755ms
   [ok] PurchasesView > shows 422 errors next to their field and line 399ms
   [x] PurchasesView > receives a draft after confirming and explains a 409 inside the dialog 179ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Carnes del Valle
</h3>
Received element with focus:
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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      >
        <div
          style="padding: 10px 14px; background: var(--success-soft); color: var(--success); border-radius: 10px; font-size: 13px; font-weight: 600;"
        >
          Compra recibida: el stock y los costos se actualizaron.
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Recibida
              .·
              2026-10-09
              . Destino:·
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total:·
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5··················
                kg
                 a·
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5··················
                kg
                 a·
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  06:58:02
   Duration  4.25s (transform 234ms, setup 315ms, collect 432ms, tests 1.62s, environment 1.33s, prepare 172ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > receives a draft after confirming and explains a 409 inside the dialog
Error: expect(element).toHaveFocus()

Expected element with focus:
  <h3
  style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
  tabindex="-1"
>
  Carnes del Valle
</h3>
Received element with focus:
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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      >
        <div
          style="padding: 10px 14px; background: var(--success-soft); color: var(--success); border-radius: 10px; font-size: 13px; font-weight: 600;"
        >
          Compra recibida: el stock y los costos se actualizaron.
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <h3
              style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
              tabindex="-1"
            >
              Carnes del Valle
            </h3>
            <p
              style="font-size: 12px; color: var(--text-muted); margin: 2px 0px 0px;"
            >
              Recibida
              .·
              2026-10-09
              . Destino:·
              Bodega
              .
               Factura 001-002-000123456.
            </p>
            <p
              style="font-size: 15px; font-weight: 700; color: var(--text-main); margin: 8px 0px 0px;"
            >
              Total:·
              USD 87,60
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
                Lomo fino
              </div>
              <div
                style="color: var(--text-muted);"
              >
                5··················
                kg
                 a·
                USD 15,00
                 c/u
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 75,00
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
                Arroz
              </div>
              <div
                style="color: var(--text-muted);"
              >
                10,5··················
                kg
                 a·
                USD 1,20
                 c/u
              </div>
              <div
                style="color: var(--text-muted);"
              >
                Saco
              </div>
            </div>
            <div
              style="font-weight: 700; color: var(--text-main); white-space: nowrap;"
            >
              USD 12,60
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:85:71
     83|     expect(receive).toHaveBeenCalledWith(9);
     84|     expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBe...
     85|     expect(screen.getByRole('heading', { name: 'Carnes del Valle' }))....
       |                                                                       ^
     86|   });
     87| 

------------------------[1/1]-
```

### Mutación 20: Tab sale del diálogo

- **Archivo:** `src/components/inventory/purchases/ConfirmDialog.jsx`
- **Original:** `else if (e.key === 'Tab') trapTab(e, dialogRef.current);`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1542ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 789ms
   [ok] PurchasesView > shows 422 errors next to their field and line 381ms
   [x] PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside 120ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
Received element with focus:
  <button
  aria-disabled="false"
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Cancelar compra
</button>

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  06:58:08
   Duration  4.49s (transform 285ms, setup 267ms, collect 555ms, tests 1.54s, environment 1.49s, prepare 173ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside
Error: expect(element).toHaveFocus()

Expected element with focus:
  <button
  aria-disabled="false"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
Received element with focus:
  <button
  aria-disabled="false"
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Cancelar compra
</button>
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:105:36
    103|     confirm.focus();
    104|     fireEvent.keyDown(document, { key: 'Tab' });
    105|     expect(dialogButton('Volver')).toHaveFocus();
       |                                    ^
    106|     fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    107|     expect(confirm).toHaveFocus();

------------------------[1/1]-
```

### Mutación 21: Escape no cierra el diálogo

- **Archivo:** `src/components/inventory/purchases/ConfirmDialog.jsx`
- **Original:** `if (e.key === 'Escape' && !busy) onClose(); else if`
- **Mutado:** `if`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1393ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 647ms
   [ok] PurchasesView > shows 422 errors next to their field and line 381ms
   [x] PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside 94ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
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
    Cancelar compra
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
      El borrador se cancela y no cambia el stock. No se puede deshacer.
    </span>
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  />
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
      Cancelar compra
    </button>
  </div>
</div> instead

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  06:58:14
   Duration  4.17s (transform 212ms, setup 267ms, collect 382ms, tests 1.39s, environment 1.41s, prepare 228ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > cancels with confirmation, closes with Escape and keeps Tab inside
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div
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
    Cancelar compra
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
      El borrador se cancela y no cambia el stock. No se puede deshacer.
    </span>
  </div>
  <div
    aria-live="polite"
    style="font-size: 12px; color: var(--error);"
  />
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
      Cancelar compra
    </button>
  </div>
</div> instead
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:98:46
     96|     fireEvent.click(trigger);
     97|     fireEvent.keyDown(document, { key: 'Escape' });
     98|     expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
       |                                              ^
     99|     expect(trigger).toHaveFocus();
    100| 

------------------------[1/1]-
```

### Mutación 22: Volver a montar el detalle tras una acción

- **Archivo:** `src/components/inventory/purchases/PurchasesView.jsx`
- **Original:** `<PurchaseDetail key={purchaseId}`
- **Mutado:** `<PurchaseDetail key={`${purchaseId}-${notice}`}`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1492ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 737ms
   [ok] PurchasesView > shows 422 errors next to their field and line 386ms
   [x] PurchasesView > receives a draft after confirming and explains a 409 inside the dialog 128ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
  type="button"
>
  <svg
    class="lucide lucide-package-check"
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
      d="m16 16 2 2 4-4"
    />
    <path
      d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
    />
    <path
      d="m7.5 4.27 9 5.15"
    />
    <polyline
      points="3.29 7 12 12 20.71 7"
    />
    <line
      x1="12"
      x2="12"
      y1="22"
      y2="12"
    />
  </svg>
  <span>
    Recibir
  </span>
</button> instead

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  06:58:21
   Duration  4.56s (transform 215ms, setup 275ms, collect 379ms, tests 1.49s, environment 1.68s, prepare 248ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > receives a draft after confirming and explains a 409 inside the dialog
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
  type="button"
>
  <svg
    class="lucide lucide-package-check"
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
      d="m16 16 2 2 4-4"
    />
    <path
      d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
    />
    <path
      d="m7.5 4.27 9 5.15"
    />
    <polyline
      points="3.29 7 12 12 20.71 7"
    />
    <line
      x1="12"
      x2="12"
      y1="22"
      y2="12"
    />
  </svg>
  <span>
    Recibir
  </span>
</button> instead
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:84:67
     82|     await waitFor(() => expect(screen.getByText('Compra recibida: el s...
     83|     expect(receive).toHaveBeenCalledWith(9);
     84|     expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBe...
       |                                                                   ^
     85|     expect(screen.getByRole('heading', { name: 'Carnes del Valle' }))....
     86|   });

------------------------[1/1]-
```

### Mutación 23: Acciones de borrador en una compra recibida

- **Archivo:** `src/components/inventory/purchases/PurchaseDetail.jsx`
- **Original:** `const isDraft = purchase.status === 'draft';`
- **Mutado:** `const isDraft = true;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests | 1 failed) 1575ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 719ms
   [ok] PurchasesView > shows 422 errors next to their field and line 407ms
   [x] PurchasesView > receives a draft after confirming and explains a 409 inside the dialog 142ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
  type="button"
>
  <svg
    class="lucide lucide-package-check"
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
      d="m16 16 2 2 4-4"
    />
    <path
      d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
    />
    <path
      d="m7.5 4.27 9 5.15"
    />
    <polyline
      points="3.29 7 12 12 20.71 7"
    />
    <line
      x1="12"
      x2="12"
      y1="22"
      y2="12"
    />
  </svg>
  <span>
    Recibir
  </span>
</button> instead

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
   Start at  06:58:28
   Duration  4.54s (transform 235ms, setup 283ms, collect 424ms, tests 1.57s, environment 1.59s, prepare 197ms)

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchasesView.test.jsx > PurchasesView > receives a draft after confirming and explains a 409 inside the dialog
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="btn-primary"
  style="flex: 1 1 0%; padding: 10px; border-radius: 9999px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;"
  type="button"
>
  <svg
    class="lucide lucide-package-check"
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
      d="m16 16 2 2 4-4"
    />
    <path
      d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
    />
    <path
      d="m7.5 4.27 9 5.15"
    />
    <polyline
      points="3.29 7 12 12 20.71 7"
    />
    <line
      x1="12"
      x2="12"
      y1="22"
      y2="12"
    />
  </svg>
  <span>
    Recibir
  </span>
</button> instead
 > src/components/inventory/purchases/__tests__/PurchasesView.test.jsx:84:67
     82|     await waitFor(() => expect(screen.getByText('Compra recibida: el s...
     83|     expect(receive).toHaveBeenCalledWith(9);
     84|     expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBe...
       |                                                                   ^
     85|     expect(screen.getByRole('heading', { name: 'Carnes del Valle' }))....
     86|   });

------------------------[1/1]-
```

### Mutación 24: Sin aviso de insumos sin costo

- **Archivo:** `src/components/inventory/purchases/ValuationPanel.jsx`
- **Original:** `{withoutCost > 0 && (`
- **Mutado:** `{false && (`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx (6 tests | 2 failed) 2019ms
   [ok] Suppliers tab > lists, searches and includes inactive suppliers 716ms
   [x] Valuation tab > shows the total, each location and the warning of items without cost 28ms
     > Unable to find an element with the text: /Hay 3 insumos con stock sin costo/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="false"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="true"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        hidden=""
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
          >
            No hay compras con este filtro.
          </div>
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-valuation"
        id="purchases-panel-valuation"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <div
              style="font-size: 12px; color: var(--text-muted);"
            >
              Valor total del inventario
            </div>
            <div
              style="font-size: 22px; font-weight: 700; color: var(--text-main);"
            >
              USD 87,60
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Bodega
            </span>
            <strong>
              USD 87,60
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Cocina
            </span>
            <strong>
              USD 0,00
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Salón
            </span>
            <strong>
              USD 0,00
            </strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
   [x] Valuation tab > explains one item without cost, hides the warning at 0 and retries after an error 1037ms
     > Unable to find an element with the text: /Hay 1 insumo con stock sin costo/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="false"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="true"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        hidden=""
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
          >
            No hay compras con este filtro.
          </div>
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-valuation"
        id="purchases-panel-valuation"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <div
              style="font-size: 12px; color: var(--text-muted);"
            >
              Valor total del inventario
            </div>
            <div
              style="font-size: 22px; font-weight: 700; color: var(--text-main);"
            >
              Sin dato
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Bodega
            </span>
            <strong>
              Sin dato
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Cocina
            </span>
            <strong>
              Sin dato
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Salón
            </span>
            <strong>
              Sin dato
            </strong>
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
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="false"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="true"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          hidden=""
          id="purchases-panel-purchases"
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
                  for="purchase-status-filter"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Estado
                </label>
                <select
                  id="purchase-status-filter"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
                >
                  <option
                    value=""
                  >
                    Todas
                  </option>
                  <option
                    value="draft"
                  >
                    Borradores
                  </option>
                  <option
                    value="received"
                  >
                    Recibidas
                  </option>
                  <option
                    value="cancelled"
                  >
                    Canceladas
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
                  Nueva compra
                </span>
              </button>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
            >
              No hay compras con este filtro.
            </div>
          </div>
        </div>
        <div
          aria-labelledby="purchases-tab-valuation"
          id="purchases-panel-valuation"
          role="tabpanel"
        >
          <div
            style="display: flex; flex-direction: column; gap: 10px;"
          >
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <div
                style="font-size: 12px; color: var(--text-muted);"
              >
                Valor total del inventario
              </div>
              <div
                style="font-size: 22px; font-weight: 700; color: var(--text-main);"
              >
                Sin dato
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Bodega
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Cocina
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Salón
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

 Test Files  1 failed (1)
      Tests  2 failed | 4 passed (6)
   Start at  06:58:34
   Duration  4.70s (transform 206ms, setup 284ms, collect 365ms, tests 2.02s, environment 1.40s, prepare 212ms)

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

------- Failed Tests 2 -------

 FAIL  src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx > Valuation tab > shows the total, each location and the warning of items without cost
TestingLibraryElementError: Unable to find an element with the text: /Hay 3 insumos con stock sin costo/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="false"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="true"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        hidden=""
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
          >
            No hay compras con este filtro.
          </div>
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-valuation"
        id="purchases-panel-valuation"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <div
              style="font-size: 12px; color: var(--text-muted);"
            >
              Valor total del inventario
            </div>
            <div
              style="font-size: 22px; font-weight: 700; color: var(--text-main);"
            >
              USD 87,60
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Bodega
            </span>
            <strong>
              USD 87,60
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Cocina
            </span>
            <strong>
              USD 0,00
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Salón
            </span>
            <strong>
              USD 0,00
            </strong>
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
 > src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx:87:19
     85|     expect(screen.getAllByText('USD 87,60')).toHaveLength(2);
     86|     expect(screen.getByText('Salón')).toBeInTheDocument();
     87|     expect(screen.getByText(/Hay 3 insumos con stock sin costo/)).toBe...
       |                   ^
     88|   });
     89| 

------------------------[1/2]-

 FAIL  src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx > Valuation tab > explains one item without cost, hides the warning at 0 and retries after an error
TestingLibraryElementError: Unable to find an element with the text: /Hay 1 insumo con stock sin costo/. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="false"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="true"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        hidden=""
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
              </span>
            </button>
          </div>
          <div
            aria-live="polite"
          />
          <div
            style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
          >
            No hay compras con este filtro.
          </div>
        </div>
      </div>
      <div
        aria-labelledby="purchases-tab-valuation"
        id="purchases-panel-valuation"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
        >
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
          >
            <div
              style="font-size: 12px; color: var(--text-muted);"
            >
              Valor total del inventario
            </div>
            <div
              style="font-size: 22px; font-weight: 700; color: var(--text-main);"
            >
              Sin dato
            </div>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Bodega
            </span>
            <strong>
              Sin dato
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Cocina
            </span>
            <strong>
              Sin dato
            </strong>
          </div>
          <div
            style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
          >
            <span>
              Salón
            </span>
            <strong>
              Sin dato
            </strong>
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
          style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
        >
          <h2
            class="section-title"
            style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
          >
            <svg
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="false"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; background-image: none; background-position: 0% 0%; background-position-x: 0%; background-position-y: 0%; background-size: auto; background-repeat: repeat; background-origin: padding-box; background-clip: border-box; background-attachment: scroll; background-color: transparent;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="true"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          hidden=""
          id="purchases-panel-purchases"
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
                  for="purchase-status-filter"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Estado
                </label>
                <select
                  id="purchase-status-filter"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
                >
                  <option
                    value=""
                  >
                    Todas
                  </option>
                  <option
                    value="draft"
                  >
                    Borradores
                  </option>
                  <option
                    value="received"
                  >
                    Recibidas
                  </option>
                  <option
                    value="cancelled"
                  >
                    Canceladas
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
                  Nueva compra
                </span>
              </button>
            </div>
            <div
              aria-live="polite"
            />
            <div
              style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;"
            >
              No hay compras con este filtro.
            </div>
          </div>
        </div>
        <div
          aria-labelledby="purchases-tab-valuation"
          id="purchases-panel-valuation"
          role="tabpanel"
        >
          <div
            style="display: flex; flex-direction: column; gap: 10px;"
          >
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass);"
            >
              <div
                style="font-size: 12px; color: var(--text-muted);"
              >
                Valor total del inventario
              </div>
              <div
                style="font-size: 22px; font-weight: 700; color: var(--text-main);"
              >
                Sin dato
              </div>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Bodega
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Cocina
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
            <div
              style="padding: 12px 14px; border-radius: 12px; background: var(--bg-card); border: 1px solid var(--border-glass); display: flex; justify-content: space-between; font-size: 13px; color: var(--text-main);"
            >
              <span>
                Salón
              </span>
              <strong>
                Sin dato
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx:98:11
     96|     await waitFor(() => expect(screen.getByText('Error 500')).toBeInTh...
     97|     fireEvent.click(screen.getByText('Reintentar'));
     98|     await waitFor(() => expect(screen.getByText(/Hay 1 insumo con stoc...
       |           ^
     99|     expect(screen.getAllByText('Sin dato').length).toBeGreaterThan(0);
    100|     unmount();

------------------------[2/2]-
```

### Mutación 25: Compras visible para el personal

- **Archivo:** `src/components/inventory/InventoryHeaderActions.jsx`
- **Original:** `{isOwner && ( <> <button type="button" className="glass-card-interactive" onClick={onPurchases} style={secondaryButton}> <ShoppingCart size={16} /> <span>Compras</span> </button>`
- **Mutado:** `<button type="button" className="glass-card-interactive" onClick={onPurchases} style={secondaryButton}>
            <ShoppingCart size={16} />
            <span>Compras</span>
          </button>
      {isOwner && (
        <>`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/__tests__/InventoryView.test.jsx (7 tests | 1 failed) 616ms
   [x] InventoryView component permissions and actions > only the owner sees "Compras"; staff makes no purchase requests 46ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="glass-card-interactive"
  style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
  type="button"
>
  <svg
    class="lucide lucide-shopping-cart"
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
      cx="8"
      cy="21"
      r="1"
    />
    <circle
      cx="19"
      cy="21"
      r="1"
    />
    <path
      d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
    />
  </svg>
  <span>
    Compras
  </span>
</button> instead

 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  06:58:40
   Duration  3.40s (transform 379ms, setup 255ms, collect 678ms, tests 616ms, environment 1.26s, prepare 210ms)

------- Failed Tests 1 -------

 FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > only the owner sees "Compras"; staff makes no purchase requests
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <button
  class="glass-card-interactive"
  style="padding: 8px 12px; font-size: 12px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border-glass); background: var(--surface-strong); color: var(--accent); cursor: pointer; font-weight: 600;"
  type="button"
>
  <svg
    class="lucide lucide-shopping-cart"
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
      cx="8"
      cy="21"
      r="1"
    />
    <circle
      cx="19"
      cy="21"
      r="1"
    />
    <path
      d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
    />
  </svg>
  <span>
    Compras
  </span>
</button> instead
 > src/components/__tests__/InventoryView.test.jsx:96:68
     94|     const { unmount } = render(<InventoryView />);
     95|     await waitFor(() => expect(screen.getByText('Inventario del Motor'...
     96|     expect(screen.queryByRole('button', { name: /Compras/i })).not.toB...
       |                                                                    ^
     97|     expect(listPurchases).not.toHaveBeenCalled();
     98|     unmount();

------------------------[1/1]-
```

### Mutación 26: Abrir Compras para el personal

- **Archivo:** `src/components/InventoryView.jsx`
- **Original:** `if (showPurchasesView && isOwner) {`
- **Mutado:** `if (showPurchasesView) {`
- **Resultado:** NO detectada

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/__tests__/InventoryView.test.jsx (7 tests) 802ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  06:58:46
   Duration  3.80s (transform 460ms, setup 253ms, collect 801ms, tests 802ms, environment 1.31s, prepare 177ms)
```

### Mutación 27: Buscar proveedores sin esperar

- **Archivo:** `src/hooks/usePurchasesData.js`
- **Original:** `const term = useDebouncedValue(search);`
- **Mutado:** `const term = search;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 [ok] src/components/inventory/purchases/__tests__/PurchaseEdgeCases.test.jsx (2 tests) 123ms
 > src/hooks/__tests__/purchaseHooks.test.js (18 tests | 1 failed) 409ms
   [x] usePurchasesData > asks for suppliers once after the typing stops 14ms
     > expected "listSuppliers" to be called 1 times, but got 4 times
 [ok] src/components/inventory/purchases/__tests__/SuppliersAndValuation.test.jsx (6 tests) 1165ms
   [ok] Suppliers tab > lists, searches and includes inactive suppliers 619ms
 [ok] src/components/inventory/purchases/__tests__/PurchasesView.test.jsx (6 tests) 1769ms
   [ok] PurchasesView > creates a draft: supplier, item search without services, lines and the engine total 979ms
   [ok] PurchasesView > shows 422 errors next to their field and line 406ms
 [ok] src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests) 2400ms
   [ok] Brief 20p review fixes > H1: the detail comes from the engine with its lines, and editing starts from them 329ms
   [ok] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 358ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1025ms

 Test Files  1 failed | 4 passed (5)
      Tests  1 failed | 41 passed (42)
   Start at  06:58:51
   Duration  7.07s (transform 796ms, setup 3.20s, collect 2.19s, tests 5.87s, environment 14.27s, prepare 1.18s)

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

------- Failed Tests 1 -------

 FAIL  src/hooks/__tests__/purchaseHooks.test.js > usePurchasesData > asks for suppliers once after the typing stops
AssertionError: expected "listSuppliers" to be called 1 times, but got 4 times
 > src/hooks/__tests__/purchaseHooks.test.js:230:17
    228|     rerender({ search: 'car' });
    229|     await act(async () => { vi.advanceTimersByTime(299); });
    230|     expect(spy).toHaveBeenCalledTimes(1);
       |                 ^
    231|     await act(async () => { vi.advanceTimersByTime(1); });
    232|     expect(spy).toHaveBeenCalledTimes(2);

------------------------[1/1]-
```

### Mutación 28: Abrir el detalle sin pedirlo al motor (revisión H1)

- **Archivo:** `src/hooks/usePurchaseActions.js`
- **Original:** `if (res.ok && res.data?.data) {`
- **Mutado:** `if (false) {`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 5 failed) 6928ms
   [x] Brief 20p review fixes > H1: the detail comes from the engine with its lines, and editing starts from them 1107ms
     > Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
   [x] Brief 20p review fixes > H1: a failed detail load shows the error and retries 1053ms
     > Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
   [x] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 1025ms
     > Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
   [x] Brief 20p review fixes > M3: a received purchase leaves the drafts filter 1022ms
     > Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 509ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1028ms
   [x] Brief 20p review fixes > M6: while processing, the focus stays inside the dialog 1023ms
     > Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  5 failed | 5 passed (10)
   Start at  06:59:00
   Duration  9.82s (transform 214ms, setup 250ms, collect 374ms, tests 6.93s, environment 1.58s, prepare 257ms)

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

------- Failed Tests 5 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > H1: the detail comes from the engine with its lines, and editing starts from them
TestingLibraryElementError: Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > openDraft src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:25:18
     23|     await waitFor(() => expect(screen.getByText('Carnes del Valle')).t...
     24|     fireEvent.click(screen.getByText('Carnes del Valle'));
     25|     await screen.findByText('Editar líneas');
       |                  ^
     26|   }
     27| 
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:29:5

------------------------[1/5]-

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > H1: a failed detail load shows the error and retries
TestingLibraryElementError: Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:49:18
     47|     await waitFor(() => expect(screen.getByText('Sin conexión')).toBeI...
     48|     fireEvent.click(screen.getByText('Reintentar'));
     49|     await screen.findByText('Editar líneas');
       |                  ^
     50|   });
     51| 

------------------------[2/5]-

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear
TestingLibraryElementError: Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > openDraft src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:25:18
     23|     await waitFor(() => expect(screen.getByText('Carnes del Valle')).t...
     24|     fireEvent.click(screen.getByText('Carnes del Valle'));
     25|     await screen.findByText('Editar líneas');
       |                  ^
     26|   }
     27| 
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:54:5

------------------------[3/5]-

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M3: a received purchase leaves the drafts filter
TestingLibraryElementError: Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:84:18
     82|     await waitFor(() => expect(screen.getByText('Carnes del Valle')).t...
     83|     fireEvent.click(screen.getByText('Carnes del Valle'));
     84|     await screen.findByText('Editar líneas');
       |                  ^
     85|     fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
     86|     fireEvent.click(within(screen.getByRole('dialog')).getByRole('butt...

------------------------[4/5]-

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M6: while processing, the focus stays inside the dialog
TestingLibraryElementError: Unable to find an element with the text: Editar líneas. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
      >
        <h2
          class="section-title"
          style="margin: 0px; font-size: 16px; display: flex; align-items: center; gap: 8px;"
        >
          <svg
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <div
          style="display: flex; flex-direction: column; gap: 10px;"
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
              Volver a compras
            </span>
          </button>
          <div
            aria-live="polite"
            style="padding: 10px; border-radius: 8px; background: var(--error-soft); color: var(--error); font-size: 12px; border: 1px solid var(--border-error); display: flex; justify-content: space-between; align-items: center; gap: 8px;"
          >
            <span>
              No se pudo cargar la compra.
            </span>
            <button
              class="btn-primary"
              style="padding: 4px 10px; font-size: 12px; border-radius: 9999px;"
              type="button"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
 > waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 > openDraft src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:25:18
     23|     await waitFor(() => expect(screen.getByText('Carnes del Valle')).t...
     24|     fireEvent.click(screen.getByText('Carnes del Valle'));
     25|     await screen.findByText('Editar líneas');
       |                  ^
     26|   }
     27| 
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:143:5

------------------------[5/5]-
```

### Mutación 29: No recargar tras un 409 (revisión M1)

- **Archivo:** `src/hooks/usePurchaseActions.js`
- **Original:** `if (res.status === 409 && onStale) onStale();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 3121ms
   [x] Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear 1216ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span>
  Editar líneas
</span> instead

Ignored nodes: comments, script, style
<html>
  <head />
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
      ...
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 391ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1018ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:12
   Duration  5.42s (transform 189ms, setup 233ms, collect 333ms, tests 3.12s, environment 1.24s, prepare 146ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M1: after a 409 the detail reloads from the engine and the draft actions disappear
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span>
  Editar líneas
</span> instead

Ignored nodes: comments, script, style
<html>
  <head />
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
      ...
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:59:73
     57|     fireEvent.click(screen.getByRole('button', { name: 'Recibir' }));
     58|     fireEvent.click(within(screen.getByRole('dialog')).getByRole('butt...
     59|     await waitFor(() => expect(screen.queryByText('Editar líneas')).no...
       |                                                                         ^
     60|     expect(screen.getByText(/Recibida\./)).toBeInTheDocument();
     61|   });
 > runWithExpensiveErrorDiagnosticsDisabled node_modules/@testing-library/dom/dist/config.js:47:12
 > checkCallback node_modules/@testing-library/dom/dist/wait-for.js:124:77
 > Timeout.checkRealTimersCallback node_modules/@testing-library/dom/dist/wait-for.js:118:16

------------------------[1/1]-
```

### Mutación 30: Dejar en la lista compras de otro filtro (revisión M3)

- **Archivo:** `src/components/inventory/purchases/PurchasesView.jsx`
- **Original:** `if (!status || purchase.status === status) list.upsert(purchase); else list.remove(purchase.id);`
- **Mutado:** `list.upsert(purchase);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2141ms
   [x] Brief 20p review fixes > M3: a received purchase leaves the drafts filter 100ms
     > Unable to find an element with the text: No hay compras con este filtro.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
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
                Carnes del Valle
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                2026-10-09
                , factura 001-002-000123456
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Recibida
              </span>
              <span
                style="font-size: 13px; font-weight: 700;"
              >
                USD 87,60
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 395ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1039ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:19
   Duration  4.58s (transform 189ms, setup 243ms, collect 332ms, tests 2.14s, environment 1.28s, prepare 187ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M3: a received purchase leaves the drafts filter
TestingLibraryElementError: Unable to find an element with the text: No hay compras con este filtro.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
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
                Carnes del Valle
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                2026-10-09
                , factura 001-002-000123456
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Recibida
              </span>
              <span
                style="font-size: 13px; font-weight: 700;"
              >
                USD 87,60
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</body>
 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:90:19
     88| 
     89|     fireEvent.click(screen.getByText('Volver a compras'));
     90|     expect(screen.getByText('No hay compras con este filtro.')).toBeIn...
       |                   ^
     91|   });
     92| 

------------------------[1/1]-
```

### Mutación 31: No vaciar la lista al cambiar el filtro (revisión M3)

- **Archivo:** `src/hooks/usePagedList.js`
- **Original:** `setItems([]); setHasMore(false); load(1, false);`
- **Mutado:** `load(1, false);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 3230ms
   [x] Brief 20p review fixes > M3: the filtered list never shows purchases from another filter 1032ms
     > Unable to find an element with the text: Cargando compras.... This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
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
                Carnes del Valle
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                2026-10-09
                , factura 001-002-000123456
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Borrador
              </span>
              <span
                style="font-size: 13px; font-weight: 700;"
              >
                USD 87,60
              </span>
            </span>
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
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
                  for="purchase-status-filter"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Estado
                </label>
                <select
                  id="purchase-status-filter"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
                >
                  <option
                    value=""
                  >
                    Todas
                  </option>
                  <option
                    value="draft"
                  >
                    Borradores
                  </option>
                  <option
                    value="received"
                  >
                    Recibidas
                  </option>
                  <option
                    value="cancelled"
                  >
                    Canceladas
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
                  Nueva compra
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
                  Carnes del Valle
                </span>
                <span
                  style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
                >
                  2026-10-09
                  , factura 001-002-000123456
                </span>
              </span>
              <span
                style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
              >
                <span
                  style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
                >
                  Borrador
                </span>
                <span
                  style="font-size: 13px; font-weight: 700;"
                >
                  USD 87,60
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 386ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1024ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:25
   Duration  5.61s (transform 184ms, setup 253ms, collect 330ms, tests 3.23s, environment 1.23s, prepare 171ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M3: the filtered list never shows purchases from another filter
TestingLibraryElementError: Unable to find an element with the text: Cargando compras.... This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
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
                for="purchase-status-filter"
                style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
              >
                Estado
              </label>
              <select
                id="purchase-status-filter"
                style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
              >
                <option
                  value=""
                >
                  Todas
                </option>
                <option
                  value="draft"
                >
                  Borradores
                </option>
                <option
                  value="received"
                >
                  Recibidas
                </option>
                <option
                  value="cancelled"
                >
                  Canceladas
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
                Nueva compra
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
                Carnes del Valle
              </span>
              <span
                style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
              >
                2026-10-09
                , factura 001-002-000123456
              </span>
            </span>
            <span
              style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
            >
              <span
                style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
              >
                Borrador
              </span>
              <span
                style="font-size: 13px; font-weight: 700;"
              >
                USD 87,60
              </span>
            </span>
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
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
                  for="purchase-status-filter"
                  style="display: block; font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 4px;"
                >
                  Estado
                </label>
                <select
                  id="purchase-status-filter"
                  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
                >
                  <option
                    value=""
                  >
                    Todas
                  </option>
                  <option
                    value="draft"
                  >
                    Borradores
                  </option>
                  <option
                    value="received"
                  >
                    Recibidas
                  </option>
                  <option
                    value="cancelled"
                  >
                    Canceladas
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
                  Nueva compra
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
                  Carnes del Valle
                </span>
                <span
                  style="display: block; font-size: 11px; color: var(--text-subtle); margin-top: 2px;"
                >
                  2026-10-09
                  , factura 001-002-000123456
                </span>
              </span>
              <span
                style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;"
              >
                <span
                  style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; background: var(--chip-bg); color: var(--accent);"
                >
                  Borrador
                </span>
                <span
                  style="font-size: 13px; font-weight: 700;"
                >
                  USD 87,60
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:72:11
     70| 
     71|     fireEvent.change(screen.getByLabelText('Estado'), { target: { valu...
     72|     await waitFor(() => expect(screen.getByText('Cargando compras...')...
       |           ^
     73|     expect(screen.queryByText('Carnes del Valle')).not.toBeInTheDocume...
     74|     resolveDrafts(pageOf([]));

------------------------[1/1]-
```

### Mutación 32: No borrar el error de la cabecera al corregir (revisión M4)

- **Archivo:** `src/hooks/usePurchaseForm.js`
- **Original:** `const errorKey = HEADER_ERROR_KEYS[field] || field;`
- **Mutado:** `const errorKey = 'ninguno';`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 1864ms
   [x] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 64ms
     > expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  aria-live="polite"
  style="font-size: 11px; color: var(--error); margin-top: 4px; display: block;"
>
  Elige el proveedor.
</span> instead
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1034ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:32
   Duration  4.33s (transform 210ms, setup 258ms, collect 373ms, tests 1.86s, environment 1.26s, prepare 166ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span
  aria-live="polite"
  style="font-size: 11px; color: var(--error); margin-top: 4px; display: block;"
>
  Elige el proveedor.
</span> instead
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:103:59
    101|     await waitFor(() => expect(screen.getByRole('option', { name: 'Car...
    102|     fireEvent.change(screen.getByLabelText('Proveedor'), { target: { v...
    103|     expect(screen.queryByText('Elige el proveedor.')).not.toBeInTheDoc...
       |                                                           ^
    104| 
    105|     purchasesClient.listSuppliers.mockResolvedValue(pageOf([{ ...suppl...

------------------------[1/1]-
```

### Mutación 33: Perder el proveedor elegido al buscar otro (revisión M2)

- **Archivo:** `src/components/inventory/purchases/PurchaseForm.jsx`
- **Original:** `const options = selected && !suppliers.items.some((s) => s.id === selected.id) ? [selected, ...suppliers.items] : suppliers.items;`
- **Mutado:** `const options = suppliers.items;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2200ms
   [x] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 395ms
     > expect(element).toHaveValue(4)

Expected the element to have value:
  4
Received:

   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1021ms

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:38
   Duration  4.79s (transform 239ms, setup 292ms, collect 401ms, tests 2.20s, environment 1.36s, prepare 175ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen
Error: expect(element).toHaveValue(4)

Expected the element to have value:
  4
Received:

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:109:48
    107|     await waitFor(() => expect(purchasesClient.listSuppliers).toHaveBe...
    108|     await waitFor(() => expect(screen.getByRole('option', { name: 'Lác...
    109|     expect(screen.getByLabelText('Proveedor')).toHaveValue('4');
       |                                                ^
    110|     expect(screen.getByRole('option', { name: 'Carnes del Valle' })).t...
    111|   });

------------------------[1/1]-
```

### Mutación 34: Ocultar el fallo de la búsqueda de insumos (revisión M5)

- **Archivo:** `src/hooks/usePurchasesData.js`
- **Original:** `setFailed(!res.ok);`
- **Mutado:** `setFailed(false);`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2131ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 390ms
   [x] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1031ms
     > Unable to find an element with the text: No se pudo buscar: revisa la conexión.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          >
       ...

Ignored nodes: comments, script, style
<html>
  <head />
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
     ...

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:45
   Duration  4.63s (transform 194ms, setup 266ms, collect 351ms, tests 2.13s, environment 1.25s, prepare 153ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line
TestingLibraryElementError: Unable to find an element with the text: No se pudo buscar: revisa la conexión.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

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
            class="lucide lucide-shopping-cart"
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
              cx="8"
              cy="21"
              r="1"
            />
            <circle
              cx="19"
              cy="21"
              r="1"
            />
            <path
              d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
            />
          </svg>
          <span>
            Compras y proveedores
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
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
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
              Volver a compras
            </span>
          </button>
          <h3
            style="font-size: 15px; font-weight: 700; margin: 0px; color: var(--text-main);"
          >
       ...

Ignored nodes: comments, script, style
<html>
  <head />
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
              class="lucide lucide-shopping-cart"
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
                cx="8"
                cy="21"
                r="1"
              />
              <circle
                cx="19"
                cy="21"
                r="1"
              />
              <path
                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
              />
            </svg>
            <span>
              Compras y proveedores
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
          aria-label="Secciones de compras"
          role="tablist"
          style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
        >
          <button
            aria-controls="purchases-panel-purchases"
            aria-selected="true"
            id="purchases-tab-purchases"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Compras
          </button>
          <button
            aria-controls="purchases-panel-suppliers"
            aria-selected="false"
            id="purchases-tab-suppliers"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Proveedores
          </button>
          <button
            aria-controls="purchases-panel-valuation"
            aria-selected="false"
            id="purchases-tab-valuation"
            role="tab"
            style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
            type="button"
          >
            Valor
          </button>
        </div>
        <div
          aria-live="polite"
          role="status"
        />
        <div
          aria-labelledby="purchases-tab-purchases"
          id="purchases-panel-purchases"
          role="tabpanel"
        >
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
     ...
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:128:11
    126|     inventoryClient.listInventory.mockResolvedValueOnce({ ok: false, s...
    127|     fireEvent.change(screen.getByLabelText('Agregar insumo'), { target...
    128|     await waitFor(() => expect(screen.getByText('No se pudo buscar: re...
       |           ^
    129| 
    130|     inventoryClient.listInventory.mockResolvedValueOnce({ ok: true, da...

------------------------[1/1]-
```

### Mutación 35: No mover el foco a la línea nueva (revisión M5)

- **Archivo:** `src/components/inventory/purchases/PurchaseLinesEditor.jsx`
- **Original:** `document.getElementById(`purchase-${focusItemId}-qty`)?.focus();`
- **Mutado:** (línea eliminada)
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2200ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 387ms
   [x] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1030ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <input
  id="purchase-31-qty"
  inputmode="decimal"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
  type="text"
  value=""
/>
Received element with focus:
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
          <svg ... />
          <span ... />
        </h2>
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px;"
          type="button"
        >
          <svg ... />
          <span ... />
        </button>
      </div>
      <div
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <form
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button ... />
          <h3 ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <button ... />
        </form>
      </div>
    </div>
  </div>
</body>

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:51
   Duration  4.79s (transform 211ms, setup 258ms, collect 363ms, tests 2.20s, environment 1.39s, prepare 180ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line
Error: expect(element).toHaveFocus()

Expected element with focus:
  <input
  id="purchase-31-qty"
  inputmode="decimal"
  style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border-glass); background: var(--bg-dark); color: var(--text-main); font-size: 13px;"
  type="text"
  value=""
/>
Received element with focus:
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
          <svg ... />
          <span ... />
        </h2>
        <button
          style="background: transparent; border: medium; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px;"
          type="button"
        >
          <svg ... />
          <span ... />
        </button>
      </div>
      <div
        aria-label="Secciones de compras"
        role="tablist"
        style="display: flex; gap: 6px; background: var(--chip-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);"
      >
        <button
          aria-controls="purchases-panel-purchases"
          aria-selected="true"
          id="purchases-tab-purchases"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: var(--primary); color: var(--on-primary); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Compras
        </button>
        <button
          aria-controls="purchases-panel-suppliers"
          aria-selected="false"
          id="purchases-tab-suppliers"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Proveedores
        </button>
        <button
          aria-controls="purchases-panel-valuation"
          aria-selected="false"
          id="purchases-tab-valuation"
          role="tab"
          style="flex: 1 1 0%; padding: 8px 10px; border-radius: 8px; border: medium; background: transparent; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer;"
          type="button"
        >
          Valor
        </button>
      </div>
      <div
        aria-live="polite"
        role="status"
      />
      <div
        aria-labelledby="purchases-tab-purchases"
        id="purchases-panel-purchases"
        role="tabpanel"
      >
        <form
          style="display: flex; flex-direction: column; gap: 12px;"
        >
          <button ... />
          <h3 ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <div ... />
          <button ... />
        </form>
      </div>
    </div>
  </div>
</body>
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:137:52
    135|     await waitFor(() => expect(screen.getByRole('button', { name: 'Lom...
    136|     fireEvent.click(screen.getByRole('button', { name: 'Lomo fino (LOM...
    137|     expect(screen.getByLabelText('Cantidad (kg)')).toHaveFocus();
       |                                                    ^
    138|   });
    139| 

------------------------[1/1]-
```

### Mutación 36: Deshabilitar los botones mientras procesa (revisión M6)

- **Archivo:** `src/components/inventory/purchases/ConfirmDialog.jsx`
- **Original:** `onClick={() => { if (!busy) onClose(); }} aria-disabled={busy}`
- **Mutado:** `onClick={onClose} disabled={busy}`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2257ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 412ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1019ms
   [x] Brief 20p review fixes > M6: while processing, the focus stays inside the dialog 82ms
     > expect(element).toHaveFocus()

Expected element with focus:
  <button
  disabled=""
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
Received element with focus:
  <button
  aria-disabled="true"
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Procesando...
</button>

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  06:59:58
   Duration  4.81s (transform 220ms, setup 275ms, collect 388ms, tests 2.26s, environment 1.31s, prepare 166ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M6: while processing, the focus stays inside the dialog
Error: expect(element).toHaveFocus()

Expected element with focus:
  <button
  disabled=""
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; border: 1px solid var(--border-glass); background: transparent; color: var(--text-muted); font-weight: 600; cursor: pointer;"
  type="button"
>
  Volver
</button>
Received element with focus:
  <button
  aria-disabled="true"
  class="btn-primary"
  style="flex: 1 1 0%; padding: 11px; border-radius: 9999px; font-weight: 600; cursor: pointer;"
  type="button"
>
  Procesando...
</button>
 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:153:68
    151|     processing.focus();
    152|     fireEvent.keyDown(document, { key: 'Tab' });
    153|     expect(within(dialog).getByRole('button', { name: 'Volver' })).toH...
       |                                                                    ^
    154|     fireEvent.click(within(dialog).getByRole('button', { name: 'Volver...
    155|     expect(screen.getByRole('dialog')).toBeInTheDocument();

------------------------[1/1]-
```

### Mutación 37: Desmontar el formulario al cambiar de pestaña (revisión M7)

- **Archivo:** `src/components/inventory/purchases/PurchasesView.jsx`
- **Original:** `hidden={tab !== 'purchases'}> {purchasesContent}`
- **Mutado:** `>
        {tab === 'purchases' && purchasesContent}`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx (10 tests | 1 failed) 2149ms
   [ok] Brief 20p review fixes > M2 and M4: the supplier is searched, stays selected and its error clears when chosen 382ms
   [ok] Brief 20p review fixes > M5: the item search says when it fails or finds nothing, and the focus goes to the new line 1015ms
   [x] Brief 20p review fixes > M7: switching tabs keeps the new purchase form and what was written 85ms
     > expect(element).toHaveValue(001-002-77)

Expected the element to have value:
  001-002-77
Received:


 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  07:00:04
   Duration  4.68s (transform 192ms, setup 261ms, collect 340ms, tests 2.15s, environment 1.37s, prepare 168ms)

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

------- Failed Tests 1 -------

 FAIL  src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx > Brief 20p review fixes > M7: switching tabs keeps the new purchase form and what was written
Error: expect(element).toHaveValue(001-002-77)

Expected the element to have value:
  001-002-77
Received:

 > src/components/inventory/purchases/__tests__/PurchaseReviewFixes.test.jsx:169:57
    167|     expect(screen.getByRole('tab', { name: 'Valor' })).toHaveAttribute...
    168|     fireEvent.click(screen.getByRole('tab', { name: 'Compras' }));
    169|     expect(screen.getByLabelText('Factura (opcional)')).toHaveValue('0...
       |                                                         ^
    170|   });
    171| });

------------------------[1/1]-
```

### Mutación 38: Aceptar fechas que no existen (revisión)

- **Archivo:** `src/services/purchasesClient.js`
- **Original:** `return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;`
- **Mutado:** `return true;`
- **Resultado:** detectada (falla al menos un test)

```text
RUN  v2.1.9 C:/laragon/www/UALDO

 > src/services/__tests__/purchasesClient.test.js (10 tests | 1 failed) 22ms
   [x] purchasesClient > purchases > rejects dates that do not exist 8ms
     > Cannot read properties of undefined (reading 'purchased_on')

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
   Start at  07:00:11
   Duration  2.33s (transform 81ms, setup 257ms, collect 108ms, tests 22ms, environment 1.31s, prepare 148ms)

------- Failed Tests 1 -------

 FAIL  src/services/__tests__/purchasesClient.test.js > purchasesClient > purchases > rejects dates that do not exist
TypeError: Cannot read properties of undefined (reading 'purchased_on')
 > src/services/__tests__/purchasesClient.test.js:119:32
    117|       for (const purchasedOn of ['2026-13-45', '2026-02-30', '2026-00-...
    118|         const res = await createPurchase({ ...base, purchasedOn }, 'uu...
    119|         expect(res.data.errors.purchased_on).toBeDefined();
       |                                ^
    120|       }
    121|       expect(spy).not.toHaveBeenCalled();

------------------------[1/1]-
```

## 5. Pendiente

- Prueba en el teléfono contra el motor: crear un proveedor, una compra con dos líneas, editarla, recibirla y ver el valor del inventario.
- Vincular una compra a un pedido interno aprobado (`supply_request_id`) desde la app, cuando existan las pantallas de pedidos internos.
- Tests de caja frágiles (esperan un solo ciclo de promesas): fuera del alcance de este brief.
