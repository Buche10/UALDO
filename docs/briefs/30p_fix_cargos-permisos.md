# Brief 30p_fix: cierre de la auditoría de cargos y permisos

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Trabaja en la rama `feat/pwa-cargos-y-permisos`, sobre el commit `56cde64` (Brief 30p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del Brief 30p (2026-11-01) dio tests, lint y build en verde y cero emojis, pero falla dos reglas del brief:

1. El criterio "no quedan `is_owner` fuera de `permissions.js`" no se cumple. Los componentes siguen aceptando la prop `isOwner` como respaldo y `SuggestionChips` todavía decide con `role === 'owner'`.
2. Hay colores fijos (`rgba` y hexadecimales) en componentes nuevos o modificados. El brief los prohíbe: los colores van solo con variables CSS de `src/styles/main.css`.

Además, cualquier `401` muestra "Tu cargo cambió", también cuando la sesión solo venció.

**Lee primero:** `docs/ualdo-brand.md`, `docs/briefs/30p_pwa-cargos-permisos-y-equipo.md`, `docs/RESUMEN-30p.md`, `src/services/permissions.js`, `src/styles/main.css` (líneas 1-72, variables de color) y `C:\laragon\www\UaldoBusiness\docs\API-team.md` (línea 137: el motor responde `401` igual para token ausente, vencido o revocado).

## Objetivo

Ningún componente fuera de `src/services/permissions.js` conoce el concepto de dueño: todo se decide con `can()` y props de permiso concretas. Los componentes del 30p no tienen colores fijos. El aviso de sesión no afirma algo que la app no sabe.

## Requerimientos

1. **Quitar `isOwner` y `role === 'owner'` de los componentes.** Elimina la prop `isOwner` y su respaldo `canX !== undefined ? canX : Boolean(isOwner)`. Cada componente recibe solo su prop de permiso, con valor por defecto `false`:
   - `src/components/inventory/counts/CountsView.jsx:8,12,26`: solo `canCount`.
   - `src/hooks/useCounts.js:7-8`: solo `canCount`.
   - `src/components/inventory/InventoryHeaderActions.jsx:26,33-36`: solo `canManageSettings`, `canManagePurchases` y `canCount`.
   - `src/components/inventory/production/ProductionView.jsx:15,55` y `ProductionRunDetail.jsx:66,80-81`: solo `canSeeCosts` y `canVoid`.
   - `src/components/supplyRequests/requestUi.js:81-82` (`availableActions` recibe `{ canDecide, userId }`), `ShoppingListPanel.jsx:13-14`, `SupplyRequestDetail.jsx:74-75,132,171-173,189`, `SupplyRequestList.jsx:9-10` y `SupplyRequestsView.jsx:24-25,45-46,81,91,103,114`: solo `canDecide`.
   - `src/components/assistant/SuggestionChips.jsx:17-20`: quita la prop `role`; decide con `can(user, ABILITIES.SUPPLY_DECIDE)` (sin usuario, `false`). En `src/components/assistant/AssistantChat.jsx:123-126` deja de pasar `role`. Si `userRole` ya no se usa en `AssistantChat.jsx`, elimínalo.
   - `SupplyRequestsView` recibe `onBack` desde `EcosystemView.jsx:104` pero no lo usa: quita la prop en `EcosystemView` (la vuelta ya la da el botón "Volver a módulos").
2. **Actualizar los tests que usan `isOwner`.** Reemplaza `isOwner` por la prop de permiso equivalente en: `CountsView.test.jsx`, `ProductionRunDetail.test.jsx`, `ProductionView.test.jsx`, `SupplyReminderSettings.test.jsx`, `SupplyRequestAuditoriaFixes.test.jsx`, `SupplyRequestEdgeCases.test.jsx`, `SupplyRequestReviewFixes.test.jsx`, `SupplyRequestsView.test.jsx`, `useCounts.test.js` y los tests de `SuggestionChips`. Los tests de `is_owner` en `permissions.test.js`, `App.test.jsx`, `EcosystemView.test.jsx`, `ModuleGrid.test.jsx`, `CashCloseView.test.jsx`, `CashConfigView.test.jsx` e `InventoryView.test.jsx` se mantienen si prueban el respaldo de `can()` con un usuario sin `abilities`. Revisa cada uno.
3. **Colores con variables CSS.** Reemplaza cada color fijo por una variable de `src/styles/main.css`:
   - `src/components/modules/ModuleCard.jsx:37` `rgba(0, 115, 127, 0.2)`.
   - `src/components/Header.jsx:64` `rgba(32, 45, 47, 0.75)` por `var(--bg-card)`; `Header.jsx:83` `#ffffff` por `var(--on-primary)`.
   - `src/components/settings/TeamMemberRow.jsx:55` `rgba(32, 45, 47, 0.45)` por `var(--surface-soft)`; `:58` `rgba(0, 115, 127, 0.25)` y `:85` `rgba(0, 115, 127, 0.15)`; `:102` `rgba(244, 63, 94, 0.1)` por `var(--error-soft)`.
   - `src/components/settings/TeamSection.jsx:87` `rgba(244, 63, 94, 0.1)` por `var(--error-soft)`.
   - Los tonos petróleo suave (`rgba(0, 115, 127, 0.15 a 0.25)`) no tienen variable. Añade una sola en `:root` de `main.css`, `--primary-soft: rgba(0, 115, 127, 0.2);`, y úsala en los tres casos. No crees más variables.
4. **Aviso de sesión neutro.** El motor no distingue un `401` por cargo cambiado de uno por token vencido. En `src/services/apiClient.js:116-123` y en el valor por defecto de `src/App.jsx:76`, cambia el texto a "Tu sesión terminó o tu cargo cambió. Inicia sesión otra vez." Mantén un solo origen del texto: expórtalo como constante desde `apiClient.js` y úsalo en `App.jsx`. Ajusta `App.test.jsx`.
5. **Doble botón de volver.** `CashCloseView.jsx:65-68` pinta su propio botón cuando recibe `onBack`, y `EcosystemView` ya pinta "Volver a módulos". En `EcosystemView.jsx`, deja de pasar `onBack` a `CashCloseView`, como en el punto 1.
6. Actualiza `docs/RESUMEN-30p.md` con una sección "30p_fix" que liste cada cambio con su `archivo:línea`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Conserva las tildes.
- La app oculta, pero el motor decide: cada `403` del motor se sigue mostrando con un mensaje claro.
- Seguridad: ids `^\d+$`; roles en lista cerrada; sin `dangerouslySetInnerHTML`, `alert` ni `confirm`; errores sin datos sensibles.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera de los listados.

## Tests

- `SuggestionChips`: con `supply.decide` ve "Qué hay que comprar"; sin él, "Reportar faltantes"; sin usuario, "Reportar faltantes".
- `availableActions` sin `canDecide` no ofrece acciones de decisión.
- `App`: un `401` muestra "Tu sesión terminó o tu cargo cambió. Inicia sesión otra vez." en el login.
- Los componentes del punto 1 sin su prop de permiso no muestran las acciones restringidas.
- Cobertura de 80 % o más del código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && grep -rn "is_owner\|role === 'owner'\|isOwner" src --include=*.js --include=*.jsx | grep -v __tests__ | grep -v "src/services/permissions.js"
cd C:/laragon/www/UALDO && grep -nE "rgba?\(|#[0-9a-fA-F]{3,6}\b" src/components/modules/ModuleCard.jsx src/components/Header.jsx src/components/settings/TeamMemberRow.jsx src/components/settings/TeamSection.jsx
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Los dos `grep` deben salir vacíos. El lint debe tener 0 errores y no más de 47 advertencias.

## Criterios de aceptación

- [ ] No quedan `is_owner`, `role === 'owner'` ni `isOwner` fuera de `src/services/permissions.js` (salvo tests del respaldo de `can()`).
- [ ] Ningún componente del 30p tiene colores fijos; solo existe una variable nueva, `--primary-soft`.
- [ ] El aviso de `401` es "Tu sesión terminó o tu cargo cambió. Inicia sesión otra vez." y su texto vive en un solo lugar.
- [ ] Caja y Pedidos tienen un solo botón para volver.
- [ ] `docs/RESUMEN-30p.md` documenta el fix.
- [ ] Lint, tests y build en verde; cero emojis.
