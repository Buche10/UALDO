# Brief 24p-fix: correcciones de la auditoría de recetas y mapeo de RunFood

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Trabaja sobre la rama donde está el commit `9507de0` (Brief 24p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del Brief 24p dejó lint, tests (665) y build en verde y cobertura del código nuevo del 90 %, pero encontró un incumplimiento de las restricciones de diseño, un error funcional y varias diferencias con el brief. Este brief las corrige sin añadir funciones nuevas.

**Lee primero:** `docs/briefs/24p_pwa-recetas-y-mapeo-runfood.md` (brief original), `docs/ualdo-brand.md`, `src/styles/main.css` (variables de color), `C:\laragon\www\UaldoBusiness\docs\API-runfood-catalog.md` (contrato).

**Archivos implicados:** `src/components/runfood/*`, `src/hooks/useRunfoodMappings.js`, `src/hooks/useRunfoodRecipes.js`, `src/services/runfoodCatalogClient.js` y sus tests.

## Objetivo

Los componentes de RunFood quedan por debajo de 200 líneas y sin colores fijos, "Cambiar" desde Ignorados mueve la fila a donde corresponde, el error `422` aparece junto al campo, "Asociar" en una receta lleva directo a ese ingrediente y la vista deja de pedir dos veces los mismos datos.

## Requerimientos

1. **[HIGH] Tamaño y anidación de componentes.** `RunfoodMappingsPanel.jsx` (390 líneas), `RunfoodRecipesList.jsx` (345), `RunfoodMappingEditModal.jsx` (227) y `RunfoodCoverageCard.jsx` (223) superan el límite de 200 líneas y anidan más de 4 niveles dentro de los `map`. Divide sin cambiar el comportamiento:
   - `RunfoodMappingRow.jsx` (una fila con su sugerencia o insumo asociado) y `RunfoodMappingActions.jsx` (botones y confirmación de dos pasos de Ignorar).
   - `RunfoodStatusTabs.jsx` reutilizable para las pastillas con contador (Pendientes/Confirmados/Ignorados) y las de estado de receta.
   - `RunfoodRecipeCard.jsx` (cabecera del acordeón y aviso de opciones) y `RunfoodRecipeLine.jsx` (una línea de ingrediente).
   - `CoverageBar.jsx` para las tres barras (hoy el mismo bloque está copiado tres veces) y `CoverageMissingList.jsx` para los 10 platos.
   - En el modal, extrae el buscador de insumos a `RunfoodItemPicker.jsx`.
   - El buscador con botón de limpiar y el botón "Cargar más" están copiados en el panel y en la lista: sácalos a un componente común dentro de `src/components/runfood/`.
2. **[MEDIUM] "Cambiar" desde Ignorados deja la fila en la pestaña equivocada.** En `useRunfoodMappings.js`, `handleUpdateMapping` solo quita la fila si la pestaña es `pending`; en `ignored` hace `upsert` de un mapeo que ya está `confirmed` y sigue mostrándose como "Ignorado". Regla para todas las acciones: si el `status` del mapeo devuelto es distinto de la pestaña activa, `paged.remove(id)`; si es igual, `paged.upsert(updated)`. Unifica los cuatro manejadores (hoy copiados casi idénticos) en un ayudante `runAction(mappingId, call, successMessage, mapError)` de menos de 50 líneas.
3. **[MEDIUM] `422` junto al campo.** `fieldErrors` se guarda en el hook pero ningún componente lo usa. Pasa `fieldErrors` al modal y muestra `fieldErrors.factor[0]` debajo del campo de factor y `fieldErrors.inventory_item_id[0]` debajo del insumo seleccionado. El aviso general del modal muestra solo errores sin campo.
4. **[MEDIUM] Error viejo en el modal.** El modal recibe `actionError`, que puede venir de una acción anterior (por ejemplo, un `409` al aceptar). Limpia `actionError` y `fieldErrors` al abrir el modal (`setActionError(null)` ya existe en el hook; añade un `clearErrors`).
5. **[MEDIUM] "Asociar" desde una receta.** Hoy solo cambia de sección. Debe abrir Ingredientes en la pestaña Pendientes con la búsqueda rellenada con `descripcion_runfood` de la línea. `RunfoodRecipesView` guarda `{ search }` al pulsar y lo pasa a `RunfoodMappingsPanel` como `initialSearch`; `useRunfoodMappings` acepta `initialSearch`.
6. **[MEDIUM] Datos pedidos dos veces.** `RunfoodRecipesView` llama a `useRunfoodRecipes()` solo para la cobertura, pero el hook también carga la lista de recetas (petición inútil), y `RunfoodRecipesList` vuelve a llamar al hook y vuelve a pedir la cobertura. Separa en `src/hooks/useRunfoodCoverage.js` (solo cobertura y días) y deja `useRunfoodRecipes.js` solo para la lista. La vista usa el primero y la lista el segundo.
7. **[MEDIUM] Colores fijos.** Hay 10 `rgba(...)` en `RunfoodCoverageCard.jsx` (132, 147, 162, 188), `RunfoodMappingsPanel.jsx` (105, 225, 233, 245, 259) y `RunfoodRecipesList.jsx` (260). El brief exige solo variables CSS. Usa las de `src/styles/main.css` (`--surface-soft`, `--success-soft`, `--chip-bg`, etc.). Si falta alguna (por ejemplo, el fondo de la barra o un `--accent-soft`), créala en `main.css` con un nombre semántico y úsala.
8. **[LOW] Cobertura sin ventas.** Si `total_cents` es 0, no muestres "Tus ventas están 100% cubiertas por recetas."; muestra "No hay ventas en este periodo."
9. **[LOW] Texto de ayuda del factor.** El brief pide "Cuántas unidades de {insumo, unidad} equivalen a 1 unidad de RunFood de {artículo}". Hoy solo aparece la unidad. Muestra nombre y unidad del insumo, por ejemplo: "Cuántas unidades de Lomo Fino (kg) equivalen a 1 unidad de RunFood de Lomo fino kg".
10. **[LOW] `per_page` sin validar** en `listRunfoodRecipes`: aplica la misma validación (entero de 1 a 100) que en `listRunfoodMappings`, en un ayudante común. Extrae también la validación de id repetida en cinco funciones del cliente.
11. **[LOW] Tildes en tests y comentarios.** Corrige "busqueda", "pagina", "invalido", "despues", "especifico", "confirmacion", "lineas", "seccion" en los tests y comentarios nuevos. No quites ninguna tilde existente.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (colores solo con variables CSS, Poppins, botones pastilla, tono).
- Sigue las convenciones existentes del repo. No cambies textos visibles salvo los indicados.
- Seguridad: valida toda entrada antes de llamar al motor, sin `dangerouslySetInnerHTML`, sin `alert`/`confirm`, errores sin datos sensibles.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50 líneas, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- Rendimiento: ninguna petición duplicada al montar la vista; sin recargar la lista completa tras cada acción.
- No añadas dependencias. No toques archivos fuera de `src/components/runfood/`, los dos hooks de RunFood, el nuevo `useRunfoodCoverage.js`, `runfoodCatalogClient.js`, `src/styles/main.css` (solo si hace falta una variable) y sus tests.

## Tests

- Hook: "Cambiar" desde Ignorados quita la fila de Ignorados; "Cambiar" desde Confirmados actualiza la fila en su sitio; `422` en `handleUpdateMapping` deja `fieldErrors` y `422` en `handleAcceptSuggestion` muestra el mensaje del motor (hoy no hay test de `422`).
- Modal: el error `422` de `factor` aparece debajo del campo; al abrir el modal no hay error viejo.
- Vista: al montar se hace una sola llamada a cobertura y ninguna a recetas mientras la sección activa es Cobertura; "Asociar" abre Ingredientes en Pendientes con la búsqueda rellenada.
- Cobertura con `total_cents` 0 muestra "No hay ventas en este periodo."
- Cliente: `per_page` 0 y 101 en recetas se rechazan sin llamar al motor.
- Los tests existentes siguen pasando. Cobertura del código de RunFood de 80 % o más.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
cd C:/laragon/www/UALDO && wc -l src/components/runfood/*.jsx
cd C:/laragon/www/UALDO && grep -n "rgba(\|#[0-9a-fA-F]\{3,6\}" src/components/runfood/*.jsx
```

La cuarta orden no debe mostrar ningún componente de 200 líneas o más; la quinta no debe mostrar resultados.

## Criterios de aceptación

- [ ] Ningún componente de `src/components/runfood/` llega a 200 líneas ni anida más de 4 niveles.
- [ ] Cero colores fijos en `src/components/runfood/`.
- [ ] "Cambiar" desde Ignorados mueve el ingrediente a Confirmados y actualiza los contadores.
- [ ] El `422` del motor aparece junto al campo correspondiente.
- [ ] "Asociar" en una receta lleva al ingrediente en Pendientes.
- [ ] Sin peticiones duplicadas al abrir la vista.
- [ ] Cobertura sin ventas y texto de ayuda del factor según lo indicado.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; tildes intactas.
