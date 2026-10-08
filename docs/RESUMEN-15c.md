# Resumen de Implementación: Brief 15c-PWA

**Rama:** `feat/pwa-cash-config` (creada a partir de `feat/pwa-cash-close`)  
**Repositorio:** `C:\laragon\www\UALDO` (PWA de Ualdo)  
**Fecha:** 2026-10-07  
**Estado:** Pendiente de auditoría  

---

## 1. Alcance y Decisiones de Arquitectura

El Brief 15c-PWA implementa las interfaces y servicios necesarios en la aplicación cliente para resolver los motivos de revisión de caja originados en RunFood y parametrizar las tasas de comisión de tarjetas, además de completar las deudas técnicas y refactorizaciones pendientes del Brief 15b.

### Decisiones Principales

1. **Cliente de Configuración de Caja (`src/services/cashConfigClient.js`):**
   - Endpoints implementados bajo `/restaurant/cash-close`:
     - `GET /restaurant/cash-close/payment-mappings` (`listPaymentMappings`)
     - `PUT /restaurant/cash-close/payment-mappings/{id}` (`assignBucket`)
     - `POST /restaurant/cash-close/payment-mappings/{id}/aceptar-sugerencia` (`acceptSuggestion`)
     - `GET /restaurant/cash-close/commission-rates` (`getCommissionRates`)
     - `PUT /restaurant/cash-close/commission-rates` (`saveCommissionRate`)
   - Lista blanca de cubetas válidas (`VALID_PAYMENT_BUCKETS`): `efectivo`, `pichincha`, `de_una`, `internacional`, `credito`, `debito`, `diners`, `pedidos_ya`, `decoracion_efectivo`, `decoracion_tarjeta`, `decoracion_transferencia`, `ignorar`. Se excluye explícitamente `'sin_mapear'`.
   - Lista blanca de tipos de tarjeta: `credito`, `debito`, `diners`, `pedidos_ya`.
   - Validaciones estrictas: enteros positivos para identificadores de formas de pago, fecha con formato ISO `YYYY-MM-DD`, y puntos básicos `0 <= bp <= 3000` enteros.

2. **Conversión de Porcentajes sin Aritmética de Coma Flotante (`src/services/money.js`):**
   - `percentToBp(raw)`: Procesa la entrada textual admitiendo comas o puntos decimales mediante análisis de subcadenas (`intPart * 100 + decPart`), impidiendo imprecisiones de coma flotante (`parseFloat`). Rechaza números mayores a 30 %, negativos o con más de 2 decimales.
   - `bpToPercent(bp)`: Formatea valores enteros en puntos básicos a su representación con coma decimal en español (ej. `448` -> `"4,48 %"`, `null`/inválido -> `"Sin tasa"`).

3. **Reevaluación de Cierres (`src/services/cashCloseClient.js`):**
   - Incorporación de `reevaluateClose(fecha)` para `POST /restaurant/cash-close/{fecha}/reevaluar`.

4. **Vistas y Paneles de Configuración (`src/components/cashconfig/`):**
   - `CashConfigView.jsx`: Vista de configuración con control estricto de acceso para el dueño (`is_owner`). Ofrece navegación por pestañas pastilla entre "Formas de pago" y "Comisiones".
   - `PaymentMappingsPanel.jsx`: Lista formas de RunFood ordenando primero las no asignadas (`sin_mapear`). Permite "Aceptar sugerencia" de forma directa. Al asignar a "ignorar" o reasignar una forma previamente confirmada, solicita confirmación explícita alertando sobre su impacto en días abiertos.
   - `CommissionRatesPanel.jsx`: Tabla de tasas vigentes destacando tarjetas sin tasa con "Sin tasa: su neto queda pendiente". Modal de "Nueva tasa" sin campos prellenados y con diálogo de confirmación que expone los porcentajes y fecha de vigencia. Modal de "Historial" de solo lectura y nota fija sobre retención.

5. **Navegación contextual y reevaluación desde el detalle (`src/components/cashclose/CashCloseDetail.jsx`):**
   - En discrepancias de tipo `formas_sin_mapear` y `falta_comision`, se ofrecen botones de acción directa ("Asignar formas de pago", "Configurar comisiones") que conducen a la pestaña pertinente de configuración y refrescan el día al retornar.
   - Se añadió el botón "Volver a evaluar", visible exclusivamente en días que no están en estado `cerrado` y disponen de `snapshot`, manejando respuestas 409 con el mensaje del servidor.

6. **Pendientes del Brief 15b:**
   - **Test del personal:** `CashCloseView.test.jsx` y `CashConfigView.test.jsx` esperan a que se asienten los efectos asíncronos (`await new Promise(...)` / `waitFor`) antes de validar que no se efectuaron llamadas de red.
   - **Extracción de Hooks:** Se extrajeron `src/hooks/useCashClose.js` y `src/hooks/useCashMovements.js`, permitiendo que `CashMovementsPanel.jsx` (169 líneas) y `CashCloseReviewForm.jsx` (191 líneas) permanezcan holgadamente por debajo de las 200 líneas sin alterar la cobertura ni su funcionalidad.
   - **Guardia de seguridad:** Clave literal `'ualdo_cash_close_history'` escrita en `src/services/auth.js` dentro de `localStorage.removeItem`. En `src/services/__tests__/securityGuard.test.js` se implementó la excepción acotada y comentada para dicho archivo y método, verificando que cualquier filtración fuera de él falle inmediatamente.

---

## 2. Archivos Creados y Modificados

### Servicios y Utilidades
- `src/services/cashConfigClient.js`: Nuevo cliente para mapeos y comisiones.
- `src/services/cashCloseClient.js`: Añadido `reevaluateClose`.
- `src/services/money.js`: Funciones `percentToBp` y `bpToPercent` sin floats.
- `src/services/auth.js`: Literal `'ualdo_cash_close_history'` en `logout` y `clearSession`.
- `src/services/__tests__/cashConfigClient.test.js`: Pruebas completas del cliente de configuración.
- `src/services/__tests__/cashCloseClient.test.js`: Pruebas de reevaluación y rutas.
- `src/services/__tests__/money.test.js`: Pruebas unitarias de conversión y formateo de tasas.
- `src/services/__tests__/securityGuard.test.js`: Guardia con excepción estricta y prueba de fuga.
- `vite.config.js`: Inclusión de componentes y hooks en `coverage.include`.

### Hooks
- `src/hooks/usePaymentMappings.js`: Lógica de ordenamiento, confirmación y guardado de formas de pago.
- `src/hooks/useCommissionRates.js`: Lógica de tasas vigentes, historial y altas de comisiones.
- `src/hooks/useCashClose.js`: Hook desacoplado para carga, revisión, netos y reevaluación del día.
- `src/hooks/useCashMovements.js`: Hook desacoplado para movimientos, paginación y anulaciones.
- `src/hooks/__tests__/usePaymentMappings.test.js`: Pruebas unitarias del hook de mapeos.
- `src/hooks/__tests__/useCommissionRates.test.js`: Pruebas unitarias del hook de comisiones.
- `src/hooks/__tests__/useCashClose.test.js`: Pruebas unitarias de `useCashClose`.
- `src/hooks/__tests__/useCashMovements.test.js`: Pruebas unitarias de `useCashMovements`.

### Componentes UI
- `src/components/CashCloseView.jsx`: Enrutamiento y pase de pestaña a configuración de caja.
- `src/components/__tests__/CashCloseView.test.jsx`: Pruebas de acceso con espera de efectos.
- `src/components/cashconfig/CashConfigView.jsx`: Contenedor principal de configuración de caja.
- `src/components/cashconfig/PaymentMappingsPanel.jsx`: Panel de mapeos de formas de pago.
- `src/components/cashconfig/CommissionRatesPanel.jsx`: Panel de tasas de comisión e historial.
- `src/components/cashconfig/__tests__/CashConfigView.test.jsx`: Pruebas de pestañas y guardia de dueño.
- `src/components/cashconfig/__tests__/PaymentMappingsPanel.test.jsx`: Pruebas de interacción y XSS.
- `src/components/cashconfig/__tests__/CommissionRatesPanel.test.jsx`: Pruebas de tasas, confirmaciones y 422.
- `src/components/cashclose/CashCloseDetail.jsx`: Integración de accesos a configuración y botón de reevaluación.
- `src/components/cashclose/CashCloseList.jsx`: Botón de acceso a configuración de caja para el dueño.
- `src/components/cashclose/CashCloseReviewForm.jsx`: Refactorizado con `useCashClose` (< 200 líneas).
- `src/components/cashclose/CashMovementsPanel.jsx`: Refactorizado con `useCashMovements` (< 200 líneas).
- `src/components/cashclose/__tests__/CashCloseDetail.test.jsx`: Pruebas de motivos interactivos y reevaluación.
- `src/components/cashclose/__tests__/CashCloseList.test.jsx`: Pruebas del botón de configuración.

---

## 3. Pruebas de Mutación Verificadas

Se verificaron las 8 mutaciones exigidas por el Brief 15c, ejecutando los tests correspondientes y registrando su salida real completa (sin símbolos de terminal ni caracteres decorativos, utilizando `[ok]`, `[x]` y `>`):

### Mutación 1: Personal sin `is_owner` en `CashConfigView`
- **Ubicación:** `src/components/cashconfig/CashConfigView.jsx:12`
- **Cambio realizado:** Se eliminó la guardia `if (!isOwner) { return <AccesoRestringido />; }`.
- **Test que falló:** `src/components/cashconfig/__tests__/CashConfigView.test.jsx > CashConfigView component > bloquea al personal sin is_owner sin realizar peticiones a la API tras asentar efectos`
- **Salida real obtenida:**
```text
[x] src/components/cashconfig/__tests__/CashConfigView.test.jsx > CashConfigView component > bloquea al personal sin is_owner sin realizar peticiones a la API tras asentar efectos
TestingLibraryElementError: Unable to find an element with the text: Acceso Restringido.

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <div
          style="display: flex; align-items: center; justify-content: space-between;"
        >
          <button
            style="background: transparent; border: medium; color: var(--accent); cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;"
            type="button"
          >
            Volver a la caja
          </button>
        </div>
        ...
        <div
          class="glass-card"
          style="padding: 20px; text-align: center; font-size: 12px; color: var(--text-muted);"
        >
          No hay formas de pago registradas.
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/cashconfig/__tests__/CashConfigView.test.jsx:33:11
     31|     render(<CashConfigView onBack={() => {}} />);
     32| 
     33|     await waitFor(() => {
       |           ^
     34|       expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
     35|       expect(screen.getByText('Solo el dueño puede configurar la caja.')).toBeInTheDocument();
```

---

### Mutación 2: Inclusión de `sin_mapear` en cubetas permitidas en `cashConfigClient`
- **Ubicación:** `src/services/cashConfigClient.js:8`
- **Cambio realizado:** Se agregó `'sin_mapear'` al arreglo `VALID_PAYMENT_BUCKETS`.
- **Test que falló:** `src/services/__tests__/cashConfigClient.test.js > cashConfigClient service > assignBucket > no envia peticion si bucket es sin_mapear o desconocido`
- **Salida real obtenida:**
```text
[x] src/services/__tests__/cashConfigClient.test.js > cashConfigClient service > assignBucket > no envia peticion si bucket es sin_mapear o desconocido
AssertionError: expected 404 to be 400 // Object.is equality

- Expected
+ Received

- 400
+ 404

 > src/services/__tests__/cashConfigClient.test.js:22:35
     20|       const resSinMapear = await assignBucket(1, 'sin_mapear');
     21|       expect(resSinMapear.ok).toBe(false);
     22|       expect(resSinMapear.status).toBe(400);
       |                                   ^
     23|       expect(requestSpy).not.toHaveBeenCalled();
     24| 
```

---

### Mutación 3: Cálculo con `parseFloat` y redondeo en `percentToBp`
- **Ubicación:** `src/services/money.js:89`
- **Cambio realizado:** Se reemplazó el análisis estricto de subcadenas decimales por `const val = parseFloat(str); const bp = Math.round(val * 100);`.
- **Test que falló:** `src/services/__tests__/money.test.js > money service > percentToBp > devuelve null para valores invalidos, fuera de rango o con decimales excesivos` (el caso de borde `"4,485"` fue indebidamente aceptado como `449` en lugar de ser rechazado con `null`).
- **Salida real obtenida:**
```text
[x] src/services/__tests__/money.test.js > money service > percentToBp > devuelve null para valores invalidos, fuera de rango o con decimales excesivos
AssertionError: expected 449 to be null

- Expected: 
null

+ Received: 
449

 > src/services/__tests__/money.test.js:59:36
     57|       expect(percentToBp('30,01')).toBeNull();
     58|       expect(percentToBp('-1')).toBeNull();
     59|       expect(percentToBp('4,485')).toBeNull();
       |                                    ^
     60|       expect(percentToBp('abc')).toBeNull();
     61|       expect(percentToBp('')).toBeNull();
```

---

### Mutación 4: Omitir confirmación al reasignar formas ya confirmadas en `usePaymentMappings`
- **Ubicación:** `src/hooks/usePaymentMappings.js:109`
- **Cambio realizado:** Se eliminó la verificación `if (selectedMapping.confirmado && confirmStep !== 'reassign' && confirmStep !== 'ignore') { setConfirmStep('reassign'); return; }`.
- **Test que falló:** `src/components/cashconfig/__tests__/PaymentMappingsPanel.test.jsx > PaymentMappingsPanel component > pide confirmacion si la forma ya estaba confirmada al cambiar la cubeta`
- **Salida real obtenida:**
```text
[x] src/components/cashconfig/__tests__/PaymentMappingsPanel.test.jsx > PaymentMappingsPanel component > pide confirmacion si la forma ya estaba confirmada al cambiar la cubeta
TestingLibraryElementError: Unable to find an element with the text: Cambiar la cubeta de una forma ya confirmada afecta a los días abiertos..

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <div
          style="padding: 8px 12px; border-radius: 10px; background: var(--success-soft); border: 1px solid var(--border-success); color: var(--success); font-size: 12px;"
        >
          Guardado. Los días abiertos se vuelven a evaluar en unos segundos.
        </div>
        ...
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/cashconfig/__tests__/PaymentMappingsPanel.test.jsx:197:11
    195| 
    196|     // Debe advertir que cambiar forma confirmada afecta dias abiertos
    197|     await waitFor(() => {
       |           ^
    198|       expect(screen.getByText('Cambiar la cubeta de una forma ya confirmada afecta a los días abiertos.')).toBeInTheDocument();
    199|     });
```

---

### Mutación 5: Prellenar formulario de nueva tasa con `"4.48"` en `useCommissionRates`
- **Ubicación:** `src/hooks/useCommissionRates.js:50`
- **Cambio realizado:** Se cambió `setRatePercent('')` por `setRatePercent('4.48')` en `openNewRateModal`.
- **Test que falló:** `src/components/cashconfig/__tests__/CommissionRatesPanel.test.jsx > CommissionRatesPanel component > muestra "Sin tasa: su neto queda pendiente" para tarjetas sin tasa y no prellena el formulario`
- **Salida real obtenida:**
```text
[x] src/components/cashconfig/__tests__/CommissionRatesPanel.test.jsx > CommissionRatesPanel component > muestra "Sin tasa: su neto queda pendiente" para tarjetas sin tasa y no prellena el formulario
AssertionError: expected '4.48' to be '' // Object.is equality

- Expected
+ Received

+ 4.48

 > src/components/cashconfig/__tests__/CommissionRatesPanel.test.jsx:80:29
     78|     const rateInput = screen.getByLabelText(/Comisión %/i);
     79|     const retentionInput = screen.getByLabelText(/Retención %/i);
     80|     expect(rateInput.value).toBe('');
       |                             ^
     81|     expect(retentionInput.value).toBe('');
     82|   });
```

---

### Mutación 6: Omitir botón interactivo para `falta_comision` en `CashCloseDetail`
- **Ubicación:** `src/components/cashclose/CashCloseDetail.jsx:154`
- **Cambio realizado:** Se removió el bloque que renderiza el botón "Configurar comisiones" ante discrepancias `falta_comision`.
- **Test que falló:** `src/components/cashclose/__tests__/CashCloseDetail.test.jsx > CashCloseDetail component > permite abrir la configuracion desde formas_sin_mapear y falta_comision`
- **Salida real obtenida:**
```text
[x] src/components/cashclose/__tests__/CashCloseDetail.test.jsx > CashCloseDetail component > permite abrir la configuracion desde formas_sin_mapear y falta_comision
TestingLibraryElementError: Unable to find an element with the text: Configurar comisiones.

Ignored nodes: comments, script, style
<html>
  <head />
  <body>
    <div>
      <div
        style="display: flex; flex-direction: column; gap: 14px;"
      >
        <div
          class="glass-card"
          style="padding: 16px; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border-warning);"
        >
          <div
            style="padding: 8px 10px; border-radius: 10px; background: var(--surface-soft); border: 1px solid var(--border-glass); display: flex; flex-direction: column; gap: 6px;"
          >
            <div
              style="font-size: 12px; font-weight: 600; color: var(--text-main);"
            >
              No hay comision para Diners
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
 > Proxy.waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 > src/components/cashclose/__tests__/CashCloseDetail.test.jsx:218:11
    216|     render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} onOpenConfig={onOpenConfigMock} />);
    217| 
    218|     await waitFor(() => {
       |           ^
    219|       expect(screen.getByText('Asignar formas de pago')).toBeInTheDocument();
    220|       expect(screen.getByText('Configurar comisiones')).toBeInTheDocument();
```

---

### Mutación 7: Mostrar "Volver a evaluar" en días cerrados en `CashCloseDetail`
- **Ubicación:** `src/components/cashclose/CashCloseDetail.jsx:120`
- **Cambio realizado:** Se eliminó la condición `cierre.status !== 'cerrado'` dejando solo `Boolean(cierre.snapshot)`.
- **Test que falló:** `src/components/cashclose/__tests__/CashCloseDetail.test.jsx > CashCloseDetail component > no muestra boton "Volver a evaluar" cuando el dia esta cerrado o no tiene snapshot`
- **Salida real obtenida:**
```text
[x] src/components/cashclose/__tests__/CashCloseDetail.test.jsx > CashCloseDetail component > no muestra boton "Volver a evaluar" cuando el dia esta cerrado o no tiene snapshot
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <span>
  Volver a evaluar
</span> instead
 > src/components/cashclose/__tests__/CashCloseDetail.test.jsx:285:56
    283|     });
    284| 
    285|     expect(screen.queryByText('Volver a evaluar')).not.toBeInTheDocument();
       |                                                        ^
    286|   });
    287| });
```

---

### Mutación 8: Ampliar la excepción de `ualdo_cash_close_history` a todo `src` en `securityGuard.test.js`
- **Ubicación:** `src/services/__tests__/securityGuard.test.js:62`
- **Cambio realizado:** Se reemplazó la validación estricta de ruta `relPath === 'services/auth.js'` y llamada `localStorage.removeItem(...)` por `if (token === 'ualdo_cash_close_history') continue;`.
- **Test que falló:** `src/services/__tests__/securityGuard.test.js > Security Guard - Comprehensive Codebase Scan > hace fallar la guardia si ualdo_cash_close_history aparece fuera de removeItem en otro archivo de src`
- **Salida real obtenida:**
```text
[x] src/services/__tests__/securityGuard.test.js > Security Guard - Comprehensive Codebase Scan > hace fallar la guardia si ualdo_cash_close_history aparece fuera de removeItem en otro archivo de src
AssertionError: expected [Function] to throw an error

- Expected: 
null

+ Received: 
undefined

 > src/services/__tests__/securityGuard.test.js:99:10
     97|       expect(() => {
     98|         assertSourceFilesClean(filesWithTemp);
     99|       }).toThrow(/contains forbidden security token: "ualdo_cash_close_history"/);
       |          ^
    100|     } finally {
    101|       if (fs.existsSync(tempFile)) {
```

---

## 4. Tabla de Cobertura de Código

Salida íntegra obtenida ejecutando `npm run test:coverage`:

```text
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.43 |    83.73 |   78.21 |   96.43 |                   
 components        |   87.58 |     87.5 |      40 |   87.58 |                   
  CashCloseView.jsx |   73.63 |    84.84 |      50 |   73.63 | 116-118,131-133   
  DobleFiloCard.jsx |     100 |    93.75 |      80 |     100 | 134-136           
  InventoryView.jsx |   82.78 |       80 |      10 |   82.78 | 71-73,150-155     
 components/assistant | 91.51 |    70.43 |   83.33 |   91.51 |                   
  AssistantChat.jsx |   78.72 |    86.66 |      60 |   78.72 | 65-77,151-159     
  MessageBubble.jsx |   96.77 |       80 |     100 |   96.77 | 8                 
  PendingActionCard.jsx|95.65 |       80 |     100 |   95.65 | 17-18,24-25       
  PrivacyNotice.jsx |   89.47 |    55.55 |     100 |   89.47 | 12-13,26-27       
  SuggestionChips.jsx |   100 |       75 |     100 |     100 | 23                
  useAssistantConversation.js|98.62| 59.57|   100 |   98.62 | 100,119           
 components/cashclose | 97.05 |    86.44 |   68.18 |   97.05 |                   
  CashCloseClosedActions.jsx|97.88| 81.08 |   76.92 |   97.88 | 60-62             
  CashCloseDetail.jsx|  98.88 |    89.74 |   66.66 |   98.88 | 50-51             
  CashCloseList.jsx |   88.77 |    85.18 |   83.33 |   88.77 | 119-131,155-156   
  CashCloseManualForm.jsx|100 |    89.28 |   33.33 |     100 | 81-86             
  CashCloseReviewForm.jsx|98.17|   83.92 |   93.33 |   98.17 | 84-86             
  CashMovementsPanel.jsx| 100 |    88.09 |      75 |     100 | 121,124,129,152   
 components/cashconfig| 99.15 |    93.39 |   70.58 |   99.15 |                   
  CashConfigView.jsx|     100 |      100 |   66.66 |     100 |                   
  CommissionRatesPanel.jsx|99.49|  92.85 |      75 |   99.49 | 217               
  PaymentMappingsPanel.jsx|98.42|  90.69 |   66.66 |   98.42 | 63-65             
 components/inventory|  98.76 |    84.04 |      60 |   98.76 |                   
  InventoryList.jsx |     100 |    93.33 |     100 |     100 | 160               
  ItemCreateModal.jsx | 98.88 |    81.81 |    37.5 |   98.88 | 36-37             
  MovementModal.jsx |   96.62 |    77.77 |      50 |   96.62 | 109-111,155-157   
  MovementsHistoryModal.jsx|100|   85.36 |     100 |     100 | 133-136,146       
 components/notifications|98.7|    80.35 |      80 |    98.7 |                   
  NotificationItem.jsx| 96.15 |    81.81 |   83.33 |   96.15 | 19-20,61-62       
  NotificationsPanel.jsx| 100 |    79.41 |      75 |     100 | 129-131,144,208   
 hooks             |   97.85 |    78.83 |      98 |   97.85 |                   
  useCashClose.js  |     100 |    63.15 |     100 |     100 | 107-113,125-131   
  useCashMovementSubmit.js|100|       84 |     100 |     100 | 91-92,100         
  useCashMovements.js|  98.44 |    90.62 |     100 |   98.44 | 116-117           
  useCommissionRates.js|  100 |    62.06 |     100 |     100 | 117-118,126-131   
  useInventoryList.js|  94.69 |    77.14 |     100 |   94.69 | 51-52,76-79       
  useMovementSubmit.js| 88.42 |       70 |     100 |   88.42 | 13-21,92-93       
  useNotifications.js|    100 |    85.71 |     100 |     100 | 33,35,37,54,66    
  usePaymentMappings.js|  100 |    80.85 |     100 |     100 | 81,89,95,102      
  useUnreadCount.js |    97.5 |    93.75 |      80 |    97.5 | 96-98             
 services          |   97.03 |    86.94 |     100 |   97.03 |                   
  assistantClient.js|     100 |    63.82 |     100 |     100 | 106-114,131,138   
  auth.js          |   98.03 |    84.84 |     100 |   98.03 | 20-21             
  cashCloseClient.js|   91.21 |     92.5 |     100 |   91.21 | 126-131,171-176   
  cashConfigClient.js|  96.31 |       95 |     100 |   96.31 | 156-161           
  cashMovementsClient.js| 100 |    93.93 |     100 |     100 | 76,104            
  inventoryClient.js|   98.57 |     85.1 |     100 |   98.57 | 36-37             
  money.js         |   98.03 |    97.67 |     100 |   98.03 | 34-35             
  notificationRoutes.js|94.44 |    80.76 |     100 |   94.44 | 26-27,54-55,88    
  notificationsClient.js| 100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

---

## 5. Verificación Final de Calidad

1. **Linter (`npm run lint`):**
   - 0 errores, 52 advertencias heredadas en archivos no tocados.
2. **Suites de Pruebas (`npm test`):**
   - 40 archivos de prueba aprobados (246 tests en verde).
3. **Compilación de Producción (`npm run build`):**
   - Compilación Vite exitosa sin errores en `dist/`.
4. **Verificación de colores codificados en duro:**
   - `git grep -E "#[0-9a-fA-F]{3,8}\b|rgba?\(" -- src/components/cashconfig src/components/cashclose` retorna 0 coincidencias.
5. **Verificación de token reconstruido dinámicamente en auth:**
   - `git grep "join('_')" src/services/auth.js` retorna 0 coincidencias.
   - En su lugar, `'ualdo_cash_close_history'` está explícito como clave literal en llamadas `removeItem`.
6. **Conteo de líneas de componentes y hooks:**
   - Todos los componentes y hooks cumplen los límites exigidos:
     - `src/components/cashconfig/CashConfigView.jsx`: 107 líneas (< 250)
     - `src/components/cashconfig/PaymentMappingsPanel.jsx`: 232 líneas (< 250)
     - `src/components/cashconfig/CommissionRatesPanel.jsx`: 237 líneas (< 250)
     - `src/components/cashclose/CashCloseReviewForm.jsx`: 191 líneas (< 200)
     - `src/components/cashclose/CashMovementsPanel.jsx`: 169 líneas (< 200)
     - `src/components/cashclose/CashCloseDetail.jsx`: 220 líneas (< 250)
     - `src/components/cashclose/CashCloseList.jsx`: 224 líneas (< 250)
     - `src/hooks/useCashClose.js`: 157 líneas
     - `src/hooks/useCashMovements.js`: 149 líneas
     - `src/hooks/usePaymentMappings.js`: 137 líneas
     - `src/hooks/useCommissionRates.js`: 165 líneas
