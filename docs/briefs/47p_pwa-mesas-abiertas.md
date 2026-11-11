# Brief 47p: mesas abiertas de RunFood en la app

## Contexto

Repo: `C:\laragon\www\UALDO` (React 18, Vite, Capacitor 8, Vitest y Testing Library, iconos SVG de `lucide-react`). Rama: `feat/pwa-mesas-abiertas`, desde `main` (a9730c7 o posterior).

El usuario pidió el 2026-11-09 que Ualdo lea **las mesas por cobrar** de RunFood. El 2026-11-11 pidió verlas casi en vivo. El agente del local manda cada 2 minutos las mesas abiertas (Brief 55 del motor) y el motor las expone (Briefs 56 y 57, en `C:\laragon\www\UaldoBusiness\docs\briefs\`).

**Depende del Brief 56** (pantalla y chat) y **del Brief 57** (aviso al cierre y bloque en el detalle del cierre). Si solo está el 56, haz las secciones 1 a 4 y deja la 5 para cuando llegue el 57.

| Endpoint | Permiso | Uso |
|---|---|---|
| `GET /api/v1/restaurant/open-tables` | `tables.view` | mesas abiertas ahora |
| `GET /api/v1/restaurant/cash-close` (detalle del dueño) | `cash.review` | trae `mesas_abiertas_al_cierre` (Brief 57) |

Respuesta de `open-tables` (los montos **no vienen** cuando `mostrar_montos` es falso; el motor los quita):

```json
{
  "capturada_en": "2026-11-09T21:40:12-05:00",
  "desactualizado": false,
  "minutos_desde_foto": 3,
  "mostrar_montos": true,
  "resumen": { "mesas": 2, "total": "83.10", "pendiente": "73.10", "con_precuenta": 1, "mas_antigua_desde": "2026-11-09T19:30:00-05:00" },
  "mesas": [
    { "pedido_id": 123456, "mesa": "4", "grupo": "SALON", "etiqueta": "Mesa 4 (SALON)", "pax": 4, "mesero": "Juan",
      "abierta_desde": "2026-11-09T20:05:00-05:00", "minutos_abierta": 95, "de_dia_anterior": false, "precuenta": true,
      "total": "45.60", "facturado": "0.00", "pendiente": "45.60" }
  ]
}
```

Bloque del cierre (Brief 57): `mesas_abiertas_al_cierre { estado: 'evaluado'|'pendiente'|'sin_dato', evaluado_en, mesas, pendiente, detalle: [{ etiqueta, mesero, abierta_desde, pendiente, precuenta }] }`.

Aviso nuevo: `OpenTablesAtCloseNotification`, pantalla `mesas_abiertas` con `params.fecha`.

Quién ve qué: dueño y admin ven todo con montos; el jefe de salón ve la lista **sin montos**; los meseros no ven la pantalla. El chat ya responde "qué mesas están abiertas" desde el motor, con sus tarjetas: no hace falta cambiar el chat.

Estado actual de la PWA:

- Permisos: `src/services/permissions.js` (`ABILITIES`, `can`, `canAny`); ya existen `SALES_TOTALS` y `CASH_REVIEW`.
- Menú de Más: `src/components/modules/moduleRegistry.js` (cada entrada con `id`, `label`, `description`, `icon`, `permissions`, `subView`, `roleRequiredLabel`); las subvistas se montan en `src/components/ecosystem/EcosystemModules.jsx`.
- Avisos: `src/services/notificationRoutes.js` (`ALLOWED_SCREENS`, `ALLOWED_SUBVIEWS`, `sanitizeActionParams`, `switch (screen)`).
- Ventas: `src/components/sales/` (`SalesStaleNotice.jsx` es el patrón del aviso de dato viejo), cliente `src/services/salesClient.js`, dinero en `src/services/money.js`.
- Cierre: `src/components/cashclose/CashCloseDetail.jsx` (219 líneas).

Lee primero `docs/ualdo-brand.md` y esos archivos.

## Objetivo

Dueño, admin y jefe de salón abren Más > Mesas abiertas y ven qué mesas siguen abiertas en RunFood, desde qué hora, con qué mesero y si ya tienen precuenta; el dueño y el admin ven además cuánto falta cobrar. El aviso de mesas abiertas al cierre abre esa información, y el detalle del cierre del dueño la muestra.

## Requerimientos

### 1. Permiso y cliente

1. `permissions.js`: `ABILITIES.TABLES_VIEW = 'tables.view'`. No hace falta una lista paralela: `can()` lee `capabilities.abilities`, y el motor ya manda el permiso nuevo en `UserResource` cuando el Brief 56 lo agrega a `RolePermissions`.
2. `src/services/openTablesClient.js`: `getOpenTables()` sobre `apiClient`, que devuelve la respuesta normalizada (lista vacía si `mesas` falta; nunca inventa montos si no vienen).

### 2. Pantalla `src/components/opentables/` (nueva)

1. `OpenTablesView.jsx`: carga al montar y refresca cada **30 segundos** **solo mientras la vista está visible** (`document.visibilityState`), limpiando el intervalo al desmontar. Al volver a primer plano (`visibilitychange` a visible) refresca de inmediato. El refresco no muestra el estado de carga ni hace saltar la lista: reemplaza los datos en silencio y actualiza "Lectura de las {hora}" debajo del resumen. El tiempo de cada mesa ("1 h 35 min") se recalcula en cada refresco con `abierta_desde`, no con `minutos_abierta`. Botón "Actualizar" (secundario). Estados: cargando, error con "Reintentar", vacío ("No hay mesas abiertas en RunFood." y debajo "Lectura de las {hora}.").
2. `OpenTablesSummary.jsx`: tarjeta arriba con "Mesas abiertas: {n}", "Con precuenta: {k}", "La más antigua desde {hora}" y, solo si `mostrar_montos`, "Por cobrar: {monto}" destacado con la variable de color primaria. Monto con `money.js`.
3. `OpenTableItem.jsx`: una fila por mesa: etiqueta en negrita, "Desde 20:05 (1 h 35 min)", mesero, comensales si hay, distintivo "Precuenta" si `precuenta`, distintivo "De ayer" o "Desde el {fecha}" con colores de aviso si `de_dia_anterior`, y "Por cobrar {monto}" alineado a la derecha solo si viene `pendiente`. Si `facturado` es mayor que cero, "Cobrado en parte: {facturado}".
4. `OpenTablesStaleNotice.jsx` (mismo estilo que `SalesStaleNotice`): si `desactualizado`, "Lectura de las {hora}: el local no ha enviado mesas desde entonces." Si `capturada_en` es nulo: "Todavía no llegan datos de mesas desde el local."
5. Las mesas abiertas más de 3 horas se resaltan con el color de aviso (sin colores escritos a mano).
6. Componente sin lógica de permisos de montos: pinta lo que llegue. La regla es del motor.

### 3. Menú de Más

Entrada nueva en `moduleRegistry.js`, junto a Ventas: `id: 'open_tables'`, "Mesas abiertas", descripción "Mesas sin cobrar en RunFood, desde qué hora y con qué mesero.", icono SVG de `lucide-react` (por ejemplo `Armchair` o `UtensilsCrossed`, según el manual), `permissions: [ABILITIES.TABLES_VIEW]`, `subView: 'open_tables'`, `roleRequiredLabel: 'jefe de salón, administración o dueño'`. Monta la subvista en `EcosystemModules.jsx`.

### 4. Avisos

En `notificationRoutes.js`: `mesas_abiertas` en `ALLOWED_SCREENS`, `open_tables` en `ALLOWED_SUBVIEWS`, y en el `switch`:

- con `can(user, CASH_REVIEW)` y `params.fecha` válida: abre `cashclose` con esa fecha (ya está: `EcosystemModules` le pasa `negociosParams.fecha` a `CashCloseView`, que lo recibe como `fechaInicial`; el detalle del cierre muestra el bloque de la sección 5);
- en otro caso (jefe de salón): abre `open_tables`.

`fecha` ya se valida como `YYYY-MM-DD` en `sanitizeActionParams`; no aceptes otros parámetros.

### 5. Detalle del cierre (requiere el Brief 57)

`src/components/cashclose/CashCloseOpenTables.jsx` (nuevo), usado por `CashCloseDetail.jsx`:

- `evaluado` con mesas: título "Mesas abiertas al cierre", "{n} mesa(s) sin cobrar en RunFood por {monto}" y la lista (etiqueta, mesero, desde, por cobrar, precuenta). Color de aviso.
- `evaluado` sin mesas: una línea discreta "Sin mesas abiertas al cierre."
- `pendiente`: "Todavía no llega la lectura de mesas posterior al cierre."
- `sin_dato`: "No llegó la lectura de mesas de esa noche."
- Si el bloque no viene (motor sin el Brief 57), no pinta nada.

No toques la declaración a ciegas (`src/components/cashclose/declaration/`): el jefe de salón y los meseros no ven montos ahí.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG.
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Ningún color escrito a mano. Conserva las tildes.
- Seguridad: la entrada de Más depende de `can(user, TABLES_VIEW)`, pero la autorización real es del motor (maneja 403 con "No tienes permiso para ver las mesas abiertas."); valida los parámetros de avisos contra listas blancas; no uses `dangerouslySetInnerHTML`; las horas se muestran en la zona `America/Guayaquil` con el formateador existente.
- Rendimiento: un solo intervalo de 30 segundos, pausado si la app está en segundo plano o la vista está cerrada (el motor responde con `Cache-Control: no-store`); sin peticiones en paralelo duplicadas (ignora un refresco si hay uno en curso).
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, componentes de menos de 200 líneas, sin anidación de más de 4 niveles, inmutabilidad.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests (Vitest y Testing Library)

1. `openTablesClient`: ruta correcta y normalización (sin `mesas`, lista vacía; sin montos, no aparecen).
2. `OpenTablesView`: con montos pinta "Por cobrar"; sin montos no aparece ninguna cifra de dinero; vacío; error con "Reintentar"; aviso de dato viejo; el intervalo de 30 segundos se limpia al desmontar, no corre con la vista oculta y refresca al volver a primer plano; un refresco no muestra el estado de carga (temporizadores falsos).
3. `OpenTableItem`: precuenta, "De ayer", cobro parcial y resaltado de más de 3 horas.
4. `moduleRegistry`: "Mesas abiertas" visible con `tables.view` y oculta para un mesero.
5. `notificationRoutes`: `mesas_abiertas` con fecha abre `cashclose` para el dueño y `open_tables` para el jefe de salón; un parámetro no permitido se ignora.
6. `CashCloseOpenTables`: los cuatro estados y la ausencia del bloque.
7. Los tests existentes siguen en verde.

Cobertura de al menos 80 % del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Prueba manual con el motor local (Brief 56 fusionado): envía una foto de prueba a `POST /api/v1/agent/open-tables` con el token del agente local de pruebas; el dueño ve las mesas con montos, el jefe de salón sin montos, y un mesero no ve la entrada en Más.

## Criterios de aceptación

- [ ] Más > Mesas abiertas para dueño, admin y jefe de salón; oculta para meseros.
- [ ] Mesa, desde qué hora, mesero, comensales y precuenta; por cobrar solo cuando el motor lo envía.
- [ ] Aviso visible cuando la lectura está vieja o no hay datos.
- [ ] Refresco cada 30 segundos solo con la vista visible, sin parpadeo, y al volver a primer plano.
- [ ] El aviso al cierre abre el detalle del cierre (dueño) o la pantalla de mesas (jefe de salón).
- [ ] El detalle del cierre muestra las mesas abiertas al cierre en sus cuatro estados.
- [ ] Sin colores escritos a mano, sin emojis y sin tildes perdidas en el diff.
- [ ] Lint, tests y build en verde; prueba manual hecha.
