# Brief 15a: PWA con el inventario y el centro de avisos del motor, sin escrituras a Vercel

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2, Testing Library, ESLint 9,
`lucide-react` para íconos). Rama actual `feat/connect-engine`. Crea la rama `feat/pwa-inventory-notifications`
desde ahí. Este brief **no toca** el repo del motor (`C:\laragon\www\UaldoBusiness`): solo léelo para conocer
los contratos.

**Decisión del dueño del producto (2026-10-05 y 2026-10-06):**
- **El motor (UaldoBusiness) es la fuente de verdad** del inventario, de los pedidos internos y de las alertas.
- La PWA debe dejar de usar NexoTeams para eso y **no escribir en DobleFilo (Vercel)** desde el teléfono. El motor
  ya replica a DobleFilo del lado del servidor.
- **Todos los avisos llegan por el centro de notificaciones de la app** (nada de Telegram).

**Estado actual de la PWA (verificado por el auditor):**
- **`src/services/apiClient.js`:**
  - `request(path, options)` llama al motor.
  - La URL viene de los ajustes (`apiBaseUrl`) y en producción exige HTTPS.
  - Usa el token Bearer (`ualdo_token`) y un timeout de 10 s.
  - Ante un 401 limpia la sesión y emite `ualdo:unauthorized`.
  - Devuelve `{ ok, status, data, error, isNetworkError }`.
  - **Úsalo para todo lo nuevo.**
- **`src/services/inventoryClient.js`:** usa **NexoTeams** (`teamsRequest('/mobile/inventory'...)`). Lo usa
  `src/components/InventoryView.jsx` (682 líneas), dentro de `EcosystemView` (pestaña "Negocios").
- **`src/services/doblefiloEngine.js`:**
  - Lee y **escribe** stock en `https://doblefilo.vercel.app`, con `fetchVercelInventory` y `updateVercelStock`.
  - Tiene tablas y menú de prueba.
  - Hace el cierre de caja local y `syncCashCloseToGoogleSheets`.
  - Incluye `fetchCanonicalInventory`, `fetchReorderAlerts` y `triggerInventoryReconciliation`.
- **`src/services/appEcosystem.js`:** expone las herramientas locales `doblefilo_vercel_get_inventory` y
  **`doblefilo_vercel_update_stock`**. Las usa `EcosystemView` mediante `executeLocalTool`.
- **`src/components/DobleFiloCard.jsx`** importa `fetchVercelInventory` y `updateVercelStock`.
- **Navegación:**
  - `App.jsx` tiene 4 pestañas (`BottomNav`): Trabajo (tareas de NexoTeams), Negocios, Asistente y Ajustes.
  - `Header.jsx` muestra el estado del nodo.
  - **No hay centro de avisos.**
- **`src/services/__tests__/securityGuard.test.js`:** prohíbe tokens peligrosos y emojis en `src/`.
- **Calidad:** 46 tests en verde. Existe `npm run lint`, y `@vitest/coverage-v8` está instalado.

**Contratos del motor que se consumen** (léelos completos en el repo del motor):
- **Inventario:** `C:\laragon\www\UaldoBusiness\docs\API-inventory.md`.
  - `GET /api/v1/inventory`: filtros y paginación según la sección 2.1. Respuesta
    `{items, meta: {current_page, last_page, per_page, total}, totals: {count, low_stock_count}}`.
  - `GET /api/v1/inventory/alerts`: `{alerts: [{id, name, unit, stock, min_stock, reorder_point, suggested_qty}], count}`.
  - `GET /api/v1/inventory/{item}/movements`: paginado de 30 en 30.
  - **`POST /api/v1/inventory/{item}/movements`:**
    - Cuerpo `{kind: entrada|salida|conteo|merma, quantity, reason, client_uuid, location?}`, con hasta 3
      decimales.
    - Responde 201 si es nuevo y 200 `idempotent` si es un reintento.
    - Responde **409** por stock insuficiente, y también si el `client_uuid` ya se usó en otro insumo.
    - Responde 422 si la validación falla.
  - `POST /api/v1/inventory/items`: **solo el dueño**; el personal recibe 403.
- **Avisos:** `C:\laragon\www\UaldoBusiness\docs\API-notifications.md`.
  - `GET /api/v1/notifications?unread=1&category=` (paginado de 20) devuelve
    `{data: [{id, category, priority, title, body, action: {screen, params}, read_at, created_at}], meta}`.
  - `GET /api/v1/notifications/unread-count` devuelve `{count}`.
  - `POST /api/v1/notifications/{id}/read`.
  - `POST /api/v1/notifications/read-all`, con `category` opcional.
  - `GET` y `PUT /api/v1/notifications/preferences`. El `PUT` recibe `{preferences: [{category, enabled}]}` y la
    respuesta trae `critical_always_enabled`.
  - Categorías: `pedidos`, `inventario`, `caja` y `sistema`. Prioridades: `info`, `warning` y `critical`.
  - **Pantallas (lista blanca):** `pedidos`, `pedido`, `inventario`, `cierre_caja` y `chat`.
- **Usuario:** `/me` devuelve `user.capabilities.is_owner` y `user.role`.

**Lee primero:** `docs/ualdo-brand.md` (marca Ualdo: paleta con variables CSS, Poppins, botones pastilla, tono),
`src/services/apiClient.js`, `src/services/auth.js`, `src/App.jsx`, `src/components/Header.jsx`,
`src/components/EcosystemView.jsx`, `src/components/InventoryView.jsx`, `src/components/DobleFiloCard.jsx`,
`src/services/doblefiloEngine.js`, `src/services/appEcosystem.js`, `src/components/SettingsView.jsx` y
`src/services/__tests__/securityGuard.test.js`.

## Objetivo

Que el dueño y el personal vean y muevan el inventario **del motor** desde la app, con las mismas reglas que el
servidor (decimales, idempotencia, stock insuficiente y alta solo para el dueño). Que el dueño reciba y gestione sus
avisos en un centro de notificaciones dentro de la app. Y que la PWA ya no lea ni escriba inventario en Vercel ni en
NexoTeams.

## Requerimientos

### Parte A: inventario del motor

1. **Reescribe `src/services/inventoryClient.js` sobre `request`** del `apiClient`, sin `teamsRequest`:
   - `listInventory({ search, page, ...filtros })`, con los filtros que documente la sección 2.1 de
     `API-inventory.md`.
   - `fetchAlerts()`.
   - `fetchMovements(itemId, page)`.
   - `registerMovement(itemId, { kind, quantity, reason, location }, clientUuid)`.
   - `createItem(data)`.
   - Codifica los parámetros con `URLSearchParams` y nunca concatena texto del usuario en la ruta: el `itemId` debe
     ser un entero, y se valida.
2. **Cantidades:**
   - La entrada se valida con `^\d{1,7}(\.\d{1,3})?$`, mayor que 0. Se acepta la coma como separador decimal y se
     convierte a punto.
   - **Se envían como texto** (`"2.5"`), nunca como número calculado en JavaScript.
   - El stock se muestra con hasta 3 decimales y la unidad.
3. **Idempotencia:**
   - Al abrir el formulario de movimiento, se genera un `client_uuid` con `crypto.randomUUID()`.
   - Se **reutiliza el mismo** en cada reintento: tras un error de red o un timeout, el usuario vuelve a tocar
     "Registrar".
   - Se genera uno nuevo solo tras un 201 o un 200 `idempotent`.
   - Un 200 `idempotent` se muestra como éxito ("Ya estaba registrado").
4. **Errores:**
   - 409 por stock insuficiente: muestra el mensaje del servidor.
   - 409 por un `client_uuid` de otro insumo: muestra un error genérico, regenera el uuid y lo deja registrado en
     consola **sin datos**.
   - 422: muestra los errores por campo.
   - 403: "Solo el dueño puede crear insumos."
   - Error de red: "Sin conexión. Tu movimiento no se registró; vuelve a intentarlo."
   - No hay cola offline en este brief.
5. **`InventoryView`:**
   - Usa el cliente nuevo.
   - Pestañas "Todos", "Stock bajo" y "Alertas" (con `suggested_qty`).
   - Búsqueda con espera de 300 ms antes de consultar.
   - Paginación con "Cargar más".
   - Historial de movimientos por insumo.
   - El botón "Nuevo insumo" **solo se muestra** si `user.capabilities.is_owner`, y el servidor igual lo valida.
   - Etiquetas de los tipos: Entrada, Salida, Conteo y Merma.
   - **Divide el archivo**, que hoy tiene 682 líneas: el listado, el formulario de movimiento, el formulario de alta
     y el historial van en componentes de menos de 250 líneas cada uno, dentro de `src/components/inventory/`.
6. **Quita la dependencia de NexoTeams del inventario:** ninguna llamada a `/mobile/inventory` en `src/`.

### Parte B: centro de avisos

7. **`src/services/notificationsClient.js`**, sobre `request`, con:
   - `listNotifications({ unread, category, page })` y `getUnreadCount()`.
   - `markRead(id)` y `markAllRead(category)`.
   - `getPreferences()` y `updatePreferences(preferences)`.
   - El `id` es un UUID y se valida antes de construir la ruta.
8. **Campana en `Header.jsx`:**
   - Un ícono de `lucide-react` (`Bell`) con una insignia del número sin leer (`99+` como máximo).
   - Solo se muestra con la sesión iniciada.
   - Al tocarla, abre el panel de avisos.
   - **Hook `useUnreadCount`:**
     - Consulta `unread-count` cada 60 s, **solo si la pestaña está visible** (`document.visibilityState`).
     - Refresca al volver a primer plano y tras marcar como leído.
     - Ante errores de red duplica el intervalo hasta 10 min, y vuelve a 60 s al primer éxito.
     - Se detiene con `ualdo:unauthorized` y limpia los temporizadores al desmontarse.
9. **`src/components/notifications/NotificationsPanel.jsx`** (panel o vista completa, según `ualdo-brand.md`):
   - **Lista:** más reciente primero, con "Cargar más", y los filtros "Sin leer" y por categoría.
   - **Prioridad:** cada aviso muestra su estilo con las **variables CSS de la marca** (por ejemplo, borde
     izquierdo o etiqueta), y `critical` destaca claramente. No uses colores sueltos.
   - **Texto:** el título y el cuerpo se muestran **como texto plano** (React ya escapa; nunca
     `dangerouslySetInnerHTML`), con la fecha relativa en español ("hace 5 min").
   - **Al tocar un aviso:**
     1. Lo marca como leído.
     2. Navega según la lista blanca, **también en el cliente**, con `src/services/notificationRoutes.js`:
        - `inventario`: pestaña Negocios, vista Inventario.
        - `pedido` y `pedidos`: pestaña Asistente. Hoy no hay pantalla de pedidos; el asistente los consulta.
        - `cierre_caja`: pestaña Negocios, vista Caja. La revisión del cierre llega en el 15b.
        - `chat`: pestaña Asistente.
        - Cualquier otra pantalla: no navega.
     3. Los `params` solo se leen si son enteros o fechas `aaaa-mm-dd`. **Nunca se abre una URL** venida de un
        aviso.
   - Botón "Marcar todas como leídas" (por la categoría filtrada, si hay una).
   - Estados vacío, cargando y error, con reintento.
10. **Navegación entre vistas:** hoy `EcosystemView` decide internamente qué mostrar.
    - Agrega un mecanismo simple para que `App` abra Negocios en una subvista concreta: por ejemplo, un estado
      `negociosView` ("inventario" o "caja") que se pasa como prop.
    - Sin librerías de rutas nuevas.
11. **Preferencias en `SettingsView`:**
    - Sección "Avisos" con un interruptor por categoría (con las etiquetas que devuelve el motor) y la nota "Los
      avisos críticos llegan siempre".
    - Guarda con `PUT`. Si falla, revierte el interruptor y muestra el error.

### Parte C: sin escrituras a Vercel ni inventario duplicado

12. **Elimina:**
    - `updateVercelStock` y `fetchVercelInventory` de `doblefiloEngine.js`.
    - Las herramientas `doblefilo_vercel_get_inventory` y `doblefilo_vercel_update_stock` de `appEcosystem.js`.
    - Su uso en `DobleFiloCard.jsx`. La sección de inventario de esa tarjeta pasa a mostrar el resumen del
      inventario **del motor** (total y bajo stock, con `totals`) y un botón "Ver inventario".
13. **`fetchCanonicalInventory`, `fetchReorderAlerts` y `triggerInventoryReconciliation`:**
    - Comprueba contra `routes/api.php` del motor si los endpoints que llaman existen.
    - Si no existen, elimínalos junto con su uso.
    - Si existen, cámbialos al `apiClient`.
    - Anota la decisión en `docs/RESUMEN-15a.md`.
14. **No toques**, que es alcance del 15b, después del cierre automático del motor:
    - `CashCloseView`, `DobleFiloCashCloseCard` y `cashCloseClient`.
    - `syncCashCloseToGoogleSheets` y el cierre local.
    - Tampoco las tareas de la pestaña Trabajo (NexoTeams), el chat ni el login.
15. **Guardia:** agrega a `securityGuard.test.js` los tokens prohibidos `updateVercelStock`,
    `fetchVercelInventory`, `doblefilo_vercel_update_stock`, `doblefilo_vercel_get_inventory` y `/mobile/inventory`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, tests, datos de prueba o nombres de archivo. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`: paleta con variables CSS, Poppins, botones pastilla y tono claro y breve en
  español con tildes. Sin colores ni fuentes sueltos.
- **Seguridad:**
  - Todo pasa por `apiClient` (Bearer y HTTPS en producción).
  - Ningún texto del servidor se interpreta como HTML ni como URL.
  - Los ids se validan antes de construir rutas, y los parámetros se codifican.
  - Sin secretos en el código.
  - No guardes avisos ni inventario en `localStorage`.
- **Accesibilidad:**
  - La campana tiene `aria-label` ("Avisos, 3 sin leer").
  - Los interruptores y botones se pueden usar con teclado.
  - Contraste según la marca.
- **Rendimiento:** el contador solo consulta con la pestaña visible, hay una espera antes de buscar, se pagina, y
  todos los temporizadores se limpian.
- **Diseño:** componentes de menos de 250 líneas, hooks para la lógica (`useUnreadCount`, `useInventoryList` y
  `useNotifications`), funciones de menos de 50 líneas y sin mutaciones de estado.
- Sin dependencias nuevas.

## Tests

Usa Vitest con Testing Library (`fetch` simulado, temporizadores falsos donde haga falta).

**Regla para todos:** cada test debe **fallar** si se revierte la protección que cubre. Verifícalo con una mutación
(revierte, ejecuta, restaura) y anota cada una en `docs/RESUMEN-15a.md`: archivo, cambio, test que falla y mensaje.
El auditor repetirá las mutaciones: en el brief anterior se registraron mutaciones que no lo eran. **No inventes
resultados.**

1. **`inventoryClient`:**
   - Las rutas y los parámetros se codifican.
   - Un `itemId` no entero se rechaza sin hacer la petición.
   - `quantity` viaja como texto.
2. **Formulario de movimiento:**
   - "2,5" se envía como "2.5"; 0, negativos y 4 decimales no se envían.
   - **Tras un error de red, el reintento usa el mismo `client_uuid`**, y tras un 201 el siguiente movimiento usa
     uno nuevo. Mutación: generar un uuid nuevo en cada envío.
   - Un 409 muestra el mensaje del servidor y un 200 `idempotent` muestra éxito.
3. **Alta de insumos:** el botón no aparece para el personal y sí para el dueño. Un 403 muestra su mensaje.
4. **`useUnreadCount`** (temporizadores falsos):
   - Consulta cada 60 s con la pestaña visible y no consulta con la pestaña oculta.
   - Duplica el intervalo ante errores y vuelve a 60 s al primer éxito.
   - Se detiene con `ualdo:unauthorized`.
   - Mutación: quitar la condición de visibilidad.
5. **Panel de avisos:**
   - Renderiza la lista, marca un aviso como leído al tocarlo y navega a la vista correcta.
   - **Un aviso con un `screen` fuera de la lista blanca, o con `params` que contengan una URL, no navega ni abre
     nada.** Mutación: quitar la lista blanca del cliente.
   - Un título `<script>alert(1)</script>` se muestra como texto y no crea ningún elemento `script`.
   - "Marcar todas como leídas" llama a `read-all` con la categoría filtrada.
6. **Preferencias:** cambiar un interruptor hace el `PUT`; si falla, el interruptor vuelve a su estado.
7. **Guardia:** los nuevos tokens prohibidos están en la lista, y el test falla si alguien vuelve a escribir
   `updateVercelStock` (verifícalo con la mutación).
8. **Regresión:** los 46 tests existentes siguen en verde (adapta los de `DobleFiloCard` si cambió su contenido, sin
   borrar aserciones de seguridad).
9. **Cobertura:** `npm run test:coverage`. Informa el porcentaje **real** del código nuevo (objetivo: al menos
   80 %).

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
git status --short
```

**Prueba manual opcional contra el motor local**, que se documenta en el resumen y no reemplaza los tests:
1. En `C:\laragon\www\UaldoBusiness`, `php artisan serve`.
2. Configura `apiBaseUrl` en Ajustes, inicia sesión como dueño y como personal.
3. Registra un movimiento, intenta dar de alta un insumo con el personal, abre un aviso creado con un pedido interno
   y cambia una preferencia.

## Criterios de aceptación

- [ ] El inventario de la app sale del motor: listado, alertas, historial, movimientos con idempotencia real y alta solo para el dueño. No queda ninguna llamada a `/mobile/inventory`.
- [ ] Las cantidades viajan como texto con hasta 3 decimales; el reintento tras un error de red reutiliza el `client_uuid`.
- [ ] Existe el centro de avisos: campana con contador eficiente (solo con la pestaña visible y con backoff), panel con filtros, marcar como leído y navegación limitada a la lista blanca.
- [ ] Las preferencias de avisos se gestionan en Ajustes, y los críticos siempre llegan.
- [ ] No queda ninguna lectura ni escritura de inventario contra Vercel; la guardia lo impide.
- [ ] El cierre de caja, las tareas, el chat y el login no cambiaron.
- [ ] `docs/RESUMEN-15a.md` lista las mutaciones reales, la cobertura real y las decisiones del punto 13.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.
