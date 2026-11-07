# Brief 46p: aprobar horas extra y ver la actividad del equipo

## Contexto

Repo: `C:\laragon\www\UALDO` (React 18, Vite, Capacitor 8, Vitest y Testing Library). Rama: `feat/pwa-horas-extra-y-actividad`, desde `main` con el Brief 45p fusionado.

**Depende de los Briefs 53 y 54 del motor** (`C:\laragon\www\UaldoBusiness\docs\briefs\`):

| Endpoint | Permiso | Uso |
|---|---|---|
| `GET /api/v1/overtime?status=pending` | el de hoy | lista; cada registro trae `status`, `status_label`, `decided_by`, `decided_at`, `decision_note` |
| `GET /api/v1/overtime/pending-count` | `overtime.approve` | número de pendientes |
| `POST /api/v1/overtime/{id}/approve` | `overtime.approve` | aprobar |
| `POST /api/v1/overtime/{id}/reject` `{ note }` | `overtime.approve` | rechazar con motivo |
| `GET /api/v1/overtime/summary` | `overtime.report` | ahora trae `pending_hours` y `pending_count` |
| `GET /api/v1/activity?modulo=&usuario_id=&desde=&hasta=&page=` | `audit.view` | rastro: `fecha`, `modulo_label`, `descripcion`, `persona { id, nombre, cargo_label }`, `referencia { tipo, id }`, `meta` |
| `GET /api/v1/activity/people` | `audit.view` | personas para el filtro |

Avisos nuevos en la app: `OvertimePendingNotification` (al dueño) y `OvertimeDecidedNotification` (a quien registró), con la pantalla de horas extra.

Estado actual de la PWA:

- `src/components/overtime/`: `OvertimeView.jsx` (151 líneas), `OvertimeList.jsx`, `OvertimeCard.jsx`, `OvertimeSummary.jsx`, `OvertimeForm.jsx`, `VoidOvertimeModal.jsx`; cliente `src/services/overtimeClient.js`.
- Menú de Más: `src/components/modules/moduleRegistry.js` (entrada `overtime` en la línea 113), con permisos por habilidad.
- Avisos: `src/services/notificationRoutes.js` (lista blanca `ALLOWED_SCREENS` y `ALLOWED_SUBVIEWS`).
- Permisos: `src/services/permissions.js` (`ABILITIES`); faltan `overtime.approve` y `audit.view`.

Lee primero `docs/ualdo-brand.md` y esos archivos.

## Objetivo

El dueño aprueba o rechaza horas extra desde la pantalla de horas extra y desde el aviso, y ve en Más > Actividad quién hizo cada cambio, con filtros por módulo, persona y fechas. Quien registró ve el estado de cada registro.

## Requerimientos

### 1. Permisos

En `permissions.js`, `ABILITIES.OVERTIME_APPROVE = 'overtime.approve'` y `ABILITIES.AUDIT_VIEW = 'audit.view'`.

### 2. Horas extra

1. `overtimeClient.js`: `listOvertime({ status, ... })`, `pendingOvertimeCount()`, `approveOvertime(id)`, `rejectOvertime(id, note)` con validación local (id numérico, motivo de 3 a 300 caracteres).
2. `OvertimeCard.jsx`: distintivo de estado ("Pendiente", "Aprobada", "Rechazada") con variables de color de aviso, éxito y error; si está rechazada, el motivo; si fue decidida, "Decidió {nombre} el {fecha}".
3. `OvertimeView.jsx`: con `overtime.approve`, pestaña o filtro "Por aprobar" (con el número de pendientes) que se abre por defecto si hay pendientes. En cada pendiente, botones "Aprobar" (pastilla petróleo) y "Rechazar" (secundario), con `RejectOvertimeModal.jsx` nuevo (motivo obligatorio). Tras decidir, la lista y el contador se refrescan.
4. `OvertimeSummary.jsx`: muestra "Pendientes de aprobar: {n} registros, {h} h" si `pending_count > 0`.
5. Quien registra ve el estado de sus registros y, al registrar, el mensaje "Quedó pendiente de aprobación del dueño."
6. En `moduleRegistry.js`, la entrada de horas extra muestra el número de pendientes para quien tenga `overtime.approve` (si el registro de módulos admite insignia; si no, añade la prop de forma simple en `ModuleCard`).
7. `notificationRoutes.js`: los avisos de horas extra abren la subvista `overtime`; con `params.status = 'pending'`, el filtro "Por aprobar" (valida el valor contra una lista blanca).

### 3. Actividad (`src/components/activity/`, nuevo)

1. `src/services/activityClient.js`: `listActivity({ modulo, usuarioId, desde, hasta, page })` y `listActivityPeople()`, con validación local (módulo de la lista, fechas `YYYY-MM-DD`, rango de 93 días como máximo).
2. `ActivityView.jsx`: filtros arriba (módulo con las etiquetas Inventario, Reservas, Pedidos y compras, Cierre de caja, Retiros de bodega, Horas extra, Incidencias, Equipo y cuentas; persona; desde y hasta, por defecto los últimos 7 días). Lista agrupada por día ("Hoy", "Ayer", "{fecha}"). Cada fila: hora, persona con su cargo, módulo y la descripción. Botón "Ver más" para la página siguiente.
3. `ActivityItem.jsx`: una fila. Si `referencia.tipo` corresponde a una pantalla existente (reserva, pedido, retiro, incidencia), la fila abre esa pantalla con el mismo mecanismo que los avisos (`notificationRoutes`); si no, no es pulsable.
4. Estados: cargando, vacío ("No hay cambios en estas fechas."), error con "Reintentar".
5. Entrada nueva en `moduleRegistry.js`: "Actividad del equipo", solo con `audit.view`, con icono SVG y la descripción "Quién hizo cada cambio".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG.
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Ningún color escrito a mano. Conserva las tildes.
- Seguridad: los botones de aprobar y la vista de actividad dependen de `can(user, ...)`, pero la autorización real es del motor (maneja 403 con un mensaje claro); valida parámetros de avisos contra listas blancas; no uses `dangerouslySetInnerHTML`.
- Rendimiento: la actividad se carga por páginas; no pidas `people` más de una vez por montaje.
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, componentes de menos de 200 líneas, sin anidación de más de 4 niveles, inmutabilidad.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests (Vitest y Testing Library)

1. `overtimeClient` y `activityClient`: validaciones locales, rutas y parámetros.
2. `OvertimeView`: con `overtime.approve` y pendientes, abre "Por aprobar"; aprobar llama al cliente y refresca; rechazar exige motivo. Sin el permiso, no hay botones.
3. `OvertimeCard`: los tres estados y el motivo del rechazo.
4. `ActivityView`: pinta filas agrupadas por día; aplicar el filtro de módulo llama con `modulo`; "Ver más" pide la página 2; vacío y error.
5. `ActivityItem`: con referencia a reserva abre la reserva; con tipo desconocido no es pulsable.
6. `moduleRegistry`: "Actividad del equipo" solo con `audit.view`.
7. `notificationRoutes`: aviso de horas extra pendientes abre el filtro correcto; un `status` no permitido se ignora.
8. Los tests existentes siguen en verde.

Cobertura de al menos 80 % del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Prueba manual con el motor local (Briefs 52, 53 y 54 fusionados): el jefe de salón registra horas extra y saca un producto; el dueño recibe el aviso, aprueba desde él y ve las dos acciones en Actividad con el nombre del jefe de salón.

## Criterios de aceptación

- [ ] El dueño aprueba y rechaza (con motivo) desde la pantalla y desde el aviso.
- [ ] Cada registro muestra su estado y quién lo decidió.
- [ ] El resumen muestra las pendientes aparte.
- [ ] Más > Actividad del equipo, solo para el dueño, con filtros, agrupado por día y paginado.
- [ ] Sin colores escritos a mano, sin emojis y sin tildes perdidas en el diff.
- [ ] Lint, tests y build en verde; prueba manual hecha.
