# Brief 32p_fix: retiros de bodega, lectura de respuestas del motor y detalles

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Trabaja sobre la rama `feat/pwa-retiros-de-bodega` (commit `2cd2875`, Brief 32p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del 2026-11-01 dio verde en lo básico: 934 tests, lint con 0 errores y 47 avisos (los mismos de antes), build correcto, sin emojis ni tildes eliminadas, componentes por debajo de 200 líneas. Pero hay un fallo grave que los tests no ven, porque los mocks no usan la forma real de las respuestas del motor.

`apiClient.request` **no desenvuelve** el JSON: devuelve `{ ok, status, data }`, donde `data` es el cuerpo completo. El motor responde los recursos individuales y los ajustes como `{ "data": { ... } }` (ver `C:\laragon\www\UaldoBusiness\app\Http\Controllers\Api\WithdrawalController.php`: `show`, `settings`, `updateSettings`, `store`, `close`, `cancel`). Consecuencias:

| Caso | Qué pasa hoy | Debe pasar |
|---|---|---|
| Ajustes de retiros (`WithdrawalSettingsForm`) | Lee `res.data.reminder_after_minutes`, que no existe: siempre muestra 120 / 120 / 3 / 02:00 / 09:00 aunque el negocio tenga otros valores. Si administración pulsa Guardar, **sobrescribe la configuración real con esos valores por defecto**. | Muestra los valores reales y guarda solo lo que se cambió. |
| Abrir un retiro por `initialId` (`WithdrawalsView`) | `setActiveWithdrawal(res.data)` guarda el sobre; `lines` queda vacío y el cierre falla con "Debes incluir la confirmación de todas las líneas.". | Abre el formulario de cierre con sus líneas. |

**Lee primero:** `docs/briefs/32p_pwa-retiros-de-bodega.md`, `docs/ualdo-brand.md`, `src/services/apiClient.js` (función `request`), `src/services/withdrawalsClient.js`, `C:\laragon\www\UaldoBusiness\docs\API-withdrawals.md` y `C:\laragon\www\UaldoBusiness\app\Http\Resources\StockWithdrawalResource.php` (nombres reales de los campos).

## Objetivo

La app lee las respuestas reales del motor: los ajustes muestran y guardan los valores verdaderos, el enlace directo a un retiro abre su cierre, los botones principales se leen bien y el detalle de un retiro cerrado muestra lo usado y lo devuelto.

## Requerimientos

### A. HIGH

1. **Desenvolver en un solo sitio.** En `src/services/withdrawalsClient.js`, añade una función privada `unwrap(res)` que, si `res.ok` y `res.data` tiene la propiedad `data`, devuelva `{ ...res, data: res.data.data }`. Úsala en `getWithdrawal`, `createWithdrawal`, `closeWithdrawal`, `cancelWithdrawal`, `getWithdrawalSettings` y `updateWithdrawalSettings`. **No** la uses en `listWithdrawals`: el listado es paginado y sus consumidores ya leen `res.data.data`.
   - Quita el `res.data?.data || res.data` de `WithdrawalForm.jsx` (línea 74), que ya no hará falta.
2. **Ajustes sin pisar valores.** En `WithdrawalSettingsForm.jsx`:
   - Si la carga falla, no muestres el formulario con valores por defecto: muestra el error y un botón "Reintentar". Guardar solo se habilita cuando la carga fue correcta.
   - Al guardar, si la respuesta trae los valores, actualiza el formulario con ellos.
3. **Tests con la forma real.** Los tests del cliente deben simular `request` con el cuerpo real (`{ data: { ... } }`) y comprobar que `getWithdrawalSettings` y `getWithdrawal` devuelven el objeto interno. En `WithdrawalSettingsForm.test.jsx` añade un caso: el motor devuelve `reminder_after_minutes: 45` y el campo muestra 45; si la carga falla, no aparece el botón Guardar. En `WithdrawalsView.test.jsx`, el caso de `initialId` debe mostrar el nombre del insumo de la línea en el formulario de cierre.

### B. MEDIUM

4. **Color de texto de los botones principales.** `var(--text-on-primary)` no existe en `src/styles/main.css`; el texto hereda el color del contenedor. Cámbialo por `var(--on-primary)`, que es la variable del repo, en `WithdrawalCancelModal.jsx`, `WithdrawalCard.jsx`, `WithdrawalCloseActions.jsx`, `WithdrawalSettingsForm.jsx` y `WithdrawalsViewHeader.jsx`.
5. **Detalle con los campos reales** (`WithdrawalCard.jsx`):
   - Usado y devuelto: `consumed_quantity` y `returned_quantity` (hoy lee `consumed` y `returned`, que no existen). Muestra también "Quedó: {kept_quantity}" si es mayor que 0.
   - Notas: `closing_note` y `cancellation_note` (hoy lee `note`, que no existe), con las etiquetas "Nota de cierre" y "Motivo de cancelación".
   - Test: un retiro cerrado muestra usado, devuelto y la nota de cierre.
6. **La tarjeta del módulo pide los retiros en cada render.** `EcosystemView` llama a `getUser()`, que hace `JSON.parse` y crea un objeto nuevo en cada render; `ModuleGrid` lo usa como dependencia del `useEffect` y vuelve a llamar a `/withdrawals` cada vez. Usa `user?.id` y el booleano del permiso como dependencias. Test: dos renders seguidos con el mismo usuario hacen una sola llamada.
7. **"Cerrar mi retiro" solo con retiros propios.** En `SuggestionChips.jsx`, filtra la lista por el usuario actual (`w.user?.id`), como hace `ModuleGrid`. Hoy un jefe o administración ve el acceso si **cualquier** persona tiene un retiro abierto. Cuenta también los `escalated`, que siguen pendientes de cierre: pide `status=open` y `status=escalated` (dos llamadas) o el listado sin filtro y filtra en la app. Aplica el mismo criterio al contador de `ModuleGrid`. Extrae la lógica a una función compartida en `withdrawalHelpers.js` (`countMyPendingWithdrawals(list, userId)`) para no duplicarla.

### C. LOW

8. Al abrir por `initialId` un retiro que ya no está `open` ni `escalated`, no abras el formulario de cierre: muestra la lista con el mensaje "Ese retiro ya se cerró o se canceló.".
9. El fondo del modal de cancelación usa `rgba(0, 0, 0, 0.6)`. Usa `var(--overlay)`, que ya existe en `main.css`.
10. El listado solo carga la primera página (30 retiros). Añade un botón "Ver más" que pida la página siguiente mientras `meta.current_page < meta.last_page`, y concatene sin duplicar por `id`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Tono cercano. Conserva las tildes.
- Colores solo con variables CSS de `main.css`.
- Seguridad: ids `^\d+$`; textos validados; sin `dangerouslySetInnerHTML`, `alert` ni `confirm`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No cambies el comportamiento del Brief 32p fuera de estos puntos. No añadas dependencias. No toques archivos fuera del alcance.

## Tests

Los indicados en cada punto, en los archivos de `src/components/withdrawals/__tests__/`, `src/services/__tests__/withdrawalsClient.test.js` y `src/components/assistant/__tests__/SuggestionChips.test.jsx`. Cobertura de 80 % o más del código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El primer comando debe mostrar `feat/pwa-retiros-de-bodega`. El lint debe seguir con 0 errores y no más de 47 avisos.

## Criterios de aceptación

- [ ] Los ajustes muestran los valores reales del motor y nunca guardan valores por defecto tras una carga fallida.
- [ ] El enlace directo a un retiro abre su cierre con las líneas.
- [ ] Los mocks de los tests usan la forma real `{ data: ... }`.
- [ ] Botones principales con `var(--on-primary)`.
- [ ] El detalle muestra usado, devuelto, lo que quedó y las notas reales.
- [ ] La tarjeta del módulo no repite llamadas en cada render.
- [ ] "Cerrar mi retiro" y el contador cuentan solo los retiros propios abiertos o escalados.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
