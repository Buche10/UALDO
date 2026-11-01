# Brief 38p: activos, vajilla y conteo mensual en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-activos` desde `main` con los Briefs 30p y 37p fusionados. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 38 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\38_activos-vajilla-y-conteo-mensual.md` y `C:\laragon\www\UaldoBusiness\docs\API-assets.md`.

**Por qué.** El dueño pide un inventario mensual de vajilla, cristalería y equipos, separado del de alimentos. Cuenta cada área y valida su jefe. Las roturas validadas bajan la cantidad esperada. Ualdo muestra qué hay que reponer y qué reparaciones siguen pendientes.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/incidents/*` (Brief 37p, para enlazar roturas y averías con un activo); `src/components/inventory/counts/CountSheet.jsx` y `CountSheetRow.jsx` (patrón de planilla con autoguardado); `src/services/permissions.js` y `moduleRegistry.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Administración carga y mantiene el catálogo de activos. Cada área hace su conteo mensual en una planilla, explica las diferencias y el jefe valida. Todos con permiso ven el reporte del mes con lo que hay que reponer y las reparaciones pendientes. Al reportar una rotura o avería se puede elegir el activo.

## Requerimientos

1. **Cliente** `src/services/assetsClient.js`:
   - `listAssets(filters)`, `createAsset`, `updateAsset(id, data, reason)`, `setAssetStatus(id, status)` e `importAssets(rows)` (hasta 300 filas).
   - `createAssetCount(area, period)`, `saveAssetCountLines(id, lines)`, `submitAssetCount(id)`, `saveAssetExplanations(id, lines)`, `validateAssetCount(id)` y `getAssetReport(period)`.
   - Cantidades enteras de 0 o más; periodo `AAAA-MM`; categorías y estados en listas cerradas.
2. **Tarjeta "Vajilla y equipos"** en `moduleRegistry` (`canAny` de `assets.count.*`, `assets.validate.*` y `settings.manage`). Pantalla `src/components/assets/AssetsView.jsx` con pestañas:
   - "Catálogo": lista por categoría con esperado, mínimo, estado, averías abiertas y roturas de 30 días. Con `settings.manage`: crear, editar (cambiar el esperado pide motivo), cambiar el estado e "Importar". La importación (`AssetImport.jsx`) recibe un CSV simple pegado o elegido (`categoria,nombre,codigo,esperado,minimo`), lo convierte en la app, lo previsualiza y muestra los errores por fila del motor.
   - "Conteo del mes": por área permitida, estado del conteo del periodo. "Empezar" abre `AssetCountSheet.jsx` (filas con nombre y campo contado, autoguardado como en la planilla del 19p, sin mostrar el esperado hasta enviar para no condicionar el conteo). "Enviar"; luego las diferencias con su explicación obligatoria; "Validar" para el jefe del área.
   - "Reporte": selector de mes; por activo, esperado al inicio, roturas, diferencias, esperado al final; bloques "Por reponer" y "Reparaciones pendientes" (enlazan a la incidencia).
3. **Enlace con incidencias.** En `ReportIncidentSheet` (Brief 37p), para averías y roturas, selector opcional "Objeto o equipo" con los activos del área (buscador por nombre). Envía `asset_id`. Al poner una avería en atención, el jefe ve la casilla "Fuera de servicio mientras se repara".
4. **Avisos.** Los recordatorios mensuales abren "Conteo del mes". Añade la pantalla si el motor envía una propia; si no, anótalo en la descripción del commit.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: ids `^\d+$`; el CSV se interpreta como texto plano y se valida fila por fila; nada se renderiza como HTML; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (comparte con la planilla del 19p lo que se pueda sin acoplarla a los insumos).
- No añadas dependencias (el CSV se interpreta con una función propia que admite comillas). No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones y rutas.
- Interpretación del CSV: comillas, filas vacías, columnas faltantes y errores por fila.
- Conteo: el esperado no se ve antes de enviar; las diferencias piden explicación; "Validar" solo para el jefe del área.
- Catálogo: editar el esperado pide motivo; sin `settings.manage` no hay botones de edición.
- Reporte: bloques "Por reponer" y "Reparaciones pendientes".
- Incidencias: el selector de activo envía `asset_id`.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Catálogo de activos con carga inicial por CSV.
- [ ] Conteo mensual por área con explicación y validación del jefe.
- [ ] Reporte mensual con reposición y reparaciones pendientes.
- [ ] Roturas y averías enlazadas al activo.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
