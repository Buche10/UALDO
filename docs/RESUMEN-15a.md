# Resumen de Implementación: Brief 15a

**Rama:** `feat/pwa-inventory-notifications` (creada a partir de `feat/connect-engine`)  
**Repositorio:** `C:\laragon\www\UALDO` (PWA móvil)  
**Fecha:** 2026-10-07  
**Estado:** Aprobado / Completo

---

## 1. Alcance y Decisiones de Arquitectura

El Brief 15a migra la gestión de inventario y el centro de avisos de la PWA de Ualdo para que consuman exclusivamente la API REST del motor (`UaldoBusiness`), eliminando por completo las llamadas directas desde el cliente a DobleFilo (Vercel) y NexoTeams para operaciones de inventario.

### Decisiones Principales
1. **Punto 13 del Brief (Eliminación de endpoints Vercel):**
   - Se eliminaron de `src/services/doblefiloEngine.js`: `fetchVercelInventory` y `updateVercelStock`.
   - Se eliminaron de `src/services/appEcosystem.js`: las herramientas locales del agente `doblefilo_vercel_get_inventory` y `doblefilo_vercel_update_stock`.
   - Se mantuvo intacto el cierre de caja local y su sincronización a Google Sheets (`syncCashCloseToGoogleSheets`), así como el estado de mesas para POS local.
   - La tarjeta de DobleFilo (`DobleFiloCard.jsx`) ahora presenta un resumen directo del catálogo del motor (`count` y `low_stock_count`) con un botón para navegar fluidamente a la pestaña de Inventario.
2. **Fuente de verdad para Inventario:**
   - La PWA ya no llama a `/mobile/inventory` de NexoTeams. Se reescribió `src/services/inventoryClient.js` usando `apiClient.request` para consultar `GET /inventory`, `GET /inventory/alerts`, `GET /inventory/{id}/movements`, `POST /inventory/{id}/movements` y `POST /inventory/items`.
3. **Idempotencia estricta en movimientos:**
   - En `src/components/inventory/MovementModal.jsx`, el `client_uuid` se genera una única vez al abrir el modal mediante `crypto.randomUUID()`.
   - Si la petición falla por error de red o timeout, el mismo identificador se preserva en los reintentos. Solo se regenera cuando la operación concluye exitosamente (201 Created o 200 OK idempotente) o cuando el modal se reabre.
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
   - Aplica retroceso exponencial (*exponential backoff*) ante errores de red (120s, 240s... hasta 10 min), restaurando el intervalo base de 60s tras el primer éxito.
   - Detiene las consultas al recibir el evento de sesión cerrada `ualdo:unauthorized`.

---

## 2. Archivos Creados y Modificados

### Servicios y Utilidades
- `src/services/inventoryClient.js`: Cliente completo de inventario con validaciones numéricas y formato string.
- `src/services/notificationsClient.js`: Cliente del centro de avisos y preferencias del usuario.
- `src/services/notificationRoutes.js`: Lista blanca y enrutamiento seguro de avisos.
- `src/services/doblefiloEngine.js`: Eliminación de escrituras a Vercel.
- `src/services/appEcosystem.js`: Retiro de herramientas obsoletas de Vercel.

### Hooks y Componentes
- `src/hooks/useUnreadCount.js`: Hook de sondeo condicional con visibilidad y backoff.
- `src/components/Header.jsx`: Botón de campana con insignia numérica (hasta `99+`), estado accesible y colores corporativos.
- `src/components/notifications/NotificationsPanel.jsx`: Centro de avisos con filtros por categoría y sin leer, lectura individual y masiva.
- `src/components/inventory/MovementModal.jsx`: Modal de registro de movimientos con idempotencia (`client_uuid`) y conversión de coma a punto.
- `src/components/inventory/ItemCreateModal.jsx`: Modal de creación de insumos para propietarios con manejo de 403.
- `src/components/inventory/MovementsHistoryModal.jsx`: Historial de kardex paginado.
- `src/components/InventoryView.jsx`: Descompuesto en componentes modulares con tabs ("Todos", "Stock Bajo", "Alertas") y búsqueda debounced.
- `src/components/DobleFiloCard.jsx`: Vista resumen de insumos del motor sin dependencias de Vercel.
- `src/components/EcosystemView.jsx`: Soporte de sub-vistas para navegación profunda (`inventory`, `cashclose`).
- `src/components/SettingsView.jsx`: Sección de preferencias de avisos con interruptores de categoría y nota de avisos críticos.
- `src/App.jsx`: Integración del hook `useUnreadCount`, modal `NotificationsPanel` y enrutador contextual.

### Pruebas Unitarias
- `src/services/__tests__/securityGuard.test.js`: Validación de tokens prohibidos y cero emojis.
- `src/services/__tests__/inventoryClient.test.js`: Pruebas de normalización, endpoints y validaciones de tipos.
- `src/services/__tests__/notificationsClient.test.js`: Pruebas de lista, marcas de lectura, preferencias y validación UUID.
- `src/services/__tests__/notificationRoutes.test.js`: Pruebas de lista blanca y sanitización de parámetros.
- `src/hooks/__tests__/useUnreadCount.test.js`: Pruebas con temporizadores simulados para 60s, `visibilityState`, backoff y desautorización.
- `src/components/inventory/__tests__/MovementModal.test.jsx`: Pruebas de conversión de decimales, reutilización de `client_uuid` en reintentos, 409 y 200 idempotente.
- `src/components/inventory/__tests__/ItemCreateModal.test.jsx`: Pruebas de render, 403 Forbidden y envío exitoso.
- `src/components/notifications/__tests__/NotificationsPanel.test.jsx`: Pruebas de render, escape de XSS, marcado individual y masivo.
- `src/components/__tests__/SettingsView.test.jsx`: Pruebas de conmutación de preferencias con rollback.

---

## 3. Pruebas de Mutación Verificadas

Para garantizar que los tests validan comportamientos de seguridad y negocio esenciales (y no pasan por casualidad), se aplicaron y comprobaron 3 mutaciones reales:

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

### Mutación 3: Permitir pantallas fuera de la lista blanca en el enrutador de avisos
- **Ubicación:** `src/services/notificationRoutes.js`
- **Cambio realizado:** En el bloque `default` del switch se devolvió `{ tab: screen, params: cleanParams }` en vez de `null`, permitiendo navegar a pantallas no reconocidas.
- **Test que falló:** `src/services/__tests__/notificationRoutes.test.js > rejects disallowed screens returning null`
- **Mensaje de fallo real obtenido:**
  ```text
  AssertionError: expected { tab: 'external_url', params: {} } to be null
  - Expected: null
  + Received: Object { "params": Object {}, "tab": "external_url" }
  ```
- **Conclusión:** La lista blanca rechaza cualquier intento de redirección no autorizada. Revertido satisfactoriamente.

---

## 4. Resultados de Verificación y Cobertura

- **Pruebas Unitarias (Vitest):**
  - **15 archivos de prueba ejecutados**, **90 pruebas pasadas** (100% de éxito).
- **ESLint:**
  - `0 errors, 74 warnings` (warnings preexistentes de dependencias de hooks y variables no utilizadas en componentes legacy).
- **Vite Build (`npm run build`):**
  - Compilación exitosa en 11.83s, generando los bundles en `dist/`.
- **Seguridad y Cero Emojis:**
  - `src/services/__tests__/securityGuard.test.js` verificado en verde. Cero emojis en código fuente, comentarios o textos de UI. Cero tokens prohibidos de Vercel/NexoTeams.
- **Cobertura de Código (v8):**
  - Servicios de inventario (`inventoryClient.js`): **98.05%** de sentencias, **87.87%** de ramas, **100%** de funciones.
  - Servicios de avisos (`notificationsClient.js`): **100%** de sentencias, ramas y funciones.
  - Enrutador de avisos (`notificationRoutes.js`): **100%** de sentencias y líneas.
  - Hook de avisos (`useUnreadCount.js`): **92.68%** de sentencias, **100%** de funciones.
  - Componente de movimientos (`MovementModal.jsx`): **87.02%** de sentencias, **82.14%** de ramas.
  - Componente de avisos (`NotificationsPanel.jsx`): **87.23%** de sentencias.
