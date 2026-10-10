# Brief 19p_fix: planilla de conteo sin pérdida de datos, cancelación y evidencia real

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`).
Rama `feat/pwa-inventory-locations`, con el Brief 19p construido y **sin commit**. No toques el motor
(`C:\laragon\www\UaldoBusiness`, rama `feat/inventory-locations`, commit `71572fd`).

La auditoría del Brief 19p (2026-10-09) dejó en verde `lint` (0 errores), `test` (56 archivos, 368 tests) y `build:prod`.
La guardia de ubicaciones, los colores por variables, los límites de líneas y la ausencia de emojis también están bien.
Pero la planilla de conteo, que es la pieza central del brief, tiene fallos que **dejan stock equivocado sin avisar**, falta
una funcionalidad pedida y la evidencia de `docs/RESUMEN-19p.md` no corresponde a la realidad.

**Lee primero:**
- `docs/briefs/19p_pwa-ubicaciones-transferencias-y-conteo.md` (el brief original; sigue vigente en todo lo que este no cambie);
- `docs/ualdo-brand.md`;
- `C:\laragon\www\UaldoBusiness\docs\API-inventory.md`, sección 3;
- `C:\laragon\www\UaldoBusiness\app\Services\InventoryCountService.php` (líneas 132 y 167: forma de los errores 422);
- `src/hooks/useCountSheet.js`, `src/components/inventory/counts/*.jsx`, `src/hooks/useCounts.js`,
  `src/hooks/useApplyCount.js`, `src/hooks/useTransferSubmit.js` y sus tests.

## Objetivo

Que ninguna cantidad escrita en la planilla se pierda ni quede marcada como guardada sin estarlo, que los errores por línea
aparezcan junto al insumo, que el dueño pueda cancelar un borrador, y que los tests y el resumen demuestren todo eso con
salidas reales.

## Requerimientos

### 1. CRITICAL: ediciones durante un guardado quedan marcadas como guardadas

`src/hooks/useCountSheet.js:152-164`. `savePendingLines` toma las líneas sucias, espera la respuesta y luego marca
`isDirty: false` en esas líneas **con el valor que tengan en ese momento**. Si el dueño cambia una línea mientras la
petición está en curso (muy probable, porque el autoguardado se dispara a mitad de escritura), el valor nuevo queda en
pantalla como guardado, nunca se envía, y `Aplicar` fija en el motor el valor viejo.

- Al terminar bien un guardado, marca limpia una línea **solo si su valor actual es igual al valor enviado**; si cambió,
  sigue sucia.
- `dirtyCountRef` no se pone a 0: se recalcula con las líneas que siguen sucias.
- Si quedaron líneas sucias tras el guardado, el estado vuelve a "Cambios sin guardar".
- Test (RED primero): con `saveCountLines` como promesa controlada, editar una línea mientras está pendiente, resolver,
  y comprobar que sigue sucia y que el siguiente guardado la envía con el valor nuevo.

### 2. HIGH: cambios perdidos al salir de la planilla

`src/components/inventory/counts/CountSheet.jsx:56` ("Volver a conteos") y la limpieza de `useCountSheet.js` descartan
lo pendiente.
- Al pulsar "Volver a conteos" con cambios sin guardar: guarda primero; si el guardado falla, muestra el error y no salgas.
- Al pasar la pestaña a oculta (`visibilitychange` con `document.visibilityState === 'hidden'`), guarda lo pendiente
  (en Android es la última oportunidad antes de que el sistema cierre la app). Al volver a visible, si quedó algo
  pendiente, programa el guardado normal.
- Elimina el listener y los temporizadores al desmontar.

### 3. HIGH: los errores por línea nunca se muestran

El motor responde 422 con claves `lines.{índice}.item_id` (o `lines.{índice}.counted_quantity`), donde el índice es la
posición **dentro de la tanda enviada**. `CountSheet.jsx:184` busca `lineErrors[item.id]`, que nunca coincide.
- En `saveCountLines` (`src/services/inventoryCountsClient.js`), traduce los errores de cada tanda a un mapa
  `{ [item_id]: [mensajes] }` usando el índice y el desplazamiento de la tanda, y devuélvelo en `res.lineErrors`.
- El error general `lines` (por ejemplo, del `apply`) se muestra arriba, no por línea.
- Test: una segunda tanda que falla con `lines.3.item_id` marca el error en el insumo correcto (posición 203 del total).

### 4. HIGH: falta cancelar un borrador (requerimiento 13 del brief)

`useCounts.cancelCount` existe pero ninguna pantalla lo usa.
- En la planilla de un borrador, un botón "Cancelar conteo" que abre una confirmación propia (sin `confirm`) con el texto
  "El conteo se cancela y no cambia el stock. No se puede deshacer."; al confirmar, llama a `cancelCount`, vuelve a la
  lista y la recarga.
- Un 409 muestra que el conteo ya estaba cerrado.
- El diálogo cumple las reglas de accesibilidad del punto 8.

### 5. MEDIUM: el conteo queda en borrador tras aplicarlo

Tras aplicar, `CountSheet` sigue mostrando "Borrador" y el botón "Aplicar" (`CountsView.jsx:34` solo recarga la lista
oculta). Tras un apply correcto, actualiza `countDetail` con la respuesta (estado `applied`), oculta "Guardar avance",
"Aplicar" y "Cancelar conteo", y deja los campos en solo lectura (`readOnly`), no con un `onChange` vacío.

### 6. MEDIUM: comportamiento y rendimiento de la planilla

- `useCountSheet.js:199`: `dirtyCountRef` cuenta pulsaciones, no líneas. El umbral de 20 debe contar **insumos distintos**
  modificados desde el último guardado.
- `useCountSheet.js:56-58` y `72-74`: si una página del inventario falla, hoy se muestra la lista parcial como si estuviera
  completa. Muestra el error con un botón "Reintentar" y no habilites "Aplicar" hasta tener todas las páginas.
- Rendimiento: `CountSheetRow` con `React.memo` y `updateQuantity` estable (`useCallback` sobre refs), de modo que una
  pulsación solo vuelva a renderizar su fila. Test: con 240 insumos, escribir en una fila renderiza solo esa fila
  (contador de renders vía `vi.fn` en un componente envoltorio o `React.Profiler`).
- `savePendingLines` mide 63 líneas: divídelo en funciones de menos de 50 (recolectar líneas sucias, aplicar el resultado).
- Estado visible: "Guardado hace N min" (o "Guardado hace un momento"), como pedía el brief, en lugar de la hora.

### 7. MEDIUM: cantidades nulas y formato

- `src/components/inventory/InventoryList.jsx:37`: `null` en `stock_by_location` debe mostrarse "Sin dato", no "0".
- `src/components/inventory/counts/ApplyCountDialog.jsx:177` y `189`: `system_quantity` y `difference` `null` se muestran
  como "Sin dato"; los números con coma de `es-EC`, hasta 3 decimales y sin ceros sobrantes (reutiliza una sola función
  de formato, por ejemplo en `src/services/inventoryLocations.js` o un `quantityFormat.js` nuevo con su test).
- El orden por diferencia absoluta deja los `null` al final.
- Separadores: en `InventoryList.jsx:53,55` y `ApplyCountDialog.jsx:177` el carácter "·" es decorativo. Usa un elemento con
  estilo (por ejemplo un `span` de 3 px de diámetro con `border-radius: 50%` y `background: var(--text-subtle)`,
  `aria-hidden="true"`).

### 8. MEDIUM: historial y accesibilidad

- `src/components/inventory/MovementsHistoryModal.jsx:178`: si el movimiento tiene `reason`, hoy se oculta
  "Transferencia (salida)", "Transferencia (entrada)" o "Conteo". Muestra siempre el tipo y, debajo, el motivo.
- Par de transferencia (líneas 152-155): hoy todas las transferencias se ven iguales. Si las dos líneas de un mismo
  `transfer_group` están en la página, muéstralas juntas, unidas por un mismo contenedor o marca visual, con el texto
  "Bodega a Cocina" (origen a destino) tomado de sus `location`.
- `ApplyCountDialog`, el diálogo de cancelar y `NewCountModal`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`,
  cierre con Escape (salvo mientras aplica), foco inicial dentro y devolución del foco al botón que lo abrió.
- `CountsView.jsx`: cada conteo de la lista es un `button` (hoy es un `div` con `onClick`, inaccesible por teclado); los
  dos filtros y el buscador de la planilla tienen `label` (puede ser visualmente oculto).
- Los mensajes con `aria-live` deben estar en un contenedor que exista siempre, no montarse junto con el texto.

### 9. HIGH: tests que no protegen lo que dicen

Repetí las mutaciones que exige el brief original. Estas **sobreviven** (todos los tests en verde):

| Mutación | Archivo | Resultado |
|---|---|---|
| uuid nuevo en cada envío (`clientUuidRef.current = generateClientUuid()` antes de `setSubmitting(true)`) | `src/hooks/useTransferSubmit.js:49` | 11/11 en verde |
| quitar `if (!isOwner) return;` | `src/hooks/useCounts.js:17` | 7/7 en verde |
| enviar todas las líneas (`if (entry.isDirty)` a `if (true)`) | `src/hooks/useCountSheet.js` | 6/6 en verde |

Y faltan tests pedidos en el brief original. Escríbelos (cada uno debe fallar si se revierte lo que protege):
1. Transferencia: reintento tras error de red reutiliza el `client_uuid`; tras un 201 se renueva.
2. Personal: `useCounts({ isOwner: false })` y `InventoryView` sin `is_owner` no llaman a `listCounts` ni a `request` con
   `/inventory/counts`, comprobado después de `await waitFor` y de vaciar los efectos.
3. Planilla: blanco no se envía y `0` sí; al reabrir un borrador, las cantidades guardadas aparecen en los campos.
4. Autoguardado con `vi.useFakeTimers()`: a las 20 líneas distintas guarda **solo** las cambiadas (aserción sobre el
   contenido exacto de `saveCountLines`); a los 60 s guarda; con un guardado pendiente no arranca otro (una sola llamada);
   con la pestaña oculta no guarda por temporizador; al ocultarse guarda lo pendiente.
5. Tandas: 450 líneas generan tres `request` con 200, 200 y 50 líneas.
6. Aplicar: guarda lo pendiente antes de aplicar (orden de llamadas); el detalle viene de la respuesta y se ordena por
   diferencia absoluta; mutación "calcular la diferencia en el cliente" (`counted - system`) debe fallar: usa una respuesta
   cuya `difference` no coincida con la resta.
7. Texto plano: un insumo llamado `<img src=x onerror=alert(1)>` aparece como texto en la planilla y en el detalle
   aplicado, y no existe ningún `img` en el DOM.
8. Los de los puntos 1 a 8 de este brief.

### 10. HIGH: cobertura y evidencia

`npm run test:coverage` real deja **por debajo del 80 % de ramas** archivos nuevos, aunque el resumen dice que todos
superan el umbral "ampliamente":

| Archivo | % Branch real |
|---|---|
| `src/hooks/useApplyCount.js` | 68.75 |
| `src/hooks/useCountSheet.js` | 68.88 |
| `src/components/inventory/counts/ApplyCountDialog.jsx` | 75 |
| `src/components/inventory/counts/CountSheetRow.jsx` | 76.92 |
| `src/components/inventory/TransferModal.jsx` | 77.77 |
| `src/hooks/useTransferSubmit.js` | 79.31 |

Además, en `docs/RESUMEN-19p.md`:
- la tabla de cobertura no está "tal cual": se reescribió, sin la columna de líneas no cubiertas ni los nombres truncados reales;
- la salida de la mutación 6 no es la real. La real es
  `AssertionError: the given combination of arguments (null and string) is invalid for this assertion...`;
- las salidas contienen símbolos de terminal (la flecha U+2192 y la barra de cuadro U+2502) que el brief pedía reemplazar;
- no aparecen las mutaciones que exigía el brief (por defecto `'bodega'`, uuid nuevo, quitar la comprobación del dueño,
  enviar todas las líneas, diferencia en el cliente);
- no se documenta la prueba manual ni se dice que no se hizo.

Corrige:
- Sube a 80 % o más de sentencias **y** ramas cada archivo nuevo, con tests de comportamiento (no tests vacíos para
  cubrir líneas).
- Reescribe `docs/RESUMEN-19p.md`: sustituye la sección de cobertura por la salida completa y sin editar de
  `npm run test:coverage` (solo cambiando símbolos de terminal por `[ok]`, `[x]` y `>`); agrega, además de las diez
  existentes revisadas, las cinco mutaciones del brief original y las tres de la tabla del punto 9, cada una con el
  cambio exacto y la salida completa real copiada de la terminal. El auditor las repetirá todas.
- Indica en el resumen si la prueba manual contra el motor se hizo; si se hizo, con los pasos y lo observado.

### 11. LOW

- `src/services/inventoryCountsClient.js:21`: `status` se envía sin validar; acepta solo `draft`, `applied` y `cancelled`.
- El motor limita `counted_quantity` a 1 000 000 (`UpdateInventoryCountLinesRequest.php:27`); valida ese máximo también
  en el cliente para la planilla, con el mensaje junto al insumo.
- `InventoryView.handleTransferSuccess` recarga todo el listado y pierde la paginación: usa `updateItemStock` con
  `res.data.item` cuando venga, y recarga solo si no viene.
- Advertencias nuevas de `react-hooks/exhaustive-deps` en `TransferModal.jsx:29` y `useCountSheet.js:112`: resuélvelas
  sin desactivar la regla.
- El listado de conteos no muestra la cantidad de líneas porque el motor no la envía en el listado. No lo inventes en el
  cliente: deja una nota en el resumen como pendiente del motor.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, tests, documentación, commits o
  nombres de archivo. Tampoco símbolos decorativos de terminal en la documentación. Íconos solo en SVG (`lucide-react`).
- **Español con tildes** en la interfaz, documentos y commits. Antes de entregar, compara las líneas con tildes que borraste
  contra las que agregaste (`git diff | grep -E "^-" | grep -E "[áéíóúñÁÉÍÓÚÑ¿¡]"`): no quites ninguna.
- **Marca:** sigue `docs/ualdo-brand.md`; colores solo con variables de `src/styles/main.css`; botones pastilla.
- **Cantidades:** viajan como texto validado; ningún saldo ni diferencia se calcula en el cliente; `null` es "Sin dato".
  Nada de cantidades en `localStorage`.
- **Seguridad:** todo por `apiClient`; ids y ubicaciones validados antes de construir rutas; `URLSearchParams`; texto plano;
  sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones de estado, lógica en hooks.
- Sin dependencias nuevas. No toques el login, el chat, la caja, Trabajo ni el motor.
- TDD: escribe primero el test que falla para los puntos 1, 2, 3 y 4, y comprueba que falla antes de corregir.

## Tests

Vitest con Testing Library, `request` o los clientes simulados y `vi.useFakeTimers()` donde haga falta.

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
grep -rn "localStorage" src/hooks/useCountSheet.js src/components/inventory | grep -v "^\s*\*"; echo "exit=$?"
wc -l src/components/inventory/*.jsx src/components/inventory/counts/*.jsx src/hooks/useTransferSubmit.js src/hooks/useCounts.js src/hooks/useCountSheet.js src/hooks/useApplyCount.js
git status --short
```

## Criterios de aceptación

- [ ] Una línea editada mientras se guarda sigue sucia y se envía en el siguiente guardado (test con promesa controlada).
- [ ] Salir de la planilla o pasar la app a segundo plano guarda lo pendiente; si el guardado falla, no se sale.
- [ ] Un 422 de una línea (también en la segunda tanda) aparece junto al insumo correcto.
- [ ] El dueño cancela un borrador con confirmación propia accesible; un 409 se explica.
- [ ] Tras aplicar, la planilla queda en "Aplicado", en solo lectura y sin botones de acción.
- [ ] El umbral de 20 cuenta insumos distintos; una carga parcial del inventario muestra error y bloquea "Aplicar".
- [ ] Escribir en una fila de 240 no vuelve a renderizar las demás.
- [ ] `null` se muestra "Sin dato" en listado y detalle; números con coma `es-EC`; separadores como elementos con estilo.
- [ ] El historial siempre muestra el tipo, y las dos líneas de una transferencia se ven como par con origen y destino.
- [ ] Diálogos con `role="dialog"`, Escape y retorno de foco; conteos de la lista operables por teclado; campos con `label`.
- [ ] Las tres mutaciones del punto 9 y las cinco del brief original hacen fallar al menos un test.
- [ ] Cada archivo nuevo con 80 % o más de sentencias y ramas, según la salida real de `npm run test:coverage`.
- [ ] `docs/RESUMEN-19p.md` con la tabla de cobertura sin editar, todas las mutaciones con su salida real, sin símbolos de
      terminal, y el estado de la prueba manual.
- [ ] Cero emojis; sin tildes perdidas; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
