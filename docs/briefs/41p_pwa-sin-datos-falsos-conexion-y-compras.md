# Brief 41p: sin mesas falsas, conexión real con el motor y acceso directo a Compras

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; app de Android con Capacitor). Crea la rama `fix/pwa-sin-datos-falsos` desde `main` (`22de90f`, versión 1.1.0). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** Al instalar la versión 1.1.0 en el teléfono del dueño (2026-11-02) aparecieron tres problemas en la pantalla de Negocios:

1. **Mesas falsas.** La tarjeta "Restaurante: Doble Filo" (`src/components/DobleFiloCard.jsx`) tiene una pestaña "Mesas" con la "Parrilla de Mesas". Los datos salen de `getDoblefiloTables()` (`src/services/doblefiloEngine.js`), que llama directo a RunFood en la red del local (`/LOCAL_NETWORK/MESA/FETCH`). Fuera del local esa llamada falla y la función devuelve **mesas de ejemplo** (`DEFAULT_TABLES`, guardadas en `localStorage`): "Mesa 2 ocupada, $24.50". El dueño ve datos inventados como si fueran reales. Además, aun cuando RunFood responde, la función marca todas las mesas como "libre" con total 0, porque ese servicio solo trae zonas y cantidad de mesas, no su ocupación. En los dos casos el dato es falso.
2. **"Desconectado" en la cabecera.** El indicador (`src/components/Header.jsx`, con `checkNodeStatus` de `src/services/aiEngine.js`) prueba la conexión directa del teléfono con RunFood en la red del local, no con el motor. Fuera del local siempre dice "Desconectado", aunque la app funcione perfectamente con `https://api.ualdocorp.com`.
3. **Compras escondido.** Compras solo se abre con un botón dentro de Inventario (`InventoryHeaderActions.jsx`), entre otros cinco. No hay tarjeta propia en "Módulos disponibles" y el dueño no lo encuentra.

Regla del dueño y de la marca: Ualdo nunca muestra datos inventados como reales.

**Lee primero:** `docs/ualdo-brand.md`, `src/components/DobleFiloCard.jsx`, `src/services/doblefiloEngine.js`, `src/services/appEcosystem.js`, `src/components/Header.jsx`, `src/services/aiEngine.js`, `src/App.jsx` (llamada a `checkNodeStatus`), `src/components/modules/moduleRegistry.js`, `src/components/EcosystemView.jsx`, `src/components/InventoryView.jsx` y `src/components/inventory/purchases/PurchasesView.jsx`.

## Objetivo

La app no muestra ningún dato de ejemplo como si fuera real. El indicador de conexión dice si la app llega al motor. Compras tiene su propia tarjeta en Negocios.

## Requerimientos

### A. Sin mesas falsas

1. Quita la pestaña "Mesas" de `DobleFiloCard.jsx`. La tarjeta queda solo con Inventario y su resumen del motor (`/restaurant/summary`). Si con eso la tarjeta pierde sentido, reemplaza las pestañas por el resumen directo.
2. En `src/services/doblefiloEngine.js`, elimina los respaldos con datos de ejemplo: `DEFAULT_TABLES`, `getStoredTables`, `saveStoredTables`, `TABLES_STORAGE_KEY`, el `MENU_CATALOG` de respaldo y los `return { ..., source: 'mock' }`. Si una función queda sin uso, bórrala. Al arrancar, borra la clave de mesas guardada en `localStorage`, si existe (en `try/catch`).
3. `executeLocalTool` en `src/services/appEcosystem.js` no se usa en ninguna parte. Bórralo junto con las importaciones que queden sin uso. Conserva `getRegisteredApps` y `saveRegisteredApps`, que sí usa `App.jsx`.
4. Tests: la tarjeta ya no muestra "Mesas" ni "Parrilla de Mesas"; ninguna función del servicio devuelve `source: 'mock'`.

### B. Conexión con el motor

5. El indicador de la cabecera consulta la salud del motor (`GET /api/v1/health` con `apiClient`, sin token) en lugar de RunFood:
   - `status = ok`: "Conectado", con la latencia.
   - Responde pero no `ok`: "Motor con problemas".
   - Sin respuesta: "Sin conexión".
   - Usa variables CSS de estado (`--success`, `--warning`, `--error`).
6. La consulta se repite cada 60 segundos solo mientras la app está visible (`document.visibilityState`), y al tocar el indicador.
7. Ajusta `checkNodeStatus` para que el proveedor `motor` use la salud del motor. Las opciones de Ollama y LM Studio de `NetworkView.jsx` y `SettingsView.jsx` pueden quedarse como están si siguen en uso.
8. Tests: los tres estados del indicador con `request` simulado, y que no hay consultas con la app en segundo plano.

### C. Tarjeta de Compras

9. En `moduleRegistry.js`, agrega la tarjeta "Compras" (icono `ShoppingCart`, descripción "Compras, recepción contra factura, facturas del SRI y conciliación."), visible con `purchases.manage` o `purchases.receive`.
10. Al tocarla:
    - con `purchases.manage`: abre `PurchasesView` (con sus pestañas y la carga de facturas del SRI);
    - solo con `purchases.receive`: abre "Compras por recibir".

    Agrega la subvista en `EcosystemView.jsx`. Los botones de Inventario se quedan como están.
11. Tests: el dueño ve la tarjeta y abre Compras; un jefe con solo `purchases.receive` abre "Compras por recibir"; un cocinero no ve la tarjeta.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes. Ningún dato inventado en pantalla.
- Colores solo con variables CSS. Sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas (compruébalo con `wc -l`), funciones de menos de 50.
- Los mocks de los tests usan la forma real de las respuestas del motor.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

Los indicados en cada punto. Cobertura de 80 % o más del código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El lint debe seguir con 0 errores y no más de 47 avisos. Prueba manual: instala el APK en un teléfono fuera de la red del local y comprueba que la cabecera dice "Conectado", que no hay mesas y que la tarjeta Compras abre la pantalla de compras.

## Criterios de aceptación

- [ ] No aparece ninguna mesa ni ningún dato de ejemplo como si fuera real.
- [ ] El indicador de la cabecera refleja la conexión con el motor.
- [ ] Compras tiene su tarjeta en Negocios, según el permiso.
- [ ] Sin código muerto del ecosistema local.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
