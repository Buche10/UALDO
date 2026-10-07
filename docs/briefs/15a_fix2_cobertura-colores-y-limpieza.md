# Brief 15a_fix2: cobertura real, colores de marca y limpieza menor

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2 con `@vitest/coverage-v8`, Testing
Library, ESLint 9, `lucide-react`). Rama `feat/pwa-inventory-notifications`. El Brief 15a está en `13f0f02` y su
corrección en `5902259`, aprobada con observaciones menores. Trabaja sobre esa rama. **No toques** el repo del motor
(`C:\laragon\www\UaldoBusiness`).

Lee primero `docs/briefs/15a_pwa-inventario-y-notificaciones-del-motor.md`,
`docs/briefs/15a_fix_preferencias-login-y-alcance.md`, `docs/RESUMEN-15a.md` y `docs/ualdo-brand.md`.

**Qué encontró la auditoría del 15a_fix (2026-10-07).** Todo funciona: 100 tests, lint, build y mutaciones reales.
Quedan detalles de calidad, uno de ellos importante para la evidencia:

1. **La cobertura del 15a no se está midiendo.**
   - En `vite.config.js:29-33`, `coverage.include` solo contiene `src/services/assistantClient.js`,
     `src/services/auth.js` y `src/components/assistant/**`.
   - Por eso `npm run test:coverage` da "94,02 %" sin medir ni un archivo del 15a. Las cifras por archivo del
     resumen (98 % en `inventoryClient`, etc.) no salen de ese comando.
   - El auditor midió los archivos del 15a a mano y obtuvo **78,43 % de sentencias y 73,24 % de ramas**. Por
     debajo del 80 % están:

     | Archivo | Sentencias | Ramas |
     |---|---|---|
     | `MovementsHistoryModal.jsx` | 10,45 % | 25 % |
     | `InventoryList.jsx` | 56,11 % | 28,57 % |
     | `SettingsView.jsx` | 56,23 % | 68,08 % |
     | `useInventoryList.js` | 75,51 % | 35,29 % |
     | `useNotifications.js` | 91,13 % | 60 % |
     | `NotificationsPanel.jsx` | 82,43 % | 67,85 % |
     | `inventoryClient.js` | 94,28 % | 71,11 % |
     | `MovementModal.jsx` | 92,91 % | 72,72 % |

2. `src/components/inventory/MovementModal.jsx` tiene 283 líneas; el límite es 250.
3. **Quedan colores sueltos** en lugar de variables:
   - `NotificationsPanel.jsx:83`, `:130`, `:131`, `:149`, `:150` y `:231`.
   - `InventoryList.jsx:110`, `:126` y `:152`.
   - `NotificationItem.jsx:81`.

   Son `#ffffff` y fondos `rgba(32, 45, 47, 0.6 a 0.8)` y `rgba(29, 29, 27, 0.6)`.
4. `fetchCanonicalInventory` y `fetchReorderAlerts` siguen en `src/services/doblefiloEngine.js` (líneas 353 y 365,
   aproximadamente). La app ya no las usa, porque `DobleFiloCard` usa `inventoryClient.listInventory`. Solo las
   simula `src/components/__tests__/DobleFiloCard.test.jsx:12-13`, y duplican `inventoryClient`.
5. **Los tests de preferencias usan una respuesta que el motor no devuelve.**
   - `src/components/__tests__/SettingsView.test.jsx` simula el GET de preferencias como un mapa
     (`{pedidos: true, ...}`).
   - El contrato real (`UaldoBusiness/docs/API-notifications.md`, sección 2.5) es
     `{"preferences": [{"category", "label", "enabled"}], "critical_always_enabled": true}`.
6. **Dos detalles en `docs/RESUMEN-15a.md`:**
   - La salida de la "Mutación Fix 1" está resumida y dice que falla 1 test; en realidad fallan 2.
   - Se pegaron símbolos de la terminal (flechas y marcas de verificación). Por la regla de cero emojis, el texto debe ser ASCII o
     español normal.

## Objetivo

Que `npm run test:coverage` mida el código del 15a y dé al menos 80 % de sentencias y de ramas en esos archivos. Que
no quede ningún color fuera de las variables de la marca. Que no quede código muerto de inventario. Y que el
resumen refleje salidas reales y sin símbolos.

## Requerimientos

1. **Configuración de cobertura** (`vite.config.js`): agrega a `coverage.include`, sin quitar lo que ya está:
   - `src/services/inventoryClient.js`, `src/services/notificationsClient.js` y
     `src/services/notificationRoutes.js`;
   - `src/hooks/**`;
   - `src/components/inventory/**`, `src/components/notifications/**`, `src/components/InventoryView.jsx` y
     `src/components/DobleFiloCard.jsx`.

   Agrega `coverage.exclude: ['**/__tests__/**']`. Deja fuera `SettingsView.jsx`, que es grande y heredado: su
   sección de avisos se cubre con los tests del punto 6.
2. **Divide `MovementModal.jsx`** por debajo de 250 líneas. Extrae la validación y el envío a un hook
   `src/hooks/useMovementSubmit.js` (uuid, normalización, manejo de 201, 200, 409, 422 y error de red), o el campo
   de errores a un componente pequeño. El comportamiento y los tests actuales no cambian.
3. **Colores** (`src/styles/main.css`, en `:root`). Agrega:
   - `--on-primary: #ffffff` (texto e íconos sobre el color primario; en la marca es `--ualdo-blanco`);
   - `--chip-bg: rgba(32, 45, 47, 0.6)` (fondo de filtros y chips inactivos);
   - `--surface-strong: rgba(32, 45, 47, 0.8)`.

   Reemplaza **todos** los colores sueltos del punto 3 del contexto. Usa las variables existentes cuando el valor
   coincida o sea equivalente (`--bg-card`, `--bg-glass`, `--overlay`). Al terminar, este comando no debe
   devolver nada:

   ```
   grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/notifications src/components/inventory src/components/InventoryView.jsx
   ```
4. **Código muerto:** elimina `fetchCanonicalInventory` y `fetchReorderAlerts` de `doblefiloEngine.js`, y las dos
   simulaciones correspondientes de `DobleFiloCard.test.jsx`. Ese test debe seguir verde y con todas sus
   aserciones. Agrega `fetchCanonicalInventory` a los tokens prohibidos de `securityGuard.test.js`.
5. **Tests para llegar al 80 % de sentencias y de ramas** en los archivos del punto 1. Cada test comprueba un
   comportamiento, no solo que algo se renderiza:
   - **`MovementsHistoryModal`:** lista los movimientos con el tipo traducido (Entrada, Salida, Conteo y Merma) y
     la cantidad con hasta 3 decimales. "Cargar más" pide la página 2 y agrega los resultados sin duplicarlos.
     Muestra el estado vacío, y el error con reintento.
   - **`InventoryList`:** la pestaña "Alertas" muestra `suggested_qty`, "Stock bajo" marca los insumos bajo
     mínimo y "Cargar más" se oculta en la última página.
   - **`useInventoryList`** (con temporizadores falsos):
     - La búsqueda espera 300 ms y escribir rápido produce una sola petición.
     - Cambiar de pestaña reinicia la paginación.
     - Un error de red deja el estado de error sin borrar la lista anterior.
   - **`useNotifications`:** filtrar por categoría reinicia la página. "Sin leer" envía `unread=1`. Un error en
     "Marcar todas" no cambia la lista.
   - **`inventoryClient`:** `createItem` descarta `min_stock` inválido, `listInventory` ignora `page` no entero y
     `type` vacío no se envía.
   - **`NotificationsPanel` y `MovementModal`:** las ramas que falten según el informe de cobertura (estado vacío,
     error con reintento y "Cargar más").
6. **Tests de preferencias con el contrato real:** en `SettingsView.test.jsx`, simula el GET con
   `{ preferences: [{ category: 'pedidos', label: 'Pedidos internos', enabled: true }, ...], critical_always_enabled: true }`,
   y comprueba que el interruptor muestra la **etiqueta del motor** ("Pedidos internos"). Deja un solo test para la
   forma de mapa, si quieres conservar esa compatibilidad, y nómbralo como tal.
7. **`docs/RESUMEN-15a.md`:**
   - Corrige la salida de la Mutación Fix 1 con la salida real completa.
   - Quita las flechas y marcas de verificación; copia las salidas de terminal en texto plano ASCII.
   - Agrega una sección "Corrección 15a_fix2" con la tabla de cobertura **por archivo** que imprime
     `npm run test:coverage` tras el cambio del punto 1 (pegada tal cual, sin símbolos), las mutaciones nuevas y la
     verificación final.
   - El estado queda "Pendiente de auditoría".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, datos de prueba, commits, documentación ni nombres de archivo. Tampoco símbolos decorativos de terminal (marcas de verificación, flechas o cruces) pegados en la documentación. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`. Los colores solo vía variables CSS de `src/styles/main.css`; Poppins;
  botones pastilla; español con tildes.
- **Seguridad:** sin cambios de comportamiento. Todo pasa por `apiClient`, ningún texto del servidor se interpreta
  como HTML ni como URL, y los ids se validan antes de construir rutas.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50 líneas, sin mutaciones de estado y
  temporizadores siempre limpiados.
- Sin dependencias nuevas. No toques el cierre de caja (`executeDoblefiloCashClose`,
  `executeDoblefiloDetailedCashClose`, `syncCashCloseToGoogleSheets`, `CashCloseView`, `cashCloseClient`), las
  tareas, el chat ni el login.

## Tests

Usa Vitest con Testing Library. **Cada test nuevo debe fallar si se revierte lo que protege.** Haz al menos estas
mutaciones (revierte, ejecuta, restaura) y pega la salida **real** en el resumen. El auditor las repetirá.

1. En `useInventoryList`, quita la espera de 300 ms: debe fallar el test de una sola petición.
2. En `MovementsHistoryModal`, haz que "Cargar más" reemplace la lista en lugar de agregar: debe fallar.
3. En `useNotifications`, no reinicies la página al cambiar de categoría: debe fallar.
4. En `SettingsView`, muestra `category` en lugar de `label`: debe fallar el test del contrato real.
5. Vuelve a escribir `export const fetchCanonicalInventory` en un archivo temporal de `src`: la guardia debe
   fallar. Borra el archivo después.

Los 100 tests existentes siguen en verde, sin borrar aserciones.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/notifications src/components/inventory src/components/InventoryView.jsx
wc -l src/components/inventory/*.jsx src/components/notifications/*.jsx src/components/InventoryView.jsx
git status --short
```

## Criterios de aceptación

- [ ] `coverage.include` mide los archivos del 15a, y `npm run test:coverage` muestra al menos 80 % de sentencias y de ramas en el total de esos archivos.
- [ ] Ningún archivo del punto 1 queda por debajo del 70 % de ramas.
- [ ] `MovementModal.jsx` y el resto de componentes de inventario y avisos tienen menos de 250 líneas.
- [ ] El `grep` de colores sueltos no devuelve nada.
- [ ] `fetchCanonicalInventory` y `fetchReorderAlerts` ya no existen, y la guardia lo impide.
- [ ] Los tests de preferencias usan el contrato real del motor.
- [ ] `docs/RESUMEN-15a.md` tiene salidas reales, sin símbolos, con la tabla de cobertura por archivo y las cinco mutaciones.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.
