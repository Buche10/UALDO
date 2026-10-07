# Resumen de Implementación: Brief 15a

**Rama:** `feat/pwa-inventory-notifications` (creada a partir de `feat/connect-engine`)  
**Repositorio:** `C:\laragon\www\UALDO` (PWA móvil)  
**Fecha:** 2026-10-07  
**Estado:** Pendiente de auditoría

---

## 1. Alcance y Decisiones de Arquitectura

El Brief 15a migra la gestión de inventario y el centro de avisos de la PWA de Ualdo para que consuman exclusivamente la API REST del motor (`UaldoBusiness`), eliminando por completo las llamadas directas desde el cliente a DobleFilo (Vercel) y NexoTeams para operaciones de inventario.

### Decisiones Principales
1. **Punto 13 del Brief (Eliminación de endpoints Vercel y decisión de arquitectura):**
   - Se eliminaron de `src/services/doblefiloEngine.js`: `fetchVercelInventory`, `updateVercelStock`, `getDoblefiloInventory` y `updateDoblefiloStock`.
   - Se eliminaron de `src/services/appEcosystem.js`: las herramientas locales del agente `doblefilo_vercel_get_inventory`, `doblefilo_vercel_update_stock`, `doblefilo_get_inventory` y `doblefilo_update_stock`, así como el import en desuso `executeDoblefiloDetailedCashClose`.
   - Respecto a los endpoints `/inventory/canonical` y `/inventory/reconcile`: en la arquitectura del motor no existen como rutas independientes; la fuente canónica oficial es `GET /inventory` (servida por `inventoryClient.listInventory`), y la consulta de alertas se realiza vía `GET /inventory/alerts` (servida por `inventoryClient.fetchAlerts`). En `doblefiloEngine.js`, `fetchCanonicalInventory` apunta a `/inventory` y `fetchReorderAlerts` a `/inventory/alerts`.
   - Se restauró y preservó intacto el cierre de caja local (`executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose`) en exacta conformidad con `c955b13`.
   - La tarjeta de DobleFilo (`DobleFiloCard.jsx`) presenta un resumen directo del catálogo del motor (`count` y `low_stock_count`) con un botón para navegar fluidamente a la pestaña de Inventario.
2. **Fuente de verdad para Inventario:**
   - La PWA ya no llama a `/mobile/inventory` de NexoTeams. Se reescribió `src/services/inventoryClient.js` usando `apiClient.request` para consultar `GET /inventory`, `GET /inventory/alerts`, `GET /inventory/{id}/movements`, `POST /inventory/{id}/movements` y `POST /inventory/items`.
3. **Idempotencia estricta en movimientos:**
   - En `src/components/inventory/MovementModal.jsx`, el `client_uuid` se genera al abrir el modal mediante `generateClientUuid` (usando `crypto.randomUUID()` o respaldo seguro `crypto.getRandomValues()`, nunca `Date.now()`).
   - Si la petición falla por error de red o timeout, el mismo identificador se preserva en los reintentos. Solo se regenera cuando la operación concluye exitosamente o ante un 409 por conflicto de identificador con otro insumo.
4. **Normalización de cantidades numéricas:**
   - Se implementó `normalizeQuantity` con expresión regular estricta `^\d{1,7}(\.\d{1,3})?$` mayor que 0.
   - Admite la coma como separador decimal (ej. `2,5`) transformándola a punto (`2.5`) y envía siempre el valor como cadena `string` en el payload JSON.
5. **Centro de Avisos y Enrutador Seguro:**
   - `src/services/notificationsClient.js`: Cliente para `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/{id}/read`, `POST /notifications/read-all`, `GET /notifications/preferences` y `PUT /notifications/preferences`. Valida identificadores con formato UUID antes de cualquier llamada HTTP.
   - `src/services/notificationRoutes.js`: Implementa una lista blanca (`ALLOWED_SCREENS`: `inventario`, `pedido`, `pedidos`, `cierre_caja`, `chat`). Sanea estrictamente los parámetros aceptando solo enteros positivos o fechas `YYYY-MM-DD`, bloqueando cualquier inyección de URL o scripts.
   - En `src/components/notifications/NotificationsPanel.jsx`, el cuerpo del mensaje se renderiza como texto plano seguro de React, previniendo cualquier ejecución de etiquetas HTML/XSS.
6. **Sondeo inteligente de avisos (`useUnreadCount`):**
   - Consulta el conteo cada 60 segundos únicamente si `document.visibilityState === 'visible'`.
   - Se suspende cuando la pestaña pasa a segundo plano y se refresca inmediatamente al volver a primer plano.
   - Aplica retroceso exponencial ante errores de red (120s, 240s... hasta 10 min), restaurando el intervalo base de 60s tras el primer éxito.
   - Detiene las consultas al recibir el evento de sesión cerrada `ualdo:unauthorized`.

---

## 2. Archivos Creados y Modificados

### Servicios y Utilidades
- `src/services/inventoryClient.js`: Cliente completo de inventario con validaciones numéricas y formato string.
- `src/services/notificationsClient.js`: Cliente del centro de avisos y preferencias del usuario (`updatePreferences` con validación de lista y categorías).
- `src/services/notificationRoutes.js`: Lista blanca y enrutamiento seguro de avisos.
- `src/services/doblefiloEngine.js`: Eliminación de inventario simulado y preservación del cierre de caja exacto a `c955b13`.
- `src/services/appEcosystem.js`: Retiro de herramientas obsoletas de Vercel y cierre detallado sin uso.
- `src/styles/main.css`: Variables `--error-soft`, `--warning-soft`, `--overlay`.

### Hooks y Componentes
- `src/hooks/useUnreadCount.js`: Hook de sondeo condicional con visibilidad y backoff.
- `src/hooks/useInventoryList.js`: Hook desacoplado para búsqueda debounced, tabs y paginación de inventario.
- `src/hooks/useNotifications.js`: Hook desacoplado para lista de avisos, filtros y marcado como leído.
- `src/components/Header.jsx`: Botón de campana con insignia numérica y estado accesible.
- `src/components/notifications/NotificationsPanel.jsx`: Centro de avisos (<250 líneas) con manejo de error si `markRead` falla.
- `src/components/notifications/NotificationItem.jsx`: Componente item de aviso con estilos y tokens de diseño.
- `src/components/inventory/MovementModal.jsx`: Modal de movimientos con errores 422 por campo, UUID seguro y regeneración ante 409.
- `src/components/inventory/ItemCreateModal.jsx`: Modal de creación de insumos con control de dueño y variables CSS.
- `src/components/inventory/MovementsHistoryModal.jsx`: Historial de kardex con variables CSS.
- `src/components/inventory/InventoryList.jsx`: Componente modular para tarjetas de catálogo y alertas de compra.
- `src/components/InventoryView.jsx`: Vista principal de inventario (<200 líneas) con permisos por rol/capacidad.
- `src/components/DobleFiloCard.jsx`: Vista resumen de insumos del motor sin dependencias de Vercel.
- `src/components/EcosystemView.jsx`: Soporte de sub-vistas para navegación profunda (`inventory`, `cashclose`).
- `src/components/SettingsView.jsx`: Sección de preferencias con validación de sesión previa y envío en formato lista.
- `src/App.jsx`: Integración corregida de `refreshUnreadCount` al iniciar sesión y al cerrar panel.

### Pruebas Unitarias
- `src/services/__tests__/securityGuard.test.js`: Validación de tokens prohibidos (`updateDoblefiloStock`, `getDoblefiloInventory`, etc.) y cero emojis.
- `src/services/__tests__/inventoryClient.test.js`: Pruebas de normalización, endpoints y validaciones de tipos.
- `src/services/__tests__/notificationsClient.test.js`: Pruebas de lista, marcas de lectura, preferencias como lista y validación UUID.
- `src/services/__tests__/notificationRoutes.test.js`: Pruebas de lista blanca y sanitización de parámetros.
- `src/hooks/__tests__/useUnreadCount.test.js`: Pruebas con temporizadores simulados para 60s, `visibilityState`, backoff y desautorización.
- `src/components/inventory/__tests__/MovementModal.test.jsx`: Pruebas de conversión de decimales, reutilización de `client_uuid`, 409 con regeneración de UUID y 422 con errores por campo.
- `src/components/inventory/__tests__/ItemCreateModal.test.jsx`: Pruebas de render, 403 Forbidden y envío exitoso.
- `src/components/notifications/__tests__/NotificationsPanel.test.jsx`: Pruebas de render, escape de XSS, marcado individual, marcado masivo, evasión de lista blanca de punta a punta y fallo en `markRead`.
- `src/components/__tests__/InventoryView.test.jsx`: Pruebas de visibilidad de "Nuevo Insumo" según `capabilities.is_owner`.
- `src/components/__tests__/SettingsView.test.jsx`: Pruebas de carga autenticada, bloqueo sin sesión y formato de lista en el PUT hacia el motor.
- `src/__tests__/App.test.jsx`: Prueba de flujo de login sin TypeError invocando `refreshUnreadCount`.

---

## 3. Pruebas de Mutación Verificadas (Brief 15a original)

### Mutación 1: Omisión de la comprobación de visibilidad de pestaña en el hook de avisos
- **Ubicación:** `src/hooks/useUnreadCount.js`
- **Cambio realizado:** Se comentó la verificación `if (document.visibilityState !== 'visible') return;` en `fetchCount`.
- **Test que falló:** `src/hooks/__tests__/useUnreadCount.test.js > pauses polling when document is hidden`
- **Mensaje de fallo real obtenido:**
  ```text
  AssertionError: expected "getUnreadCount" to not be called at all, but actually been called 1 times
  Received: 1st getUnreadCount call: []
  Number of calls: 1
  ```
- **Conclusión:** La suite detecta si la app realiza peticiones en segundo plano sin que la pestaña esté visible. Revertido satisfactoriamente.

### Mutación 2: Regeneración de UUID en cada reintento de envío de movimiento (rotura de idempotencia)
- **Ubicación:** `src/components/inventory/MovementModal.jsx`
- **Cambio realizado:** Se reemplazó el uso de `clientUuidRef.current` por un nuevo UUID aleatorio generado en cada llamada a `handleSubmit`.
- **Test que falló:** `src/components/inventory/__tests__/MovementModal.test.jsx > reuses the same client_uuid across network retries until success`
- **Mensaje de fallo real obtenido:**
  ```text
  AssertionError: expected '8112cc4f-28db-4caf-9af7-6450f5fa44d0' to be 'ff66e94f-2cbb-4deb-bdfb-12436e2b2649' // Object.is equality
  Expected: "ff66e94f-2cbb-4deb-bdfb-12436e2b2649"
  Received: "8112cc4f-28db-4caf-9af7-6450f5fa44d0"
  ```
- **Conclusión:** El test comprueba con rigor que el identificador es idéntico entre reintentos tras un fallo de red. Revertido satisfactoriamente.

### Mutación 3 (Corregida): Eliminación de la comprobación de lista blanca y default del router
- **Ubicación:** `src/services/notificationRoutes.js`
- **Aclaración de auditoría:** Cambiar únicamente el `default` del switch no hacía fallar los tests porque la comprobación previa `if (!ALLOWED_SCREENS.has(screen)) return null;` cortaba antes. Para verificar la protección de la lista blanca de punta a punta, se requirió retirar simultáneamente la verificación `ALLOWED_SCREENS.has` y cambiar el `default: return { tab: 'asistente', params: cleanParams }`.
- **Test que falló:** `src/components/notifications/__tests__/NotificationsPanel.test.jsx > marks read but does NOT navigate when screen is disallowed (URL or admin)`
- **Mensaje de fallo real obtenido:**
  ```text
  AssertionError: expected "spy" to not be called at all, but actually been called 1 times
  Received: 
    1st spy call:
      Array [
        Object {
          "params": Object {},
          "tab": "asistente",
        },
      ]
  Number of calls: 1
  ```
- **Conclusión:** El panel de avisos valida de punta a punta que una pantalla no autorizada no provoca navegación. Revertido satisfactoriamente.

---

## 4. Corrección 15a_fix: Mutaciones Nuevas y Verificaciones

Se aplicaron las correcciones y se ejecutaron las mutaciones requeridas por el Brief 15a_fix, capturando las salidas reales de la terminal:

### Mutación Fix 1: Enviar mapa `{ [category]: newEnabled }` en lugar de lista en `SettingsView.jsx`
- **Ubicación:** `src/components/SettingsView.jsx:87`
- **Cambio realizado:** Se reemplazó `updatePreferences([{ category, enabled: newEnabled }])` por `updatePreferences({ [category]: newEnabled })`.
- **Tests que fallaron (2 tests):**
  1. `src/components/__tests__/SettingsView.test.jsx > SettingsView component notifications preferences > sends PUT payload with list format [{ category, enabled }] via request`
  2. `src/components/__tests__/SettingsView.test.jsx > SettingsView component notifications preferences > updates switch optimistically and reverts if request fails`
- **Salida real obtenida:**
  ```text
  FAIL  src/components/__tests__/SettingsView.test.jsx
    SettingsView component notifications preferences
      x sends PUT payload with list format [{ category, enabled }] via request
        -> expected "request" to be called with arguments: [ '/notifications/preferences', ... ]
      x updates switch optimistically and reverts if request fails
        -> TestingLibraryElementError: Unable to find an element with the text: /Error guardando preferencias/i

  Test Files  1 failed (1)
  Tests  2 failed | 3 passed (5)
  ```
  *(Nota: Al enviar un objeto tipo mapa `{ pedidos: false }` en vez de un array `[{ category: 'pedidos', enabled: false }]`, el validador cliente `notificationsClient.updatePreferences` rechaza la solicitud retornando 422 antes de la llamada HTTP, provocando el fallo de ambos tests al no coincidir el payload enviado ni el mensaje de error).*

### Mutación Fix 2: Botón "Nuevo Insumo" visible siempre sin validar `capabilities.is_owner`
- **Ubicación:** `src/components/InventoryView.jsx:38`
- **Cambio realizado:** Se reemplazó la validación por `const isOwner = true;`.
- **Test que falló:** `src/components/__tests__/InventoryView.test.jsx > does NOT render "Nuevo Insumo" button when user is regular staff without owner capability`
- **Salida real obtenida:**
  ```text
  FAIL  src/components/__tests__/InventoryView.test.jsx > InventoryView component permissions and actions > does NOT render "Nuevo Insumo" button when user is regular staff without owner capability
  Error: expect(element).not.toBeInTheDocument()
  expected document not to contain element, found <button class="btn-primary" ...><span>Nuevo Insumo</span></button> instead
  ```

### Mutación Fix 3: No regenerar UUID ante 409 por conflicto de identificador con otro insumo
- **Ubicación:** `src/components/inventory/MovementModal.jsx:99`
- **Cambio realizado:** Se comentó la línea `clientUuidRef.current = generateClientUuid();` dentro del bloque de manejo de 409 con mensaje de conflicto.
- **Test que falló:** `src/components/inventory/__tests__/MovementModal.test.jsx > handles 409 conflict when client_uuid was used by another item, displays generic message and generates fresh UUID for next submission`
- **Salida real obtenida:**
  ```text
  FAIL  src/components/inventory/__tests__/MovementModal.test.jsx > MovementModal component > handles 409 conflict when client_uuid was used by another item, displays generic message and generates fresh UUID for next submission
  AssertionError: expected 'f4476859-774b-426c-9eb6-5a2d1a229ea1' not to be 'f4476859-774b-426c-9eb6-5a2d1a229ea1' // Object.is equality
  ```

### Mutación Fix 4: Desestructuración errónea `refresh: refreshUnreadCount` en `App.jsx`
- **Ubicación:** `src/App.jsx:28`
- **Cambio realizado:** Se cambió a `const { unreadCount, refresh: refreshUnreadCount } = useUnreadCount(...)`.
- **Test que falló:** `src/__tests__/App.test.jsx > handles login without throwing TypeError and refreshes unread count`
- **Salida real obtenida:**
  ```text
  Vitest caught 1 unhandled error during the test run.
  TypeError: refreshUnreadCount is not a function
     at handleLoginSuccess src/App.jsx:87:5
  ```

---

## 5. Verificación de Cierre Local Intacto contra `c955b13`

Ejecución de `git diff c955b13 -- src/services/doblefiloEngine.js`:
- Se confirma que las funciones de cierre de caja (`executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose`) permanecen exactamente idénticas a la versión de referencia.
- Únicamente se reflejan las eliminaciones de inventario de Vercel (`fetchVercelInventory`, `updateVercelStock`, `VERCEL_CATALOG`) e inventario mock local (`getDoblefiloInventory`, `updateDoblefiloStock`), además del ajuste de endpoints de inventario del motor.
- La búsqueda de `executeDoblefilo` en el diff no arroja ningún resultado, confirmando 0 modificaciones en la lógica de cuadre financiero.

---

## 6. Resultados Anteriores de la Suite (15a_fix)

```text
> npm run lint
0 errors, 65 warnings (warnings correspondientes a variables y hooks sin usar en vistas no modificadas).

> npm test
Test Files  17 passed (17)
Tests       100 passed (100)

> npm run build
vite v5.4.21 building for production...
[OK] 1613 modules transformed.
dist/index.html 1.13 kB
dist/assets/index-BRhqXTuR.js 298.80 kB
built in 2.42s
```

---

## 7. Corrección 15a_fix2 y 15a_fix3: Cobertura Real, Colores de Marca y Evidencia Verificable

Se implementaron todos los requisitos del Brief 15a_fix2 y 15a_fix3 en la rama `feat/pwa-inventory-notifications`:

*(Nota sobre formato: Todas las salidas de comandos se presentan en texto plano estándar sin emojis ni símbolos de terminal (visto bueno, flechas o aspas), sustituidos por [ok] y [x]).*

### 1. Inclusión de Cobertura en `vite.config.js` y Resultados v8
Se incluyeron en `coverage.include` de `vite.config.js` todos los archivos de servicios, hooks y componentes de inventario y notificaciones correspondientes al 15a, excluyendo `**/__tests__/**`.

Todos los archivos del 15a superan el umbral objetivo (>= 80 % en sentencias y >= 70 % en ramas):

```text
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   95.86 |    80.43 |   77.67 |   95.86 |                   
 components        |   92.19 |    89.36 |   33.33 |   92.19 |                   
  ...eFiloCard.jsx |     100 |    93.75 |      80 |     100 | 134-136           
  ...ntoryView.jsx |   82.78 |       80 |      10 |   82.78 | ...,71-73,150-155 
 ...ents/assistant |   91.51 |    70.43 |   83.33 |   91.51 |                   
  ...stantChat.jsx |   78.72 |    86.66 |      60 |   78.72 | ...,65-77,151-159 
  ...ageBubble.jsx |   96.77 |       80 |     100 |   96.77 | 8                 
  ...ctionCard.jsx |   95.65 |       80 |     100 |   95.65 | 17-18,24-25       
  ...acyNotice.jsx |   89.47 |    55.55 |     100 |   89.47 | 12-13,26-27       
  ...tionChips.jsx |     100 |       75 |     100 |     100 | 23                
  ...nversation.js |   98.62 |    59.57 |     100 |   98.62 | 100,119           
 ...ents/inventory |   98.76 |    84.04 |      60 |   98.76 |                   
  ...ntoryList.jsx |     100 |    93.33 |     100 |     100 | 160               
  ...eateModal.jsx |   98.88 |    81.81 |    37.5 |   98.88 | 36-37             
  ...mentModal.jsx |   96.62 |    77.77 |      50 |   96.62 | 109-111,155-157   
  ...toryModal.jsx |     100 |    85.36 |     100 |     100 | ...33,133-136,146 
 .../notifications |   96.76 |    82.35 |      80 |   96.76 |                   
  ...ationItem.jsx |   90.38 |    88.88 |   83.33 |   90.38 | 13-20,61-62       
  ...ionsPanel.jsx |     100 |    78.78 |      75 |     100 | ...29-131,144,208 
 hooks             |   95.22 |    83.33 |   94.44 |   95.22 |                   
  ...entoryList.js |   94.69 |    77.14 |     100 |   94.69 | 51-52,76-79       
  ...mentSubmit.js |   88.42 |       70 |     100 |   88.42 | 13-21,92-93       
  ...ifications.js |     100 |    85.71 |     100 |     100 | 33,35,37,54,66    
  ...nreadCount.js |    97.5 |    96.66 |      80 |    97.5 | 96-98             
 services          |    98.4 |    80.11 |     100 |    98.4 |                   
  ...tantClient.js |     100 |    63.82 |     100 |     100 | ...06-114,131,138 
  auth.js          |   97.93 |     87.5 |     100 |   97.93 | 19-20             
  ...toryClient.js |   98.57 |     85.1 |     100 |   98.57 | 36-37             
  ...tionRoutes.js |   94.44 |    80.76 |     100 |   94.44 | 26-27,54-55,88    
  ...ionsClient.js |     100 |    94.73 |     100 |     100 | 29                
-------------------|---------|----------|---------|---------|-------------------
```

### 2. Descomposición y Límites de Archivos (< 250 líneas)
Se extrajo la lógica de envío de movimientos de `MovementModal.jsx` al hook `src/hooks/useMovementSubmit.js` (105 líneas), reduciendo `MovementModal.jsx` a 211 líneas.

Conteo de líneas (`wc -l`):
- `src/components/inventory/InventoryList.jsx`: 165 líneas
- `src/components/inventory/ItemCreateModal.jsx`: 210 líneas
- `src/components/inventory/MovementModal.jsx`: 211 líneas
- `src/components/inventory/MovementsHistoryModal.jsx`: 180 líneas
- `src/components/notifications/NotificationItem.jsx`: 120 líneas
- `src/components/notifications/NotificationsPanel.jsx`: 248 líneas
- `src/components/InventoryView.jsx`: 190 líneas
- `src/hooks/useMovementSubmit.js`: 105 líneas

### 3. Tokens de Marca y Eliminación Total de Colores Crudos
Se agregaron y normalizaron en `src/styles/main.css` los tokens de marca:
- `--on-primary: #ffffff;`
- `--chip-bg: rgba(32, 45, 47, 0.6);`
- `--surface-soft: rgba(32, 45, 47, 0.5);`
- `--surface-strong: rgba(32, 45, 47, 0.8);`
- `--success-soft: rgba(16, 185, 129, 0.15);`
- `--error-soft-strong: rgba(244, 63, 94, 0.15);`

Se sustituyeron todos los colores hexadecimales y rgba directos en componentes de inventario y notificaciones (`MovementsHistoryModal.jsx` incluido) por variables CSS.

Salida real del comando de verificación:
```text
$ grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/notifications src/components/inventory src/components/InventoryView.jsx; echo "exit=$?"
exit=1
```

### 4. Limpieza de Código Muerto y Guardia de Seguridad
- Se eliminaron las funciones en desuso `fetchCanonicalInventory` y `fetchReorderAlerts` de `src/services/doblefiloEngine.js` e importaciones sin usar.
- Se eliminaron los mocks innecesarios de `DobleFiloCard.test.jsx`.
- Se añadieron `fetchCanonicalInventory` y `fetchReorderAlerts` a la lista de tokens prohibidos de `src/services/__tests__/securityGuard.test.js`.

### 5. Nota de Correcciones Realizadas en 15a_fix3
1. **Colores en `MovementsHistoryModal.jsx`:** Reemplazados los 4 valores `rgba` restantes en las líneas 108, 122 y 163 por `--surface-soft`, `--success-soft`, `--error-soft-strong` y `--chip-bg`.
2. **Valor de `--success-soft`:** Corregido el valor documentado a `rgba(16, 185, 129, 0.15)` en estricta concordancia con `src/styles/main.css`.
3. **Test de Paginación y Mutación 3 (`useNotifications`):** Se adaptó el test con `mockResolvedValueOnce` para simular con precisión la página 2 (`meta.current_page = 2, last_page = 3`) y comprobar que al cambiar el filtro a `inventario` la lista contiene exclusivamente los avisos de la página 1 sin mezclar los de la página 2. Con ello, la regresión realista `loadNotifications(meta.current_page, false)` falla determinísticamente solicitando la página 2.

### 6. Pruebas de Mutación Verificadas

#### Mutación 1: Eliminación del debounce de 300 ms en la búsqueda de inventario
- **Ubicación:** `src/hooks/useInventoryList.js:28`
- **Cambio realizado:** Disparo inmediato del cambio de estado `debouncedSearch` ignorando el timer del debounce.
- **Test que falló:** `src/hooks/__tests__/useInventoryList.test.js > debounces search by 300 ms and triggers a single request on fast typing`
- **Salida real obtenida:**
  ```text
  FAIL  src/hooks/__tests__/useInventoryList.test.js > useInventoryList hook > debounces search by 300 ms and triggers a single request on fast typing
  AssertionError: expected "listInventory" to be called 1 times, but got 4 times
  ```

#### Mutación 2 / Mutación B: Reemplazo en lugar de acumulación al paginar en `MovementsHistoryModal.jsx`
- **Ubicación:** `src/components/inventory/MovementsHistoryModal.jsx:28`
- **Cambio realizado:** Se reemplazó `append ? [...prev, ...list] : list` por `list`.
- **Test que falló:** `src/components/inventory/__tests__/MovementsHistoryModal.test.jsx > appends next page items when "Cargar más" is clicked`
- **Salida real obtenida:**
  ```text
  FAIL  src/components/inventory/__tests__/MovementsHistoryModal.test.jsx > MovementsHistoryModal component > appends next page items when "Cargar más" is clicked
  TestingLibraryElementError: Unable to find an element with the text: /Movimiento inicial pag 1/i.
  ```

#### Mutación 3 / Mutación A: Recargar con `meta.current_page` al cambiar de categoría en `useNotifications.js`
- **Ubicación:** `src/hooks/useNotifications.js:42`
- **Cambio realizado:** En el efecto que recarga avisos al cambiar filtros, se cambió `loadNotifications(1, false)` por `loadNotifications(meta.current_page, false)`.
- **Test que falló:** `src/hooks/__tests__/useNotifications.test.js > useNotifications hook > resets page to 1 when category filter changes`
- **Salida real obtenida:**
  ```text
  FAIL  src/hooks/__tests__/useNotifications.test.js > useNotifications hook > resets page to 1 when category filter changes
  AssertionError: expected last "listNotifications" call to have been called with [ { unread: null, ...(2) } ]

  - Expected
  + Received

    Array [
      Object {
        "category": "inventario",
  -     "page": 1,
  +     "page": 2,
        "unread": null,
      },
    ]
  ```

#### Mutación 4: Renderizar `category` crudo ignorando `label` del motor en `SettingsView.jsx`
- **Ubicación:** `src/components/SettingsView.jsx:137`
- **Cambio realizado:** Se reemplazó `{p.label || p.category}` por `{p.category}`.
- **Test que falló:** `src/components/__tests__/SettingsView.test.jsx > loads preferences using real engine contract and displays engine labels`
- **Salida real obtenida:**
  ```text
  FAIL  src/components/__tests__/SettingsView.test.jsx > SettingsView component notifications preferences > loads preferences using real engine contract and displays engine labels
  TestingLibraryElementError: Unable to find an accessible element with the role "switch" and name /Desactivar avisos de Pedidos internos/i
  ```

#### Mutación 5: Inyección de función prohibida `fetchCanonicalInventory` en archivo fuente
- **Ubicación:** `src/services/temp_leak.js`
- **Cambio realizado:** Se creó temporalmente `export const fetchCanonicalInventory = () => {};`.
- **Test que falló:** `src/services/__tests__/securityGuard.test.js > Security Guard - Comprehensive Codebase Scan > scans all src files recursively and confirms zero forbidden tokens`
- **Salida real obtenida:**
  ```text
  FAIL  src/services/__tests__/securityGuard.test.js > Security Guard - Comprehensive Codebase Scan > scans all src files recursively and confirms zero forbidden tokens
  AssertionError: File src/services\temp_leak.js contains forbidden security token: "fetchCanonicalInventory": expected true to be false
  - Expected: false
  + Received: true
  ```

### 7. Verificación Final de Calidad
- **ESLint:** 0 errores, 63 advertencias (todas en módulos preexistentes ajenos al Brief 15a).
- **Vitest:** 21 archivos de prueba aprobados (123 tests en verde).
- **Vite Build:** Compilación limpia para producción en `dist/`.
- **Estado:** Pendiente de auditoría.


