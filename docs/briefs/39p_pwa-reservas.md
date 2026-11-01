# Brief 39p: reservas y disponibilidad en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-reservas` desde `main` con el Brief 30p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 39 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\39_reservas-y-stock-comprometido.md` y `C:\laragon\www\UaldoBusiness\docs\API-reservations.md`.

**Por qué.** El dueño quiere centralizar las reservas. Las que traen platos comprometen stock (sin venderlo) y avisan si dejan algún insumo bajo el mínimo. Las que no traen platos solo van a la agenda. El salón recibe avisos el día anterior y el mismo día, y la cocina los recibe cuando hay platos.

**Lee primero:** `docs/ualdo-brand.md`; `src/services/runfoodCatalogClient.js` (artículos de RunFood para elegir platos); `src/components/supplyRequests/ShoppingListPanel.jsx` (para la sección de comprometido); `src/services/permissions.js` y `moduleRegistry.js`; `src/services/notificationRoutes.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

El salón ve la agenda de reservas por día. Quien tiene permiso crea, edita y cancela reservas, con o sin platos, y ve al instante qué insumos quedan comprometidos y si alguno baja del mínimo. Administración ve en Compras lo comprometido por reservas con la sugerencia de reposición.

## Requerimientos

1. **Cliente** `src/services/reservationsClient.js`:
   - `listReservations({ from, to, status, page })`, `getReservation(id)`, `createReservation`, `updateReservation(id, data)`, `cancelReservation(id, reason)` y `setReservationStatus(id, status)`.
   - `getAvailability(itemIds)` (hasta 200 ids), `getReservationSettings()` y `updateReservationSettings(data)`.
   - Fecha y hora futuras, a no más de 365 días; personas de 1 a 500; nombre de 2 a 80 caracteres; contacto opcional de hasta 80; ítems con `runfood_article_id` y cantidad de 1 a 500; `client_uuid` estable por formulario.
2. **Tarjeta "Reservas"** en `moduleRegistry` (`reservations.view`), con el número de reservas de hoy. Pantalla `src/components/reservations/ReservationsView.jsx`:
   - Selector de día (hoy, mañana, otra fecha) y vista de semana compacta con el número de reservas y de personas por día.
   - Lista del día ordenada por hora: hora, personas, nombre (primer nombre), mesa o sector, etiqueta "Con platos", estado.
   - Con `reservations.manage`, botón "Nueva reserva".
3. **Formulario** (`ReservationForm.jsx` y `ReservationDishes.jsx`):
   - Fecha, hora, personas, nombre, contacto (solo visible y editable con `reservations.manage`), mesa o sector y notas.
   - "Agregar platos" (opcional): buscador de artículos de RunFood y cantidad por plato. Texto de ayuda: "Si el cliente aún no eligió, deja la reserva sin platos."
   - Al guardar, si el motor devuelve `warnings` (plato sin receta), se muestran en la reserva. Si la respuesta trae insumos bajo el mínimo, se muestra "Esta reserva deja poco {insumo}: disponible {n}, mínimo {m}. Se avisó a compras."
4. **Detalle** (`ReservationDetail.jsx`):
   - Datos, platos y, si hay platos, tabla de insumos comprometidos con existencia, comprometido y disponible (usa `getAvailability`).
   - Acciones según el permiso: "Editar", "Cancelar" (motivo obligatorio) y, desde el día de la reserva, "Cumplida" y "No vino".
5. **Compras.** En la lista de compras del dueño, si la respuesta trae `comprometido_por_reservas`, bloque "Por reservas" con insumo, disponible, mínimo y sugerencia. Solo informativo.
6. **Ajustes** (`settings.manage`): hora del aviso del día anterior y hora del aviso del mismo día.
7. **Avisos.** Pantalla `reserva` con `params.id`, que abre el detalle. Sin `id`, abre la agenda del día. Añádela a `ALLOWED_SCREENS` y a su test.
8. **Chat.** Con `reservations.view`: acceso "Reservas de hoy", con el texto "¿Qué reservas hay hoy?".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Privacidad: el contacto del cliente solo se muestra a `reservations.manage`, nunca se guarda en `localStorage` y nunca va en avisos ni en el chat.
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: ids `^\d+$`; textos validados; sin `dangerouslySetInnerHTML`.
- Fechas y horas en `America/Guayaquil`, con el formato que ya usa la app.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones (fecha pasada, personas fuera de rango, más de 200 ids) y rutas.
- Agenda: orden por hora; la etiqueta "Con platos" aparece; `lounge_staff` no ve "Nueva reserva" ni el contacto.
- Formulario: reserva sin platos; reserva con platos; aviso de bajo mínimo; `warnings` de plato sin receta.
- Detalle: tabla de comprometido; "Cumplida" solo desde el día de la reserva; cancelar exige motivo.
- Bloque "Por reservas" en Compras.
- Ruta de aviso `reserva`.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Agenda de reservas por día y semana para el salón.
- [ ] Crear, editar y cancelar reservas con o sin platos, según el permiso.
- [ ] Comprometido y disponible por insumo, y aviso de bajo mínimo.
- [ ] Contacto del cliente protegido.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
