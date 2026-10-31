# Brief 27p: resumen del día y ventas por empleado en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-resumen-del-dia` desde `main` (con el Brief 23p fusionado). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** los Briefs 28 y 29 del motor desplegados. Lee completos `C:\laragon\www\UaldoBusiness\docs\briefs\29_resumen-del-dia-y-desempeno-en-el-chat.md` y `C:\laragon\www\UaldoBusiness\docs\API-sales.md` actualizado (endpoints `/restaurant/sales/day`, `/restaurant/sales/today` con `resumen`, `/restaurant/sales/staff`, `/restaurant/runfood/staff`).

**Por qué.** El dueño quiere ver de un vistazo cómo le fue en el día: total vendido, pedidos, ticket promedio, plato más vendido, empleado que más vendió, propinas, anulaciones y formas de pago. La vista de Ventas (Brief 23p) ya muestra resumen por rango, platos y horas; le faltan el resumen de un día y el desempeño del personal. Además, cuando RunFood no trae el nombre del empleado, el dueño debe poder ponerle uno.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/sales/*` y `src/services/salesClient.js`; `src/hooks/usePagedList.js`; `src/services/money.js`; `src/services/quantityFormat.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS de `src/styles/main.css` (sin `rgba` ni hexadecimales en componentes); todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; solo el dueño ve Ventas.

## Objetivo

En Ventas, el dueño ve la tarjeta "Resumen del día" (hoy en curso o un día elegido), una sección "Personal" con el ranking de empleados del rango, y puede ponerle alias a los usuarios de RunFood.

## Requerimientos

1. **Cliente** (`src/services/salesClient.js`): `getSalesDay({ fecha })`, `getSalesStaff({ from, to })`, `listRunfoodStaff({ page })` y `updateRunfoodStaffAlias(runfoodUserId, alias)`. Valida antes de llamar: fecha `YYYY-MM-DD` no futura, rango de hasta 92 días (reusa `validateDateRange`), id `^\d+$`, alias de 1 a 60 caracteres sin `<` ni `>`, o `null` para quitarlo.
2. **Resumen del día** (`src/components/sales/SalesDaySummaryCard.jsx`, con subcomponentes si pasa de 200 líneas):
   - Selector "Hoy" / "Ayer" / fecha. "Hoy" usa `resumen` de `/sales/today` y muestra "Parcial, actualizado a las {hora}"; los demás usan `/sales/day`.
   - Cifras: total, pedidos, ticket promedio, mesas, propinas, descuentos, anulaciones (pedidos y monto).
   - Plato más vendido y los 5 primeros; empleado que más vendió y los 5 primeros con participación; hora pico; formas de pago.
   - Si un dato llega en `null`, muestra "No disponible" (no 0). `404` en `/sales/day` muestra "No hay cierre de ventas para ese día".
3. **Personal** (`src/components/sales/SalesStaffRanking.jsx`): nueva sección en `SalesView` con el mismo rango de fechas de la vista. Por empleado: nombre, pedidos, total, ticket promedio, mesas, propinas, anulaciones y barra de participación (ancho por porcentaje, color por variable CSS). Orden por total.
4. **Nombres del personal** (`src/components/sales/RunfoodStaffAliases.jsx`): desde la sección Personal, botón "Nombres del personal" que abre la lista de usuarios de RunFood (paginada, "Cargar más") con su nombre en RunFood y un campo de alias. Guardar con estado de envío y mensaje de éxito; `422` muestra el mensaje del motor junto al campo; quitar alias con confirmación de dos pasos. Tras guardar, actualiza solo esa fila y vuelve a pedir el ranking.
5. **Navegación:** las secciones nuevas se suman al selector de `SalesView` sin cambiar las existentes. `SalesView.jsx` ya tiene 209 líneas: extrae el selector de secciones a su propio componente para quedar por debajo de 200.
6. **Privacidad:** nada de esto se muestra al personal. Si un no dueño llega a Ventas, se mantiene el comportamiento actual.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono).
- Sigue las convenciones existentes del repo. Conserva las tildes de todos los textos.
- Seguridad: valida toda entrada antes de llamar al motor; sin `dangerouslySetInnerHTML`; los nombres se muestran como texto (React escapa); errores sin datos sensibles.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (reusa el formato de dinero y cantidades existente).
- Rendimiento: una petición por sección visible; no pidas el ranking ni el resumen de secciones ocultas.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: fecha futura, rango de 93 días, id no numérico y alias con `<` o de 61 caracteres se rechazan sin llamar al motor.
- Resumen: "Hoy" muestra la hora de captura; un día con `404` muestra el mensaje; `null` se muestra como "No disponible"; plato y empleado top.
- Ranking: orden por total y participación.
- Alias: guardar actualiza la fila; `422` junto al campo; quitar con dos pasos.
- El personal no ve Ventas.
- `SalesView.jsx` y los componentes nuevos por debajo de 200 líneas.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
cd C:/laragon/www/UALDO && wc -l src/components/sales/*.jsx
```

## Criterios de aceptación

- [ ] El dueño ve el resumen de hoy (parcial) y de cualquier día cerrado.
- [ ] El dueño ve qué empleado vendió más en el rango y su desempeño.
- [ ] El dueño puede poner y quitar alias a los usuarios de RunFood.
- [ ] El personal no accede.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
