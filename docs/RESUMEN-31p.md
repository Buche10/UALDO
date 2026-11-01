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
- `src/services/inventoryCountsClient.js`: Agregados métodos `createDailyClose`, `submitCount`, `saveExplanations`, `validateCount`, `escalateCount`, `getDailyCloseSummary`, `getDailyCloseSettings`, `updateDailyCloseSettings`, constantes `SALES_PENDING_CODE` y `VALID_EXPLANATION_CAUSES`.
- `src/services/notificationRoutes.js`: Habilitada pantalla `daily_close` y `subView: 'daily_close'`.
- `src/components/modules/moduleRegistry.js`: Registrado módulo `daily_close` con capacidades granulares.

### Componentes de Cierre Diario (`src/components/inventory/dailyClose/`)
- `dailyCloseCauses.js`: Lista cerrada de causas válidas con etiquetas legibles en español.
- `dailyClosePermissions.js`: Helpers de verificación de permisos por área para conteo y validación.
- `dailyCloseDates.js`: Utilidades para fechas operativas (hoy y ayer).
- `DailyCloseView.jsx`: Vista principal con selector de fecha, listado de tarjetas y navegación a planilla / diferencias.
- `DailyCloseCard.jsx`: Tarjeta de estado de cada área con badges, montos de diferencia si tiene `inventory.costs`, y acciones disponibles.
- `DifferencesList.jsx`: Vista de diferencias con banner respetuoso, listado de items, formulario de causas/explicaciones y acciones de validador.
- `DifferenceRow.jsx`: Fila individual de diferencia con selector de causa y campo de texto.
- `DifferencesValidatorActions.jsx`: Barra de acciones para el rol validador (corregir, validar, escalar).
- `SubmitDailyCloseDialog.jsx`: Diálogo de confirmación en dos pasos y reintento ante 409 `SALES_PENDING`.
- `ValidateConfirmDialog.jsx`: Diálogo de confirmación de ajuste de stock por diferencias.
- `EscalateDailyCloseDialog.jsx`: Diálogo con motivo obligatorio para escalar a administración.
- `DailyCloseSettingsForm.jsx`: Formulario de configuración de horarios y áreas incluidas.

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
- `src/components/inventory/dailyClose/__tests__/DailyCloseView.test.jsx`: 4 pruebas de renderizado, selección de fecha y estados de tarjeta.
- `src/components/inventory/dailyClose/__tests__/DifferencesList.test.jsx`: 5 pruebas de visualización de diferencias, causas y escalamiento.
- `src/components/inventory/dailyClose/__tests__/SubmitDailyCloseDialog.test.jsx`: 2 pruebas de confirmación y captura de 409 `SALES_PENDING`.
- `src/components/inventory/dailyClose/__tests__/DailyCloseSettingsForm.test.jsx`: 2 pruebas de carga y guardado de ajustes.
- `src/services/__tests__/notificationRoutes.test.js`: 12 pruebas de enrutamiento incluyendo `daily_close`.
- Suite completa Vitest: **117 archivos ejecutados, 855 pruebas aprobadas (100% pasando)**.
- ESLint: **0 errores**, 47 advertencias (exactamente la línea base previa, sin advertencias nuevas).
- Build de producción Vite: **Compilación exitosa** sin errores de empaquetado.

---

## 4. Estándares Cumplidos
- **Límites de tamaño**: Todos los componentes nuevos y modificados tienen menos de 200 líneas.
- **Sin colores fijos**: Se utilizaron exclusivamente tokens semánticos de CSS (`var(--warning)`, `var(--warning-soft)`, `var(--border-warning)`, `var(--bg-card)`, `var(--text)`, etc.).
- **Sin emojis**: 0 emojis en código, plantillas, pruebas y documentación.
- **Respeto a las reglas de negocio**: Sin duplicidad de descuento de ventas con RunFood, validación de explicaciones antes de ajustar stock, auto-validación neutralmente señalada y roles claramente delimitados.
