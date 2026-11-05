# Brief 43p: formas de pago de RunFood que se entiendan, y nota de retención corregida

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; app de Android con Capacitor 8). Crea la rama `feat/pwa-formas-de-pago-claras` desde `main`. No toques el motor (`C:\laragon\www\UaldoBusiness`): no hace falta ningún cambio de API.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** El dueño abrió la pestaña "Formas de pago" de la configuración de caja (`CashConfigView`) en la app y no entendió qué tenía que hacer. La pantalla (`src/components/cashconfig/PaymentMappingsPanel.jsx`) tiene estos problemas:

- Lista **todas** las formas de pago que RunFood tiene en su catálogo: más de 100. Casi todas son códigos de impuestos del SRI ("332G - Pagos con tarjeta de crédito", "RETENCION IVA 70%", "Régimen Microempresarial"…) que el local nunca usa para cobrar.
- Todas las que no tienen destino aparecen como "Sin asignar" en naranja, como si fueran un problema. No lo son: una forma sin destino solo frena el cierre automático si ese día tuvo cobros (motor, `CashCloseRuleEvaluator::formasSinMapearConMonto`).
- Usa palabras internas: "cubeta", "Libro diario".

En los últimos 30 días, el local cobró solo con 4 formas (`UaldoBusiness/docs/runfood/MAPA-RUNFOOD-2026-11-03.md`, sección de pagos):

| RunFood | Destino correcto |
|---|---|
| 2 EFECTIVO | Efectivo |
| 105 TARJETA DE CREDITO/DEBITO | Tarjeta de crédito (RunFood no separa crédito y débito) |
| 119 TRANSFERENCIA | Transferencia Pichincha (RunFood no separa Pichincha y De Una) |
| 30 NOTA CREDITO | Ignorar (es una devolución aplicada, no dinero) |

**Lo que trae la API** (`GET /api/v1/restaurant/cash-close/payment-mappings`, sin cambios). Cada fila trae:
- `id`, `runfood_forma_pago_id` y `descripcion_runfood`;
- `es_efectivo` y `es_tarjeta`;
- `bucket` (`sin_mapear` = sin destino), `suggested_bucket` y `confirmado`;
- `ultimo_arqueo`: `{monto, business_date}` o `null`. Sale de las últimas 10 fotos de caja de RunFood, así que significa "cobró algo en los últimos días".

**Nota de retención desactualizada.** `src/components/cashconfig/CommissionRatesPanel.jsx:66` dice "La retención se calcula sobre el bruto. Confírmalo con tu contador." El dueño confirmó el 2026-11-04 que la retención del 2 % se calcula sobre lo que queda después de la comisión, y que la comisión incluye IVA del 15 % (crédito y Diners 4,60 %, débito 2,30 %). El motor lo corrige en `UaldoBusiness/docs/briefs/13a_fix3_retencion-sobre-el-sobrante.md`.

**Lee primero:**
- `src/components/cashconfig/PaymentMappingsPanel.jsx`, `src/hooks/usePaymentMappings.js`, `src/services/cashConfigClient.js` (`BUCKET_LABELS`, `VALID_PAYMENT_BUCKETS`) y `src/components/cashconfig/CashConfigView.jsx`.
- `src/components/cashconfig/__tests__/PaymentMappingsPanel.test.jsx` y `CommissionRatesPanel.test.jsx`.
- `src/components/cashconfig/CommissionRatesPanel.jsx`.
- `docs/ualdo-brand.md`.

## Objetivo

1. Al abrir Formas de pago, el dueño ve arriba solo las formas con las que el local cobra, y un aviso que le dice si falta algo.
2. El resto queda plegado bajo un título que explica que no hace falta tocarlas.
3. La nota de las tasas de comisión dice cómo se calcula de verdad.

## Requerimientos

### A. Formas de pago

1. **Dos grupos**, calculados en `usePaymentMappings` con una función pura exportada `groupMappings(mappings)` que devuelve `{ enUso, otras }`:
   - `enUso`: las filas con `ultimo_arqueo` distinto de `null` **o** con `bucket` distinto de `sin_mapear`. Orden:
     1. primero las que necesitan acción (`sin_mapear` con `ultimo_arqueo`);
     2. después las que tienen sugerencia sin confirmar;
     3. al final las demás;
     4. dentro de cada grupo, por `runfood_forma_pago_id`.
   - `otras`: el resto (sin destino y sin cobros recientes), ordenadas por `runfood_forma_pago_id`.
   - Reemplaza el orden actual de `sortedMappings`. No cambia nada más del hook.
2. **Encabezado nuevo**:
   - Título: "Formas de pago de RunFood".
   - Subtítulo: "Dile a Ualdo en qué casilla del cierre va cada forma con la que cobra el local."
3. **Aviso de estado**, arriba de la lista, uno de estos dos:
   - Si hay formas `sin_mapear` con `ultimo_arqueo`: aviso naranja "Falta asignar {n} forma(s) con cobros. Hasta que lo hagas, el cierre de esos días queda para revisión."
   - Si no: aviso verde "Todo listo: todas las formas con cobros tienen su casilla."
4. **Grupo "Con cobros"** (`enUso`), con su título. Cada tarjeta se ve como hoy, con estos cambios:
   - Si está `sin_mapear` y tiene cobros, la etiqueta naranja dice "Falta asignar".
   - La línea de cobros dice "Último cobro: USD {monto} ({fecha})" en lugar de "Último arqueo".
   - Si la forma tiene `es_tarjeta` y su destino es crédito o débito, muestra debajo, en texto atenuado: "RunFood junta crédito y débito en esta forma. Ualdo usa la tasa de la casilla elegida; el neto real se ajusta al revisar el cierre."
5. **Grupo "Otras formas de RunFood ({n})"** (`otras`):
   - Plegado por defecto, con un botón que lo despliega y lo vuelve a plegar (`aria-expanded`).
   - Texto fijo debajo del título, visible aun plegado: "RunFood las tiene en su catálogo (muchas son códigos de impuestos del SRI), pero el local no cobró con ellas. Déjalas sin asignar: no afectan el cierre."
   - Al desplegar, cada tarjeta muestra la etiqueta "Sin uso" en gris, no "Sin asignar" en naranja, y no muestra la línea "Sin movimientos recientes".
   - El botón "Cambiar" sigue disponible.
   - Recuerda en `localStorage` (clave `ualdo:pagos:otras-abierto`, envuelta en try/catch) si el grupo quedó abierto.
6. **Textos del diálogo de cambio:**
   - "Asignar cubeta" pasa a "Elegir casilla".
   - "Selecciona cubeta de destino:" pasa a "¿En qué casilla del cierre va?".
   - "Advertencia de Ignorar" pasa a "Ignorar esta forma".
   - En `BUCKET_LABELS`, `sin_mapear` sigue siendo "Sin asignar". No cambies los valores de las casillas que se envían al motor.
7. Si el panel queda por encima de 300 líneas, extrae la tarjeta a `src/components/cashconfig/PaymentMappingCard.jsx` y el grupo plegable a `PaymentMappingGroup.jsx`.

### B. Nota de las tasas de comisión

8. En `CommissionRatesPanel.jsx:66`, cambia la nota por: "La comisión incluye el IVA. La retención del 2 % se calcula sobre lo que queda después de la comisión." Actualiza el test que compara el texto (`CommissionRatesPanel.test.jsx:71`).

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo de `lucide-react` (SVG).
- Marca: sigue `docs/ualdo-brand.md` (colores por variables CSS, Poppins, botones pastilla, tono cercano y directo). Conserva las tildes en todos los textos.
- Sin cambios de API ni de lo que se envía al motor.
- Accesibilidad: el grupo plegable usa un `button` con `aria-expanded` y `aria-controls`; los avisos usan `role="status"`.
- Seguridad: los textos de RunFood se muestran como texto plano (React ya escapa; no uses `dangerouslySetInnerHTML`).
- Diseño: componentes de menos de 300 líneas, funciones de menos de 50 y sin anidación de más de 4 niveles.
- Rendimiento: `groupMappings` se calcula con `useMemo` sobre `mappings`.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests (Vitest y Testing Library)

- **`groupMappings` (unitario):**
  - una forma `sin_mapear` sin cobros va a `otras`;
  - una forma `sin_mapear` con cobros va primera en `enUso`;
  - una forma asignada sin cobros va a `enUso`;
  - el orden dentro de cada grupo es el pedido.
- **Panel:**
  - con una forma sin asignar y con cobros, muestra "Falta asignar 1 forma(s) con cobros";
  - sin formas pendientes, muestra "Todo listo";
  - "Otras formas de RunFood (n)" empieza plegado, se despliega con un clic y muestra "Sin uso", no "Sin asignar";
  - una forma con `es_tarjeta` asignada a crédito muestra la nota de crédito y débito;
  - el diálogo dice "Elegir casilla".
  - Los tests existentes de aceptar sugerencia, confirmar "ignorar" y reasignar una forma confirmada siguen pasando. El de orden ("ordena las formas sin asignar primero") se reescribe para el orden nuevo; el de XSS se conserva.
- **Tasas:** el test de `CommissionRatesPanel` busca la nota nueva.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El lint no debe sumar errores ni avisos respecto de `main`.

**Prueba manual en Android** (APK con `npm run android:release`):
1. En "Formas de pago" aparecen arriba EFECTIVO, TARJETA DE CREDITO/DEBITO, TRANSFERENCIA y NOTA CREDITO (las que tengan cobros o destino), con el aviso de estado.
2. Las demás quedan plegadas en "Otras formas de RunFood".
3. En "Tasas de comisión" se ve la nota nueva.

Anota el resultado en la descripción del commit.

## Criterios de aceptación

- [ ] Arriba se ven solo las formas con cobros o con destino; las demás quedan plegadas, con la explicación de que no hace falta tocarlas.
- [ ] El aviso de estado dice cuántas formas con cobros faltan, o que todo está listo.
- [ ] Ya no aparece "cubeta" ni "Libro diario" en la pantalla.
- [ ] La nota de comisión dice que la retención es sobre lo que queda después de la comisión.
- [ ] Sin cambios de API.
- [ ] Todos los tests pasan; lint y build sin errores; cero emojis; tildes intactas.
