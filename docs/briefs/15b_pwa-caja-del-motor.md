# Brief 15b: PWA con la caja del motor (revisión del día, netos reales, movimientos)

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2, Testing Library, ESLint 9,
`lucide-react`). Rama base `feat/pwa-inventory-notifications` (Brief 15a cerrado en `6aad4d9`). Crea la rama
`feat/pwa-cash-close` desde ahí. **No toques** el repo del motor (`C:\laragon\www\UaldoBusiness`): solo léelo para
los contratos.

**Por qué:**
- El motor ya arma el cierre de caja solo cada noche, con la foto de RunFood que envía el agente (Brief 13c). Si
  todo cuadra, lo cierra y avisa "Cierre del D/M: cuadra". Si no, lo deja **en revisión** con los motivos y avisa
  al dueño.
- La PWA todavía no tiene pantalla para eso:
  - sigue usando el cierre viejo de NexoTeams;
  - calcula la caja en el teléfono con `parseFloat` y una comisión fija de Diners;
  - envía el cierre a Google Sheets desde el teléfono.
- El motor ya exporta a Sheets (Brief 13d), así que el envío desde el teléfono sobra y duplica filas.

**Estado actual de la PWA, verificado por el auditor:**
- **`src/services/cashCloseClient.js`:** llama a **NexoTeams**: `teamsRequest('/mobile/cash-close?fecha=...')` y
  `POST /mobile/cash-close`.
- **`src/components/CashCloseView.jsx`** (293 líneas):
  - formulario que suma montos con `parseFloat` y floats;
  - `DINERS_NET_FACTOR = 0.9361` fijo;
  - calcula en el cliente el efectivo esperado, la diferencia y el estado;
  - usa `alert()`.
- **`src/components/DobleFiloCashCloseCard.jsx`** (279 líneas): envía a Sheets con `syncCashCloseToGoogleSheets`.
- **`src/services/doblefiloEngine.js`:**
  - `executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose` y `syncCashCloseToGoogleSheets`;
  - el historial de cierres se guarda en `localStorage` (`ualdo_cash_close_history`).
  - Las usa `appEcosystem.js` (`executeLocalTool`, herramienta `doblefilo_cash_close`) y la tarjeta anterior.
- **`src/components/SettingsView.jsx`:** campo `googleSheetsWebhookUrl` (`storage.js`).
- **Navegación:**
  - `EcosystemView` muestra `CashCloseView` con la subvista `cashclose`.
  - `notificationRoutes.js` ya resuelve `cierre_caja` a `{ tab: 'negocios', subView: 'cashclose', params }`.
  - Pero `App.jsx` (`handleNotificationNavigate`) **descarta `params`**, así que un aviso del día 5 no abre el
    día 5.
- **Base que hay que reutilizar:**
  - `src/services/apiClient.js` (`request`, Bearer, HTTPS en producción y 401);
  - el patrón de hooks del 15a (`useInventoryList`, `useNotifications` y `useMovementSubmit`);
  - las variables CSS de `src/styles/main.css` (`--success-soft`, `--error-soft`, `--warning-soft`, `--chip-bg`,
    `--surface-soft`, `--surface-strong`, `--on-primary` y `--overlay`);
  - la guardia `src/services/__tests__/securityGuard.test.js`;
  - la cobertura en `vite.config.js` (`coverage.include`).

**Contratos del motor que se consumen.** Léelos completos en
`C:\laragon\www\UaldoBusiness\docs\API-cash-close.md`, secciones 1, 2, 3 y 7. Todos son **solo para el dueño**: el
personal recibe 403, y un cierre de otro negocio o inexistente responde 404. Los montos **llegan en dólares**
(número) y **se envían en dólares como texto** con 2 decimales como máximo.

- **`GET /api/v1/restaurant/cash-close`:** los 60 cierres más recientes, o uno con `?date=AAAA-MM-DD`.
  Respuesta `{ data: [cierre] }`. Cada cierre trae:
  - `fecha` y `status` (`borrador`, `revision` o `cerrado`), `auto_cerrado` y `source` (`runfood` o `pwa`);
  - los brutos (`efectivo`, `pichincha`, `de_una`, `internacional`, `credito`, `debito`, `diners`, `pedidos_ya` y
    las decoraciones) y los netos (`tarjeta_neto`, `diners_neto`, `pedidos_ya_neto`, que pueden ser `null`);
  - `neto_tarjetas_origen` (`estimado`, `real` o `null`) y `propinas`;
  - los calculados: `ventas_del_dia`, `gastos_diarios`, `efectivo_esperado`, `efectivo_declarado`,
    `efectivo_contado`, `diferencia_efectivo` y `valor_en_cuentas`;
  - `discrepancias`: una lista de `{tipo, motivo}`; las de tipo `runfood_cambio_tras_cierre` traen `detalle` en
    lugar de `motivo`;
  - `confirmed_at`, `reopened_at`, `forced_reason`, `snapshot` (`{id, captured_at, agent_version}` o `null`),
    `sheets_status` y `observacion`.

  **`null` significa "pendiente"**, nunca 0.
- **`PUT /api/v1/restaurant/cash-close/{fecha}`:**
  - **Campos opcionales:** `efectivo_contado`, `tarjeta_neto`, `diners_neto`, `pedidos_ya_neto`, `pedidos_ya`,
    `decoracion_efectivo`, `decoracion_tarjeta`, `decoracion_transferencia`, `observacion` (hasta 500),
    `confirmar` (booleano), `forzar` (booleano) y `motivo` (de 10 a 300 caracteres, obligatorio con `forzar`).
  - **Formato:** los montos van como texto, con `^\d{1,7}(\.\d{1,2})?$`. Una clave desconocida responde 422.
  - **Respuestas:**
    - `200 { data: cierre }`;
    - **`422 { message, fallas: [{tipo, motivo}] }`** si se pide `confirmar` con fallas y sin forzar; los datos
      enviados **sí quedan guardados**;
    - `422` de validación, con `errors` por campo.
- **`POST /api/v1/restaurant/cash-close/{fecha}/netos-reales`:**
  - al menos uno de `tarjeta_neto`, `diners_neto` y `pedidos_ya_neto`;
  - no cambia el estado, recalcula y reexporta a Sheets;
  - responde `200 { data: cierre }`.
- **`POST /api/v1/restaurant/cash-close/{fecha}/reabrir`:**
  - cuerpo `{ motivo }`, hasta 300;
  - solo sobre un cierre `cerrado`, que pasa a `revision`; si no está cerrado, `409`.
- **`POST /api/v1/restaurant/cash-close`** (cierre manual de un día **sin** datos de RunFood):
  - `fecha` y los brutos en dólares; ver la tabla de la sección 2 de `API-cash-close.md`;
  - **`409`** si ese día ya tiene foto de RunFood ("Este cierre lo genera RunFood: usa la revisión del cierre.").
- **`GET /api/v1/restaurant/cash-movements?date=AAAA-MM-DD`:**
  - `{ data: [movimiento], meta, fecha, totals: { por_tipo, gastos_diarios } }`, paginado de 100 en 100;
  - cada movimiento: `id`, `kind`, `kind_label`, `counterparty`, `amount`, `note`, `source`, `anulado`,
    `anulado_en`, `created_by` y `created_at`.
- **`POST /api/v1/restaurant/cash-movements`:**
  - cuerpo: `business_date`, `kind`, `counterparty`, `amount` (mayor que 0, hasta 100000, 2 decimales), `note`
    (hasta 200) y `client_uuid`;
  - `kind` es uno de `pago_transferencia`, `pago_efectivo`, `caja_chica`, `deposito`, `a_justificar` y `cheque`;
  - `counterparty` es obligatoria en `pago_transferencia`, `pago_efectivo` y `cheque`;
  - respuestas: `201` nuevo; `200` si el `client_uuid` se repite (idempotente); `409` si el `client_uuid` es de
    otro negocio; `422` de validación.
- **`POST /api/v1/restaurant/cash-movements/{id}/anular`:** cuerpo `{ motivo }` (obligatorio, hasta 200);
  idempotente.

**Lee primero:**
- `docs/ualdo-brand.md`;
- en el motor: `docs/API-cash-close.md` y `docs/runbooks/RUNBOOK-cierre-ciego-runfood.md`, sección 6 ("Cómo revisa
  el dueño un día en revisión"), que es la guía funcional de esta pantalla;
- en la PWA: `src/services/apiClient.js`, `src/App.jsx`, `src/components/EcosystemView.jsx`,
  `src/components/CashCloseView.jsx`, `src/components/DobleFiloCashCloseCard.jsx`,
  `src/services/doblefiloEngine.js`, `src/services/appEcosystem.js`, `src/components/SettingsView.jsx`,
  `src/services/notificationRoutes.js`, `src/hooks/useMovementSubmit.js` y `vite.config.js`.

## Objetivo

Que el dueño revise la caja **del motor** desde la app:
- vea los días en revisión con sus motivos;
- complete el conteo de efectivo;
- confirme o fuerce con motivo;
- cargue los netos reales del banco y reabra un día cerrado;
- registre o anule los pagos y depósitos del día.

Todo sin calcular dinero en el teléfono, sin NexoTeams y sin enviar nada a Sheets desde el teléfono.

## Requerimientos

### Parte A: clientes

1. **Reescribe `src/services/cashCloseClient.js` sobre `request`** del `apiClient`, sin `teamsRequest`:
   - `listCloses()` y `getClose(fecha)`;
   - `reviewClose(fecha, data)`, `setNetosReales(fecha, netos)` y `reopenClose(fecha, motivo)`;
   - `createManualClose(data)`.

   **Validaciones antes de la petición**, que devuelven un error sin llamar:
   - `fecha` cumple `^\d{4}-\d{2}-\d{2}$` y es una fecha real;
   - las claves de `reviewClose` están en la lista blanca del contrato.

   La fecha va en la ruta solo después de validarla, y la consulta se arma con `URLSearchParams`.
2. **Nuevo `src/services/cashMovementsClient.js`:**
   - `listMovements(fecha, page)`;
   - `createMovement({ business_date, kind, counterparty, amount, note }, clientUuid)`;
   - `voidMovement(id, motivo)`.

   El `id` es un entero positivo y se valida; `kind` está en la lista blanca de los seis tipos.
3. **Montos, en un módulo nuevo `src/services/money.js`:**
   - `normalizeAmount(raw)`: acepta coma decimal, valida `^\d{1,7}(\.\d{1,2})?$` y devuelve **texto**
     (`"12.5"`), o `null` si no es válido. Para movimientos, además, mayor que 0 y hasta 100000.
   - `formatUsd(value)`: muestra un número del motor como `USD 1.234,56` (separadores de `es-EC`), y `null` como
     **"Pendiente"**.
   - **Ningún cálculo de dinero en el cliente:** ni sumas, ni restas, ni comisiones. Todos los totales,
     diferencias y estados salen de la respuesta del motor. Esto se verifica con un test (punto 6 de Tests).

### Parte B: pantallas (dentro de `src/components/cashclose/`)

4. **`CashCloseView.jsx`** (reemplaza al actual, con menos de 250 líneas) es el contenedor de la subvista
   `cashclose`.
   - **Personal:** si `user.capabilities.is_owner` es falso, muestra "Solo el dueño puede ver la caja." y no hace
     ninguna petición. El servidor igual responde 403; si llega un 403, muestra el mismo mensaje.
   - **Lista de días** (`CashCloseList.jsx`), con los cierres de `listCloses()`, el más reciente primero:
     - Fecha, estado con etiqueta ("En revisión", "Cerrado", "Cerrado solo", "Borrador"), ventas del día y
       diferencia de efectivo.
     - Los días **en revisión van primero**, destacados con `--warning-soft`, y con el número de motivos.
     - Filtro "Solo en revisión".
   - Al tocar un día, abre su detalle.
   - Recibe una `fechaInicial` opcional (punto 9) y, si viene, abre ese día directamente.
5. **Detalle del día (`CashCloseDetail.jsx`)**, por bloques y solo con datos del motor:
   - **Cabecera:**
     - fecha y estado;
     - "Cerrado automáticamente" si `auto_cerrado`;
     - "Reabierto el ..." si `reopened_at`;
     - "Forzado: <motivo>" si `forced_reason`;
     - el origen de los datos: "RunFood, foto de las HH:MM" desde `snapshot.captured_at`, o "Manual";
     - el estado de Sheets (`sheets_status`).
   - **Motivos de revisión:** cada discrepancia con su `motivo` (o `detalle`) **como texto plano**. Debajo de cada
     tipo, la acción sugerida de la sección 6.1 del runbook del cierre ciego. Por ejemplo, `sin_conteo_efectivo`:
     "Cuenta el efectivo y cárgalo abajo"; `sin_datos_runfood`: "Revisa que el PC del local esté encendido y con
     internet". Los textos van en un mapa local; un tipo desconocido muestra solo el motivo del servidor.
   - **Ventas:** efectivo, transferencias (Pichincha, De Una e Internacional), tarjetas (crédito, débito y Diners,
     cada una con bruto y neto, y una marca "estimado" o "real" según `neto_tarjetas_origen`), Pedidos Ya,
     decoración, propinas y ventas del día.
   - **Efectivo:** declarado por el cajero, contado, esperado y diferencia, con color por signo, usando
     variables.
   - **Valor en cuentas.**
   - **Observación.**
6. **Revisar y cerrar (`CashCloseReviewForm.jsx`),** solo si el estado no es `cerrado`:
   - **Campos:** efectivo contado, los netos (tarjeta, Diners y Pedidos Ya), Pedidos Ya bruto, las tres
     decoraciones y la observación. Cada campo arranca con el valor del motor y solo se envían las claves que el
     dueño cambió.
   - **Botones:**
     - "Guardar": `PUT` sin `confirmar`;
     - "Guardar y cerrar el día": `PUT` con `confirmar: true`.
   - **Si el `PUT` con `confirmar` responde 422 con `fallas`:**
     - muestra "El cierre no cuadra" con la lista de fallas y la opción "Cerrar de todas formas";
     - esa opción pide el **motivo** (de 10 a 300 caracteres, con contador) y reenvía con `confirmar: true`,
       `forzar: true` y `motivo`;
     - avisa que los datos sí quedaron guardados y recarga el día.
   - **Un 422 de validación** muestra el error junto a cada campo.
   - **Tras un 200:** actualiza el detalle con `data` (sin volver a calcular nada) y emite
     `ualdo:notifications-updated`.
7. **Acciones sobre un día cerrado (`CashCloseClosedActions.jsx`):**
   - **"Cargar netos del banco":** formulario con los tres netos, de los que al menos uno es obligatorio. Llama a
     `setNetosReales` y actualiza el detalle. El estado no cambia.
   - **"Reabrir el día":** pide un motivo (obligatorio, hasta 300) y una confirmación explícita ("El día volverá a
     revisión y no se cerrará solo"). Llama a `reopenClose`. Un 409 muestra el mensaje del servidor.
8. **Movimientos del día (`CashMovementsPanel.jsx`)**, en el detalle de cualquier día:
   - **Lista** con tipo (`kind_label`), contraparte, monto, nota y autor. Los anulados aparecen tachados con
     "Anulado". Al pie, `gastos_diarios` y los totales por tipo **del servidor**. Si hay más de una página,
     "Cargar más".
   - **"Registrar movimiento":**
     - tipo, contraparte (obligatoria según el tipo, igual que en el servidor), monto y nota;
     - `client_uuid` con la misma regla que `useMovementSubmit` del 15a: se genera al abrir el formulario, se
       **reutiliza** en los reintentos tras un error de red y se renueva tras un 201 o un 200;
     - un 200 idempotente se muestra como "Ya estaba registrado";
     - un 409 muestra un error genérico y genera un uuid nuevo;
     - extrae la lógica a un hook `src/hooks/useCashMovementSubmit.js`, o generaliza `useMovementSubmit` si
       resulta natural, sin romper sus tests.
   - **"Anular":** pide el motivo y una confirmación.
   - **Después de crear o anular,** recarga el día con `getClose(fecha)`, porque el motor recalcula el cierre, y
     también los movimientos.
9. **Día sin datos (`CashCloseManualForm.jsx`):**
   - Si `getClose(fecha)` no trae cierre y la fecha no es futura, ofrece "Cargar el cierre a mano" con los brutos
     del contrato del `POST`, convertidos con `normalizeAmount`.
   - Si el `POST` responde 409, explica que ese día lo genera RunFood y abre el detalle del motor.
   - El selector de fecha no permite fechas futuras ni anteriores a 90 días, igual que el servidor.
10. **Navegación desde los avisos:**
    - `App.jsx` (`handleNotificationNavigate`) conserva `target.params` en un estado nuevo `negociosParams` y lo
      pasa a `EcosystemView`, que se lo pasa a `CashCloseView` como `fechaInicial`. Solo se usa si
      `params.fecha` cumple el formato de fecha, que ya sanea `notificationRoutes.js`.
    - Al salir de la subvista, el estado se limpia.

### Parte C: retirar el cierre del teléfono

11. **Elimina:**
    - `DobleFiloCashCloseCard.jsx`;
    - de `doblefiloEngine.js`: `executeDoblefiloCashClose`, `executeDoblefiloDetailedCashClose`,
      `syncCashCloseToGoogleSheets` y la lectura y escritura de `ualdo_cash_close_history`;
    - en `appEcosystem.js`, la herramienta local de cierre que las usaba y su import. Si `executeLocalTool` queda
      sin herramientas y nadie la usa, elimínala también y anótalo.
12. **Ajustes:**
    - Quita el envío a Sheets.
    - Si `settings.googleSheetsWebhookUrl` tiene un valor guardado, muestra en Ajustes una tarjeta de solo lectura,
      "Google Sheets ahora lo envía el motor", con la URL y un botón "Copiar". El runbook de despliegue pide
      copiarla al motor con `sheets:configure`.
    - Ya no se puede editar ni se usa para nada más.
    - No borres el valor guardado en este brief: se elimina cuando el motor esté desplegado.
13. **Limpieza de almacenamiento:** al iniciar sesión, borra `ualdo_cash_close_history` de `localStorage`
    (historial local viejo con datos de dinero). Hazlo en `auth.js`, junto a las otras limpiezas.
14. **Guardia:** agrega a `securityGuard.test.js` los tokens prohibidos `syncCashCloseToGoogleSheets`,
    `executeDoblefiloDetailedCashClose`, `ualdo_cash_close_history`, `/mobile/cash-close` y `DINERS_NET_FACTOR`.
15. **Cobertura:** agrega a `coverage.include` de `vite.config.js` `src/components/cashclose/**`,
    `src/services/cashCloseClient.js`, `src/services/cashMovementsClient.js`, `src/services/money.js` y el hook
    nuevo.

**Importante para el despliegue:** este brief deja la caja de la PWA dependiendo del motor. Se publica **junto con**
el motor desplegado (Brief 16) y después de copiar la URL de Sheets al motor. Anótalo en el resumen.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, datos de prueba, documentación, commits o nombres de archivo. Tampoco símbolos decorativos de terminal pegados en la documentación. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`:
  - colores **solo** con variables de `src/styles/main.css`; si hace falta una nueva, se agrega allí;
  - Poppins, botones pastilla, tono claro y breve en español con tildes.
  - Al terminar, este `grep` no debe devolver nada:

    ```
    grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/cashclose
    ```
- **Dinero:** ningún cálculo de dinero en el cliente. Los montos se envían como texto validado. `null` se muestra
  como "Pendiente", nunca como 0.
- **Seguridad:**
  - Todo pasa por `apiClient`.
  - Ningún texto del servidor (motivos, observación, contraparte o nota) se interpreta como HTML; nunca
    `dangerouslySetInnerHTML`.
  - Las fechas y los ids se validan antes de construir rutas.
  - No se guardan cierres ni movimientos en `localStorage`.
  - Nada de `alert()` ni `confirm()` nativos: usa modales de la app.
- **Accesibilidad:** cada campo con su `label`; errores con `aria-live`; los modales se cierran con Escape y
  devuelven el foco.
- **Diseño:**
  - componentes de menos de 250 líneas, funciones de menos de 50 y sin mutaciones de estado;
  - hooks para la lógica: `useCashClose(fecha)` (carga, revisión, netos y reapertura) y `useCashMovements(fecha)`;
  - temporizadores siempre limpiados.
- Sin dependencias nuevas. No toques el motor, las tareas de NexoTeams, el chat ni el login, salvo la limpieza del
  punto 13.

## Tests

Usa Vitest con Testing Library, con `request` simulado y temporizadores falsos donde haga falta. **Cada test debe
fallar si se revierte lo que protege.** Anota en `docs/RESUMEN-15b.md` al menos **ocho** mutaciones (archivo,
cambio exacto, test que falla y la salida **real** sin editar ni resumir, sin símbolos de terminal: reemplázalos por
`[ok]`, `[x]` y `>`). El auditor repetirá cada una; en el 15a se anotaron salidas que no se podían reproducir.

1. **`cashCloseClient`:**
   - una fecha mal formada o inexistente (`2026-02-30`) no hace la petición;
   - una clave fuera de la lista blanca en `reviewClose` no se envía;
   - las rutas y la consulta se codifican.
2. **`money`:**
   - `"12,5"` da `"12.5"`; `"1.234"`, `"-3"` y `"abc"` dan `null`;
   - los movimientos rechazan 0 y más de 100000;
   - `formatUsd(null)` da "Pendiente".
3. **Revisión:**
   - "Guardar" envía solo las claves cambiadas, y los montos como texto.
   - Un 422 con `fallas` muestra la lista y "Cerrar de todas formas"; el reenvío lleva `forzar: true` y el
     `motivo`.
   - Un motivo de 9 caracteres no se envía.
   - Mutación: enviar `forzar` sin `motivo`.
4. **Estados:**
   - el formulario de revisión no aparece en un día `cerrado`;
   - "Cargar netos" y "Reabrir" no aparecen en un día en revisión;
   - un 409 al reabrir muestra el mensaje del servidor.
5. **Netos reales:** sin ningún neto no se envía; con uno, llama a `netos-reales` y el detalle muestra lo que
   devolvió el servidor.
6. **Sin cálculos en el cliente:** con un cierre simulado cuyo `diferencia_efectivo` (por ejemplo, `-12.4`)
   **no** coincide con declarado menos esperado, la pantalla muestra exactamente lo del servidor.
   Mutación: calcular la diferencia en el cliente.
7. **`null` es "Pendiente":** `tarjeta_neto: null` y `valor_en_cuentas: null` se muestran como "Pendiente", nunca
   como "USD 0,00".
8. **Movimientos:**
   - Contraparte obligatoria en `pago_efectivo` y opcional en `deposito`.
   - **El reintento tras un error de red reutiliza el `client_uuid`**, y tras un 201 se usa uno nuevo.
     Mutación: un uuid nuevo en cada envío.
   - Un 200 idempotente muestra "Ya estaba registrado".
   - Anular pide el motivo y, después de anular, se recarga el cierre del día.
9. **Personal:** sin `is_owner` no se hace ninguna petición y se ve el mensaje. Mutación: quitar la comprobación.
10. **Texto plano:** un motivo `<img src=x onerror=alert(1)>` se muestra como texto y no crea ningún `img`.
11. **Navegación desde un aviso:**
    - un aviso `cierre_caja` con `params.fecha = "2026-10-05"` abre el detalle de ese día;
    - con `params.fecha = "javascript:alert(1)"` abre la lista sin fecha.

    Mutación: no pasar los `params`.
12. **Día manual:** sin cierre, aparece "Cargar el cierre a mano", y un 409 lleva al detalle del motor.
13. **Guardia:** escribir `syncCashCloseToGoogleSheets` en un archivo temporal de `src` hace fallar la guardia; el
    archivo se borra después.
14. **Ajustes:** con una URL guardada aparece la tarjeta de solo lectura con "Copiar", y no hay ningún campo
    editable de Sheets.
15. **Regresión:** los 123 tests existentes siguen en verde, sin borrar aserciones.
16. **Cobertura:** `npm run test:coverage` con al menos **80 % de sentencias y de ramas** en los archivos nuevos del
    punto 15. Pega la tabla por archivo **tal cual** en el resumen.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/cashclose; echo "exit=$?"
grep -rn "teamsRequest('/mobile/cash-close\|syncCashCloseToGoogleSheets\|ualdo_cash_close_history" src --include=*.js --include=*.jsx | grep -v __tests__; echo "exit=$?"
wc -l src/components/cashclose/*.jsx
git status --short
```

**Prueba manual opcional** contra el motor local (`php artisan serve` en `C:\laragon\www\UaldoBusiness`), que se
documenta en el resumen y no reemplaza los tests:
1. Inicia sesión como dueño y como personal.
2. Abre un día en revisión y confírmalo forzado con un motivo.
3. Carga los netos reales de un día cerrado y reábrelo.
4. Registra y anula un pago en efectivo.

## Criterios de aceptación

- [ ] La caja de la app sale del motor: lista de días con los de revisión primero, detalle con motivos y acciones sugeridas, revisión con confirmar o forzar con motivo, netos reales, reapertura y movimientos del día.
- [ ] El cliente no calcula dinero: los totales, diferencias y estados son los del servidor; `null` se muestra como "Pendiente".
- [ ] Los montos viajan como texto validado, y los movimientos son idempotentes con reutilización del `client_uuid`.
- [ ] Solo el dueño ve la caja; el personal no hace peticiones.
- [ ] Un aviso `cierre_caja` abre el día de su `params.fecha`.
- [ ] No queda NexoTeams en la caja, ni envío a Sheets desde el teléfono, ni historial de caja en `localStorage`, ni comisión fija; la guardia lo impide.
- [ ] Ajustes muestra la URL de Sheets de solo lectura con "Copiar".
- [ ] Componentes de menos de 250 líneas; colores solo con variables (el `grep` sale vacío).
- [ ] `docs/RESUMEN-15b.md` tiene al menos ocho mutaciones con salidas reales, la tabla de cobertura por archivo y la nota de despliegue.
- [ ] Cero emojis; marca Ualdo; sin dependencias nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build` en verde.

## Fuera de alcance (Brief 15c)

Pantallas para asignar las formas de pago de RunFood a su cubeta (`payment-mappings`) y para configurar las tasas
de comisión (`commission-rates`). Mientras no existan, el detalle del día explica que los motivos `formas_sin_mapear`
y `falta_comision` se resuelven desde el motor, sin enlazar a ninguna pantalla.
