# Resumen de implementación: Brief 37p (Incidencias en la App)

## Contexto y objetivos
Implementación del módulo de incidencias operativas (averías, roturas de vajilla/menaje y quejas de clientes) en la aplicación móvil Ualdo (`C:\laragon\www\UALDO`), de acuerdo con las especificaciones del Brief 37p.

## Componentes y servicios implementados

1. **Cliente de API (`src/services/incidentsClient.js`):**
   - Listas cerradas para tipos (`averia`, `rotura`, `queja`), estados (`abierta`, `en_atencion`, `resuelta`, `validada`, `descartada`), severidades, causas de quejas, clases de queja y áreas.
   - Métodos: `createIncident`, `listIncidents`, `getIncident`, `uploadEvidence`, `evidenceUrl`, `getEvidenceBlob`, `changeStatus`, `kitchenConfirm`, `assignIncident`, `addIncidentComment`, `registerIncidentWaste`, `getIncidentRecurrence`, `getIncidentSettings`, `updateIncidentSettings`.
   - Soporte para subida de fotos (jpeg, png, webp <= 8 MB) usando `apiClient.uploadFile`.
   - Visualización segura de fotos privadas mediante blob con token de sesión en encabezados (`Authorization: Bearer <token>`), sin exponer credenciales en la URL.

2. **Navegación e integración en el ecosistema:**
   - Registro del módulo "Incidencias" en `moduleRegistry.js` con permisos `incidents.report` e `incidents.manage`.
   - Rutas de notificación en `notificationRoutes.js`: rutas `incidencia` e `incidencias` dirigen a `subView: 'incidents'`.
   - Acceso rápido en el asistente: chip "Reportar un problema" disponible para todo el personal.
   - Vista principal integrada en `EcosystemView.jsx` bajo `subView === 'incidents'`.

3. **Interfaz de usuario (`src/components/incidents/`):**
   - `ReportIncidentSheet.jsx` y `ReportTypeSelector.jsx`: selector en 2 pasos para reporte de problemas (avería, rotura, queja), validación contra datos personales de clientes y subida de evidencia fotográfica.
   - `IncidentsView.jsx`: vista principal con selector de pestañas condicionado por rol ("Mi área", "Reporté", "Todas", "Recurrencias"), filtros por estado y tipo, y apertura automática con `initialId`.
   - `IncidentCard.jsx`: resumen visual de cada incidencia con estilo de estado, área, responsable asignado y recuento de fotos.
   - `IncidentDetail.jsx` y `IncidentDetailActions.jsx`: detalle completo de la incidencia con evidencias, historial inmutable de eventos y barra de acciones según rol.
   - Bloqueo de validación: quejas con causa de producción (`cause === 'produccion'`) en estado `resuelta` requieren la confirmación expresa del jefe de cocina antes de permitir la validación.
   - `IncidentActionModals.jsx`: modales para marcar resuelta (con causa de queja si aplica), descartar con motivo obligatorio y agregar comentarios.
   - `IncidentWasteModal.jsx`: modal para registrar merma asociada a la queja con selección de insumo y ubicación.
   - `IncidentRecurrence.jsx`: reporte analítico de recurrencias en los últimos 30 días desglosado por tipo, plato, activo y título.
   - `IncidentSettingsModal.jsx`: configuración de horas para recordatorios y escalamiento a administración.

## Cumplimiento de restricciones técnicas
- Cero emojis en toda la base de código, interfaces, pruebas y mensajes.
- Paleta de diseño basada estrictamente en variables CSS (`var(--primary)`, `var(--warning)`, `var(--accent)`, `var(--error)`, etc.).
- Límites de código respetados: todos los componentes tienen menos de 200 líneas y las funciones menos de 50 líneas.
- Cobertura de pruebas superior al 80% en todos los archivos de `src/components/incidents/` y `src/services/incidentsClient.js`.
- 1063 tests pasando (148 suites), build de producción limpio y 0 errores de ESLint (47 avisos de baseline).
