# Brief 37p_fix: causa al resolver quejas y detalles de horas extra

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `fix/pwa-incidencias-y-horas-extra` desde `main` (que ya tiene el 36p en `1df6408` y el 37p en `8341007`). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Por qué.** La auditoría del 2026-11-01 de los Briefs 36p y 37p dio verde en lo básico: lint con 0 errores y 47 avisos (los mismos de antes), 1063 tests, build correcto, sin emojis, sin colores fijos, sin tildes eliminadas y componentes por debajo de 200 líneas. Los clientes desenvuelven bien el sobre `{ data: ... }`, las fotos se descargan con el token en el encabezado y no hay dinero en horas extra.

Pero hay un fallo que anula un control que pidió el dueño:

- **La resolución de una queja cambia la causa sin que nadie lo note.** `ResolveModal` (`src/components/incidents/IncidentActionModals.jsx`, línea 7) arranca siempre con `cause = 'servicio'`. El motor (Brief 37_fix) toma la causa enviada al resolver y, si deja de ser `produccion`, **borra la confirmación del jefe de cocina**. Una queja reportada como de producción, resuelta por el jefe de salón sin tocar el selector, pasa a "servicio" y se valida sin que cocina confirme. Es justo la doble confirmación que pidió el dueño.

Y tres detalles de horas extra:
- Al registrar horas, el formulario elige solo al primer trabajador de la lista (`OvertimeForm.jsx`, línea 35). Si el jefe no lo cambia, las horas quedan a nombre de otra persona.
- "Anular y registrar de nuevo" anula con un motivo fijo ("Corrección de horas registradas", línea 82), en vez de pedirlo, y si la nueva creación falla, el registro anterior ya quedó anulado sin aviso claro.
- El formulario no manda `client_uuid`: un doble toque con mala señal puede dar un `409` confuso.

**Lee primero:** `docs/briefs/36p_pwa-horas-extra.md`, `docs/briefs/37p_pwa-incidencias.md`, `C:\laragon\www\UaldoBusiness\docs\API-incidents.md` (regla de la causa al resolver), `src/components/incidents/IncidentActionModals.jsx`, `IncidentDetail.jsx`, `src/components/overtime/OvertimeForm.jsx`, `OvertimeConflictBanner.jsx` y `VoidOvertimeModal.jsx`.

## Objetivo

Resolver una queja nunca cambia su causa sin una elección consciente, y la app avisa cuando el cambio quita la confirmación de cocina. Las horas extra se registran siempre a nombre de alguien elegido a propósito, y anular pide el motivo.

## Requerimientos

### A. HIGH

1. **Causa al resolver una queja** (`ResolveModal`):
   - Recibe la incidencia (o su `cause` actual) y arranca con esa causa. Si la queja no tiene causa, el selector arranca vacío con la opción "Elige la causa" y el botón queda deshabilitado hasta elegir.
   - Si la causa original es `produccion` y se elige otra, muestra antes de confirmar: "Al cambiar la causa se borra la confirmación de cocina." (aviso neutro, no de error).
   - Envía `cause` solo al pasar a `resuelta` (el motor responde `422` si llega en otro paso).
   - Tests: una queja de producción abre el modal con "Producción" elegida; cambiarla muestra el aviso; una queja sin causa no deja confirmar sin elegir; una avería no muestra el selector.

### B. MEDIUM

2. **Sin trabajador preseleccionado** (`OvertimeForm.jsx`): el selector arranca vacío ("Elige a la persona") y "Registrar" queda deshabilitado hasta elegir. Test: sin elegir no se puede registrar.
3. **Anular con motivo** (`handleVoidAndRetry`):
   - Abre `VoidOvertimeModal` para pedir el motivo (5 a 300 caracteres) antes de anular; sin motivo fijo.
   - Si la anulación funciona y la nueva creación falla, muestra: "Se anuló el registro anterior, pero no se pudo guardar el nuevo. Vuelve a registrar las horas." y deja el formulario con los datos para reintentar.
   - Tests para los dos casos.
4. **`client_uuid` estable**: genera uno por formulario con `generateClientUuid` (de `src/hooks/useMovementSubmit.js`), lo reutiliza en reintentos y lo renueva al registrar con éxito o al cambiar de trabajador o fecha. Test: dos envíos seguidos usan el mismo `client_uuid`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Colores solo con variables CSS. Sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas (`IncidentDetail.jsx` tiene 197 e `IncidentDetailActions.jsx` 194: si crecen, extrae; compruébalo con `wc -l`), funciones de menos de 50.
- Los mocks de los tests usan la forma real de la respuesta del motor (`{ data: ... }`).
- No cambies el comportamiento del 36p ni del 37p fuera de estos puntos. No añadas dependencias.

## Tests

Los indicados en cada punto, en `src/components/incidents/__tests__/` y `src/components/overtime/__tests__/`. Cobertura de 80 % o más del código tocado.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El primer comando debe mostrar `fix/pwa-incidencias-y-horas-extra`. El lint debe seguir con 0 errores y no más de 47 avisos.

## Criterios de aceptación

- [ ] Resolver una queja conserva su causa salvo elección explícita, y avisa si se pierde la confirmación de cocina.
- [ ] Las horas extra nunca se registran a un trabajador preseleccionado.
- [ ] Anular pide el motivo y avisa si la nueva creación falla.
- [ ] `client_uuid` estable en reintentos.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
