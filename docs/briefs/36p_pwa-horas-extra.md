# Brief 36p: horas extra en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-horas-extra` desde `main` con el Brief 30p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 36 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\36_horas-extra.md` y `C:\laragon\www\UaldoBusiness\docs\API-overtime.md`.

**Por qué.** Solo los jefes de área registran horas extra de su equipo. Administración ve los acumulados por día y por mes. Por decisión del dueño, no hay nada de dinero: ni tarifas, ni pagos, ni nómina.

**Lee primero:** `docs/ualdo-brand.md`; `src/services/permissions.js` y `moduleRegistry.js` (Brief 30p); `src/hooks/usePagedList.js`; `src/components/assistant/SuggestionChips.jsx`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Un jefe registra horas extra de su equipo en pocos toques y ve lo registrado. Administración ve el resumen del mes por persona, con el desglose por día.

## Requerimientos

1. **Cliente** `src/services/overtimeClient.js`: `createOvertime`, `listOvertime(filters)`, `voidOvertime(id, reason)`, `listOvertimeWorkers(area)` y `getOvertimeSummary(month)`.
   - Horas mayores que 0 y hasta 12, en pasos de 0,25.
   - Fecha de hoy hasta 7 días atrás.
   - `worker_user_id` (`^\d+$`) o `worker_name` (de 2 a 80 caracteres), nunca los dos.
   - Mes en formato `AAAA-MM`.
2. **Tarjeta "Horas extra"** en `moduleRegistry` (`canAny` de `overtime.register.kitchen`, `overtime.register.lounge` y `overtime.report`). Pantalla `src/components/overtime/OvertimeView.jsx`:
   - "Registrar" (para los jefes): `OvertimeForm.jsx` con el trabajador elegido de la lista del área (`listOvertimeWorkers(area)` sobre `GET /overtime/workers`) o "Otra persona" con nombre libre, fecha (hoy por defecto), horas con botones rápidos (1, 2 y 3 más un campo), y observación. El `409` de duplicado muestra el registro existente con la opción "Anular y registrar de nuevo".
   - "Registros": lista paginada con filtros por fecha y, para administración, por área. Total del filtro arriba. "Anular" con motivo obligatorio.
   - "Mes" (solo `overtime.report`): `OvertimeSummary.jsx` con selector de mes y una tarjeta por persona (horas del mes y días), que al tocarla muestra el desglose por día.
3. **Avisos.** El resumen mensual del motor abre esta pantalla en la vista "Mes". Añade la ruta a `notificationRoutes.js` si el motor envía una pantalla propia; si llega `inventario` (respaldo del Brief 36), no lo cambies y anótalo en la descripción del commit.
4. **Chat.** Para quien tiene `overtime.register.*`: acceso "Registrar horas extra", con el texto "Quiero registrar horas extra".
5. No hay ningún texto, columna ni cálculo de dinero en estas pantallas.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Privacidad: datos de personal; nada en `localStorage`.
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: ids `^\d+$`; textos validados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (`usePagedList`).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: validación de horas (paso de 0,25 y máximo de 12), fechas, trabajador y mes.
- Formulario: un jefe de cocina ve solo su equipo; nombre libre; el `409` ofrece anular y registrar.
- Anular exige motivo.
- "Mes" visible solo con `overtime.report`; el desglose por día se abre.
- No aparece ningún símbolo de moneda (test que busca "$" en el render).
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Los jefes registran y anulan horas extra de su área.
- [ ] Administración ve el resumen mensual por persona y por día.
- [ ] Ningún dato de dinero.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
