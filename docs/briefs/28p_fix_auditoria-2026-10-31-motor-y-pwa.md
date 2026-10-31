# Brief 28p_fix: corrección total de la auditoría del 2026-10-31 (motor y PWA)

## Contexto

Este brief reúne **todas** las correcciones de la auditoría del 2026-10-31 sobre los Briefs 27, 28 y 29 del motor y 24p_fix, 25p, 26p y 27p de la PWA. Reemplaza a los briefs parciales `27p_fix`, `26p_fix` y `29_fix`. Se hace en dos repos y **en este orden**: primero el motor (Parte 1) y después la PWA (Parte 2), porque la PWA consume los campos que el motor corrige.

**Construye:** el usuario (Antigravity). Audita: Claude.

### Repos

| Parte | Repo | Stack | Rama |
|---|---|---|---|
| 1. Motor | `C:\laragon\www\UaldoBusiness` | Laravel 12, PHP 8.3, PostgreSQL, Pest 3. Agente del local en `agent/` (Node 22, sin dependencias npm, `node --test`) | `fix/auditoria-27-29` desde `main` (`318f00b`) |
| 2. PWA | `C:\laragon\www\UALDO` | React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react` | `fix/auditoria-pwa-24p-27p` desde `feat/pwa-resumen-del-dia` (`d681e47`) |

**Atención en el motor:** el árbol de trabajo está en la rama `feat/roles-por-area` con cambios sin commitear del Brief 30. **No los mezcles:** commitéalos en su rama o usa `git stash` antes de cambiar a `main`, y recupéralos al terminar.

### Estado medido en la auditoría

- PWA: lint 0 errores, 761/761 tests, build correcto.
- Motor: 840 tests en verde y 2 fallidos en `CashCloseTest` (fecha fija vencida), Pint limpio, 80 tests del agente en verde.
- No hubo CRITICAL. Hubo **un HIGH**: la columna de anulaciones del ranking del personal en la PWA siempre sale vacía. Los tests pasan porque usan un campo inventado.

### Lee primero, completos

- Motor:
  - `docs/briefs/27_faltantes-del-dia-por-chat.md`, `28_ventas-por-empleado-desde-runfood.md` y `29_resumen-del-dia-y-desempeno-en-el-chat.md`.
  - `docs/API-sales.md`, `docs/API-supply-requests.md` y `docs/PRIVACIDAD-asistente.md`.
  - `docs/runfood/CONTRATO-snapshot-ventas.md` y `docs/RUNBOOK-shop-pc-runfood-agent.md`.
  - `docs/ualdo-brand.md`.
- PWA:
  - `docs/ualdo-brand.md` y `src/styles/main.css` (variables CSS disponibles).
  - `docs/briefs/25p_pwa-consumo-por-ventas.md`, `26p_pwa-faltantes-del-dia-y-compras.md` y `27p_pwa-resumen-del-dia-y-personal.md`.

## Objetivo

1. El operador puede actualizar el agente del local siguiendo el runbook.
2. El motor rechaza alias con etiquetas, nunca inventa ceros y permite configurar la hora del aviso de cierre.
3. La PWA muestra las anulaciones reales, usa solo variables CSS existentes y nunca muestra un estado falso (vacío o de otro día).
4. Ambos repos quedan con todas las verificaciones en verde, incluidos los dos tests de `CashCloseTest`.

---

## Parte 1: Motor (`C:\laragon\www\UaldoBusiness`)

### 1A. Agente y contrato (Brief 28)

1. **MEDIUM. Runbook** (`docs/RUNBOOK-shop-pc-runfood-agent.md`, sección "Actualizar el agente a 1.4.0", paso 2).
   - Problema: `cash/nocturno.js` y `sales/intradia.js` no existen, y `runfood_agent.js` no ejecuta el canal de ventas.
   - Revisa `agent/cash_snapshot.js`: modos `nocturno` e `intradia`, líneas 6-7 y 172-174.
   - Escribe el comando real que genera la foto de ventas y deja en el log la línea `[ventas] Columna de nombre de empleado detectada`. Si existe un modo de prueba sin envío, úsalo.
   - Verifica el comando en local con una configuración de prueba antes de documentarlo.
2. `StoreSalesDaySnapshotRequest`: en `2026-11-01`, `por_usuario.*.nombre` pasa a `['present', 'nullable', 'string', 'max:60']`, igual que el validador del agente.
3. **Upsert de `runfood_staff`** (`app/Listeners/ApplyRunfoodSalesDaySnapshot.php`, líneas 91-119).
   - Hoy es `first()` seguido de `create`. Hazlo atómico con `upsert` o `firstOrCreate` dentro de la transacción.
   - No pises `alias`, ni `nombre_runfood` con `null`.
4. **Sin duplicación.**
   - En el motor, el cálculo de `propina_cents`, `mesas` y `anulados_*` está en `SalesDaySnapshotService::store` y en `syncSnapshotDailyTotals` del listener. Déjalo en un solo lugar.
   - En el agente, `allowedNameCols` (`agent/cash/sql.js`) debe reutilizar `USER_NAME_CANDIDATES`.
5. **Contrato** (`docs/runfood/CONTRATO-snapshot-ventas.md`).
   - Corrige la numeración duplicada "1.2".
   - Documenta que `totales.mesas` es la suma de mesas por usuario: una mesa atendida por dos usuarios cuenta dos veces.
6. **Funciones largas del agente.** Divide `fetchAndBuildSalesSnapshot` (unas 80 líneas) y `buildPorUsuarioList` (unas 70) en funciones de menos de 50 líneas, sin cambiar el resultado.

### 1B. Resumen del día y alias (Brief 29)

7. **MEDIUM. Alias** (`app/Http/Requests/UpdateRunfoodStaffAliasRequest.php`, líneas 24-33).
   - Problema: el saneo lee el cuerpo crudo como JSON. Un `PUT` con formulario guarda etiquetas tal cual, y con JSON `<script>x</script>` se guarda como `x`.
   - Lee `$this->input('alias')`, recorta los espacios de los extremos y colapsa los internos.
   - **Rechaza con `422`** cualquier alias que contenga `<` o `>` (`not_regex:/[<>]/`). No quites las etiquetas en silencio.
8. **MEDIUM. Nunca un `0` inventado** (`app/Services/SalesDaySummaryService.php`: `resolveExtendedTotals` y el cálculo de `descuento`).
   - Resuelve cada campo por separado: `propina`, `mesas`, `anulados.pedidos`, `anulados.total` y `descuento`.
   - Si la clave no existe ni en la foto ni en las columnas normalizadas, devuelve `null`.
   - `top_platos` devuelve `null` cuando no hay datos de artículos. Documéntalo en `API-sales.md`.
9. **Id fuera de rango.** En `routes/api.php` (líneas 115-116), limita `{runfood_user_id}` a `[0-9]{1,10}`, para que un id enorme dé `404` y no `500`.
10. **Primer nombre para el modelo** (`SalesDaySummaryService.php:598`). Usa `preg_split('/\s+/u', trim($nombre), 2)[0]` en lugar de `explode(' ', ...)`.
11. **`compras_pendientes.aprobado`** (`SalesDaySummaryService.php`, líneas 540-547).
    - Quita el respaldo que cuenta pedidos cuando no hay líneas.
    - La unidad es "insumos distintos por comprar". Documéntala en `API-sales.md`.
12. **Herramientas** (`app/Assistant/Tools/SalesTools.php`).
    - `resumen_del_dia` envía el resumen una sola vez; hoy va plano y además bajo `resumen`.
    - En la descripción de `ventas_por_empleado`, aclara que si `desde` o `hasta` es `hoy` se devuelve el ranking parcial de hoy.
13. **Tamaño.** `SalesDaySummaryService.php` tiene 775 líneas.
    - Extrae a `app/Services/SalesStaffRankingService.php`: `staffRanking`, `buildPartialStaffRanking`, `buildStaffRankingRow` y sus ayudantes.
    - Ningún método debe pasar de 50 líneas.

### 1C. Faltantes y aviso de cierre (Brief 27)

14. **MEDIUM. Hora del aviso configurable.** Hoy `faltantes_reminder_time` solo se lee.
    - Añade la escritura: formato `HH:MM` (`date_format:H:i`), máximo `23:45`, solo el dueño, registrada en `ActivityLog`. El tope evita la ventana que cruza la medianoche.
    - Canal: usa un endpoint de ajustes del negocio si ya existe. Si no, crea `PUT /api/v1/supply-requests/settings` con `{ "faltantes_reminder_time": "21:30", "faltantes_reminder_enabled": true }` y `GET` del mismo recurso.
    - Documéntalo en `docs/API-supply-requests.md`.
15. **MEDIUM. Módulo activo** (`app/Console/Commands/SupplyEndOfDayReminderCommand.php`, líneas 38-53).
    - Problema: las banderas `settings.supply_requests_enabled`, `settings.modules.supply_requests` y `settings.modules.pedidos` no existen en ningún otro lugar.
    - Si hay un mecanismo real de módulos del negocio, úsalo.
    - Si no lo hay, usa una sola bandera documentada, `settings.faltantes_reminder_enabled` (por defecto `true`), que se escribe con el punto 14.
16. **MEDIUM. Cantidad al aprobar** (`app/Services/SupplyRequestService.php`, líneas 168-191; `app/Support/SupplyRequestInput.php`, líneas 232-263).
    - Solo se aceptan cantidades para ítems con `quantity` nula.
    - Un ítem que ya tiene cantidad responde `422` con un mensaje claro. No se pisa en silencio.
17. **`aprobar_pedidos`** (`app/Assistant/Tools/SupplyRequestTools.php`, líneas 692-726).
    - Si un pedido cambió de estado entre la confirmación y la ejecución, captura `InvalidSupplyRequestTransition`.
    - Responde nombrando el pedido que falló; no revierte todo sin explicación.
18. **Limpieza.** Elimina la expresión muerta `$item->attributes['unit']` (`SupplyRequestService.php:459`).

### 1D. Suite

19. **`tests/Feature/Api/CashCloseTest.php`.** Los casos "pwa can record daily cash close with correct aggregates" y "get cash close returns libro diario figures" usan una fecha fija que quedó fuera de la ventana de 90 días. Cambia esas fechas a relativas (`now('America/Guayaquil')->subDays(1)`) sin tocar la regla de validación.

### Tests del motor (Pest y `node --test`)

- **Brief 28:**
  - Un snapshot con `nombre: null` no pisa un `nombre_runfood` existente.
  - En `2026-11-01` dan `422`: una clave desconocida dentro de `totales`, la falta de `totales.propina` y un ítem de `por_usuario` sin la clave `nombre`.
- **Brief 29:**
  - Alias con `<b>x</b>` en cuerpo de formulario: `422`.
  - Alias con `<script>` en JSON: `422`.
  - Id de 20 dígitos: `404`.
  - Foto parcial `2026-11-01` sin `propina`: llega en `null`.
  - Nombre con tab: solo viaja la primera palabra.
  - `resumen_del_dia` no duplica el resumen.
- **Brief 27, `purchasingOverview`:**
  - Número de consultas acotado (`DB::enableQueryLog`).
  - Aislamiento entre negocios.
  - Límites de 50 y 30.
- **Brief 27, aviso de cierre:**
  - No se envía a negocios que no son restaurante, ni con el aviso apagado, ni a usuarios agente.
- **Brief 27, decisión REST con `items`:**
  - Cantidad válida: se aplica.
  - Id de otro pedido: `422`.
  - Ítem que ya tenía cantidad: `422`.
- **Brief 27, escritura de la hora:**
  - Formato inválido: `422`.
  - `23:50`: `422`.
  - Personal: `403`.
- **Brief 27, `aprobar_pedidos`:** un pedido decidido entre la confirmación y la ejecución se informa por nombre.

---

## Parte 2: PWA (`C:\laragon\www\UALDO`)

Empieza cuando la Parte 1 esté terminada. Los contratos a respetar están en `C:\laragon\www\UaldoBusiness\docs\API-sales.md` y `API-supply-requests.md` ya actualizados.

### 2A. Resumen del día y personal (Brief 27p)

20. **HIGH. Anulaciones con el campo real** (`src/components/sales/SalesStaffRanking.jsx`, líneas 124-131).
    - El motor envía por empleado `anulados: { pedidos, total }`, y a veces `anulados_pedidos` y `anulados_total`. No existe `anulaciones`.
    - Lee `emp.anulados` y, si no viene, `anulados_pedidos` y `anulados_total`.
    - Muestra `"{pedidos} ({monto})"` con `formatUsd`. Sin dato, "No disponible".
    - Corrige las fixtures de `src/components/sales/__tests__/SalesStaffRanking.test.jsx` y de los demás tests de ventas para que usen **exactamente** la forma documentada en `API-sales.md`.
21. **Forma de la respuesta del ranking** (`SalesStaffRanking.jsx:38`).
    - La respuesta documentada es `{ from, to, totales, empleados }`. Lee `data.empleados`; usa `data.data` solo como respaldo.
22. **Colores.** Solo variables CSS que existan en `src/styles/main.css`.
    - `--surface-sunken` no existe. Reemplázala por `--surface-soft` o `--chip-bg` en:
      - `RunfoodStaffAliases.jsx:125`
      - `SalesPeriodSelector.jsx:89` y `:107`
      - `SalesStaffRanking.jsx:154`
    - En `RunfoodStaffAliases.jsx:82`, cambia `rgba(0,0,0,0.6)` por `var(--overlay)`.
23. **Modal de nombres del personal** (`RunfoodStaffAliases.jsx`, abierto desde `SalesStaffRanking.jsx`, líneas 173-178).
    - Problema: está dentro de un `.glass-card` con `backdrop-filter`, así que el `position: fixed` queda recortado a la tarjeta.
    - Renderízalo con `createPortal(..., document.body)`.
24. **Aviso de datos desactualizados.**
    - El Brief 27p dejó de montar `SalesTodayCard` y se perdió el aviso de foto parcial con más de 60 minutos.
    - En `SalesDaySummaryCard`, modo "Hoy", muestra ese aviso cuando `/sales/today` lo indique. El nombre exacto del campo está en `API-sales.md` y en `SalesTodayCard.jsx`.
    - Si después `SalesTodayCard` no se usa en ningún lugar, elimínalo junto con su test.
25. **Resumen del día** (`SalesDaySummaryCard.jsx`).
    - Descarta las respuestas fuera de orden entre "Hoy", "Ayer" y fecha: contador de petición en un `ref`.
    - El texto de carga es "Cargando resumen..." en todos los modos.
    - Si `/sales/today` llega sin `resumen`, muestra "Aún no hay datos de hoy". No caigas al objeto raíz (línea 59).
    - Con el campo de fecha vacío no llames al motor; muestra "Elige una fecha".
26. **Alias** (`RunfoodStaffAliases.jsx` y `src/services/salesClient.js`).
    - "Guardar" con el campo vacío quita el alias, así que pide la misma confirmación de dos pasos que "Quitar".
    - Recorta los espacios antes de validar la longitud de 60.
    - El motor ahora rechaza `<` y `>` con `422`; muestra ese mensaje junto al campo.

### 2B. Compras y faltantes (Brief 26p)

27. **Error de carga** (`src/components/supplyRequests/ShoppingListPanel.jsx`, aprox. líneas 35-50).
    - Si hay `error` y no hay datos, muestra solo el error con "Reintentar".
    - No muestres `ApprovedPurchases`, `PendingReports` ni `LowStockSuggestions` con sus mensajes de vacío.
28. **Cantidades al aprobar** (`SupplyRequestDetail.jsx`, `handleConfirm`, aprox. 104-113; `src/services/supplyRequestsClient.js`, `decideRequest`, aprox. 117-129).
    - Valida cada cantidad de "Fijar cantidades" con `normalizeRequestQuantity` antes de confirmar.
    - Una cantidad inválida (`abc`, `0`, negativa) muestra el error junto al campo y no envía la aprobación.
    - Un campo vacío sigue significando "por definir".
    - Muestra los `422` del motor (por ejemplo, un ítem que ya tenía cantidad) junto al campo.
29. **"Aprobar todos"** (`PendingReports.jsx`, aprox. líneas 36-46 y 85-95).
    - Lista cuáles fallaron: id, primer nombre de quien reportó y mensaje del motor.
    - En las líneas 22-23, un éxito sin `onReload` no debe reportarse como error.
30. **Sin respaldo silencioso** (`src/hooks/useSupplyRequests.js`).
    - Quita el respaldo de `usePurchasingOverview` a `getShoppingList` (aprox. líneas 99-110).
    - Elimina `useShoppingList` (línea 139) si no tiene usos.
31. **Hora del aviso de cierre (nuevo).**
    - En Compras, solo el dueño ve el ajuste "Aviso de faltantes al personal": activado o desactivado, y la hora.
    - Valida en el cliente `HH:MM` con máximo `23:45` y usa el endpoint de la Parte 1, punto 14.
    - Componente propio de menos de 200 líneas, con estado de envío, mensaje de éxito y `422` junto al campo.

### 2C. Consumo por ventas (Brief 25p)

32. **"Mapear insumo"** de platos incompletos (`src/components/runfood/RunfoodConsumptionUnmappedBlock.jsx`, líneas 78-89; `RunfoodConsumptionUnmappedSection.jsx`).
    - Busca por el primer elemento de `item.faltantes`; si no hay, por `item.descripcion`.
    - Muestra la lista de `faltantes` bajo el plato.
33. **Carga por fecha** (`src/hooks/useRunfoodConsumption.js`, aprox. líneas 296-314).
    - Al empezar a cargar otra fecha, limpia `consumption`. Si la carga falla, queda en `null`.
    - Descarta las respuestas fuera de orden.
34. **Primera carga** (`RunfoodConsumptionDay.jsx:35`): muestra "Cargando...", no "Consumo desactivado".
35. **Errores junto al campo** (`RunfoodConsumptionSettingsCard.jsx`, líneas 57-75; `RunfoodConsumptionActivateForm.jsx`). Toma `errors.start_date[0]` y `errors.location[0]` del `422` y muéstralos bajo cada campo.
36. **Accesibilidad.** La casilla de `RunfoodConsumptionActivateForm.jsx` (líneas 242-265) lleva `role="checkbox"` y `aria-checked`.
37. **Tildes** en los textos visibles.
    - `src/services/runfoodConsumptionClient.js`: líneas 97, 110, 127, 132, 143, 167, 172, 177 y 204.
    - `src/hooks/useRunfoodConsumption.js`: líneas 287, 309, 331 y 347.
    - Palabras a corregir: "válido", "Ubicación", "días", "máximo", "recálculo", "conexión". Actualiza los tests que comparan esos textos.

### 2D. Recetas (Brief 24p_fix)

38. `src/components/runfood/RunfoodRecipesView.jsx:21`: limpia `mappingsSearch` cuando el usuario cambia de sección a mano.

### Tests de la PWA (Vitest)

- **Ranking:**
  - Con la forma real del contrato, muestra las anulaciones (`anulados: { pedidos: 2, total: "15.00" }`), y "No disponible" sin dato.
  - Lee `empleados`.
  - El modal se monta en `document.body`.
- **Resumen:**
  - Aviso de datos desactualizados en "Hoy".
  - Respuesta fuera de orden descartada.
  - Fecha vacía sin llamada al motor.
  - En `SalesView`, la sección "Ventas" no pide el ranking y "Personal" no pide el resumen.
- **Alias:**
  - Guardar vacío pide dos pasos.
  - 60 caracteres con espacio final se aceptan.
  - `422` del motor junto al campo.
- **Compras:**
  - Error de carga sin mensajes de vacío.
  - El dueño fija cantidades válidas e inválidas al aprobar.
  - El formulario de pedido no envía `quantity` vacía.
  - Lista de fallidos tras "Aprobar todos".
  - Ajuste de hora: validación, guardado, `422`, y el personal no lo ve.
- **Consumo:**
  - "Mapear insumo" usa el ingrediente faltante.
  - Un cambio de fecha con error no muestra datos del día anterior.
  - Respuesta fuera de orden descartada.
  - `422` por campo.
- **Recetas:** la búsqueda se limpia al cambiar de sección.
- **Cobertura:** 80 % o más del código tocado.

---

## Restricciones técnicas (ambos repos)

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Conserva y restaura las tildes.
- Privacidad (LOPDP): ningún nombre de empleado en logs del agente ni del motor. Al modelo de IA solo viaja el alias o el primer nombre. El personal no ve ventas, desempeño ni ajustes del dueño.
- Sigue las convenciones de cada repo:
  - Motor: AdminTool, servicios, policies, Form Requests, `BusinessContext`, recursos API.
  - PWA: todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- Seguridad:
  - Autorización de dueño en cada endpoint, herramienta y vista.
  - Validación de toda entrada, en el cliente y en el motor.
  - Consultas parametrizadas; en el agente, columnas dinámicas solo desde la lista blanca.
  - Errores sin datos sensibles; `throttle` como el resto de rutas.
- Diseño:
  - Funciones de menos de 50 líneas.
  - Componentes de la PWA de menos de 200 líneas y archivos del motor de menos de 800.
  - Sin anidación de más de 4 niveles; inmutabilidad; DRY.
- Rendimiento: sin N+1, una petición por sección visible y respuestas fuera de orden descartadas.
- No añadas dependencias. No toques archivos fuera del alcance de cada punto. No toques los cambios del Brief 30.
- Un commit por repo con formato convencional, por ejemplo `fix: correcciones de auditoría 2026-10-31 (Briefs 27-29)` y `fix: correcciones de auditoría 2026-10-31 (Briefs 24p-27p)`.

## Verificación final

En este orden, todo en verde:

```bash
cd C:/laragon/www/UaldoBusiness/agent && node --test "test/**/*.test.js"
cd C:/laragon/www/UaldoBusiness && php artisan test
cd C:/laragon/www/UaldoBusiness && ./vendor/bin/pint --test
cd C:/laragon/www/UaldoBusiness && wc -l app/Services/SalesDaySummaryService.php app/Services/SalesStaffRankingService.php
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
cd C:/laragon/www/UALDO && grep -rn "surface-sunken\|rgba(\|anulaciones" src/components/sales/SalesStaffRanking.jsx src/components/sales/RunfoodStaffAliases.jsx src/components/sales/SalesPeriodSelector.jsx src/components/sales/SalesDaySummaryCard.jsx
```

`php artisan test` debe terminar sin fallos, incluidos los dos de `CashCloseTest`. El último `grep` no debe devolver nada.

## Criterios de aceptación

**Motor**
- [ ] El runbook trae el comando real y verificado para ver la columna de nombre detectada.
- [ ] Un alias con `<` o `>` se rechaza con `422`, en JSON y en formulario.
- [ ] El resumen devuelve `null` (nunca `0.00` inventado) en cada campo ausente.
- [ ] El dueño puede activar o desactivar el aviso de cierre y cambiar su hora (validada, máximo 23:45).
- [ ] Una cantidad ya definida no se pisa al aprobar.
- [ ] `SalesDaySummaryService.php` y el nuevo `SalesStaffRankingService.php` quedan bien por debajo de 800 líneas.

**PWA**
- [ ] El ranking muestra las anulaciones reales y los tests usan la forma documentada del motor.
- [ ] Sin `--surface-sunken` ni `rgba` en los componentes de ventas tocados.
- [ ] El modal de nombres cubre toda la pantalla.
- [ ] El dueño ve el aviso de datos desactualizados en "Hoy".
- [ ] Compras y Consumo nunca muestran un estado falso (vacío o de otro día).
- [ ] El dueño ajusta la hora del aviso desde Compras.

**Ambos repos**
- [ ] Todas las verificaciones en verde.
- [ ] Cero emojis, tildes conservadas y marca Ualdo.
