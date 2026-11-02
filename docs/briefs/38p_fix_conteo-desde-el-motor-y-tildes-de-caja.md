# Brief 38p_fix: conteo de activos desde el motor, tildes de caja y un test con fecha fija

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Trabaja sobre la rama `feat/pwa-activos` (commit `775cd90`, Brief 38p). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 38_fix2 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\38_fix2_consulta-de-conteos-de-activos.md` (añade `GET /asset-counts?area=&period=` y `GET /asset-counts/{id}`, y el `409` con `data.id`).

**Por qué.** La auditoría del 2026-11-02 dio verde en lo básico del 38p: lint con 0 errores y 47 avisos, build correcto, sin emojis, sin colores fijos, componentes por debajo de 200 líneas y contrato con el motor correcto en catálogo, importación, conteo y reporte. Pero el conteo mensual no se puede terminar entre dos personas:

- `AssetCountTab.jsx` guarda el conteo en `localStorage` del teléfono que lo empezó y no tiene otra forma de recuperarlo, porque el motor no tenía consultas (se agregan en el 38_fix2).
- Cuando el jefe del área, desde su teléfono, pulsa "Empezar" para validar, recibe "Ya existe un conteo registrado para esta área y periodo. Revisa el reporte del mes." y **no puede ver ni validar el conteo**. Lo mismo pasa si quien cuenta cambia de teléfono.

Además, de la auditoría del Brief 35p (caja del jefe de salón, rama `feat/pwa-caja-jefe-de-salon`, aprobado con observaciones), quedan textos visibles sin tildes. Y un test del Brief 31p depende de la fecha real.

**Lee primero:** `docs/briefs/38p_pwa-activos-y-conteo-mensual.md`, `C:\laragon\www\UaldoBusiness\docs\API-assets.md` (tras el 38_fix2), `src/services/assetsClient.js`, `src/components/assets/AssetCountTab.jsx`, `AssetCountSheet.jsx`, `src/services/cashCloseClient.js` (rama del 35p) y `src/components/inventory/dailyClose/__tests__/DailyCloseView.test.jsx`.

## Objetivo

El conteo del mes se carga siempre desde el motor, de modo que cualquiera con permiso lo retoma o lo valida desde su teléfono. Los textos de caja llevan sus tildes. Ningún test depende de la fecha real.

## Requerimientos

### A. HIGH: conteo desde el motor

1. **Cliente.** En `assetsClient.js`, `getAssetCountForPeriod(area, period)` (`GET /asset-counts?area=&period=`, devuelve el conteo o `null`) y `getAssetCount(id)`. Desenvuelve `res.data.data` en el mismo lugar que el resto del cliente.
2. **Pestaña "Conteo del mes"** (`AssetCountTab.jsx`):
   - Al elegir área y periodo, pide el conteo al motor. Si existe, muestra su estado ("En borrador", "Enviado, faltan explicaciones", "Listo para validar", "Validado") y el botón que corresponde ("Seguir contando", "Explicar diferencias", "Validar" para quien tiene `assets.validate.{área}`, "Ver").
   - "Empezar" solo aparece si no hay conteo. Si `POST /asset-counts` responde `409` con `data.id`, abre ese conteo en vez de mostrar el error.
   - `localStorage` deja de ser la fuente del conteo. Solo puede guardar, como borrador local, las cantidades escritas y aún no enviadas al motor, con clave por `count.id`; se borran al guardar en el motor. Todo en `try/catch`.
3. **Esperado.** La planilla no muestra el esperado en `draft` a quien cuenta (el motor ya no lo envía); el jefe que valida sí lo ve después del envío.
4. **Tests** (con mocks en la forma real `{ data: ... }`):
   - El jefe de salón abre el conteo enviado por otra persona y lo valida.
   - Sin conteo, aparece "Empezar"; con conteo en borrador, "Seguir contando".
   - El `409` con `data.id` abre el conteo existente.
   - Quien cuenta no ve el esperado en `draft`.

### B. MEDIUM: tildes en caja (Brief 35p)

5. En `src/services/cashCloseClient.js` (rama `feat/pwa-caja-jefe-de-salon`; si ya se fusionó, sobre `main`), corrige los textos visibles:
   - "Fecha invalida. Debe ser hoy, ayer o tener formato AAAA-MM-DD." -> "Fecha inválida. Debe ser hoy, ayer o tener formato AAAA-MM-DD."
   - "El monto de efectivo contado es obligatorio y debe ser valido." -> "...debe ser válido."
   - "Cada medio de pago debe incluir un identificador y un monto valido." -> "...un monto válido."
   - "Causa de diferencia invalida." -> "Causa de diferencia inválida."
   - "La explicacion debe ser texto de hasta 500 caracteres sin etiquetas HTML." -> "La explicación debe..."
   - "Datos de configuracion invalidos." -> "Datos de configuración inválidos."
   - "reminder_time debe tener formato HH:MM y ser como maximo 23:45." y el de `escalation_time`: reescríbelos sin nombres de campo: "La hora del recordatorio debe tener formato HH:MM y ser como máximo 23:45." y "La hora límite debe tener formato HH:MM y ser como máximo 23:45."
   - Corrige también las tildes de los comentarios de ese archivo ("declaracion", "salon", "valida").
   - Actualiza los tests que comparen esos textos exactos.

### C. LOW

6. **Avisos de lint nuevos.** El 38p subió el lint de 47 a 49 avisos (el reporte decía que seguía igual): `AssetCatalogTab.jsx:34` y `AssetReportTab.jsx:36`, `useEffect` sin `loadAssets` / `loadReport` en las dependencias. Envuelve esas funciones en `useCallback` y añádelas, como en `WithdrawalSettingsForm.jsx`.

### Test con fecha fija

7. `DailyCloseView.test.jsx`, caso "un kitchen_head ve solo cocina y puede empezar conteo exitoso", espera la fecha fija `'2026-11-01'` y falla desde el 2 de noviembre. Fija el reloj con `vi.useFakeTimers()` y `vi.setSystemTime(...)` (y restaura en `afterEach`) o calcula la fecha esperada con la misma función de la app.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Colores solo con variables CSS. Sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas (compruébalo con `wc -l`), funciones de menos de 50.
- Los mocks de los tests usan la forma real de la respuesta del motor (`{ data: ... }`).
- No cambies el comportamiento del 38p ni del 35p fuera de estos puntos. No añadas dependencias.

## Tests

Los indicados en cada punto. Cobertura de 80 % o más del código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El lint debe seguir con 0 errores y no más de 47 avisos. `npm test` debe pasar completo, sin fallos por la fecha.

## Criterios de aceptación

- [ ] El conteo del mes se carga desde el motor; el jefe valida desde su teléfono un conteo que empezó otra persona.
- [ ] El `409` de un duplicado abre el conteo existente.
- [ ] Quien cuenta no ve el esperado antes de enviar.
- [ ] Textos de caja con tildes y sin nombres de campo.
- [ ] Ningún test depende de la fecha real.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
