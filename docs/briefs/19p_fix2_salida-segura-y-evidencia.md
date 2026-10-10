# Brief 19p_fix2: salida segura de la planilla, test de rendimiento real y evidencia

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9). Rama
`feat/pwa-inventory-locations`, con los Briefs 19p y 19p_fix construidos y **sin commit**. No toques el motor.

La auditoría del 19p_fix (2026-10-09) confirmó:
- en verde: `lint` (0 errores), `test` (57 archivos, 396 tests), `test:coverage` y `build:prod`;
- la tabla de cobertura del resumen coincide con la salida real, y todos los archivos nuevos superan el 80 %;
- guardias limpias: sin colores directos, sin `bodega`/`salon`, sin `localStorage`, sin emojis, sin tildes perdidas y
  componentes de menos de 250 líneas;
- corregidos y protegidos por tests: la carrera del guardado (CRITICAL), los errores por tanda, la cancelación del
  borrador, el estado tras aplicar, el umbral de 20 insumos distintos, el guardado al pasar a segundo plano y el
  cálculo de la diferencia en el cliente. El auditor repitió 10 mutaciones y 9 fallaron.

Quedan estos problemas.

**Lee primero:** `docs/briefs/19p_fix_planilla-de-conteo-y-evidencia.md` (sigue vigente), `docs/ualdo-brand.md`,
`src/hooks/useCountSheet.js`, `src/components/inventory/counts/CountSheet.jsx`,
`src/components/inventory/counts/CountSheetRow.jsx`, `src/services/inventoryCountsClient.js` y sus tests.

## Objetivo

Que salir de la planilla nunca pierda cambios, que el test de rendimiento proteja de verdad la planilla real, que una
cantidad mal escrita no bloquee el guardado de las demás sin decir cuál es, y que el resumen tenga solo salidas
reales.

## Requerimientos

### 1. HIGH: "Volver a conteos" sale sin guardar si el estado no es "dirty"

`CountSheet.jsx:58-64` solo guarda cuando `saveStatus === 'dirty'`:
- si el último guardado falló (`saveStatus === 'error'`), las líneas siguen sucias pero se sale sin guardar y se
  pierden;
- si hay un guardado en curso (`'saving'`), se sale y se pierden las ediciones hechas durante ese guardado.

Corrige:
- la decisión se basa en si **hay líneas sucias** (expón `hasPendingChanges` desde `useCountSheet`), no en el estado;
- `savePendingLines` con un guardado en curso no devuelve `false`: espera a que termine (guarda la promesa en curso
  en una ref) y, si quedan líneas sucias, guarda otra vez. Así también funcionan bien "Aplicar" y el paso a segundo
  plano durante un guardado;
- si el guardado falla, muestra el error y no salgas (como ya hace con `'dirty'`).

Tests (primero en rojo):
- con un guardado fallido y líneas sucias, "Volver a conteos" llama a `saveCountLines` y no llama a `onBack` si vuelve
  a fallar;
- con un guardado en curso (promesa controlada) y una edición nueva, "Volver" espera, guarda la edición nueva y recién
  entonces sale;
- pasar a segundo plano durante un guardado guarda lo pendiente cuando ese guardado termina.

### 2. HIGH: el test de rendimiento no prueba la planilla

`CountSheetRow.test.jsx:83-147` envuelve la fila en su **propio** `React.memo` (`RowWrapper`) y usa su **propio**
`useCallback`. El auditor quitó `memo` de `CountSheetRow.jsx:108` y el test siguió en verde. No prueba ni el `memo` de
la fila ni que `updateQuantity` de `useCountSheet` sea estable.

Reescríbelo sobre el **`CountSheet` real**: con `listInventory` simulado devolviendo 240 insumos y `getCount` con un
borrador, cuenta los renders de cada fila (por ejemplo, con `vi.mock` de `./CountSheetRow` que envuelve el componente
real con un contador por `item.id`, o con `React.Profiler`), escribe en una fila y comprueba que solo esa fila volvió
a renderizarse. Debe fallar si se quita `memo` de `CountSheetRow` o si `updateQuantity` deja de ser estable.

### 3. MEDIUM: una cantidad mal escrita bloquea todo el guardado sin marcar la fila

`inventoryCountsClient.js:97-99`: si una línea no cumple el formato (por ejemplo `1.2345` o `abc`),
`normalizeCountLines` rechaza **todo** el envío con "Cantidad inválida para el insumo 57" (el id, no el nombre) y sin
`lineErrors`. El guardado automático sigue fallando y ninguna otra línea se guarda, sin que el dueño sepa cuál
corregir.
- Devuelve `lineErrors` por `item_id` también para el formato inválido, igual que para el máximo de 1.000.000.
- Mejor aún: en `useCountSheet`, no envíes las líneas con formato inválido; envía las válidas y deja las inválidas
  sucias con su error junto al insumo. El estado general dice "Hay cantidades por corregir".
- Test: con una línea `1.2345` y otra `5`, se guarda la `5`, la otra queda sucia con su error y el estado lo indica.

### 4. MEDIUM: borrar una cantidad ya guardada no la borra en el motor

El motor no tiene forma de quitar una línea de un conteo (solo crea o reemplaza). Si el dueño borra el campo de un
insumo ya guardado, la línea en blanco no se envía, la pantalla muestra el campo vacío y **"Aplicar" usa la cantidad
vieja** del motor. Además, la línea queda sucia para siempre y el estado nunca vuelve a "Guardado".
- Una línea es sucia solo si su valor normalizado difiere del último guardado (`initial_saved_qty`). Volver al valor
  guardado, o dejar en blanco una línea que nunca se guardó, no la ensucia.
- Si el dueño deja en blanco una línea que ya tiene cantidad guardada, muestra junto al insumo: "Ya hay {cantidad}
  guardada en el motor. Para corregirla, escribe la cantidad correcta (0 si no hay)." y no la cuentes como pendiente.
- En el resumen de "Aplicar", los contados se basan en lo guardado en el motor (líneas del detalle), no en los campos.
- Tests para los tres casos.
- Anota en `docs/RESUMEN-19p.md` como pendiente del motor: un endpoint para quitar una línea de un borrador.

### 5. MEDIUM: falta el test de texto plano en la planilla

El brief 19p pedía el insumo `<img src=x onerror=alert(1)>` como texto **en la planilla y en el detalle**. Solo existe
en `ApplyCountDialog.test.jsx`. Agrégalo en `CountSheet.test.jsx` (nombre visible como texto y ningún `img` en el DOM).

### 6. HIGH: evidencia duplicada o copiada en el resumen

En `docs/RESUMEN-19p.md`:
- las salidas de las mutaciones 1 a 10 tienen los mismos tiempos (`15ms`, `12ms`, `607ms`, `585ms`...) que la versión
  anterior del resumen, con el número de tests cambiado a mano: no son salidas nuevas;
- las mutaciones 12 y 16, 13 y 17, y 14 y 18 son la misma mutación con la misma salida (los mismos UUID). Son 15
  mutaciones distintas, no 18;
- la mutación 15 dice que falla "displays difference calculated strictly by the motor...", pero al repetirla falla
  "applies count and renders diffs from backend response, sorted by absolute diff with nulls last".

Corrige:
- vuelve a ejecutar **cada** mutación y pega la salida completa real de esa ejecución (con `[ok]`, `[x]` y `>` en lugar
  de símbolos de terminal);
- elimina los duplicados y numera de nuevo;
- agrega las mutaciones de este brief: guardar al volver con estado `'error'`, quitar `memo` de `CountSheetRow`,
  enviar líneas con formato inválido, y ensuciar una línea igual a la guardada.

### 7. LOW

- `CountSheet.jsx:11-17`: "Guardado hace N min" solo se recalcula cuando algo vuelve a renderizar. Actualízalo cada
  30 segundos con un intervalo que se limpie al desmontar.
- `useCountSheet.js:15` y `:38`: `replace(',', '.')` solo cambia la primera coma; usa `replaceAll` o una expresión
  regular global.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, tests, documentación, commits
  o nombres de archivo. Tampoco símbolos decorativos de terminal en la documentación. Íconos solo en SVG.
- **Español con tildes.** Antes de entregar, compara las líneas con tildes borradas contra las agregadas.
- **Marca:** `docs/ualdo-brand.md`; colores solo con variables de `src/styles/main.css`.
- **Cantidades:** texto validado; ningún cálculo de cantidades en el cliente; `null` es "Sin dato"; nada en
  `localStorage`.
- **Seguridad:** todo por `apiClient`; texto plano; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones de estado. Si
  `useCountSheet.js` o `CountSheet.jsx` pasan de 250 líneas, extrae funciones o un hook (por ejemplo,
  `useCountSheetAutosave`).
- Sin dependencias nuevas. No toques el login, el chat, la caja, Trabajo ni el motor.
- TDD: los tests de los puntos 1 a 4 se escriben primero y se ven fallar.

## Tests

```
npx vitest run src/hooks src/components/inventory src/services
npm test
npm run test:coverage
```

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory; echo "exit=$?"
grep -rnE "value=\"(bodega|salon)\"|location: '(bodega|salon)'" src --include=*.jsx --include=*.js | grep -v __tests__; echo "exit=$?"
wc -l src/components/inventory/counts/*.jsx src/hooks/useCountSheet.js
git status --short
```

## Criterios de aceptación

- [ ] "Volver a conteos" guarda siempre que haya líneas sucias, espera un guardado en curso y no sale si falla.
- [ ] `savePendingLines` con un guardado en curso espera y guarda lo que quedó pendiente.
- [ ] El test de rendimiento usa el `CountSheet` real y falla al quitar `memo` de `CountSheetRow`.
- [ ] Una cantidad mal escrita queda marcada junto a su insumo y no impide guardar las demás.
- [ ] Una línea solo es sucia si difiere de lo guardado; borrar una cantidad guardada lo explica junto al insumo.
- [ ] Test de texto plano en la planilla.
- [ ] `docs/RESUMEN-19p.md` con cada mutación ejecutada de nuevo, sin duplicados y con las nuevas de este brief.
- [ ] Cero emojis; sin tildes perdidas; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
