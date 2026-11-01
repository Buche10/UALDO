# Brief 37p: incidencias (averías, roturas y quejas) en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-incidencias` desde `main` con el Brief 30p fusionado; si el 34p ya está, reutiliza su `uploadFile`. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 37 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\37_incidencias-averias-roturas-y-quejas.md` y `C:\laragon\www\UaldoBusiness\docs\API-incidents.md`.

**Por qué.** Cualquier trabajador debe poder reportar en el momento una avería, una rotura o una queja de un cliente, con foto opcional. Los jefes las atienden, las resuelven y las validan. Si una queja se debe a producción, también confirma el jefe de cocina.

**Lee primero:** `docs/ualdo-brand.md`; `src/services/apiClient.js` (y `uploadFile` si el 34p está fusionado; si no, créalo como se describe en `docs/briefs/34p_pwa-subir-factura.md`, punto 1); `src/services/permissions.js` y `moduleRegistry.js`; `src/services/notificationRoutes.js`; `src/hooks/usePagedList.js`; `src/hooks/useItemSearch.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Un botón "Reportar un problema" siempre a mano, que en dos pasos registra una avería, una rotura o una queja con foto. Una bandeja para los jefes con lo abierto de su área. Un detalle con historial y las acciones según el estado y el cargo.

## Requerimientos

1. **Cliente** `src/services/incidentsClient.js`:
   - `createIncident`, `listIncidents(filters)`, `getIncident(id)` y `uploadEvidence(id, file)` (`jpg`, `png` o `webp`, hasta 8 MB, hasta 5 por incidencia).
   - `evidenceUrl(id, evidenceId)`, con el token por encabezado y nunca en la URL.
   - `changeStatus(id, status, payload)`, `kitchenConfirm(id)`, `assign(id, userId)`, `comment(id, text)`, `registerWaste(id, items)` y `getRecurrence(days)`.
   - `getIncidentSettings()` y `updateIncidentSettings(data)`.
   - Tipos, estados, causas y clases de queja en listas cerradas del Brief 37.
2. **Reportar** (`src/components/incidents/ReportIncidentSheet.jsx`): hoja inferior que se abre desde la tarjeta "Incidencias" (`incidents.report`) y desde un acceso en el chat.
   - **Paso 1**, tipo con tres botones grandes: "Algo se dañó" (avería), "Se rompió algo" (rotura) y "Queja de un cliente" (queja).
   - **Paso 2**, campos del tipo:
     - Avería: título, descripción y severidad.
     - Rotura: qué se rompió y cuántas.
     - Queja: plato, clase y relato.
   - Área por defecto: la del usuario. Foto opcional con la cámara.
   - Aviso fijo en quejas: "No anotes nombres ni teléfonos del cliente". El `422` del motor por datos personales se muestra en el relato.
3. **Bandeja** (`IncidentsView.jsx`), con pestañas:
   - "Reporté": quien solo puede reportar ve únicamente esta.
   - "Mi área": con `incidents.manage`, abiertas primero.
   - "Todas": dueño y administración.
   - Cada tarjeta muestra tipo, título, área, estado, antigüedad ("hace 3 h") y el asignado (primer nombre). Filtros por estado y tipo.
4. **Detalle** (`IncidentDetail.jsx` e `IncidentTimeline.jsx`):
   - Datos, fotos (miniaturas que se abren a pantalla completa) e historial de eventos.
   - Acciones según el estado y el permiso, siguiendo las transiciones del Brief 37: "Atender", "Marcar resuelta" (pide resolución), "Validar", "Descartar" (pide motivo), "Asignar", "Comentar" y "Agregar foto".
   - En quejas: selector de causa, "Se volvió a preparar" y "Registrar merma" (insumos y cantidades con el buscador).
   - Si la causa es producción, el jefe de cocina ve "Confirmar solución de cocina", y "Validar" muestra por qué está bloqueado mientras falta esa confirmación.
5. **Recurrencias** (`IncidentRecurrence.jsx`, con `incidents.manage`): las más repetidas de 30 días por tipo, plato, objeto y equipo.
6. **Avisos.** Pantalla `incidencia` con `params.id`, que abre el detalle. Añádela a `ALLOWED_SCREENS` y a su test.
7. **Chat.** Acceso "Reportar un problema" para todos, con el texto "Quiero reportar un problema".
8. **Ajustes** (`settings.manage`): horas para recordar y para escalar averías.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Tono que registra hechos sin culpar. Conserva las tildes.
- Privacidad: sin datos de clientes; las fotos solo se ven dentro de la app con el token; las URL de objeto se liberan.
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: ids `^\d+$`; tipo y tamaño de archivo validados antes de subir; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY. Las acciones por estado salen de una tabla, no de `if` anidados.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: listas cerradas, validación de archivos y rutas.
- Reportar: los dos pasos para cada tipo; la foto es opcional; el `422` por datos personales aparece en el relato.
- Bandeja: pestañas según el permiso.
- Detalle: acciones correctas por estado y cargo; "Validar" bloqueado sin la confirmación de cocina en quejas de producción; la merma envía los insumos.
- Ruta de aviso `incidencia`.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Cualquier trabajador reporta averías, roturas y quejas en dos pasos, con foto.
- [ ] Los jefes atienden, resuelven y validan desde la bandeja y el detalle.
- [ ] Doble confirmación en quejas de producción y merma registrada.
- [ ] Los avisos abren la incidencia.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
