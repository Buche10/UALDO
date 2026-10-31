# Brief 26p: faltantes del día y compras del dueño en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-faltantes-del-dia` desde `main` (con los Briefs 22p y 24p fusionados). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 27 del motor desplegado (`C:\laragon\www\UaldoBusiness\docs\briefs\27_faltantes-del-dia-por-chat.md`). Léelo completo junto con `C:\laragon\www\UaldoBusiness\docs\API-supply-requests.md` actualizado.

**Por qué.** Al final del día el personal le dice a Ualdo qué falta en el local, y el dueño pregunta qué hay que comprar. El motor ya lo resuelve en el chat (Brief 27). La app debe acompañarlo:
- Los pedidos pueden tener ítems con **cantidad por definir** (`quantity: null`). Hoy `quantityWithUnit` (`src/components/supplyRequests/requestUi.js:44`) muestra "Sin dato", que suena a error.
- La lista de compras del dueño (`ShoppingListPanel.jsx`) solo muestra lo aprobado. El motor ahora da tres secciones con `GET /supply-requests/shopping-list?overview=1`: `aprobado`, `por_aprobar` y `bajo_minimo`.
- El personal necesita un acceso directo en el chat para reportar faltantes, y el aviso de cierre (pantalla `chat`) debe abrir el chat con ese acceso a la vista.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/supplyRequests/*` (`ShoppingListPanel.jsx`, `RequestItemsEditor.jsx`, `SupplyRequestDetail.jsx`, `requestUi.js`); `src/services/supplyRequestsClient.js`; `src/components/assistant/SuggestionChips.jsx`; `src/services/notificationRoutes.js`; `src/services/quantityFormat.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS de `src/styles/main.css` (sin `rgba` ni hexadecimales en componentes); cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Los ítems sin cantidad se ven como "Cantidad por definir" en toda la app; el dueño ve en Compras lo aprobado, lo reportado por aprobar (con quién y cuándo, y botón para aprobar) y lo que está bajo mínimo; el personal tiene en el chat el acceso "Reportar faltantes".

## Requerimientos

1. **Cantidad por definir.**
   - `requestUi.js`: `quantityWithUnit(null, unit)` devuelve "Cantidad por definir". Los demás casos no cambian.
   - `RequestItemsEditor.jsx`: la cantidad pasa a ser opcional. Campo vacío = sin cantidad; si se escribe algo, se valida como hoy (`normalizeRequestQuantity`). Texto de ayuda: "Déjala vacía si no sabes cuánto falta".
   - `supplyRequestsClient.buildRequestBody`: omite `quantity` cuando está vacía, nunca envía `0`.
   - En el detalle del pedido, el dueño que aprueba puede escribir la cantidad de los ítems por definir (opcional); se envía como `items: [{ id, quantity }]` en la decisión, según el contrato del Brief 27.
2. **Compras del dueño.** Nuevo `getPurchasingOverview()` en `supplyRequestsClient.js` (`/supply-requests/shopping-list?overview=1`). `ShoppingListPanel.jsx` pasa a mostrar tres bloques, cada uno en su propio componente dentro de `src/components/supplyRequests/`:
   - `ApprovedPurchases`: como hoy, con "Cantidad por definir" y, si `requests_without_quantity > 0`, la nota "{n} pedido(s) sin cantidad".
   - `PendingReports`: cada pedido con el primer nombre de quien lo reportó, la hora ("hoy 21:40", "ayer 22:05"), prioridad e ítems. Botones "Aprobar" (usa `decideRequest`) y "Ver" (abre el detalle). Botón "Aprobar todos" con confirmación de dos pasos ("Se aprobarán {n} pedidos"); aprueba uno por uno con `decideRequest` y muestra cuántos se aprobaron y cuáles fallaron, sin detenerse en el primer error.
   - `LowStockSuggestions`: insumos bajo mínimo que nadie pidió, con stock y mínimo. Solo informativo.
   - Estado vacío de cada bloque con texto corto ("Nada por aprobar"). Error con botón "Reintentar".
3. **Chat del personal.** En `SuggestionChips.jsx`, primer acceso para `staff`: "Reportar faltantes" con el texto "Quiero reportar lo que falta en el local". Para `owner`, cambia "Lista de compras" por "Qué hay que comprar" con el texto "¿Qué hay que comprar?". Iconos de `lucide-react`.
4. **Aviso de cierre.** Verifica que un aviso con `action.screen = chat` abre la pestaña del asistente (`notificationRoutes.js`). No hace falta pasar el texto al chat; los accesos del punto 3 bastan.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono).
- Sigue las convenciones existentes del repo. Conserva las tildes de todos los textos.
- Seguridad: valida toda entrada antes de llamar al motor; ids `^\d+$`; sin `dangerouslySetInnerHTML`; errores sin datos sensibles.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- `quantityWithUnit(null)` devuelve "Cantidad por definir".
- Formulario: crear un pedido con un ítem sin cantidad no envía `quantity`; una cantidad inválida sigue mostrando error.
- Cliente: `getPurchasingOverview` llama a la ruta correcta.
- Compras: muestra los tres bloques; "Aprobar" llama a `decideRequest`; "Aprobar todos" pide confirmación en dos pasos y reporta éxitos y fallos parciales; estados vacíos y error.
- Chips: el personal ve "Reportar faltantes"; el dueño ve "Qué hay que comprar".
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El personal puede pedir sin cantidad y la app lo muestra como "Cantidad por definir".
- [ ] El dueño ve aprobado, por aprobar y bajo mínimo, y aprueba desde Compras.
- [ ] El chat tiene "Reportar faltantes" para el personal y "Qué hay que comprar" para el dueño.
- [ ] El aviso de cierre abre el chat.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
