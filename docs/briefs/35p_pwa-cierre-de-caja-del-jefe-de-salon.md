# Brief 35p: cierre de caja del jefe de salón en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-caja-jefe-de-salon` desde `main` con el Brief 30p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 35 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\35_cierre-de-caja-por-jefe-de-salon.md` y la sección "Declaración del jefe de salón" de `C:\laragon\www\UaldoBusiness\docs\API-cash-close.md`.

**Por qué.** Por decisión del dueño, solo el jefe de salón registra el cierre de caja. Usa una vista limitada a su cierre de hoy o de ayer, sin históricos, gastos ni comisiones. Si no cuadra, recuenta una vez y después explica la causa. Administración revisa. La app hoy solo tiene la caja completa del dueño (`CashCloseView.jsx`, `src/components/cashclose/`).

**Lee primero:** `docs/ualdo-brand.md`; `src/components/CashCloseView.jsx`; `src/components/cashclose/*`; `src/hooks/useCashClose.js`; `src/services/cashCloseClient.js`; `src/services/money.js`; `src/services/permissions.js` y `moduleRegistry.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos como texto validado con `money.js`; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

El jefe de salón abre "Mi cierre de caja", ve los medios de pago del día con lo esperado de RunFood, escribe lo contado y lo envía. La app guía el recuento y la causa. Administración sigue viendo la caja completa y los cierres en revisión.

## Requerimientos

1. **Cliente.** En `cashCloseClient.js`:
   - `getDeclaration(fecha)` y `submitDeclaration(fecha, { efectivo_contado, medios, difference_cause, difference_explanation })`.
   - `getCashCloseSettings()` y `updateCashCloseSettings(data)`.
   - Fecha solo de hoy o ayer; montos con `normalizeAmount`; causa en la lista cerrada del Brief 35.
   - El `409` con `code = recount` se devuelve como resultado propio, no como error genérico.
2. **Pantalla del jefe** (`src/components/cashclose/declaration/`; tarjeta "Mi cierre de caja" en `moduleRegistry` para quien tiene `cash.register` y no `cash.review`):
   - `CashDeclarationView.jsx`: selector Hoy o Ayer, estado del cierre ("Por declarar", "Cerrado", "En revisión") y quién lo declaró.
   - `CashDeclarationForm.jsx`: efectivo contado y un campo por medio habilitado, con lo esperado al lado. Muestra en vivo la diferencia por medio y la total.
   - Recuento: tras el `409 recount`, mensaje destacado "Hay una diferencia de {monto} en {medio}. Vuelve a contar antes de seguir." Los campos se mantienen y el botón pasa a "Enviar recuento".
   - Si sigue sin cuadrar, aparecen el selector de causa y la explicación (obligatoria con "Otro" o "Faltante sin explicar"), con el texto "El cierre quedará en revisión de administración".
   - Resultado: "Cierre enviado. Cuadró." o "Cierre en revisión.", sin mostrar netos, gastos ni comisiones aunque lleguen.
3. **Lo que el jefe no ve.** La tarjeta y la pantalla completas de caja (`CashCloseView`, movimientos, configuración y ventas) exigen `cash.review` o `sales.totals`. Comprueba que el jefe no llega a ellas ni por aviso ni por navegación.
4. **Administración.** En `CashCloseList`, los cierres declarados muestran "Declarado por {nombre}", la causa y la explicación cuando estén en revisión. Usa el flujo de revisión existente.
5. **Ajustes** (`settings.manage`): "Lo declara el jefe de salón" (encendido o apagado), hora del recordatorio y hora límite. Componente `CashCloseSettingsForm.jsx` en `src/components/cashconfig/`.
6. **Avisos.** Un aviso con `action.screen = cierre_caja` abre la pantalla del jefe si tiene `cash.register` sin `cash.review`; si no, la caja completa. Ajusta `notificationRoutes.js` y su test.
7. **Chat.** En `SuggestionChips.jsx`, para `cash.register` sin `cash.review`: "Hacer el cierre de caja", con el texto "Quiero declarar el cierre de caja de hoy".

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Privacidad: el jefe nunca ve cifras del libro, históricos ni ventas de otros días; la app no guarda montos en `localStorage`.
- La app oculta, pero el motor decide; errores con el mensaje del motor.
- Seguridad: montos validados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: fechas permitidas, montos y el resultado `recount`.
- Flujo: cuadra, se cierra; diferencia, pide recuento; sigue la diferencia, pide causa y queda en revisión.
- El jefe no ve la tarjeta de caja completa ni Ventas; el aviso `cierre_caja` lo lleva a su pantalla.
- Administración ve "Declarado por" y la causa.
- La respuesta con claves de más (netos, gastos) no se renderiza en la pantalla del jefe.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] El jefe de salón declara el cierre con recuento y causa guiados.
- [ ] El jefe no ve nada fuera de su cierre de hoy o de ayer.
- [ ] Administración ve quién declaró y por qué hay diferencia.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
