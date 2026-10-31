# Brief 25p: consumo por ventas en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-runfood-consumption` desde la rama del Brief 24p (o `main` si ya se fusionó). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** El motor ya puede descontar insumos según lo vendido en RunFood (Brief 25 del motor), pero el consumo **viene apagado**: si se enciende antes de cargar el stock real con el conteo de reapertura, el inventario queda negativo. El dueño necesita encenderlo con una fecha de inicio, ver qué se descontó cada día y de qué platos vino, y saber qué no se pudo descontar.

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-runfood-consumption.md` (léelo completo). Resumen, todo solo para el dueño:
- `GET /restaurant/runfood/consumption/settings` y `PUT` `{ enabled, start_date, location }`: `start_date` obligatoria al activar, entre 30 días atrás y 30 días adelante; `location` es `warehouse`, `kitchen` o `lounge`.
- `GET /restaurant/runfood/consumption?date=`: estado (`aplicado`, `apagado`, `antes_de_inicio`, `sin_ventas`), líneas (insumo, unidad, cantidad, platos de origen), `sin_receta`, `incompletos`, `con_opciones`.
- `POST /restaurant/runfood/consumption/recalcular` `{ desde, hasta }` (máximo 31 días): `202` con los días encolados.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/runfood/` (Brief 24p); `src/services/inventoryLocations.js` (nombres de ubicaciones en español); `src/services/quantityFormat.js`; `src/components/EcosystemView.jsx`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; cantidades como texto; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; confirmaciones de dos pasos.

## Objetivo

El dueño enciende el consumo automático con una fecha de inicio y una ubicación, después de confirmar que hizo el conteo de reapertura; revisa día por día qué insumos bajaron y por qué; ve qué platos no descontaron nada y puede ir a resolverlos; y puede pedir recalcular días después de corregir recetas.

## Requerimientos

1. **Cliente** `src/services/runfoodConsumptionClient.js`: `getConsumptionSettings`, `updateConsumptionSettings`, `getConsumption(date)`, `recalculateConsumption({ desde, hasta })`. Valida fechas reales `AAAA-MM-DD`, rangos (inicio dentro de 30 días atrás y 30 adelante; recálculo de hasta 31 días y `desde <= hasta`), ubicación de la lista.
2. **Activación** (`RunfoodConsumptionSettingsCard`):
   - Estado actual: "Apagado" o "Activo desde {fecha} en {ubicación}".
   - Para activar: fecha de inicio (por defecto hoy), ubicación (por defecto Cocina) y una casilla obligatoria "Ya cargué el stock real con el conteo de reapertura". Sin la casilla, el botón "Activar" queda deshabilitado.
   - Confirmación de dos pasos que explica: "Desde {fecha}, cada día cerrado descontará del inventario de {ubicación} lo vendido en RunFood según las recetas".
   - Apagar también con dos pasos. Mensajes de error del motor junto al campo.
3. **Consumo del día** (`RunfoodConsumptionDay`):
   - Selector de fecha (por defecto ayer), con flechas de día anterior y siguiente.
   - Estado del día con texto claro para cada valor del contrato.
   - Lista de insumos descontados (nombre, cantidad con unidad), ordenada de mayor a menor; al tocar uno, se despliegan los platos de origen con su cantidad vendida.
   - Bloque "No se descontó" con `sin_receta`, `incompletos` y `con_opciones`, cada uno con cantidad vendida y un acceso a la vista de recetas del Brief 24p (filtrada por ese plato cuando el contrato lo permita).
4. **Recalcular** (`RunfoodRecalculateForm`): rango de fechas, validación local, dos pasos, mensaje con los días encolados y aviso de que el resultado aparece en unos minutos.
5. **Navegación:** sección "Consumo" dentro de `RunfoodRecipesView` (Brief 24p), además de Cobertura, Ingredientes y Recetas. Solo dueño.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`.
- Sigue las convenciones existentes del repo.
- Seguridad: valida toda entrada antes de llamar al motor, sin `dangerouslySetInnerHTML`, errores sin datos sensibles.
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, componentes de menos de 200 líneas, sin anidación de más de 4 niveles, inmutabilidad, manejo de errores explícito.
- No añadas dependencias sin justificarlo.
- No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones de fechas, rangos y ubicación sin llamar al motor.
- Activación: el botón queda deshabilitado sin la casilla; dos pasos para activar y apagar; error del motor junto al campo.
- Consumo del día: cada estado; lista ordenada; despliegue de platos de origen; bloque "No se descontó"; navegación entre días.
- Recalcular: rango inválido no llama al motor; éxito muestra los días encolados.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El consumo solo se puede activar confirmando el conteo de reapertura, con fecha y ubicación.
- [ ] El dueño ve por día qué se descontó, de qué platos vino y qué no se pudo descontar.
- [ ] Desde lo no descontado se llega a resolver la receta o el ingrediente.
- [ ] Recalcular un rango funciona con validación y confirmación.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo.
