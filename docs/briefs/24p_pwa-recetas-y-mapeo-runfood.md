# Brief 24p: recetas de RunFood y mapeo de insumos en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-runfood-recipes` desde la rama del Brief 23p (o `main` si ya se fusionó). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** El motor trae de RunFood el catálogo y las recetas de los platos (Brief 24 del motor). Los ingredientes de esas recetas son artículos de RunFood, y para descontar inventario cada uno tiene que estar asociado a un insumo de Ualdo, con un factor de unidades. El motor sugiere la asociación por nombre; el dueño tiene que confirmarla, cambiarla o ignorar el ingrediente (por ejemplo, sal o agua). Es un trabajo de una sola vez, más los ingredientes nuevos que aparezcan. Sin esta pantalla, el consumo automático (Brief 25) no puede funcionar.

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-runfood-catalog.md` (léelo completo). Resumen, todo solo para el dueño:
- `GET /restaurant/runfood/mappings?status=pending|confirmed|ignored&search=&page=`: 20 por página; cada fila con artículo de RunFood (código, descripción), insumo mapeado o sugerido (id, nombre, unidad), puntaje, factor y número de recetas donde aparece.
- `PUT /restaurant/runfood/mappings/{id}` `{ inventory_item_id, factor }`: confirmar con un insumo. `factor` mayor que 0 y hasta 100000, hasta 6 decimales, como texto.
- `POST /restaurant/runfood/mappings/{id}/aceptar-sugerencia` (`409` sin sugerencia), `POST .../ignorar`, `POST .../reabrir`.
- `GET /restaurant/runfood/recipes?search=&estado=completa|incompleta|con_opciones&page=`: recetas con sus líneas y estado.
- `GET /restaurant/runfood/coverage?days=7`: porcentaje de lo vendido con receta completa, vendido directo mapeado y sin cubrir, más los 10 platos sin receta o incompletos que más venden.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/cashconfig/PaymentMappingsPanel.jsx` y `src/hooks/usePaymentMappings.js` (el mismo patrón de mapeo con sugerencia, que hay que imitar); `src/hooks/useItemSearch.js` (buscador de insumos); `src/services/quantityFormat.js`; `src/hooks/usePagedList.js`; `src/components/EcosystemView.jsx`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; cantidades y factores como texto validado (coma o punto, hasta 6 decimales para el factor); todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; confirmaciones con el patrón de dos pasos de `usePaymentMappings`.

## Objetivo

El dueño ve cuánto de lo vendido está cubierto por recetas, trabaja la lista de ingredientes pendientes (aceptar la sugerencia con un toque, elegir otro insumo con factor, o ignorar) y revisa cada receta con sus ingredientes asociados.

## Requerimientos

1. **Cliente** `src/services/runfoodCatalogClient.js` con todas las llamadas del contrato. Valida antes de llamar: ids `^\d+$`, `status` y `estado` en la lista, `search` de hasta 60 caracteres, `factor` con el formato del contrato (normaliza la coma a punto), `days` entre 1 y 31.
2. **Hooks** `src/hooks/useRunfoodMappings.js` (lista por estado con búsqueda con espera de 300 ms, paginación, acciones con estado de envío y mensaje de éxito, recarga del ítem tras la acción) y `src/hooks/useRunfoodRecipes.js`.
3. **Vista** `src/components/runfood/RunfoodRecipesView.jsx` con tres secciones (selector tipo pastilla):
   - **Cobertura** (`RunfoodCoverageCard`): tres barras con porcentaje (receta completa, vendido directo, sin cubrir) y la lista de los 10 platos que faltan, cada uno con lo que se vendió.
   - **Ingredientes** (`RunfoodMappingsPanel`): pestañas Pendientes, Confirmados e Ignorados con contador. Cada fila muestra el artículo de RunFood, la sugerencia con su puntaje ("Coincidencia alta" de 80 o más, "media" de 60 a 79) y acciones:
     - "Aceptar" (si hay sugerencia).
     - "Elegir otro insumo": buscador de insumos de Ualdo (`useItemSearch`) y campo de factor con ayuda: "Cuántas unidades de {insumo, unidad} equivalen a 1 unidad de RunFood de {artículo}". Por defecto 1.
     - "Ignorar" con confirmación de dos pasos y texto "No se descontará del inventario".
     - En Confirmados e Ignorados: "Cambiar" y "Reabrir".
   - **Recetas** (`RunfoodRecipesList`): búsqueda, filtro por estado y, al abrir una receta, sus líneas: ingrediente de RunFood, cantidad, insumo de Ualdo y factor, o "Sin asociar" con acceso directo a resolverlo. Las recetas con opciones muestran el aviso "Tiene opciones a elegir: solo se descuenta la parte fija".
4. **Navegación:** desde la pestaña Inventario del dueño, un botón "Recetas de RunFood" abre la vista (subvista `runfood-recetas`). No se muestra al personal; si un no dueño llega a la subvista, vuelve a Inventario.
5. **Errores del motor:** `409` al aceptar sin sugerencia muestra "Este ingrediente ya no tiene sugerencia; elige un insumo"; `422` muestra el mensaje del motor junto al campo.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`.
- Sigue las convenciones existentes del repo.
- Seguridad: valida toda entrada antes de llamar al motor, sin `dangerouslySetInnerHTML`, errores sin datos sensibles.
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, componentes de menos de 200 líneas, sin anidación de más de 4 niveles, inmutabilidad, manejo de errores explícito.
- Rendimiento: paginación, búsqueda con espera, sin recargar la lista completa tras cada acción.
- No añadas dependencias sin justificarlo.
- No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones (id no numérico, factor 0, factor con 7 decimales, factor con coma aceptado, `days` 32) sin llamar al motor.
- Hooks: búsqueda con espera; acción exitosa actualiza solo la fila; error `409` y `422` muestran el mensaje correcto.
- Componentes: aceptar, elegir otro con factor, ignorar con dos pasos, reabrir; receta con líneas sin asociar y con opciones; cobertura con porcentajes; el personal no ve el botón.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El dueño ve la cobertura de recetas y los platos que faltan.
- [ ] Puede aceptar sugerencias, elegir otro insumo con factor, ignorar y reabrir ingredientes.
- [ ] Cada receta muestra sus ingredientes asociados o pendientes, y avisa si tiene opciones.
- [ ] El personal no accede.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo.
