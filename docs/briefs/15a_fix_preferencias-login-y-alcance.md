# Brief 15a_fix: preferencias de avisos, error al iniciar sesión, alcance de caja y evidencia

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama `feat/pwa-inventory-notifications`; el Brief 15a quedó en el commit `13f0f02`. Trabaja
sobre esa rama. **No toques** el repo del motor (`C:\laragon\www\UaldoBusiness`): solo léelo para el contrato.

Lee primero `docs/briefs/15a_pwa-inventario-y-notificaciones-del-motor.md` (el brief original), `docs/RESUMEN-15a.md`
y `docs/ualdo-brand.md`.

**Resultado de la auditoría del 15a (2026-10-07).** Lint, los 90 tests y el build están en verde. Las mutaciones de
visibilidad, del `client_uuid` y de la guardia son reales. La seguridad de rutas, ids, lista blanca y texto plano
está bien. Pero hay fallos:

1. **HIGH: las preferencias de avisos nunca se guardan.**
   - `src/components/SettingsView.jsx:72` llama a `updatePreferences({ [category]: newEnabled })`, así que envía
     `{"preferences": {"pedidos": false}}`.
   - El motor (`UaldoBusiness/app/Http/Requests/Notifications/UpdateNotificationPreferencesRequest.php:22-24`)
     exige una lista: `{"preferences": [{"category": "pedidos", "enabled": false}]}`. Con un mapa responde 422
     siempre, y el interruptor vuelve a su estado.
   - `src/components/__tests__/SettingsView.test.jsx` simula `updatePreferences` y no comprueba el cuerpo que se
     envía, por eso no lo detectó.
2. **HIGH: evidencia mal registrada en `docs/RESUMEN-15a.md`.**
   - La "Mutación 3" dice que cambiar el `default` del `switch` en `notificationRoutes.js` hace fallar
     `rejects disallowed screens returning null`. Es falso: con ese cambio los 9 tests pasan, porque la
     comprobación `ALLOWED_SCREENS.has(screen)` corta antes y el `default` es inalcanzable. El mensaje citado solo
     aparece si se quitan **las dos** protecciones.
   - El resumen se declara "Aprobado". El estado lo decide el auditor, no el constructor.
3. **HIGH: faltan tests que el brief exigía.**
   - El panel de avisos no tiene ningún test de que un aviso con `screen` fuera de la lista blanca, o con `params`
     que contengan una URL, **no navega**. Quitar la lista blanca no rompe ningún test del panel.
   - No hay test de que "Nuevo insumo" aparece para el dueño y no para el personal.
   - No hay test del 409 por un `client_uuid` de otro insumo (mensaje genérico y uuid nuevo).
4. **MEDIUM: error en cada inicio de sesión.** `src/App.jsx:28` desestructura `refresh: refreshUnreadCount`, pero
   `useUnreadCount` devuelve `refreshUnreadCount` (`src/hooks/useUnreadCount.js:118`). La variable queda `undefined`
   y lanza `TypeError` en `App.jsx:87` (al iniciar sesión) y en `App.jsx:182` (al cerrar el panel).
5. **MEDIUM: se tocó el cierre de caja local, que el punto 14 del 15a prohibía.**
   - En `src/services/doblefiloEngine.js` cambiaron `executeDoblefiloCashClose` y
     `executeDoblefiloDetailedCashClose`, entre las líneas 205 y 310 aproximadamente.
   - Se quitó la conversión `parseFloat(x) || 0` de los montos: ahora `pichincha + deUna + internacional` puede
     concatenar textos.
   - La comisión de tarjeta pasó de `0.9353` a valores fijos `0.96` y `0.94`.
   - Hoy no se puede llegar a ese código desde la interfaz (`executeLocalTool` no se usa en ningún archivo de
     `src`), pero es una regresión sobre dinero y fuera de alcance.
6. **MEDIUM: código simulado que finge escribir.**
   - `updateDoblefiloStock` (`doblefiloEngine.js:196-201`) responde "Inventario actualizado" sin escribir nada.
   - `getDoblefiloInventory` (`:184-194`) devuelve existencias inventadas.
   - Ambas siguen registradas como herramientas en `appEcosystem.js:97-106`. El motor es la fuente de verdad del
     inventario.
7. **MEDIUM: diseño pedido en el 15a y no cumplido.**
   - `src/components/InventoryView.jsx` tiene 366 líneas y `src/components/notifications/NotificationsPanel.jsx`,
     382. El límite era 250.
   - No existen los hooks `useInventoryList` ni `useNotifications`.
   - El resumen no anota la decisión del punto 13: `fetchCanonicalInventory` llamaba a `/inventory/canonical` y
     `triggerInventoryReconciliation` a `/inventory/reconcile`, que no existen en el motor; `fetchReorderAlerts`
     quedó sustituida por `inventoryClient.fetchAlerts`.
8. **LOW:**
   - Colores sueltos en lugar de variables: `NotificationsPanel.jsx:103` y `:109`, y los fondos `rgba(...)` de los
     modales de inventario.
   - El 422 de un movimiento no muestra los errores por campo (`MovementModal.jsx:82-83`).
   - El respaldo `uuid-${Date.now()}` no es un UUID (`MovementModal.jsx:25`, `:65`, `:77`).
   - `markRead` marca el aviso como leído en pantalla aunque el servidor falle (`NotificationsPanel.jsx:83-87`).
   - Hay `setTimeout` sin limpiar en `InventoryView.jsx:42`, `SettingsView.jsx:105` y `SettingsView.jsx:140`.
   - `SettingsView.jsx:39` pide las preferencias sin sesión iniciada, lo que provoca un 401 innecesario.

## Objetivo

Que el dueño pueda guardar sus preferencias de avisos contra el motor real. Que iniciar sesión no lance errores. Que
el cierre de caja local vuelva exactamente a como estaba antes del 15a. Y que la evidencia y los tests del 15a sean
reales y cubran lo que el brief exigía.

## Requerimientos

1. **Preferencias** (`SettingsView.jsx` y `notificationsClient.js`):
   - `updatePreferences` recibe y envía una lista: `{ preferences: [{ category, enabled }] }`.
   - Valida en el cliente que `category` sea `pedidos`, `inventario`, `caja` o `sistema`, y que `enabled` sea
     booleano. Si no, no hace la petición.
   - `SettingsView` envía `[{ category, enabled: newEnabled }]`. Si falla, revierte el interruptor y muestra el
     error, como ya hace.
   - Solo pide las preferencias si hay sesión (`isAuthenticated()`). Sin sesión, la sección "Avisos" muestra
     "Inicia sesión para gestionar tus avisos".
2. **`App.jsx:28`:** usa `const { unreadCount, refreshUnreadCount } = useUnreadCount(...)`.
3. **Restaura el cierre local:**
   - `executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose` y todo lo relacionado con caja en
     `doblefiloEngine.js` vuelven **exactamente** a la versión de `c955b13`:
     `git show c955b13:src/services/doblefiloEngine.js`.
   - `syncCashCloseToGoogleSheets` y el historial local no cambian.
   - Comprueba con `git diff c955b13 -- src/services/doblefiloEngine.js` que solo queden las eliminaciones de
     inventario pedidas en el 15a.
4. **Elimina el inventario simulado:**
   - Borra `getDoblefiloInventory` y `updateDoblefiloStock` de `doblefiloEngine.js`.
   - Borra sus herramientas en `appEcosystem.js` y el import sin uso de `executeDoblefiloDetailedCashClose`.
   - Agrega `updateDoblefiloStock` y `getDoblefiloInventory` a los tokens prohibidos de
     `src/services/__tests__/securityGuard.test.js`.
   - Si `executeLocalTool` queda sin herramientas útiles y nadie la usa, elimínala también y anótalo.
5. **Divide los componentes grandes:**
   - Extrae `src/hooks/useInventoryList.js` (búsqueda con espera, pestañas, paginación y carga) y
     `src/hooks/useNotifications.js` (lista, filtros, paginación, marcar como leído y marcar todas).
   - `InventoryView.jsx` y `NotificationsPanel.jsx` deben quedar por debajo de 250 líneas. Si hace falta, extrae
     `NotificationItem.jsx` y `InventoryList.jsx` en sus carpetas.
   - El comportamiento no cambia.
6. **`markRead`:** si la respuesta no es `ok`, el aviso sigue como no leído y se muestra un error breve.
7. **Movimientos:**
   - Un 422 muestra los errores por campo (`res.data.errors`) junto a cada campo.
   - El `client_uuid` usa `crypto.randomUUID()`. Si no existe, genera un UUID v4 con `crypto.getRandomValues`;
     nunca `Date.now()`.
8. **Temporizadores:** el `setTimeout` de `InventoryView.jsx` y los de `SettingsView.jsx` se guardan en un `ref` y
   se limpian al desmontar.
9. **Colores:** agrega a `src/styles/main.css` las variables `--error-soft` (`rgba(244, 63, 94, 0.08)`),
   `--warning-soft` (`rgba(245, 158, 11, 0.06)`) y `--overlay` (`rgba(21, 21, 19, 0.85)`). Úsalas en
   `NotificationsPanel` y en los tres modales de inventario en lugar de los `rgba(...)` sueltos.
10. **`docs/RESUMEN-15a.md`:**
    - Quita "Aprobado" del estado.
    - Corrige la Mutación 3: describe exactamente qué se cambió.
    - Agrega la decisión del punto 13 y una sección "Corrección 15a_fix" con las mutaciones nuevas (pegando la
      salida real), la cobertura real y los resultados de la verificación final.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, datos de prueba, commits o nombres de archivo. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`: paleta con variables CSS, Poppins, botones pastilla y tono claro y breve
  en español con tildes.
- **Seguridad:**
  - Todo pasa por `apiClient`.
  - Ningún texto del servidor se interpreta como HTML ni como URL.
  - Los ids se validan antes de construir rutas.
  - Sin secretos en el código y sin guardar avisos ni inventario en `localStorage`.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50 líneas, sin mutaciones de estado y
  manejo de errores explícito.
- Sin dependencias nuevas.
- **No toques** `CashCloseView`, `DobleFiloCashCloseCard`, `cashCloseClient`, `syncCashCloseToGoogleSheets`, las
  tareas, el chat ni el login, salvo el punto 2 de `App.jsx`.

## Tests

Usa Vitest con Testing Library. **Cada test nuevo debe fallar si se revierte lo que protege.** Verifícalo con una
mutación (revierte, ejecuta, restaura) y pega en el resumen la salida **real** del test que falla. El auditor
repetirá todas las mutaciones; en el 15a una de ellas no fallaba como se dijo.

1. **Preferencias, cuerpo del PUT:** el test no simula `updatePreferences`; simula `fetch` o `request` y comprueba
   que el cuerpo es `{"preferences":[{"category":"pedidos","enabled":false}]}`.
   Mutación: volver a enviar el mapa `{ [category]: newEnabled }`.
2. **Preferencias sin sesión:** sin sesión no se llama a `getPreferences`.
3. **`App` al iniciar sesión:** renderiza `App` con `login` simulado, inicia sesión y comprueba que no se lanza
   ningún error y que se consulta `unread-count`. Mutación: volver a `refresh: refreshUnreadCount`.
4. **Panel de avisos, lista blanca de punta a punta:**
   - Un aviso con `action.screen = "https://evil.example"` y otro con `screen: "admin"`: al tocarlos se marcan como
     leídos, pero `onNavigate` **no** se llama.
   - Un aviso `inventario` con `params: { url: "https://evil.example" }`: navega a inventario y los `params`
     entregados no contienen la URL.
   - Mutación: quitar la comprobación `ALLOWED_SCREENS.has(screen)` **y** el `default: return null` a la vez. Debe
     fallar el test del panel, no solo el del servicio.
5. **Botón "Nuevo insumo":** visible con `capabilities.is_owner = true` y ausente para el personal.
   Mutación: mostrarlo siempre.
6. **409 por `client_uuid` de otro insumo:** muestra el mensaje genérico, y el siguiente envío usa un uuid distinto.
   Mutación: no regenerar el uuid.
7. **`markRead` fallido:** el aviso sigue sin leer y se muestra el error.
8. **422 por campo:** el error de `quantity` aparece junto a su campo.
9. **Guardia:** escribir `updateDoblefiloStock` en un archivo de `src` hace fallar `securityGuard.test.js`
   (mutación con un archivo temporal que luego se borra).
10. **Cierre local intacto:** `git diff c955b13 -- src/services/doblefiloEngine.js` no muestra cambios en las
    funciones de caja. Anota la salida en el resumen.
11. **Regresión:** los 90 tests existentes siguen en verde, sin borrar aserciones.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
git diff c955b13 -- src/services/doblefiloEngine.js
git status --short
```

## Criterios de aceptación

- [ ] El PUT de preferencias envía la lista `[{category, enabled}]`, y un test comprueba el cuerpo real.
- [ ] Iniciar sesión y cerrar el panel de avisos no lanzan errores.
- [ ] El cierre de caja local es idéntico al de `c955b13`.
- [ ] No queda inventario simulado (`getDoblefiloInventory`, `updateDoblefiloStock`), y la guardia lo impide.
- [ ] `InventoryView` y `NotificationsPanel` tienen menos de 250 líneas; existen `useInventoryList` y `useNotifications`.
- [ ] Los tests del panel prueban la lista blanca de punta a punta, y existen los tests del botón del dueño y del 409 de uuid.
- [ ] `docs/RESUMEN-15a.md` tiene la Mutación 3 corregida, la decisión del punto 13 y las mutaciones nuevas con su salida real, sin declararse aprobado.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.
