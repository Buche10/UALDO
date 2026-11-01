# Resumen de Construcción - Brief 30p: Cargos, Permisos y Equipo en la PWA

## 1. Visión General
Implementación completa del control de acceso basado en habilidades (abilities) y cargos (roles) para la PWA de Ualdo, alineado con el motor de Laravel (Brief 30).
Se eliminó la dependencia exclusiva de la bandera binaria `is_owner` en toda la aplicación, reemplazándola por una matriz granular de 33 habilidades (`ABILITIES`), manteniendo compatibilidad retroactiva para sesiones previas.

---

## 2. Matriz de Habilidades y Permisos (`src/services/permissions.js`)

### Cargos (`ROLES`) y Etiquetas
- `owner`: Dueño
- `admin`: Administrador
- `kitchen_head`: Jefe de cocina
- `lounge_head`: Jefe de salón
- `kitchen_staff`: Cocinero
- `lounge_staff`: Garzón
- `staff`: Personal

### Áreas (`userArea`)
- `owner`, `admin`: Todas las áreas (`all`)
- `kitchen_head`, `kitchen_staff`: Cocina (`kitchen`)
- `lounge_head`, `lounge_staff`: Salón (`lounge`)
- `staff`: Sin área asignada (`none`)

### Catálogo de 33 Habilidades (`ABILITIES`)
- **Inventario**: `inventory.read`, `inventory.write`, `inventory.manage`, `inventory.costs`, `inventory.transfer`, `inventory.count.create`, `inventory.count.read`, `inventory.count.apply`, `inventory.count.cancel`
- **Producción**: `production.view`, `production.record`, `production.void`
- **Cierre Diario**: `daily_close.view`, `daily_close.count`, `daily_close.send`, `daily_close.validate`
- **Retiros**: `withdrawal.create`, `withdrawal.close`, `withdrawal.cancel`
- **Compras**: `purchases.read`, `purchases.manage`, `purchases.receive`
- **Pedidos**: `supply.create`, `supply.decide`
- **Caja**: `cash.operate`, `cash.close_shift`, `cash.review`, `cash.open_shift`
- **Ventas**: `sales.view`, `sales.manage`
- **Equipo y Configuración**: `team.read`, `team.manage`, `settings.manage`

### Función `can(user, ability)`
- Verifica la presencia de `ability` en `user.abilities` (o `user.permissions`).
- Si no están presentes en el token o usuario (sesión previa), aplica fallback retroactivo basado en `capabilities.is_owner === true` o `role === 'owner'`.

---

## 3. Nuevos Componentes y Servicios

1. `src/services/permissions.js`
   - Matriz de habilidades por cargo.
   - Funciones `can(user, ability)`, `canAny(user, abilities)`, `roleLabel(user)`, `userArea(user)`.
2. `src/services/teamClient.js`
   - `listTeam(page)`: Consulta paginada a `/api/v1/team`.
   - `updateRole(userId, role)`: Actualización de cargo vía `PATCH /api/v1/team/{id}/role` con validación de id (`^\d+$`) y roles permitidos.
3. `src/components/modules/moduleRegistry.js`
   - Registro desacoplado de módulos con icono, título, descripción, cargo responsable y permisos asociados.
   - Módulos iniciales: Inventario, Pedidos internos, Cierre de caja, Ventas del día.
4. `src/components/modules/ModuleCard.jsx`
   - Tarjeta estilo glassmorphism interactiva, con badge de cargo, icono y descripción accesible.
5. `src/components/modules/ModuleGrid.jsx`
   - Cuadrícula responsiva que filtra módulos según `canAny(user, module.permissions)`.
6. `src/components/settings/TeamMemberRow.jsx`
   - Fila de miembro del equipo con avatar, nombre, email, área y selector de cargo.
   - Confirmación en dos pasos: `"{Nombre} pasará a {cargo}. Tendrá que volver a iniciar sesión."` con botón pastilla.
   - Muestra error directo del servidor 422 (e.g. `El negocio debe tener al menos un dueño.`).
7. `src/components/settings/TeamSection.jsx`
   - Sección de gestión del equipo en Ajustes, con estados de carga, reintento y paginación "Cargar más".

---

## 4. Auditoría y Reemplazo de `is_owner` Archivo por Archivo

| Archivo | Reemplazo Realizado | Justificación |
|---|---|---|
| `src/components/EcosystemView.jsx` | Se eliminó la barra fija de subpestañas por `ModuleGrid` en vista general. Se agregó pantalla de restricción de acceso con aviso del cargo correspondiente (`canAny(user, module.permissions)`). | Los módulos ahora se muestran según las habilidades del usuario. |
| `src/components/CashCloseView.jsx` | Reemplazo de `isOwner` por `can(currentUser, ABILITIES.CASH_REVIEW)`. | Jefe de cocina y salón no revisan el arqueo del dueño/admin. |
| `src/components/cashconfig/CashConfigView.jsx` | Reemplazo de `isOwner` por `can(currentUser, ABILITIES.SETTINGS_MANAGE)`. | Solo dueño/admin configuran formas de pago y comisiones. |
| `src/components/InventoryView.jsx` | Se sustituyó `isOwner` por `canManageSettings` (`SETTINGS_MANAGE`), `canManagePurchases` (`PURCHASES_MANAGE`), `canCount` (`INVENTORY_COUNT_READ`), `canSeeCosts` (`INVENTORY_COSTS`), `canVoidProduction` (`PRODUCTION_VOID`). | Desacople de privilegios de insumos, costos, compras y recetas. |
| `src/components/inventory/InventoryHeaderActions.jsx` | Reemplazo de prop `isOwner` por `canManageSettings`, `canManagePurchases`, `canCount` con fallback retroactivo. | Control de visibilidad de botones "Nuevo Insumo", "Compras", "Conteos" y "Recetas". |
| `src/hooks/useCounts.js` y `CountsView.jsx` | Soporte de prop `canCount` (`INVENTORY_COUNT_READ`) con fallback a `isOwner`. | Control de acceso al módulo de conteos físicos. |
| `src/components/inventory/production/ProductionView.jsx` y `ProductionRunDetail.jsx` | Control de visualización de costos vía `canSeeCosts` (`INVENTORY_COSTS`) y anulación vía `canVoid` (`PRODUCTION_VOID`). | Personal de cocina ve recetas y registra tandas sin ver costos. |
| `src/components/supplyRequests/SupplyRequestsView.jsx`, `SupplyRequestDetail.jsx`, `SupplyRequestList.jsx`, `ShoppingListPanel.jsx`, `requestUi.js` | Incorporación de prop `canDecide` (`SUPPLY_DECIDE`) manteniendo `isOwner` como fallback. | Jefes de área y dueños pueden aprobar o rechazar pedidos; garzones/cocineros solo solicitan. |
| `src/components/Header.jsx` | Renderiza `roleLabel(currentUser)` bajo el nombre del usuario autenticado. | Identidad y cargo visible para el usuario. |
| `src/components/assistant/SuggestionChips.jsx` y `AssistantChat.jsx` | Sugerencias basadas en `can(user, ABILITIES.SUPPLY_DECIDE)` ("Qué hay que comprar" vs "Reportar faltantes"). | Sugerencias pertinentes al rol. |
| `src/components/SettingsView.jsx` | Renderiza `<TeamSection />` condicionado a `can(currentUser, ABILITIES.TEAM_MANAGE)`. | Solo dueños y administradores pueden gestionar el equipo y cambiar cargos. |
| `src/services/apiClient.js`, `src/App.jsx`, `src/components/LoginView.jsx` | Al recibir un 401, el cliente API emite el evento `ualdo:unauthorized` con el mensaje: `'Tu cargo cambió. Inicia sesión otra vez.'`. `App.jsx` captura el evento, limpia la sesión y pasa el mensaje a `LoginView`. | Re-autenticación obligatoria e intuitiva tras cambio de cargo. |

---

## 5. Pruebas y Validación
- **Tests unitarios y de componentes**: 821 pasados de 821 (112 suites de test ejecutadas sin errores).
- **Linter**: 0 errores, 47 advertencias estándar idénticas a la línea base.
- **Build de producción**: Vite compiló exitosamente (`dist/`) sin errores.
- **Reglas de estilo y seguridad**: Cero emojis, uso estricto de variables CSS, componentes bajo 200 líneas y diseño de botones pastilla (`border-radius: 9999px`).
