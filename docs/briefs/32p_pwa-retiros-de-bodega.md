# Brief 32p: retiros de bodega en la app

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`). Crea la rama `feat/pwa-retiros-de-bodega` desde `main` con los Briefs 30p y 31p fusionados. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 32 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\32_retiros-de-bodega-con-confirmacion.md` y `C:\laragon\www\UaldoBusiness\docs\API-withdrawals.md`.

**Por qué.** El dueño quiere que el trabajador avise antes de sacar algo de la bodega y diga después cuánto usó y cuánto devolvió. El canal principal es el chat. La app debe permitir hacerlo rápido con el celular en la mano y mostrar a cada uno sus retiros abiertos.

**Lee primero:** `docs/ualdo-brand.md`; `src/components/inventory/TransferModal.jsx` y `src/hooks/useTransferSubmit.js` (patrón de formulario con `client_uuid`); `src/hooks/useItemSearch.js`; `src/services/inventoryLocations.js`; `src/services/quantityFormat.js`; `src/components/assistant/SuggestionChips.jsx`; `src/services/permissions.js` y `moduleRegistry.js`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Cualquier trabajador declara un retiro en tres toques (insumos, cantidades, motivo), ve sus retiros abiertos y los cierra indicando lo usado y lo devuelto. Los jefes ven los retiros abiertos y escalados de su área. Administración ajusta los recordatorios.

## Requerimientos

1. **Cliente** `src/services/withdrawalsClient.js`:
   - `createWithdrawal`, `listWithdrawals(filters)`, `getWithdrawal(id)`, `closeWithdrawal(id, lines, note)` y `cancelWithdrawal(id, note)`.
   - `getWithdrawalSettings()` y `updateWithdrawalSettings(data)`.
   - De 1 a 15 ítems; cantidades con 3 decimales como máximo; motivo de 3 a 200 caracteres; `client_uuid` generado una vez por formulario.
   - `withdrawn_at` solo dentro de las últimas 24 horas, con `late_reason`.
2. **Tarjeta "Retiros de bodega"** en `moduleRegistry` (`withdrawals.declare`), con contador de retiros abiertos propios. Pantalla `src/components/withdrawals/WithdrawalsView.jsx` con pestañas:
   - "Mis retiros": abiertos primero y después cerrados.
   - "Mi área": solo con `withdrawals.supervise`, con abiertos y escalados del área y el primer nombre de quién retiró.
3. **Declarar** (`WithdrawalForm.jsx`):
   - Buscador de insumos (`useItemSearch`) y cantidades, con la unidad del insumo a la vista.
   - Destino (por defecto su área) y motivo con sugerencias rápidas ("Producción", "Mise en place", "Servicio").
   - Casilla "Lo retiré antes de avisar", que muestra la hora y pide el motivo.
   - El `422` de stock insuficiente se muestra en la línea del insumo.
4. **Cerrar** (`WithdrawalCloseForm.jsx`):
   - Por línea, campos "Usé" y "Devolví", con el cálculo en vivo de "Queda en {área}".
   - Nota obligatoria si queda algo; validación de que usado más devuelto no supere lo retirado.
   - Un supervisor que cierra en nombre de otro ve una nota obligatoria.
5. **Cancelar**: el autor, durante los primeros 15 minutos (muestra el tiempo restante); después, solo el supervisor, con nota.
6. **Chat.** En `SuggestionChips.jsx`, acceso "Voy a la bodega" para quien tiene `withdrawals.declare`, con el texto "Voy a retirar de la bodega". Si el usuario tiene retiros abiertos, acceso "Cerrar mi retiro".
7. **Ajustes** (solo `settings.manage`): primer recordatorio, intervalo, máximo de recordatorios y franja silenciosa. Componente `WithdrawalSettingsForm.jsx`.
8. **Avisos.** Un aviso con `action.screen = chat` sigue abriendo el chat. Añade la pantalla `retiros` a `notificationRoutes.js` si el motor la envía. Si no, deja el chat y anótalo en la descripción del commit.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Tono cercano; nada de lenguaje de vigilancia. Conserva las tildes.
- Uso con una mano: botones grandes, como mucho dos pantallas para declarar.
- La app oculta, pero el motor decide; cada error del motor se muestra con su mensaje.
- Seguridad: ids `^\d+$`; textos validados; sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (reutiliza el buscador y el formato de cantidades).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- Cliente: validaciones, `client_uuid` estable en reintentos y rutas.
- Declarar: el `422` de stock se muestra en la línea; el retiro tardío pide motivo.
- Cerrar: "Queda en" se calcula bien; usado más devuelto mayor que lo retirado bloquea; si queda algo, pide nota.
- Cancelar: visible para el autor solo dentro de los 15 minutos.
- "Mi área" visible solo con `withdrawals.supervise`.
- Accesos del chat según los permisos y los retiros abiertos.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

## Criterios de aceptación

- [ ] Declarar y cerrar un retiro desde la app, con validaciones claras.
- [ ] Cada trabajador ve sus retiros; los jefes ven los de su área.
- [ ] Accesos rápidos en el chat.
- [ ] Ajustes de recordatorios para administración.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
