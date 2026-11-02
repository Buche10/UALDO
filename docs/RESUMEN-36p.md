# Resumen de implementación - Brief 36p: horas extra en la app

## Resumen del trabajo realizado

Se implementó el flujo completo de horas extra en la PWA de Ualdo Negocios siguiendo las especificaciones del Brief 36p y el contrato de API `UaldoBusiness/docs/API-overtime.md`.

### 1. Cliente API (`src/services/overtimeClient.js`)
- `createOvertime(data, clientUuid)`:
  - Valida localmente que las horas sean mayores a 0 y hasta 12, estrictamente en pasos de 0,25.
  - Valida que la fecha de trabajo (`work_date`) esté entre hoy y hasta 7 días atrás (nunca futura).
  - Valida que se envíe o bien `worker_user_id` o `worker_name` (2 a 80 caracteres), nunca ambos ni ninguno.
  - Valida longitud máxima de 300 caracteres para `note`.
  - Soporta idempotencia con `client_uuid`.
- `voidOvertime(id, reason)`:
  - Valida identificador numérico positivo y motivo obligatorio entre 5 y 300 caracteres.
  - Envía `POST /api/v1/overtime/{id}/void`.
- `listOvertime(filters)`:
  - Soporta paginación y filtros por `from`, `to`, `area` y `worker`.
- `listOvertimeWorkers(area)`:
  - Consulta `GET /api/v1/overtime/workers?area=` y desenvuelve el listado de colaboradores activos.
- `getOvertimeSummary(month)`:
  - Valida formato `AAAA-MM` no futuro y consulta `GET /api/v1/overtime/summary?month=`.

### 2. Módulos y Navegación
- **`moduleRegistry.js`**:
  - Añadida tarjeta "Horas extra" con permisos `[overtime.register.kitchen, overtime.register.lounge, overtime.report]` y subvista `overtime`.
- **`EcosystemView.jsx`**:
  - Conectada la subvista `overtime` renderizando `<OvertimeView user={user} initialMonth={...} onBack={...} />`.
- **`notificationRoutes.js`**:
  - Añadidos destinos `'overtime'` y `'horas_extra'` a la lista blanca `ALLOWED_SCREENS` y `ALLOWED_SUBVIEWS`.
  - Soporte de sanitización para `params.mes` y `params.month` con formato `AAAA-MM`.
  - Respaldo de aviso: si llega `inventario` con `params.subView: 'overtime'`, navega a `overtime`.
- **`SuggestionChips.jsx`**:
  - Para usuarios con permisos `overtime.register.kitchen` o `overtime.register.lounge`, añade el chip "Registrar horas extra" con el prompt "Quiero registrar horas extra".

### 3. Componentes de interfaz (`src/components/overtime/`)
- **`OvertimeView.jsx`**:
  - Navegación por pestañas: "Registrar" (si puede registrar), "Registros" (todos) y "Mes" (solo `overtime.report`).
  - Navegación inicial a "Mes" si se pasa `initialMonth`.
- **`OvertimeForm.jsx`**:
  - Selector de área para administración/dueño; área automática para jefes de área.
  - Selección de trabajador del equipo (`listOvertimeWorkers`) o "Otra persona" con nombre libre.
  - Fecha prellenada con hoy (mínimo 7 días atrás, máximo hoy).
  - Botones rápidos de horas (1 h, 2 h, 3 h) e input numérico en pasos de 0,25.
  - Manejo de error 409 de registro duplicado con componente `OvertimeConflictBanner`, ofreciendo "Anular y registrar de nuevo".
- **`OvertimeList.jsx`**:
  - Lista paginada con `usePagedList`.
  - Filtros por fechas (`from`/`to`), trabajador y área (para administradores).
  - Bloque superior con total de horas acumuladas en el filtro.
- **`OvertimeCard.jsx`**:
  - Muestra datos del registro, badge de área, estado de anulación con su motivo.
  - Botón "Anular" visible solo para autor dentro de los 7 días o usuarios con `overtime.report`.
- **`VoidOvertimeModal.jsx`**:
  - Modal accesible con confirmación y motivo obligatorio de mínimo 5 caracteres.
- **`OvertimeSummary.jsx` & `OvertimeSummaryWorkerCard.jsx`**:
  - Selector de mes no futuro.
  - Resumen con total de horas y cantidad de colaboradores.
  - Tarjeta por persona con desglose desplegable día a día al tocar la tarjeta.

### 4. Restricciones y Verificaciones
- **Cero Dinero**: Ninguna pantalla, componente ni texto muestra precios, tarifas, nómina ni el símbolo `$`.
- **Cero Emojis**: Verificado en código, componentes, tests y commits. Iconos exclusivamente en SVG (`lucide-react`).
- **Límites de tamaño**: Todos los componentes < 200 líneas (todos < 175 líneas), funciones < 50 líneas.
- **Estilos**: Colores exclusivamente mediante variables CSS (`var(--primary)`, `var(--accent)`, `var(--warning)`, `var(--error)`, etc.).
- **Tests**:
  - 34 tests nuevos para cliente y componentes de horas extra.
  - Cobertura de código nuevo superior al 90%.
  - ESLint: 0 errores, 47 warnings (mismo baseline que el commit inicial).
  - Build de Vite exitoso.
