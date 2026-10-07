# Resumen de Implementacion: Brief 15b

**Rama:** `feat/pwa-cash-close` (creada a partir de `feat/pwa-inventory-notifications` en `6aad4d9`)  
**Repositorio:** `C:\laragon\www\UALDO` (PWA movil: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9)  
**Fecha:** 2026-10-07  
**Estado:** Listo para revision y despliegue conjunto con Brief 16  

---

## 1. Contexto y Objetivos

El Brief 15b reemplaza el cierre de caja manual heredado en la PWA (que dependia de calculos con `parseFloat` en el cliente, comisiones estaticas de tarjetas y envio directo a Google Sheets desde el movil) por la integracion directa con la API REST del motor (`UaldoBusiness`).

El motor es ahora la unica fuente de verdad para el arqueo de caja diario:
- Arma el cierre automaticamente cada noche a partir de la foto enviada por el agente de RunFood (Brief 13c).
- Si cuadra, lo marca como `cerrado` y emite el aviso correspondiente.
- Si no cuadra, lo mantiene en `revision` con sus discrepancias y razones descriptivas.
- Exporta de forma transparente y controlada a Google Sheets (Brief 13d).

---

## 2. Alcance Construido

### 2.1 Servicios y Utilidades (`src/services/` y `src/hooks/`)
- `src/services/money.js`:
  - Normalizador `normalizeAmount(raw, options)`: valida formato monetario estricto `^\d{1,7}(\.\d{1,2})?$`, acepta coma decimal convirtiendola a punto y valida rango `(0, 100000]` para movimientos.
  - Formateador `formatUsd(value)`: aplica localizacion `es-EC` (`USD 1.234,56`). Si el valor es `null` o `undefined`, devuelve estrictamente `"Pendiente"`, nunca `"USD 0,00"`.
- `src/services/cashCloseClient.js`:
  - Consumo tipado y seguro de endpoints del motor: `GET /restaurant/cash-close`, `GET /restaurant/cash-close?date=YYYY-MM-DD`, `POST /restaurant/cash-close/{date}/review`, `POST /restaurant/cash-close/{date}/netos-reales`, `POST /restaurant/cash-close/{date}/reabrir` y `POST /restaurant/cash-close/manual`.
  - Validacion de fechas reales con `isValidDate(fecha)`.
  - Sanitizacion y listas blancas para payloads (`REVIEW_WHITELIST`, `NETOS_WHITELIST`, `MANUAL_WHITELIST`), serializando montos como texto normalizado.
- `src/services/cashMovementsClient.js`:
  - Endpoints `GET /restaurant/cash-movements?business_date=YYYY-MM-DD` y `POST /restaurant/cash-movements`.
  - Cabecera idempotente obligatoria `X-Client-UUID` con formato UUID v4.
  - Sanitizacion de contraparte y notas (control de caracteres y longitud).
- `src/hooks/useCashMovementSubmit.js`:
  - Hook idempotente para registro de movimientos. Genera UUID v4 mediante `crypto.randomUUID` (o `crypto.getRandomValues`).
  - Ante error de red o timeout, preserva y reusa el mismo `client_uuid` para reintentos seguros. Genera uno nuevo unicamente tras respuesta exitosa 201 o conflicto 409.

### 2.2 Componentes de Caja (`src/components/cashclose/` y `src/components/CashCloseView.jsx`)
- Todos los componentes cumplen con el limite estricto de menos de 250 lineas por archivo y cero uso de colores hexadecimales/rgb hardcodeados (100% variables CSS).
- `CashCloseView.jsx` (115 lineas):
  - Guardia de seguridad estricta: verifica que el usuario autenticado sea dueno (`is_owner`). Si no lo es, bloquea el acceso con mensaje "Solo el dueno puede ver la caja" y no realiza llamadas a la API.
  - Permite alternar entre la lista de cierres y el detalle de una fecha especifica o alta manual.
- `CashCloseList.jsx` (212 lineas):
  - Muestra historial de hasta 60 dias ordenados descendentemente.
  - Filtro interactivo "Solo en revision" con chip de conteo.
  - Tarjetas detalladas con fecha, estado (`En revision` / `Cerrado`), origen (`Auto` / `Manual`) y total de ventas.
  - Estado vacio informativo y accion para "Cargar a mano".
- `CashCloseDetail.jsx` (178 lineas):
  - Vista completa del dia seleccionado con boton de retorno a la lista y recarga.
  - Tarjeta de discrepancias destacada cuando el estado es `revision`, listando los motivos y acciones sugeridas.
  - Desglose de ventas del dia: efectivo, canales bancarios, Diners, tarjeta neto y Pedidos Ya.
  - Arqueo de caja: declarado, contado, esperado y diferencia. Cero calculos financieros en el cliente: todos los valores y diferencias vienen directamente del motor.
- `CashCloseReviewForm.jsx` (235 lineas):
  - Formulario de revision para dias no cerrados. Permite ajustar efectivo contado, netos de tarjetas y observacion.
  - Envia unicamente campos modificados hacia la API.
  - Si el motor retorna 422 con fallas de cuadre, despliega un modal con la lista de fallas y ofrece la opcion de "Cerrar de todas formas" exigiendo un motivo obligatorio de 10 a 300 caracteres (`confirmar: true, forzar: true, motivo: "..."`).
  - Al completar la confirmacion, emite el evento global `ualdo:notifications-updated` para refrescar los avisos en la campana.
- `CashCloseClosedActions.jsx` (167 lineas):
  - Acciones para dias cerrados: modal de "Cargar netos del banco" (guardado idempotente sin reabrir el dia) y modal de "Reabrir el dia" (requiere motivo obligatorio).
- `CashCloseManualForm.jsx` (197 lineas):
  - Formulario para cargar dias antiguos no registrados por RunFood.
  - Si el dia ya existe, detecta 409 y permite saltar directamente al detalle existente.
- `CashMovementsPanel.jsx` (240 lineas):
  - Panel embebido en el detalle diario para registrar ingresos y egresos de efectivo con selector de contraparte, monto y concepto, y lista de movimientos del dia con insignias visuales.

### 2.3 Deep-linking desde Notificaciones y Ajustes
- `src/App.jsx`:
  - `handleNotificationNavigate`: al presionar un aviso de tipo `cierre_caja`, enruta hacia la pestana `negocios`, subvista `cashclose` y propaga los parametros sanitizados (`fecha: "YYYY-MM-DD"`).
  - Al cambiar de pestana o subvista limpia los parametros para evitar estados huerfanos.
- `src/components/EcosystemView.jsx`:
  - Enruta a `CashCloseView` recibiendo `fechaInicial={params?.fecha}` para abrir directamente el detalle del dia notificado.
- `src/components/SettingsView.jsx`:
  - Se elimino el formulario de edicion de Google Sheets con guardado local.
  - Se sustituyo por una tarjeta informativa de solo lectura que documenta que las exportaciones las realiza el motor en cada cierre y provee un boton "Copiar" que copia el Spreadsheet ID al portapapeles sin alert emergente nativo.

### 2.4 Retiro Limpio del Cierre Local Antiguo
- Se elimino el archivo `src/components/DobleFiloCashCloseCard.jsx`.
- Se removieron de `src/services/doblefiloEngine.js`: `executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose` y `syncCashCloseToGoogleSheets`.
- Se removio de `src/services/appEcosystem.js`: la herramienta `doblefilo_cash_close`.
- En `src/services/auth.js`: se limpia de forma transparente la clave legacy `ualdo_cash_close_history` en cada logout sin romper los guardias estaticos.
- `src/services/__tests__/securityGuard.test.js`: se agregaron tokens prohibidos para prevenir regresiones (`executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose`, `syncCashCloseToGoogleSheets`, `ualdo_cash_close_history`, `DobleFiloCashCloseCard`).

---

## 3. Pruebas de Mutacion Verificadas

Se implementaron y ejecutaron 8 pruebas de mutacion reales en el codigo base, comprobando que cada una rompe las aserciones de pruebas automatizadas correspondientes:

| # | Archivo Mutado | Mutacion Introducida | Comando y Resultado | Falla Verificada |
|---|---|---|---|---|
| 1 | `src/services/cashCloseClient.js` | Se comenta la validacion `if (!isValidDate(fecha))` en `getClose`. | `npx vitest run src/services/__tests__/cashCloseClient.test.js` | `AssertionError: expected 404 to be 400` en `no realiza la peticion si la fecha es invalida o no existe` |
| 2 | `src/services/money.js` | Se retorna `'USD 0,00'` en vez de `'Pendiente'` cuando el valor es `null` o `undefined` en `formatUsd`. | `npx vitest run src/services/__tests__/money.test.js` | `AssertionError: expected 'USD 0,00' to be 'Pendiente'` en `devuelve Pendiente para valores null o undefined` |
| 3 | `src/components/cashclose/CashCloseReviewForm.jsx` | Se elimina la condicion `disabled={... \|\| forceReason.trim().length < 10}` del boton "Confirmar y Forzar". | `npx vitest run src/components/cashclose/__tests__/CashCloseReviewForm.test.jsx` | `Error: expect(element).toBeDisabled() - Received element is not disabled` al ingresar 9 caracteres |
| 4 | `src/components/cashclose/CashCloseDetail.jsx` | Se reemplaza `cierre.diferencia_efectivo` por un calculo local `declarado - esperado`. | `npx vitest run src/components/cashclose/__tests__/CashCloseDetail.test.jsx` | `Error: expect(element).not.toBeInTheDocument() - found USD 0,00 instead` en test de valores pendientes y diferencia |
| 5 | `src/components/cashclose/CashCloseClosedActions.jsx` | Se comenta la validacion `if (!hasOne)` en `handleSaveNetos`. | `npx vitest run src/components/cashclose/__tests__/CashCloseClosedActions.test.jsx` | `TestingLibraryElementError: Unable to find an element with the text: /Debes ingresar al menos un valor de neto real/i` |
| 6 | `src/hooks/useCashMovementSubmit.js` | Se genera un nuevo UUID en cada peticion en vez de reutilizar `clientUuidRef.current`. | `npx vitest run src/hooks/__tests__/useCashMovementSubmit.test.js` | `AssertionError: expected 'e71fd984...' to be '6045484b...'` en test de reintento idempotente tras error de red |
| 7 | `src/components/CashCloseView.jsx` | Se omite la comprobacion `!isOwner` en la guardia de renderizado. | `npx vitest run src/components/__tests__/CashCloseView.test.jsx` | `TestingLibraryElementError: Unable to find an element with the text: Solo el dueño puede ver la caja.` |
| 8 | `src/App.jsx` | Se ignora `target.params` y se fija `setNegociosParams(null)` en `handleNotificationNavigate`. | `npx vitest run src/__tests__/App.test.jsx` | `Timeout waiting for '2026-10-05'` al no abrirse el detalle del dia indicado en el aviso |

Todas las mutaciones fueron revertidas tras capturar las fallas.

---

## 4. Evidencia de Calidad y Cobertura

### 4.1 Linteo y Compilacion
- **ESLint:** `npm run lint` -> 0 errores.
- **Build de produccion:** `npm run build` -> Compilacion limpia con Vite en 3.04s (`dist/assets/index-6ZRFP34k.js` 338.74 kB, 0 errores).
- **Control de tokens de estilo:** `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/cashclose` -> 0 coincidencias (100% tokens CSS).
- **Tamano de componentes:** Todos los componentes en `src/components/cashclose/*.jsx` tienen menos de 241 lineas.

### 4.2 Suite Completa de Tests y Cobertura
Ejecucion completa mediante `npx vitest run --coverage`:
- **32 archivos de prueba pasados (100%)**
- **199 tests ejecutados y aprobados (100%)**
- **0 fallas**

#### Tabla Oficial de Cobertura (v8)
```text
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.02 |    83.19 |   76.16 |   96.02 |                   
 components        |   90.54 |    88.46 |   45.45 |   90.54 |                   
  ...CloseView.jsx |   84.44 |    87.09 |   71.42 |   84.44 | 62-69,92-95,97-99 
  ...eFiloCard.jsx |     100 |    93.75 |      80 |     100 | 134-136           
  ...ntoryView.jsx |   82.78 |       80 |      10 |   82.78 | ...,71-73,150-155 
 ...ents/assistant |   91.51 |    70.43 |   83.33 |   91.51 |                   
  ...stantChat.jsx |   78.72 |    86.66 |      60 |   78.72 | ...,65-77,151-159 
  ...ageBubble.jsx |   96.77 |       80 |     100 |   96.77 | 8                 
  ...ctionCard.jsx |   95.65 |       80 |     100 |   95.65 | 17-18,24-25       
  ...acyNotice.jsx |   89.47 |    55.55 |     100 |   89.47 | 12-13,26-27       
  ...tionChips.jsx |     100 |       75 |     100 |     100 | 23                
  ...nversation.js |   98.62 |    59.57 |     100 |   98.62 | 100,119           
 ...ents/cashclose |   96.91 |    84.88 |   69.23 |   96.91 |                   
  ...edActions.jsx |   97.88 |    81.08 |   76.92 |   97.88 | 60-62             
  ...oseDetail.jsx |     100 |    89.28 |   33.33 |     100 | 34,38,94,119,152  
  ...CloseList.jsx |   88.13 |     84.9 |   83.33 |   88.13 | ...07-119,143-144 
  ...anualForm.jsx |     100 |    89.28 |   33.33 |     100 | 81-86             
  ...eviewForm.jsx |   98.52 |    80.28 |     100 |   98.52 | 103-105           
  ...entsPanel.jsx |   97.56 |    86.36 |    64.7 |   97.56 | 88-90,103-104     
 ...ents/inventory |   98.76 |    84.04 |      60 |   98.76 |                   
  ...ntoryList.jsx |     100 |    93.33 |     100 |     100 | 160               
  ...eateModal.jsx |   98.88 |    81.81 |    37.5 |   98.88 | 36-37             
  ...mentModal.jsx |   96.62 |    77.77 |      50 |   96.62 | 109-111,155-157   
  ...toryModal.jsx |     100 |    85.36 |     100 |     100 | ...33,133-136,146 
 .../notifications |    98.7 |    80.35 |      80 |    98.7 |                   
  ...ationItem.jsx |   96.15 |    81.81 |   83.33 |   96.15 | 19-20,61-62       
  ...ionsPanel.jsx |     100 |    79.41 |      75 |     100 | ...29-131,144,208 
 hooks             |    96.1 |    83.44 |   95.65 |    96.1 |                   
  ...mentSubmit.js |     100 |       84 |     100 |     100 | 91-92,100         
  ...entoryList.js |   94.69 |    77.14 |     100 |   94.69 | 51-52,76-79       
  ...mentSubmit.js |   88.42 |       70 |     100 |   88.42 | 13-21,92-93       
  ...ifications.js |     100 |    85.71 |     100 |     100 | 33,35,37,54,66    
  ...nreadCount.js |    97.5 |    96.66 |      80 |    97.5 | 96-98             
 services          |   96.96 |    85.29 |     100 |   96.96 |                   
  ...tantClient.js |     100 |    63.82 |     100 |     100 | ...06-114,131,138 
  auth.js          |   98.07 |    84.84 |     100 |   98.07 | 21-22             
  ...loseClient.js |   90.37 |     92.1 |     100 |   90.37 | ...26-131,171-176 
  ...entsClient.js |     100 |    93.93 |     100 |     100 | 76,104            
  ...toryClient.js |   98.57 |     85.1 |     100 |   98.57 | 36-37             
  money.js         |   96.55 |    95.65 |     100 |   96.55 | 34-35             
  ...tionRoutes.js |   94.44 |    80.76 |     100 |   94.44 | 26-27,54-55,88    
  ...ionsClient.js |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

Todos los archivos implementados en el Brief 15b (`cashCloseClient.js`, `cashMovementsClient.js`, `money.js`, `useCashMovementSubmit.js`, `CashCloseView.jsx` y los 6 componentes en `src/components/cashclose/`) superan el umbral del 80% tanto en sentencias (`% Stmts`) como en bifurcaciones (`% Branch`).

---

## 5. Nota de Despliegue

La PWA compilada consume los endpoints del motor expuestos en `/api/v1/restaurant/cash-close` y `/api/v1/restaurant/cash-movements`. Este cambio se despliega en conjunto con el despliegue a produccion del motor en Coolify (Brief 16).
