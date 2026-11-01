# Brief 31p: cierre diario de inventario en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-cierre-diario-inventario` desde `main` con el Brief 30p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 31 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\31_cierre-diario-de-inventario-por-area.md`. Léelo completo junto con la sección "Cierre diario" de `C:\laragon\www\UaldoBusiness\docs\API-inventory.md`.

**Por qué.** El dueño pide un conteo al final del día por área, con explicación de cada diferencia y validación del jefe. El motor ahora tiene conteos `daily_close` con estados `draft → submitted → validated` (o `escalated`), explicaciones por línea y un resumen del día. La planilla de conteo actual (`src/components/inventory/counts/`, Brief 19p) solo conoce `draft` y `applied`.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/inventory/counts/*`; `src/hooks/useCounts.js`, `useCountSheet.js`, `useCountSheetAutosave.js`, `useApplyCount.js`; `src/services/inventoryCountsClient.js`; `src/services/permissions.js` y `src/components/modules/moduleRegistry.js` (Brief 30p).

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Quien cuenta un área abre "Cierre del día", ve qué áreas puede contar, carga la planilla (reutilizando la del 19p) y la envía. Si hay diferencias, cada una pide causa y explicación. El jefe del área revisa, corrige una cantidad si hace falta, valida o escala. El dueño y administración ven el estado de todas las áreas del día.

## Requerimientos

1. **Cliente.** En `inventoryCountsClient.js` añade:
   - `createDailyClose(location, businessDate)`, `submitCount(id)`, `saveExplanations(id, lines)`, `validateCount(id)` y `escalateCount(id, note)`.
   - `getDailyCloseSummary(date)`, `getDailyCloseSettings()` y `updateDailyCloseSettings(data)`.
   - Fecha `AAAA-MM-DD` real; causas en la lista cerrada del Brief 31; explicación de hasta 500 caracteres.
   - Un `409` de "falta descontar las ventas" se devuelve con un `code` propio para mostrarlo bien.
2. **Pantalla "Cierre del día"** (`src/components/inventory/dailyClose/`, tarjeta nueva en `moduleRegistry` con `canAny` de `inventory.count.*` y `inventory.validate.*`):
   - `DailyCloseView.jsx`: fecha (hoy por defecto, puede ir a ayer) y una tarjeta por ubicación permitida con estado ("Sin empezar", "Contando", "Enviado: 3 diferencias por explicar", "Validado", "Escalado"), quién contó y quién validó (primer nombre).
   - Con `inventory.costs`, la tarjeta muestra el valor de las diferencias. "Validado por quien contó" se ve como etiqueta neutra.
   - Botón "Empezar conteo" crea el cierre y abre la planilla existente (`CountSheet`) en modo cierre. El autoguardado se mantiene.
   - "Enviar conteo" con confirmación de dos pasos ("Se calcularán las diferencias con el sistema"). El `409` de ventas muestra "Falta descontar las ventas del día. Intenta de nuevo en unos minutos." con botón "Reintentar".
3. **Diferencias** (`DifferencesList.jsx` y `DifferenceRow.jsx`):
   - Tras enviar, lista solo las líneas con diferencia: insumo, contado, sistema y diferencia con signo y unidad (formato de `quantityFormat.js`).
   - Selector de causa y campo de explicación (obligatoria con "Otro"). "Guardar explicaciones" envía todas juntas.
   - Mensaje fijo arriba, en tono respetuoso: "Una diferencia no es una falta. Cuéntanos qué pasó para corregirlo."
4. **Validación** (solo con `inventory.validate.{ubicación}` o `inventory.adjust` en bodega):
   - En `submitted`, el validador puede corregir una cantidad contada (reutiliza la edición de la planilla); al guardar, la explicación de esa línea se limpia.
   - "Validar" se deshabilita mientras falten explicaciones e indica cuántas faltan; la confirmación dice "Se ajustará el inventario por {n} diferencias".
   - "Escalar a administración" pide una nota.
5. **Ajustes** (solo `settings.manage`, dentro de Ajustes): hora del recordatorio, hora límite y áreas incluidas. Componente `DailyCloseSettingsForm.jsx`.
6. **Avisos.** Un aviso con `action.screen = inventario` y `params.subView = daily_close` abre esta pantalla. Ajusta `notificationRoutes.js` y su test.
7. Los conteos `adhoc` (Brief 19p) siguen funcionando igual desde Inventario.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes. Las diferencias negativas no van en rojo alarmante: usa las variables de advertencia existentes.
- La app oculta, pero el motor decide: cada `403` o `422` se muestra con el mensaje del motor.
- Seguridad: ids `^\d+$`; textos recortados y validados antes de enviar; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (reutiliza la planilla del 19p, no la copies).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: rutas, validaciones y el `code` del `409`.
- `DailyCloseView`: un `kitchen_head` ve solo cocina; un `lounge_staff` ve salón sin botón de validar; el dueño ve todo con valores.
- Flujo: empezar, enviar, ver diferencias, explicar, validar (el botón se habilita al completar las explicaciones).
- Corrección de cantidad por el validador limpia la explicación.
- Escalar exige nota.
- El `409` de ventas muestra el mensaje y "Reintentar".
- Ruta de aviso a `daily_close`.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Cada cargo ve y hace solo lo que le toca en el cierre del día.
- [ ] Las diferencias se explican con causa y el jefe valida o escala.
- [ ] El dueño ve el estado de todas las áreas, con valores si tiene permiso.
- [ ] El aviso de cierre abre la pantalla.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
