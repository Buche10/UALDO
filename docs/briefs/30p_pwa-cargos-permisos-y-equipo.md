# Brief 30p: cargos, permisos y equipo en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-cargos-y-permisos` desde `main` **después de fusionar en `main` las ramas de los Briefs 23p a 27p** (hoy `main` está en el 22p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 30 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\30_roles-y-permisos-por-area.md`. Léelo completo junto con `C:\laragon\www\UaldoBusiness\docs\API-team.md`.

**Por qué.** El motor ahora tiene siete cargos (dueño, administración, jefe de cocina, jefe de salón, cocina, salón y personal sin área) y expone en `capabilities` el cargo, el área y la lista `abilities`. La app decide hoy todo con `capabilities.is_owner` o `role === 'owner'`, por ejemplo en `EcosystemView.jsx:63`, `CashCloseView.jsx:12`, `CashConfigView.jsx:10`, `InventoryHeaderActions.jsx` y `CountsView.jsx`. Con los cargos nuevos, un jefe de salón vería pantallas vacías o con `403`, y administración no vería nada. Además, el dueño necesita asignar cargos desde la app. Este brief es la base de los Briefs 31p a 40p.

**Lee primero:** `docs/ualdo-brand.md`; `docs/briefs/26p_pwa-faltantes-del-dia-y-compras.md` (formato y reglas); `src/services/auth.js`; `src/components/EcosystemView.jsx`; `src/components/SettingsView.jsx`; `src/components/assistant/SuggestionChips.jsx`; `src/components/assistant/useAssistantConversation.js`; y el resultado de `grep -rn "is_owner\|role === 'owner'\|isOwner" src`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS de `src/styles/main.css` (sin `rgba` ni hexadecimales en componentes); todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

La app muestra y oculta cada pantalla y acción según los permisos que da el motor, con una sola función `can(user, ability)`. El dueño ve a su equipo en Ajustes y cambia el cargo de cada persona. El área Negocios tiene una portada con las tarjetas de los módulos que el usuario puede usar.

## Requerimientos

1. **Permisos.** Nuevo `src/services/permissions.js`:
   - `ABILITIES`: objeto congelado con los 33 permisos del Brief 30.
   - `can(user, ability)`: lee `user.capabilities.abilities`. Si el arreglo no existe (motor viejo), usa como respaldo `is_owner`: el dueño puede todo y el resto solo `supply.request`, `inventory.view`, `inventory.move` y `withdrawals.declare`.
   - `canAny(user, abilities)`, `roleLabel(user)` y `userArea(user)`.
2. **Reemplazo.** Sustituye cada `is_owner`, `role === 'owner'` e `isOwner` por `can` con el permiso equivalente, según la tabla del Brief 30:
   - Ventas: `sales.totals`. Caja: `cash.review`. Configuración de caja: `settings.manage`.
   - Compras y proveedores: `purchases.manage`. Costos: `inventory.costs`.
   - Conteos: `inventory.count.*` por ubicación. Pedidos: `supply.decide`. Recetas y mapeo de RunFood: `settings.manage`.
   - Donde un componente recibe la prop `isOwner`, cámbiala por props de permiso concretas (`canDecide`, `canSeeCosts`) para no arrastrar el concepto de dueño.
   - Lista cada reemplazo (archivo:línea) en la descripción del commit o en `docs/RESUMEN-30p.md`.
3. **Portada de Negocios.** `EcosystemView` deja de tener la barra fija `SUB_TABS`:
   - La vista `overview` muestra una cuadrícula de tarjetas (`src/components/modules/ModuleGrid.jsx` y `ModuleCard.jsx`) con icono `lucide-react`, nombre y una línea de descripción.
   - Cada tarjeta declara su permiso en `src/components/modules/moduleRegistry.js` (id, etiqueta, icono, permisos con `canAny`, subvista). Arranca con Inventario, Pedidos, Cierre de caja y Ventas.
   - Los Briefs 31p a 40p añaden sus tarjetas solo editando el registro.
   - La tarjeta de Doble Filo (`DobleFiloCard`) se mantiene arriba.
   - Navegar a una subvista sin permiso muestra el estado "Acceso restringido" con el texto "Esta sección le corresponde a {cargo que la tiene}".
4. **Equipo.** Nuevo `src/services/teamClient.js` (`listTeam(page)` y `updateRole(userId, role)`; id validado `^\d+$`; rol dentro de la lista de los siete). En Ajustes, solo con `team.manage`, sección "Equipo":
   - Lista con nombre, cargo y área.
   - Selector de cargo con confirmación en dos pasos ("{Nombre} pasará a {cargo}. Tendrá que volver a iniciar sesión.").
   - Muestra el `422` del motor ("El negocio debe tener al menos un dueño.") tal cual.
   - Componentes: `TeamSection.jsx` y `TeamMemberRow.jsx` en `src/components/settings/`.
5. **Sesión.** Si el motor responde `401` porque el cargo cambió (tokens revocados), la app vuelve al login con el aviso "Tu cargo cambió. Inicia sesión otra vez." Usa el manejo de `401` que ya existe en `apiClient`; no lo dupliques.
6. **Cabecera y chat.** `Header.jsx` muestra el cargo (`roleLabel`) bajo el nombre. `SuggestionChips.jsx` elige los accesos por permisos y no por `role`: `supply.decide` ve "Qué hay que comprar"; quien no lo tiene ve "Reportar faltantes".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Conserva las tildes.
- La app oculta, pero el motor decide: nunca uses los permisos de la app como única protección; cada `403` del motor se muestra con un mensaje claro.
- Seguridad: ids `^\d+$`; valores de rol en lista cerrada; sin `dangerouslySetInnerHTML`; errores sin datos sensibles.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- `permissions.js`: `can` con `abilities`, el respaldo sin `abilities` (dueño y personal) y `roleLabel`.
- `ModuleGrid`: un `lounge_staff` no ve Ventas ni Cierre; un `lounge_head` ve Cierre; `admin` ve todo menos Equipo.
- Subvista sin permiso muestra "Acceso restringido".
- Equipo: oculto sin `team.manage`; el cambio de cargo pide confirmación en dos pasos, llama a `updateRole` y muestra el `422`.
- `teamClient`: rutas, validación de id y rol.
- Los tests existentes que usaban `is_owner` pasan con `abilities` y con el respaldo.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Toda decisión de acceso usa `can()`; no quedan `is_owner` fuera de `permissions.js`.
- [ ] Negocios tiene una portada de módulos filtrada por permisos y fácil de extender.
- [ ] El dueño gestiona cargos desde Ajustes, con confirmación.
- [ ] La cabecera muestra el cargo y los accesos del chat dependen de los permisos.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
