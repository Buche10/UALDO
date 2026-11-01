# Brief 31p_fix: cierres escalados, validación con explicaciones guardadas y cobertura

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Trabaja en la rama `feat/pwa-cierre-diario-inventario`, sobre el commit `f8ce403` (Brief 31p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del 31p (2026-11-01) dio 855 tests en verde, lint sin errores, build correcto y cero emojis. Pero encontró que un cierre escalado sin enviar queda trabado, que "Validar" se habilita con explicaciones sin guardar y que falta cobertura en la pantalla principal.

**Lee primero:** `docs/briefs/31p_pwa-cierre-diario-de-inventario.md`, `docs/RESUMEN-31p.md` y la sección 3.6 "Cierre diario" de `C:\laragon\www\UaldoBusiness\docs\API-inventory.md`. Del motor, lee también `app/Console/Commands/DailyCloseEscalationCommand.php`: cada día, a la hora límite, escala los cierres del día anterior que siguen en `draft` o `submitted`. Si estaba en `draft`, el conteo queda `escalated` con `submitted_at = null`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; componentes de menos de 200 líneas.

## Objetivo

Administración puede terminar un cierre escalado, haya sido enviado o no. "Validar" solo se habilita cuando todas las explicaciones están guardadas en el motor. El código nuevo del 31p tiene 80 % de cobertura o más.

## Requerimientos

1. **[HIGH] Cierre escalado sin enviar.** Hoy, en `DailyCloseCard.jsx`, un cierre `escalated` solo ofrece "Ver diferencias", que abre una lista vacía, y no hay forma de contar ni de enviar. El motor sí permite que quien tiene `inventory.adjust` complete las líneas y envíe un conteo `escalated` con `submitted_at = null`.
   - Expón `submitted_at` en la decisión. Si el resumen de `GET /inventory/daily-close` no lo trae, usa `differences_count` y el detalle (`getCount`): el conteo no está enviado si `submitted_at` es nulo o alguna línea tiene `difference = null`.
   - Escalado sin enviar y con `inventory.adjust`: botón "Completar conteo", que abre `CountSheet` en modo cierre con "Enviar conteo" visible (`CountSheetActions.jsx:80` hoy lo oculta solo para `submitted` y `validated`; mantenlo así, pero confirma que se ve con `escalated` sin enviar).
   - Escalado sin enviar y sin `inventory.adjust`: etiqueta "Escalado a administración", sin acciones.
   - Escalado y enviado: igual que hoy (diferencias), pero valida solo quien tiene `inventory.adjust`.
2. **[MEDIUM] Quién valida un escalado.** `dailyClosePermissions.js:canValidateLocation` da `true` al jefe del área también en `escalated`, pero el motor exige `inventory.adjust`. Añade un tercer argumento `status`: si es `escalated`, devuelve `can(user, ABILITIES.INVENTORY_ADJUST)`. Úsalo en `DailyCloseView.jsx` (tarjetas y `DifferencesList`).
3. **[MEDIUM] Validar con explicaciones guardadas.** En `DifferencesList.jsx`, `unexplainedCount` se calcula con el estado local, así que "Validar" se habilita antes de guardar y el motor responde `422`.
   - Calcula dos cosas: las explicaciones que faltan en el motor (desde `count.lines`) y si hay cambios locales sin guardar.
   - "Validar" se habilita solo cuando faltan cero en el motor y no hay cambios sin guardar. Si hay cambios, el texto dice "Guarda las explicaciones antes de validar".
   - Al recibir un `count` nuevo por `onCountUpdated`, resincroniza el estado local con sus líneas.
4. **[LOW] Estado validado de solo lectura.** Con `count.status === 'validated'`, oculta "Guardar explicaciones", "Validar" y "Escalar"; muestra las causas como texto.
5. **[LOW] Volver a las diferencias tras corregir.** Cuando el validador abre la planilla con "Corregir conteo", el botón de volver de `CountSheet` debe volver a las diferencias, con el detalle recargado por `getCount`, y no al resumen. Usa la prop `backLabel` que ya existe ("Volver a diferencias").
6. **[LOW] Mensaje de RunFood pendiente.** El motor tiene dos `409` al enviar. `submitCount` les pone el mismo `code` a los dos. Distínguelos: `RUNFOOD_PENDING` para "RunFood todavía no envió las ventas del día..." (muestra el mensaje del motor, sin "Reintentar") y `SALES_PENDING` para "Falta descontar las ventas del día..." (con "Reintentar", como hoy).
7. **[LOW] Sombras.** `EscalateDailyCloseDialog.jsx` y `SubmitDailyCloseDialog.jsx` usan `boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'`. Si `main.css` ya tiene una variable de sombra, úsala. Si no, añade `--shadow-dialog: 0 8px 32px rgba(0, 0, 0, 0.4);` en `:root` y úsala en los dos.
8. Añade la sección "31p_fix" a `docs/RESUMEN-31p.md` con cada cambio y su `archivo:línea`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes. Diferencias con variables de advertencia, nunca en rojo.
- La app oculta, pero el motor decide: cada `403`, `409` o `422` se muestra con el mensaje del motor.
- Seguridad: ids `^\d+$`; textos recortados y validados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas (`DailyCloseCard`, `DailyCloseView`, `DailyCloseSettingsForm` y `DifferencesList` ya están en 197: extrae subcomponentes o helpers antes de crecer), funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera de `src/components/inventory/dailyClose/`, `src/components/inventory/counts/CountSheet*.jsx`, `src/services/inventoryCountsClient.js`, `src/styles/main.css`, sus tests y `docs/RESUMEN-31p.md`.

## Tests

- `DailyCloseView` (hoy tiene 52 % de líneas): empezar conteo (incluido el `409` con `existing_count_id`, que abre el conteo existente), enviar y pasar a diferencias, auto-validado (vuelve al resumen), cambio Hoy/Ayer y error con "Reintentar".
- Escalado sin enviar: con `inventory.adjust` ve "Completar conteo" y puede enviar; sin él ve "Escalado a administración" sin acciones.
- Escalado y enviado: el jefe de cocina no ve "Validar"; administración sí.
- `DifferencesList`: con cambios sin guardar, "Validar" está deshabilitado y muestra "Guarda las explicaciones antes de validar"; tras guardar, se habilita. Validado: sin botones de edición.
- `inventoryCountsClient`: `getDailyCloseSummary` (fecha inválida), `getDailyCloseSettings`, `updateDailyCloseSettings` y los dos `code` de `409`.
- `dailyClosePermissions`: las tres ubicaciones, `inventory.adjust` y el caso `escalated`.
- Cobertura de 80 % o más de líneas en cada archivo de `src/components/inventory/dailyClose/` y en las funciones nuevas de `inventoryCountsClient.js`.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npx vitest run --coverage --coverage.include='src/components/inventory/dailyClose/**' --coverage.reporter=text
cd C:/laragon/www/UALDO && npm run build
```

Lint con 0 errores y no más de 47 advertencias.

## Criterios de aceptación

- [ ] Un cierre escalado automáticamente sin enviar se puede completar y enviar desde la app por quien tiene `inventory.adjust`.
- [ ] Un escalado solo lo valida quien tiene `inventory.adjust`.
- [ ] "Validar" no se habilita con explicaciones sin guardar.
- [ ] Un cierre validado se ve en solo lectura.
- [ ] Tras corregir una cantidad, el validador vuelve a las diferencias recargadas.
- [ ] Los dos `409` de envío se muestran con su propio mensaje.
- [ ] Cobertura de 80 % o más en cada archivo de `dailyClose/`.
- [ ] Lint, tests y build en verde; cero emojis; sin colores fijos.
