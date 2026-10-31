# Brief 23p: ventas en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-sales` desde la rama más reciente de la PWA (`feat/pwa-supply-requests`, Brief 22p en `f93f00e`, o `main` si ya se fusionó). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** El motor ya recibe de RunFood lo vendido por plato y por hora (Brief 23 del motor) y, si está instalado, la foto parcial del día en curso (Brief 26). El dueño necesita verlo en el teléfono: cuánto vendió, qué platos salen más y a qué hora hay más movimiento. Hoy la app solo muestra el cierre de caja.

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-sales.md` (léelo completo; lo crean los Briefs 23 y 26 del motor). Resumen, todo solo para el dueño (el personal recibe `403`):
- `GET /restaurant/sales/summary?from=&to=`: totales del rango y una fila por día (`fecha`, `pedidos`, `total`, `descuento`). Rango máximo 92 días; sin parámetros, los últimos 7 días cerrados.
- `GET /restaurant/sales/items?from=&to=&sort=quantity|total&page=`: artículos agregados, 20 por página, con `cantidad`, `total`, `participacion`.
- `GET /restaurant/sales/hours?from=&to=`: 24 filas (hora 0 a 23) con promedio de pedidos y total por día.
- `GET /restaurant/sales/today`: última foto parcial de hoy o `null`; incluye `capturada_a`, `minutos_desde_captura`, `desactualizado`, `totales`, 10 artículos y `por_hora`. Si el motor aún no tiene el Brief 26, este endpoint puede responder `404`: la app lo trata como "sin datos de hoy".
- Montos como texto con 2 decimales; cantidades como texto con 3.

**Lee primero:** `docs/ualdo-brand.md`, `src/components/EcosystemView.jsx` (subpestañas de Negocios y cómo se detecta al dueño), `src/components/CashCloseView.jsx` y `src/hooks/useCashClose.js` (patrón de vista y hook), `src/services/apiClient.js`, `src/services/money.js`, `src/services/quantityFormat.js`, `src/hooks/usePagedList.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos y cantidades como texto (nunca `parseFloat` para mostrar ni sumar); todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; iconos de `lucide-react`.

## Objetivo

El dueño abre Negocios, pestaña "Ventas", y ve cómo va hoy (si hay foto parcial), el resumen de los últimos días, los platos más vendidos y las horas de más venta, con cifras que coinciden con el motor. El personal no ve la pestaña.

## Requerimientos

1. **Cliente** `src/services/salesClient.js`: `getSalesSummary({ from, to })`, `getSalesItems({ from, to, sort, page })`, `getSalesHours({ from, to })`, `getSalesToday()`. Valida antes de llamar: fechas `AAAA-MM-DD` reales, `from <= to`, rango de hasta 92 días, `sort` en la lista, `page` entero positivo. Devuelve `{ ok, data, error }` como los demás clientes. `getSalesToday` convierte `404` en `{ ok: true, data: null }`.
2. **Hook** `src/hooks/useSales.js`: rango seleccionado (presets "Últimos 7 días", "Últimos 30 días", "Este mes" y rango personalizado), carga en paralelo de resumen y horas, artículos paginados con `usePagedList` y orden por cantidad o total. Cancela respuestas viejas si el rango cambia (no muestra datos del rango anterior).
3. **Vista** `src/components/sales/SalesView.jsx` y componentes pequeños en `src/components/sales/`:
   - **Tarjeta "Hoy"** (`SalesTodayCard`): total, pedidos y los 5 platos más vendidos de la foto parcial; texto "Actualizado hace N min". Si `desactualizado`, aviso visible "La última lectura de RunFood tiene más de una hora". Si no hay datos de hoy: "Todavía no hay ventas de hoy desde RunFood".
   - **Resumen del rango** (`SalesSummary`): total, pedidos, ticket promedio (total / pedidos, calculado con `money.js`, sin `float`) y una fila por día.
   - **Platos más vendidos** (`SalesItemsList`): lista paginada con nombre, cantidad, total y participación; alternar orden por cantidad o por total.
   - **Ventas por hora** (`SalesHoursChart`): barras horizontales simples hechas con `div` y variables CSS (sin librería de gráficos nueva), solo de las horas con ventas, con la hora pico resaltada y etiqueta de texto accesible por barra.
   - Estados de carga, vacío y error en cada bloque, con botón "Reintentar".
4. **Navegación:** subpestaña `{ id: 'ventas', label: 'Ventas', icon: TrendingUp }` en `EcosystemView.jsx`, visible **solo para el dueño** (misma detección `isOwner` que ya usa el archivo). Si alguien sin rol de dueño llega a `ventas` (por ejemplo, desde un enlace), muestra el mensaje de acceso restringido existente o vuelve a `overview`.
5. **Accesibilidad y marca:** botones pastilla, Poppins, contraste suficiente, `aria-pressed` en los selectores de orden y de rango, textos en español con tildes.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (paleta vía variables CSS, Poppins, botones pastilla, tono).
- Sigue las convenciones existentes del repo (nombres, estructura, estilo).
- Seguridad: valida toda entrada antes de llamar al motor, escapa salidas (React por defecto, sin `dangerouslySetInnerHTML`), errores sin datos sensibles.
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, archivos de menos de 800 líneas (componentes de menos de 200), sin anidación de más de 4 niveles, inmutabilidad, manejo de errores explícito.
- Rendimiento: paginación de artículos, sin recargar todo al cambiar de página, sin librerías nuevas.
- No añadas dependencias sin justificarlo en el resumen final.
- No toques archivos fuera del alcance.

## Tests

- `salesClient`: validaciones (fecha inválida, rango invertido, rango de 93 días, `sort` desconocido) sin llamar al motor; `404` de `today` da `data: null`; errores del motor se propagan como `{ ok: false }`.
- `useSales`: cambio de rango descarta la respuesta vieja; orden y paginación.
- Componentes: tarjeta Hoy con datos, sin datos y desactualizada; resumen con ticket promedio exacto (por ejemplo, 100,00 / 3 pedidos); lista con orden; gráfico por hora marca la hora pico; estados de error con reintento.
- `EcosystemView`: el dueño ve "Ventas"; el personal no.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El dueño ve la pestaña "Ventas"; el personal no.
- [ ] La tarjeta "Hoy" muestra la foto parcial con su antigüedad, o el mensaje de sin datos.
- [ ] El resumen, los platos y las horas coinciden con el motor para el rango elegido.
- [ ] Montos y cantidades se muestran sin errores de redondeo y sin `float`.
- [ ] Estados de carga, vacío y error en cada bloque.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo.
