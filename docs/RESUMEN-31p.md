# Resumen Brief 31p: Cierre diario de inventario por area

## Rama de trabajo
`feat/pwa-cierre-diario-inventario` basada en `main` (que integra los Briefs 30p y 30p_fix).

---

## 1. Alcance y Objetivos
Implementación del módulo "Cierre del día" en la PWA de Ualdo, correspondiente a la contraparte móvil del cierre diario de inventario del Brief 31 del motor.

El flujo implementado cubre:
1. **Selector de fecha**: Selección entre hoy y ayer para operar sobre la fecha operativa relevante.
2. **Tarjetas por área**: `kitchen` (Cocina), `lounge` (Salón), `warehouse` (Bodega). Se muestran las tarjetas según los permisos del usuario (`inventory.count.{area}` o `inventory.view.{area}`).
3. **Estados del cierre**:
   - `Sin empezar`: Botón "Empezar conteo" (crea el conteo diario y abre la planilla).
   - `Contando`: Botón "Continuar conteo" y avance ("X de Y contados").
   - `Enviado`: Muestra diferencias pendientes por explicar y quién contó.
   - `Validado`: Indica quién validó y etiqueta neutral si fue auto-validado ("Validado por quien contó").
   - `Escalado`: Muestra nota de escalamiento a administración.
4. **Planilla de conteo (`CountSheet`)**: Reutilizada en modo `isDailyClose={true}`, adaptada modularmente extrayendo `CountSheetSearchBar` y `CountSheetActions` para mantener cada archivo bajo 200 líneas.
5. **Confirmación en dos pasos al enviar (`SubmitDailyCloseDialog`)**:
   - Mensaje explicativo: "Se calcularán las diferencias con el sistema".
   - Manejo del código `SALES_PENDING` (409 de RunFood): "Falta descontar las ventas del día. Intenta de nuevo en unos minutos." con botón "Reintentar".
6. **Manejo de Diferencias (`DifferencesList`, `DifferenceRow`)**:
   - Lista filtrada solo con líneas que tienen diferencias entre lo contado y el sistema.
   - Banner respetuoso: "Una diferencia no es una falta. Cuéntanos qué pasó para corregirlo."
   - Selector de causa (lista cerrada: merma, error de conteo, consumo no registrado, transferencia sin anotar, porcionamiento, otro) y campo de explicación (obligatorio si la causa es "otro").
   - Cantidades con signo formateadas mediante `quantityFormat.js`.
   - Estilo visual de advertencia suave con `--warning` (sin rojos alarmistas).
   - En `submitted`, el validador puede corregir cantidades ("Corregir conteo"), reabriendo la planilla y limpiando la explicación de esa línea.
7. **Validación y Escalamiento**:
   - "Validar": Requiere permiso (`inventory.validate.{area}` o `inventory.adjust`). Deshabilitado mientras falten explicaciones por registrar. Confirmación modal: "Se ajustará el inventario por {n} diferencias".
   - "Escalar a administración": Modal con motivo obligatorio.
8. **Ajustes de cierre diario (`DailyCloseSettingsForm`)**:
   - En `SettingsView.jsx`, protegido por `settings.manage` (`ABILITIES.SETTINGS_MANAGE`).
   - Configuración de horario de recordatorio, horario de escalamiento y áreas incluidas en el cierre diario.
9. **Rutas y Notificaciones**:
   - Soporte en `notificationRoutes.js` para `screen = 'daily_close'` y `subView = 'daily_close'`.
   - Registro en `moduleRegistry.js` con permisos `canAny` de cierre diario.

---

## 2. Archivos Creados y Modificados

### Servicios y Rutas
- `src/services/inventoryCountsClient.js`: Agregados métodos `createDailyClose`, `submitCount`, `saveExplanations`, `validateCount`, `escalateCount`, `getDailyCloseSummary`, `getDailyCloseSettings`, `updateDailyCloseSettings`, constantes `SALES_PENDING_CODE`, `RUNFOOD_PENDING_CODE` y `VALID_EXPLANATION_CAUSES`.
- `src/services/notificationRoutes.js`: Habilitada pantalla `daily_close` y `subView: 'daily_close'`.
- `src/components/modules/moduleRegistry.js`: Registrado módulo `daily_close` con capacidades granulares.

### Componentes de Cierre Diario (`src/components/inventory/dailyClose/`)
- `dailyCloseCauses.js`: Lista cerrada de causas válidas con etiquetas legibles en español.
- `dailyClosePermissions.js`: Helpers de verificación de permisos por área para conteo y validación (con soporte de estado `escalated`).
- `dailyCloseDates.js`: Utilidades para fechas operativas (hoy y ayer).
- `DailyCloseView.jsx`: Vista principal con selector de fecha, listado de tarjetas y navegación a planilla / diferencias.
- `DailyCloseHeader.jsx`: Subcomponente con título, descripción y selector Hoy/Ayer.
- `DailyCloseCard.jsx`: Tarjeta de estado de cada área con badges, montos de diferencia si tiene `inventory.costs`, y acciones disponibles.
- `DailyCloseCardActions.jsx`: Subcomponente con botones y etiquetas de acción según estado y permisos.
- `DifferencesList.jsx`: Vista de diferencias con banner respetuoso, listado de items, formulario de causas/explicaciones y acciones de validador.
- `DifferencesHeader.jsx`: Subcomponente con botón de retorno, corrección de conteo y guardado de explicaciones.
- `DifferenceRow.jsx`: Fila individual de diferencia con selector de causa y campo de texto (o texto plano en validado).
- `DifferencesValidatorActions.jsx`: Barra de acciones para el rol validador (corregir, validar, escalar).
- `SubmitDailyCloseDialog.jsx`: Diálogo de confirmación en dos pasos y distinción de 409 `SALES_PENDING` y `RUNFOOD_PENDING`.
- `ValidateConfirmDialog.jsx`: Diálogo de confirmación de ajuste de stock por diferencias con `--shadow-dialog`.
- `EscalateDailyCloseDialog.jsx`: Diálogo con motivo obligatorio para escalar a administración con `--shadow-dialog`.
- `DailyCloseSettingsForm.jsx`: Formulario de configuración de horarios y áreas incluidas.
- `DailyCloseSettingsFields.jsx`: Subcomponente con campos de formulario de configuración.

### Componentes Modulares de Planilla (`src/components/inventory/counts/`)
- `CountSheetSearchBar.jsx`: Barra de búsqueda y selector de ubicación extraído.
- `CountSheetActions.jsx`: Acciones de pie de página para modo conteo puntual y modo cierre diario.
- `CountSheet.jsx`: Refactorizado para admitir `isDailyClose={true}`, integrado con `SubmitDailyCloseDialog` y reducido bajo el límite de 200 líneas.

### Integración en Vistas
- `src/components/EcosystemView.jsx`: Mapeo de subview `daily_close` a `<DailyCloseView />`.
- `src/components/SettingsView.jsx`: Inclusión de `<DailyCloseSettingsForm />` para usuarios con `settings.manage`.

---

## 3. Pruebas Automatizadas
- `src/services/__tests__/inventoryCountsClient.dailyClose.test.js`: 19 pruebas de integración del cliente API.
- `src/components/inventory/dailyClose/__tests__/DailyCloseView.test.jsx`: 9 pruebas de renderizado, selección de fecha, apertura de conteo existente, autovalidación, error con reintento, cierres escalados y retorno recargado a diferencias.
- `src/components/inventory/dailyClose/__tests__/DailyCloseCard.test.jsx`: 7 pruebas cubriendo todos los estados (incluyendo escalado sin enviar con/sin adjust, y escalado enviado).
- `src/components/inventory/dailyClose/__tests__/DifferencesList.test.jsx`: 6 pruebas de visualización de diferencias, causas, bloqueo de validación sin guardar, guardado, autovalidado en solo lectura y escalamiento.
- `src/components/inventory/dailyClose/__tests__/SubmitDailyCloseDialog.test.jsx`: 5 pruebas de confirmación, captura de 409 `SALES_PENDING` con reintento, 409 `RUNFOOD_PENDING` sin reintento, fallo al guardar y tecla Escape.
- `src/components/inventory/dailyClose/__tests__/EscalateDailyCloseDialog.test.jsx`: 4 pruebas de nota obligatoria, escalamiento exitoso, manejo de error y tecla Escape.
- `src/components/inventory/dailyClose/__tests__/DailyCloseSettingsForm.test.jsx`: 2 pruebas de carga y guardado de ajustes.
- `src/components/inventory/dailyClose/__tests__/dailyClosePermissions.test.js`: 6 pruebas de permisos por área, adjust y caso escalado.
- `src/components/inventory/dailyClose/__tests__/dailyCloseCauses.test.js`: 2 pruebas de causas y etiquetas legibles.
- `src/services/__tests__/notificationRoutes.test.js`: 12 pruebas de enrutamiento incluyendo `daily_close`.
- Suite completa Vitest: **121 archivos ejecutados, 883 pruebas aprobadas (100% pasando)**.
- ESLint: **0 errores**, 47 advertencias (exactamente la línea base previa, sin advertencias nuevas).
- Build de producción Vite: **Compilación exitosa** sin errores de empaquetado.

---

## 4. Estándares Cumplidos
- **Límites de tamaño**: Todos los componentes nuevos y modificados tienen menos de 200 líneas (todos entre 11 y 185 líneas).
- **Sin colores fijos**: Se utilizaron exclusivamente tokens semánticos de CSS (`var(--warning)`, `var(--warning-soft)`, `var(--border-warning)`, `var(--bg-card)`, `var(--text)`, `var(--shadow-dialog)`, etc.).
- **Sin emojis**: 0 emojis en código, plantillas, pruebas y documentación.
- **Respeto a las reglas de negocio**: Sin duplicidad de descuento de ventas con RunFood, validación de explicaciones antes de ajustar stock, auto-validación neutralmente señalada y roles claramente delimitados.

---

## 5. Correcciones y Mejoras 31p_fix (Brief 31p_fix)

### Requerimiento 1: Cierre escalado sin enviar
- `src/components/inventory/dailyClose/DailyCloseCard.jsx:45-50`: detección de si el conteo está enviado verificando `submitted_at` si está presente, o `differences_count > 0` como respaldo.
- `src/components/inventory/dailyClose/DailyCloseCardActions.jsx:47-78`: para un cierre `escalated` sin enviar:
  - Si el usuario cuenta con `inventory.adjust`: muestra el botón "Completar conteo", abriendo la planilla `CountSheet` en modo cierre con "Enviar conteo" habilitado.
  - Si el usuario no cuenta con `inventory.adjust`: muestra la etiqueta neutral "Escalado a administración" sin botones de acción.
- `src/components/inventory/counts/CountSheetActions.jsx:80`: verificado que `countStatus !== 'submitted' && countStatus !== 'validated'` permite ver "Enviar conteo" en estado `escalated`.

### Requerimiento 2: Quién valida un escalado
- `src/components/inventory/dailyClose/dailyClosePermissions.js:17-27`: `canValidateLocation(user, location, status)` recibe el parámetro `status`. Si `status === 'escalated'`, exige estrictamente `can(user, ABILITIES.INVENTORY_ADJUST)`.
- `src/components/inventory/dailyClose/DailyCloseView.jsx:117,175`: invoca `canValidateLocation` pasando el estado del conteo (`loc.status` y `activeCountDetail.status`).

### Requerimiento 3: Validar con explicaciones guardadas
- `src/components/inventory/dailyClose/DifferencesList.jsx:38-55`: calcula `serverUnexplainedCount` directamente contra las líneas del motor (`count.lines`) y `hasUnsavedChanges` contrastando el estado local con las líneas del motor.
- `src/components/inventory/dailyClose/DifferencesValidatorActions.jsx:13-23,59-79`: "Validar" permanece deshabilitado si `serverUnexplainedCount > 0` o `hasUnsavedChanges` es verdadero. Si hay cambios locales sin guardar, muestra "Guarda las explicaciones antes de validar.".
- `src/components/inventory/dailyClose/DifferencesList.jsx:29-36`: resincroniza `explanationsState` en `useEffect` cuando `count` cambia tras `onCountUpdated`.

### Requerimiento 4: Estado validado de solo lectura
- `src/components/inventory/dailyClose/DifferencesList.jsx:119,139`: cuando `count.status === 'validated'`, se ocultan los botones "Guardar explicaciones", "Validar" y "Escalar".
- `src/components/inventory/dailyClose/DifferenceRow.jsx:64-78`: cuando `disabled={true}`, no muestra `<select>` ni `<input>`, sino que muestra la causa y explicación en texto plano.

### Requerimiento 5: Volver a las diferencias tras corregir
- `src/components/inventory/dailyClose/DailyCloseView.jsx:26,78-95,103`: maneja `sheetOrigin = 'differences'` al abrir la planilla desde `DifferencesList` ("Corregir conteo"). Pasa `backLabel="Volver a diferencias"` a `CountSheet`. Al presionar volver en `CountSheet`, recarga el detalle con `getCount(activeCountId)` y regresa a la vista de diferencias en lugar del resumen.

### Requerimiento 6: Mensaje y comportamiento de RunFood pendiente (409)
- `src/services/inventoryCountsClient.js:12,288-294`: exporta `RUNFOOD_PENDING_CODE = 'RUNFOOD_PENDING'` y distingue el 409 cuando RunFood todavía no envió las ventas del 409 cuando falta descontarlas (`SALES_PENDING_CODE`).
- `src/components/inventory/dailyClose/SubmitDailyCloseDialog.jsx:64-67`: para `RUNFOOD_PENDING_CODE` muestra el mensaje devuelto por el servidor ("RunFood todavía no envió las ventas del día...") y no muestra el botón "Reintentar". Para `SALES_PENDING_CODE` mantiene el botón "Reintentar".

### Requerimiento 7: Variable de sombra para diálogos
- `src/styles/main.css:52`: incorporada la variable `--shadow-dialog: 0 8px 32px rgba(0, 0, 0, 0.4);` en `:root`.
- `src/components/inventory/dailyClose/SubmitDailyCloseDialog.jsx:86`: `boxShadow: 'var(--shadow-dialog)'`.
- `src/components/inventory/dailyClose/EscalateDailyCloseDialog.jsx:77`: `boxShadow: 'var(--shadow-dialog)'`.
- `src/components/inventory/dailyClose/ValidateConfirmDialog.jsx:36`: `boxShadow: 'var(--shadow-dialog)'`.

### Requerimiento 8 y Modularización (< 200 líneas)
- `DailyCloseCardActions.jsx`: extraído (138 líneas). `DailyCloseCard.jsx` reducido a 152 líneas.
- `DailyCloseHeader.jsx`: extraído (52 líneas). `DailyCloseView.jsx` reducido a 185 líneas.
- `DifferencesHeader.jsx`: extraído (74 líneas). `DifferencesList.jsx` reducido a 185 líneas.
- `DailyCloseSettingsFields.jsx`: extraído (76 líneas). `DailyCloseSettingsForm.jsx` reducido a 152 líneas.

### Cobertura de Pruebas
- Cobertura global de `src/components/inventory/dailyClose/`: **96.53% de líneas** (todas las partes por encima del 91% de líneas, superando el umbral de 80% exigido en cada archivo).
