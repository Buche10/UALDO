# Brief 15a_fix3: evidencia verificable, colores del historial y test de paginación

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library). Rama
`feat/pwa-inventory-notifications`. Commits previos del 15a: `13f0f02` (15a) y `5902259` (15a_fix). El 15a_fix2
está **sin commit** en el árbol de trabajo: construye este brief **encima** de esos cambios, sin descartarlos. **No
toques** el repo del motor.

Lee primero `docs/briefs/15a_fix2_cobertura-colores-y-limpieza.md`, `docs/RESUMEN-15a.md` (sección 7) y
`docs/ualdo-brand.md`.

**Resultado de la auditoría del 15a_fix2 (2026-10-07).** El código está bien:
- lint sin errores, 123 tests, build en verde;
- la cobertura ya mide el 15a (ningún archivo bajo el 70 % de ramas);
- `MovementModal` tiene 211 líneas;
- el código muerto se eliminó;
- los tests de preferencias usan el contrato real;
- las mutaciones 1, 2, 4 y 5 son reales.

Pero el resumen afirma cosas que no son ciertas:

1. **Colores.**
   - El resumen dice que el `grep` de colores sueltos da "0 coincidencias". Da **3**:
     - `src/components/inventory/MovementsHistoryModal.jsx:108`: `rgba(32, 45, 47, 0.5)`;
     - `src/components/inventory/MovementsHistoryModal.jsx:122`: `rgba(16, 185, 129, 0.15)` y
       `rgba(244, 63, 94, 0.15)`;
     - `src/components/inventory/MovementsHistoryModal.jsx:163`: `rgba(32, 45, 47, 0.6)`.
   - Además, el resumen documenta `--success-soft: rgba(34, 197, 94, 0.15)`, pero `src/styles/main.css` define
     `rgba(16, 185, 129, 0.15)`.
2. **Mutación 3.**
   - El resumen dice que cambiar `loadNotifications(1, false)` por `loadNotifications(page, false)` en
     `src/hooks/useNotifications.js` produce un fallo con `"page": 2`. No es así: en ese efecto no existe ninguna
     variable `page`, y el cambio produce `ReferenceError: page is not defined`.
   - La regresión realista, recargar con `loadNotifications(meta.current_page, false)`, **pasa los 4 tests**.
   - El motivo: en `src/hooks/__tests__/useNotifications.test.js`, el test
     `resets page to 1 when category filter changes` simula siempre `meta: { current_page: 1, last_page: 2 }`.
     Después de cargar la página 2, el hook sigue creyendo que está en la 1, así que el test no puede distinguir.

## Objetivo

Que no quede ningún color suelto en inventario ni en avisos. Que el test de reinicio de página detecte la regresión
realista. Y que cada afirmación del resumen se pueda reproducir tal cual.

## Requerimientos

1. **`MovementsHistoryModal.jsx`:** reemplaza los cuatro valores `rgba` por variables de `src/styles/main.css`:
   - `--chip-bg` en la línea 163;
   - `--success-soft` y `--error-soft-strong` en la línea 122;
   - en la línea 108, una variable existente si equivale (`--bg-card` o `--chip-bg`), o una nueva
     `--surface-soft: rgba(32, 45, 47, 0.5)`.

   Si hace falta, agrega `--error-soft-strong: rgba(244, 63, 94, 0.15)`; no cambies el valor de `--error-soft`, que
   usan los avisos. El `grep` de la verificación final no debe devolver nada.
2. **Test de reinicio de página** (`useNotifications.test.js`): la segunda respuesta simulada debe ser la página 2
   real, con `meta: { current_page: 2, last_page: 3 }` y avisos distintos (usa `mockResolvedValueOnce`). Al cambiar
   la categoría, la última llamada debe pedir `page: 1`, y la lista debe contener solo los avisos de esa respuesta,
   sin mezclar los de la página 2.
3. **`docs/RESUMEN-15a.md`, sección 7:**
   - Corrige el valor documentado de `--success-soft` y lista las variables nuevas.
   - Reemplaza la "Verificación por grep" por la salida real del comando, que debe estar vacía, con el código de
     salida.
   - Reescribe la Mutación 3 con el cambio exacto `loadNotifications(meta.current_page, false)` y la salida real
     del test que falla.
   - Agrega una nota "Corrección 15a_fix3" que diga qué se corrigió del resumen anterior.
   - Las salidas de terminal se pegan sin editar, en texto plano y sin símbolos (marcas de verificación, flechas o cruces). Si el comando
     imprime esos símbolos, reemplázalos por `[ok]` y `[x]` e indícalo una sola vez.
   - El estado queda "Pendiente de auditoría".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, datos de prueba, commits o documentación. Íconos solo en SVG (`lucide-react`).
- **Marca:** colores solo vía variables CSS (`docs/ualdo-brand.md`).
- **Evidencia:** no escribas en el resumen ningún resultado que no hayas obtenido ejecutando el comando en este
  estado del código. El auditor repetirá cada comando y cada mutación.
- Sin dependencias nuevas. No toques el cierre de caja, las tareas, el chat ni el login. No cambies el
  comportamiento de ningún componente: solo estilos, el test y la documentación.

## Tests

1. **Mutación A:** en `useNotifications.js`, cambia `loadNotifications(1, false)` por
   `loadNotifications(meta.current_page, false)` en el efecto. El test de reinicio de página debe fallar. Pega la
   salida y restaura.
2. **Mutación B:** en `MovementsHistoryModal.jsx`, deja la lista en "reemplazar" en lugar de "agregar". El test de
   "Cargar más" debe seguir fallando (repite la mutación 2 del fix2 para confirmar que los cambios de estilo no la
   rompieron).
3. Los 123 tests existentes siguen en verde.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/notifications src/components/inventory src/components/InventoryView.jsx; echo "exit=$?"
git status --short
```

## Criterios de aceptación

- [ ] El `grep` de colores sueltos no devuelve nada (`exit=1`).
- [ ] La mutación `loadNotifications(meta.current_page, false)` hace fallar el test de reinicio de página.
- [ ] `docs/RESUMEN-15a.md` coincide con lo que el auditor obtiene al repetir cada comando y mutación, incluido el valor de `--success-soft`.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.
