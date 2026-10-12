# Brief 22p: pedidos internos del personal en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama `feat/pwa-supply-requests`, creada desde `feat/pwa-purchases` (Brief 20p en `9f4ae36`). No toques
el motor.

**Construye:** Claude, por pedido explícito del dueño del producto (2026-10-10).

**Por qué.** El punto 4 del alcance de "control total" (2026-10-05) es que el personal pida lo que falta desde la app
en lugar de una lista en papel. El motor ya tiene los pedidos internos (`supply_requests`): pedir, aprobar o rechazar,
marcar comprado y recibido, cancelar, y la lista de compras consolidada. Además avisa en el centro de avisos de la app
("Nuevo pedido interno" al dueño, "Pedido aprobado o rechazado" al solicitante) con la acción
`{ screen: 'pedido', params: { id } }`. Hoy la app no tiene pantallas de pedidos: ese aviso abre el Asistente.

**Contrato:** `C:\laragon\www\UaldoBusiness\docs\API-supply-requests.md` (léelo completo). Resumen:
- `GET /supply-requests?status=&mine=&page=` (20 por página): el dueño ve todos; el personal, solo los suyos.
- `POST /supply-requests` `{ client_uuid?, priority?, note?, items: [{ inventory_item_id | free_text_name, quantity,
  unit?, note? }] }`: de 1 a 30 líneas; cantidad mayor que 0 y hasta 100000; `unit` obligatoria en texto libre (hasta
  20); nombre libre hasta 120; nota de línea hasta 200; nota hasta 500. `201` nuevo o `200` idempotente.
- `GET /supply-requests/{id}` (dueño o solicitante; `403` al resto; `404` ajeno).
- Dueño: `POST /{id}/decision` `{ decision: approved|rejected, note }` (motivo obligatorio al rechazar),
  `POST /{id}/purchased`, `POST /{id}/received`, `GET /supply-requests/shopping-list`.
- `POST /{id}/cancel`: el solicitante en `pending`; el dueño en `pending` o `approved`.
- Cualquier transición no permitida responde `409` con el motivo.

**Reglas que se mantienen:** cero emojis; colores solo con variables; cantidades como texto validado; todo por
`apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; idempotencia como `useMovementSubmit`.

## Objetivo

Que cualquier miembro pida insumos desde el teléfono (del catálogo o en texto libre, normal o urgente) y siga su
pedido, y que el dueño los apruebe o rechace, los marque comprados y recibidos, y vea la lista de compras
consolidada. El aviso de un pedido abre su detalle.

## Requerimientos

1. **Cliente** `src/services/supplyRequestsClient.js` con todas las llamadas del contrato y sus validaciones antes de
   llamar al motor (ids `^\d+$`, estados, prioridad, cantidades con coma y hasta 3 decimales, longitudes, motivo de
   rechazo obligatorio). Consultas con `URLSearchParams`.
2. **Entrada:** pestaña "Pedidos" en Negocios para cualquier miembro (`EcosystemView`). Las pestañas de Negocios se
   pasan a un componente con colores por variables.
3. **Avisos:** `notificationRoutes` lleva `pedido` y `pedidos` a `{ tab: 'negocios', subView: 'pedidos', params }`,
   y con `params.id` se abre el detalle de ese pedido.
4. **Lista:** solicitante, fecha, cantidad de líneas, prioridad y estado ("Pendiente", "Aprobado", "Rechazado",
   "Comprado", "Recibido", "Cancelado"); filtro por estado (el dueño empieza en "Pendientes"); "Cargar más".
5. **Nuevo pedido:** líneas del catálogo (búsqueda por nombre o código, sin servicios) o en texto libre (nombre,
   cantidad y unidad); nota por línea; prioridad "Urgente"; nota general. `client_uuid` al abrir, reutilizado tras un
   error de red y renovado tras un 201 o un 200; los `422` junto a su línea o campo.
6. **Detalle:** líneas, solicitante, prioridad, nota, estado, fechas y motivo de la decisión. Acciones según rol y
   estado, cada una con confirmación propia:
   - dueño: en `pending`, "Aprobar" (nota opcional) y "Rechazar" (motivo obligatorio); en `approved`, "Marcar
     comprado" y "Cancelar"; en `purchased`, "Marcar recibido";
   - solicitante: en `pending`, "Cancelar".
   - Un `409` explica que el pedido cambió y recarga su estado.
7. **Lista de compras** (solo el dueño): lo aprobado y sin comprar, consolidado por insumo, con urgentes primero,
   cantidad, unidad, stock y mínimo del motor.
8. Agrega `src/services/supplyRequestsClient.js` a `coverage.include`.

## Restricciones técnicas

- CERO EMOJIS. Íconos solo en SVG (`lucide-react`). Español con tildes.
- Marca: `docs/ualdo-brand.md`; colores solo con variables.
- Accesibilidad: cada campo con `label`; errores en contenedores `aria-live` siempre montados; diálogos con
  `role="dialog"`, Escape, Tab dentro y retorno del foco.
- Componentes de menos de 250 líneas, funciones de menos de 50, sin mutaciones, lógica en hooks.
- Sin dependencias nuevas. No toques el login, el chat, la caja, Trabajo, los conteos, producción ni compras salvo
  para reutilizar piezas.

## Tests

Vitest con Testing Library y `request` simulado. Cada test debe fallar si se revierte lo que protege. Cobertura de 80 %
o más de sentencias y ramas en los archivos nuevos. Mutaciones reales en `docs/RESUMEN-22p.md`.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/supplyRequests src/components/inventory; echo "exit=$?"
```

## Criterios de aceptación

- [ ] Cualquier miembro crea un pedido con líneas del catálogo y en texto libre, con idempotencia.
- [ ] El personal ve solo sus pedidos y puede cancelar los pendientes.
- [ ] El dueño aprueba, rechaza con motivo, marca comprado y recibido, y cancela, con confirmaciones propias.
- [ ] El aviso de un pedido abre su detalle.
- [ ] Lista de compras consolidada para el dueño.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` en verde.
