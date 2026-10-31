# Brief 28p_fix2: segunda ronda de correcciones en la PWA (consumo, compras y ventas)

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA: React 18, Vite 5, Vitest 2, ESLint 9, lucide-react). Trabaja sobre la rama actual `fix/auditoria-pwa-24p-27p` (commit `fbc3e06`, Parte 2 del Brief 28p_fix). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del 2026-10-31 de `fbc3e06` dio este resultado:
- `npm run lint` sin errores (47 avisos, los mismos de antes), 779/779 tests en verde y el build compila. No hay emojis y no se quitaron tildes.
- El contrato con el motor (`main` en `4d1de25`) coincide en todo: ranking, resumen del día, alias y ajuste del recordatorio de faltantes.
- Queda un **HIGH**: Consumo muestra "Consumo desactivado" cuando en realidad falló la carga. El criterio de 28p_fix "Compras y Consumo nunca muestran un estado falso" no se cumple.
- Hay además seis MEDIUM y varios LOW.

**Lee primero:**
- `docs/briefs/28p_fix_auditoria-2026-10-31-motor-y-pwa.md` (Parte 2) y `docs/ualdo-brand.md`.
- `src/components/runfood/RunfoodConsumptionDay.jsx` y `src/hooks/useRunfoodConsumption.js`.
- `src/components/sales/SalesDaySummaryCard.jsx` y `src/components/sales/RunfoodStaffAliases.jsx`.
- `src/components/supplyRequests/SupplyReminderSettings.jsx`, `SupplyRequestDetail.jsx` y `ShoppingListPanel.jsx`.
- `src/components/common/ConfirmDialog.jsx` (patrón de foco en modales).

**Forma real de los errores del motor:**
- Al decidir un pedido (`POST /supply-requests/{id}/decision`), un 422 llega solo como `{ "message": "..." }`, sin `errors`.
- Al actualizar el alias, el 422 llega con `errors.alias[0]`.

## Objetivo

1. Ninguna pantalla muestra un estado falso cuando falla una carga.
2. Ningún indicador de carga se queda colgado.
3. Los modales gestionan el foco.
4. Los tests prueban la forma real de las respuestas del motor.

## Requerimientos

### HIGH

1. **Estado falso en Consumo** (`RunfoodConsumptionDay.jsx:35-39`).
   - Hoy `estado = consumption?.estado || 'apagado'`: si la carga falla (`consumption = null` y `error` presente), aparece "Consumo desactivado" junto al banner de error.
   - Con `!consumption && error`:
     - no muestres la insignia de estado, o muéstrala como "No disponible" con los colores neutros existentes (`var(--chip-bg)` y `var(--text-muted)`);
     - no muestres los bloques de líneas, stock negativo ni último error.
   - Test de render: con `consumption = null` y `error = 'No se pudo cargar'`, no aparece "Consumo desactivado".

### MEDIUM

2. **422 al aprobar un pedido** (`SupplyRequestDetail.jsx`, aprox. 160-170; `useSupplyRequests.js`, `fieldErrors`).
   - El motor no envía claves `items.N.quantity`, así que el mensaje "junto al campo" nunca aparece.
   - Muestra el `message` del 422 en un aviso con `role="alert"`, justo encima de los campos de cantidad, y marca con `aria-invalid` los campos cuya cantidad se envió.
   - Elimina el código que busca `errors['items.N.quantity']`.
   - Ajusta el test de `SupplyRequestAuditoriaFixes.test.jsx:77-103` a la forma real (`{ message }` sin `errors`). Comprueba el aviso con un selector concreto (`getByRole('alert')`), no con `getAllByText(...).length >= 1`.
3. **Foco en el modal de alias** (`RunfoodStaffAliases.jsx`). Al abrir, el foco va al primer campo. Tab no sale del modal, Escape lo cierra y, al cerrar, el foco vuelve al botón "Nombres del personal". Reutiliza el patrón de `ConfirmDialog.jsx`. Test: Escape cierra el modal y el foco vuelve al botón.
4. **Carga colgada en el resumen del día** (`SalesDaySummaryCard.jsx`, manejador de modo, aprox. líneas 100-104).
   - Si el usuario toca el modo que ya está activo, `reqIdRef.current++` descarta la respuesta en vuelo y el efecto no vuelve a ejecutarse, así que queda en "Cargando resumen...".
   - Incrementa el contador y cambia de modo solo si `mode !== dayMode`.
   - Test: tocar dos veces "Ayer" con la petición en vuelo termina mostrando el resumen.
5. **Ajustes del recordatorio con carga fallida** (`SupplyReminderSettings.jsx:30-49`).
   - Si `GET` falla, no muestres el formulario con los valores por defecto (`21:30`, activado). Guardarlo pisaría la configuración real.
   - Muestra solo el error con un botón "Reintentar" que vuelva a cargar.
   - Test: con el `GET` fallido no existe el botón "Guardar horario", y "Reintentar" carga el formulario.
6. **Tests vacíos o débiles:**
   - `SupplyReminderSettings.test.jsx:106-118`, "el personal no ve el ajuste": espera con `waitFor` a que termine la carga antes de comprobar la ausencia. Si con `isOwner={false}` el componente no carga nada, comprueba que no se llamó a `getSupplySettings`.
   - `RunfoodStaffAliases.test.jsx:46-73`: añade el caso real. Se envía un alias con `<`, el motor responde `422` con `errors.alias[0]` y el mensaje aparece en la fila. Si el cliente rechaza `<` antes de llamar al motor, prueba ese mensaje y que no se llamó al motor.
   - `ShoppingListPanel.jsx:13`: cambia `isOwner = true` a `isOwner = false` como valor por defecto, y pasa la prop explícita donde se usa.

### LOW

7. Componentes de más de 200 líneas:
   - `SalesDaySummaryCard.jsx` (214): extrae el aviso de datos desactualizados a `SalesStaleNotice.jsx`.
   - `SupplyRequestDetail.jsx` (244): extrae los campos de cantidad a `SupplyRequestQuantityFields.jsx`.
8. `SalesStaffRanking.jsx:126-128`: si `anulados.total` llega `null`, muestra "No disponible", no "USD 0,00".
9. `useRunfoodConsumption.js`: en las recargas tras guardar ajustes (misma fecha), no pongas `consumption` en `null`. Límpialo solo al cambiar de fecha, para evitar el parpadeo.
10. `RunfoodStaffAliases.jsx`, aprox. 146-160: si el usuario escribe después de pulsar Guardar vacío, se anula la confirmación pendiente ("¿Confirmar quitar?").
11. Botones "Guardar" y "Quitar alias": usa el estilo pastilla de la marca (`docs/ualdo-brand.md`, sección 4) con la clase de botón existente del repo, no `borderRadius: 8px`.
12. Tildes en los comentarios JSDoc de `runfoodConsumptionClient.js`: "recálculo", "configuración", "días".

## Fuera de alcance

El motor ahora concede el ajuste del recordatorio (`settings.manage`) y los alias (`sales.totals`) también a administración. La PWA sigue mostrándolos solo al dueño por `isOwner`. El paso a permisos lo hace el Brief 30p; no lo adelantes aquí.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests o nombres de archivo. Iconos solo con SVG (lucide-react).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Colores solo con las variables CSS existentes de `src/styles/main.css` (sin hex, rgb ni variables inventadas), Poppins, botones pastilla y tono cercano. Conserva las tildes.
- Todas las llamadas por `apiClient`, sin `console.log`. Componentes de menos de 200 líneas, funciones de menos de 50 y sin anidación de más de 4 niveles. Inmutabilidad.
- Accesibilidad: `role="alert"` en los errores, `aria-invalid` en los campos con error y foco gestionado en los modales.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

Los indicados en cada punto (Vitest y Testing Library). Los fixtures deben usar la forma real de las respuestas del motor descrita en el Contexto. Cobertura de al menos 80 % en el código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npx vitest run
cd C:/laragon/www/UALDO && npx vite build
```

- El primer comando debe mostrar `fix/auditoria-pwa-24p-27p`.
- El lint debe quedar sin errores.

## Criterios de aceptación

- [ ] Con la carga fallida, Consumo no dice "Consumo desactivado".
- [ ] El 422 al aprobar un pedido se ve encima de las cantidades, con la forma real del motor.
- [ ] El modal de alias gestiona el foco y se cierra con Escape.
- [ ] Tocar dos veces el mismo modo no deja el resumen cargando.
- [ ] Con el `GET` de ajustes fallido no se puede guardar.
- [ ] Los tests de M5 y M6 prueban lo que dicen.
- [ ] Ningún componente tocado pasa de 200 líneas.
- [ ] Todos los tests pasan; lint sin errores; build correcto; cero emojis.
