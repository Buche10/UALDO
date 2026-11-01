# Resumen Brief 32p: Retiros de bodega en la app

## 1. Alcance y Objetivo
Implementación completa del frontend para la declaración previa y confirmación de uso de retiros de bodega en la PWA de Ualdo Negocios (`C:\laragon\www\UALDO`), rama `feat/pwa-retiros-de-bodega`.

Permite que cualquier trabajador declare insumos antes de sacarlos de la bodega (destino, insumos, cantidades y motivo) en tres toques; consulte sus retiros abiertos y los cierre indicando cantidades usadas y devueltas (con cálculo en vivo de lo que queda en el área). Los supervisores de área (`kitchen_head`, `lounge_head`, `admin`, `owner`) tienen visibilidad de los retiros abiertos y escalados de su área con el nombre de quien retiró, y administración puede configurar los recordatorios automáticos.

---

## 2. Archivos Creados y Modificados

### Servicios y Rutas
- `src/services/withdrawalsClient.js`: cliente API completo con endpoints (`createWithdrawal`, `listWithdrawals`, `getWithdrawal`, `closeWithdrawal`, `cancelWithdrawal`, `getWithdrawalSettings`, `updateWithdrawalSettings`), normalización de cantidades (hasta 3 decimales), validación de 1 a 15 insumos, `client_uuid` estable e idempotente, validación de `withdrawn_at` (máx. 24h atrás) con `late_reason`, y mapeo de errores `422` de stock insuficiente a la línea del insumo correspondiente.
- `src/services/notificationRoutes.js`: inclusión de rutas seguras para notificaciones de retiros (`screen: 'retiros'` y `screen: 'withdrawals'`).
- `src/components/modules/moduleRegistry.js`: registro del módulo de retiros con icono `ArrowDownRight`, permisos `withdrawals.declare` y `withdrawals.supervise`, y `subView: 'withdrawals'`.

### Componentes de UI (`src/components/withdrawals/`)
- `withdrawalHelpers.js`: helpers puros de visualización (traducción de ubicaciones, badges de estado con CSS variables, primer nombre de usuario y lógica de capacidad de cancelación dentro de 15 minutos).
- `WithdrawalForm.jsx`: formulario de declaración rápida con destino por defecto según área, buscador con `useItemSearch`, chips de sugerencias rápidas ("Producción", "Mise en place", "Servicio"), casilla de retiro tardío y manejo de errores 422 en línea. (193 líneas).
- `WithdrawalFormItems.jsx`: gestor de lista dinámica de insumos (1 a 15 elementos). (59 líneas).
- `WithdrawalItemRow.jsx`: fila individual con buscador en catálogo de inventario, cambio de insumo, cantidad y visualización de unidad. (189 líneas).
- `WithdrawalFormLateFields.jsx`: campos de fecha/hora y motivo para retiros tardíos. (62 líneas).
- `WithdrawalCloseForm.jsx`: formulario de confirmación de cierre de retiro. (175 líneas).
- `WithdrawalCloseRow.jsx`: fila de cierre con inputs "Usé" y "Devolví", cálculo en vivo de "Queda en {área}" y validación visual cuando la suma supera lo retirado. (117 líneas).
- `WithdrawalCloseActions.jsx`: nota explicativa obligatoria (si queda insumo o si un supervisor cierra en nombre de otro) y botones pastilla de acción. (84 líneas).
- `WithdrawalCancelModal.jsx`: modal de cancelación que muestra tiempo restante para el autor (primeros 15 minutos) o exige motivo obligatorio para supervisores tras 15 minutos. (166 líneas).
- `WithdrawalCard.jsx`: tarjeta de retiro con badge de estado, resumen de insumos, autor, acordeón de detalles y acciones de cerrar y cancelar. (171 líneas).
- `WithdrawalsList.jsx`: lista con ordenamiento prioritario (abiertos y escalados primero, luego cerrados y cancelados cronológicamente). (61 líneas).
- `WithdrawalsView.jsx`: vista principal con navegación entre lista, declaración, cierre y modal de cancelación. Pestañas "Mis retiros" y "Mi área" (restringida a `withdrawals.supervise`). (159 líneas).
- `WithdrawalsViewHeader.jsx`: cabecera con botón de recarga, botón "+ Declarar retiro" y pestañas filtradas. (105 líneas).
- `WithdrawalSettingsForm.jsx`: formulario de configuración de recordatorios para administración (`settings.manage`). (195 líneas).
- `WithdrawalSettingsIntervals.jsx`: campos de primer recordatorio e intervalo entre avisos. (46 líneas).
- `WithdrawalSettingsQuietHours.jsx`: campos de franja horaria silenciosa. (42 líneas).

### Integraciones
- `src/components/modules/ModuleCard.jsx`: soporte de insignias numéricas (badges) con variables CSS.
- `src/components/modules/ModuleGrid.jsx`: carga y renderizado de la cantidad de retiros abiertos propios en la tarjeta de módulo.
- `src/components/EcosystemView.jsx`: enrutamiento del submódulo `withdrawals`.
- `src/components/SettingsView.jsx`: renderizado de `WithdrawalSettingsForm` condicionado a `settings.manage`.
- `src/components/assistant/SuggestionChips.jsx`: chips rápidos en el chat asistente ("Voy a la bodega" y "Cerrar mi retiro" si el usuario tiene retiros abiertos).

---

## 3. Pruebas y Cobertura

### Tests Unitarios
- `src/services/__tests__/withdrawalsClient.test.js`: 14 tests (100% éxito).
- `src/services/__tests__/notificationRoutes.test.js`: 13 tests (100% éxito).
- `src/components/assistant/__tests__/SuggestionChips.test.jsx`: 5 tests (100% éxito).
- `src/components/modules/__tests__/ModuleGrid.test.jsx`: 5 tests (100% éxito).
- `src/components/withdrawals/__tests__/withdrawalHelpers.test.js`: 8 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalForm.test.jsx`: 5 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalCloseForm.test.jsx`: 4 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalCancelModal.test.jsx`: 3 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalCard.test.jsx`: 3 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalsList.test.jsx`: 2 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalsView.test.jsx`: 7 tests (100% éxito).
- `src/components/withdrawals/__tests__/WithdrawalSettingsForm.test.jsx`: 2 tests (100% éxito).

### Cobertura de Código Nuevo (`src/components/withdrawals/`)
- Total componentes retiros: **97.71% en líneas**, superando holgadamente el umbral del 80% exigido:
  - `WithdrawalCancelModal.jsx`: 87.85%
  - `WithdrawalCard.jsx`: 98.00%
  - `WithdrawalCloseActions.jsx`: 100.00%
  - `WithdrawalCloseForm.jsx`: 95.86%
  - `WithdrawalCloseRow.jsx`: 100.00%
  - `WithdrawalForm.jsx`: 100.00%
  - `WithdrawalFormItems.jsx`: 100.00%
  - `WithdrawalFormLateFields.jsx`: 100.00%
  - `WithdrawalItemRow.jsx`: 98.79%
  - `WithdrawalSettingsForm.jsx`: 98.77%
  - `WithdrawalSettingsIntervals.jsx`: 100.00%
  - `WithdrawalSettingsQuietHours.jsx`: 100.00%
  - `WithdrawalsList.jsx`: 100.00%
  - `WithdrawalsView.jsx`: 94.48%
  - `WithdrawalsViewHeader.jsx`: 100.00%
  - `withdrawalHelpers.js`: 100.00%

### Verificación Global
- `npm run lint`: 0 errores, 47 warnings (sin warnings añadidos sobre la línea base).
- `npm test -- --run`: 130 suites pasadas, 934 tests pasados de 934 (100%).
- `securityGuard.test.js`: 5/5 tests pasados (cero emojis, cero colores fijos, cero tokens prohibidos).
- `npm run build`: compilación limpia en 3.93s sin errores.
- Todos los componentes `.jsx` tienen menos de 200 líneas (ninguno excede 195 líneas).
