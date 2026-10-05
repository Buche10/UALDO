# Brief 09: PWA UALDO — chat del asistente del restaurante y cierre de huecos de seguridad

## Contexto

**Repos:**
- `C:\laragon\www\UALDO`: PWA (React 18 + Vite 5, Capacitor 8 para Android, `lucide-react`,
  `@fontsource/poppins`). Rama `feat/connect-engine`. **No tiene tests ni linter.**
- `C:\laragon\www\UaldoBusiness`: motor. Rama `feat/restaurant-assistant` (Briefs 06 a 08 con commit). Solo dos
  ajustes menores (Parte D).

**Arquitectura decidida (no negociable):**
- **UaldoBusiness es la única fuente de verdad y la PWA es un cliente delgado.** La PWA **no** se comunica
  directamente con RunFood (el PC del local), porque esa conexión pasa por el motor y su agente.
- La interfaz principal del restaurante es **un chat conversacional** contra `POST /api/v1/assistant/chat`,
  igual para el dueño y el personal. El motor decide qué puede hacer cada rol.
- Toda escritura (crear, cancelar, aprobar o marcar pedidos) la propone el asistente y **el usuario la confirma
  con un botón**. La confirmación llega por `POST /api/v1/assistant/approve` o se cancela con
  `POST /api/v1/assistant/cancel`.

**Contrato del motor (ya implementado):**
- `POST /assistant/chat` con `{message}` (máximo 1000 caracteres). Responde 200
  `{reply: string, pending_actions: [{token, action, summary, expires_at}], pending_action?: {...}}`. El campo
  singular `pending_action` es legacy: usa siempre el arreglo. Responde 429 si se superan 20 mensajes por minuto.
  El historial lo guarda el servidor.
- `POST /assistant/approve` con `{token}`:
  - 200 `{success: true, message, result}` (`result` es un texto como "Pedido #12 creado: carne molida 5 kg (urgente).").
  - 409 `{success: false, message}` si el estado cambió.
  - 400 `{success: false, message}` si el token expiró, ya se usó, no hay permiso o el registro no existe.
- `POST /assistant/cancel` con `{token}`.
- `GET /me` devuelve el usuario con su `role` (`owner`, `staff`, `receptionist` o `doctor`) y su negocio.
- Autenticación: Bearer de Sanctum (ya implementada en `src/services/apiClient.js`, que limpia la sesión ante un 401).

**Problemas encontrados al revisar la PWA:**
1. **CRITICAL: login falso.** `src/services/auth.js`:
   - Acepta las credenciales fijas `admin@doblefilo.com` / `admin123` o `password` sin consultar al servidor.
   - **Ante cualquier login fallido** (contraseña incorrecta incluida, por la condición `!result.ok`) crea una
     sesión local como "Administrador" con un token falso.
   - Combinado con el punto 2, cualquiera con la app en el WiFi del local puede "entrar" con una contraseña
     equivocada y escribir en el punto de venta.
2. **CRITICAL: escrituras directas al POS.** `src/services/aiEngine.js`, `appEcosystem.js` y `doblefiloEngine.js`
   hablan directamente con RunFood en la LAN (`192.168.100.10:1000`). El chat tiene rutas locales (simulación
   offline con regex y Ollama) que **crean comandas** (`doblefilo_create_order`) y **cambian el número de mesas**
   (`doblefilo_set_tables_count`) sin pasar por el motor, sin autorización, sin auditoría y sin las reglas del
   asistente.
3. **HIGH: la URL de la API se puede cambiar desde la app.** `SettingsView.jsx` permite modificar `apiBaseUrl`
   desde la interfaz. En un teléfono del personal, eso permite redirigir el token Bearer a cualquier servidor.
4. **MEDIUM:** el chat (`ChatView.jsx`) usa el endpoint legacy `/admin/chat`, lee solo `pending_action`
   (singular) y ofrece atajos de dueño a todos los usuarios ("Eliminar item", "Actualizar precio", "Horario").
   Además, usa `alert()` para los errores.
5. **Marca:** hay emojis en todo el chat y en las respuestas locales (prohibido por la regla de cero emojis).
6. **Repo:** la rama tiene muchos cambios sin commit, y `.env.local`, `android/` y `tasks/` no están en `.gitignore`.

**Lee primero:**
- `docs/ualdo-brand.md` (paleta vía variables CSS, Poppins, logo oficial, botones pastilla, tono, consentimiento LOPDP).
- `src/App.jsx` (pestañas y la sesión), `src/components/ChatView.jsx`, `src/services/apiClient.js`,
  `src/services/auth.js`, `src/services/aiEngine.js`, `src/services/storage.js`,
  `src/components/SettingsView.jsx` y `src/styles/main.css`.
- En UaldoBusiness: `docs/PRIVACIDAD-asistente.md` (de ahí sale el texto del aviso al personal) y `docs/API-supply-requests.md`.

## Objetivo

Que la pestaña "Asistente" de la PWA sea el chat del restaurante contra el motor: mensajes, sugerencias según el
rol, tarjetas de confirmación por cada acción pendiente y aviso de privacidad. Además, que la PWA deje de aceptar
logins falsos y de escribir directamente en RunFood, y que no permita redirigir el token en producción.

## Requerimientos

### Parte 0: base limpia (antes de tocar código)

1. En `UALDO/.gitignore`, agrega `.env.local`, `.env.*.local`, `android/app/build/`, `android/.gradle/`,
   `android/build/`, `tasks/` y `*.jks`.
2. Haz commit del estado actual de la rama (mensaje `chore: baseline before brief 09`), **sin** `.env.local` ni
   artefactos de build. Así la auditoría ve solo el diff de este brief.

### Parte A: seguridad (lo primero)

3. **`src/services/auth.js`:**
   - Elimina las credenciales demo y la sesión local de respaldo. `login` solo tiene éxito con un 200 del
     servidor que traiga `token`.
   - Ante un error de red, el mensaje es "No hay conexión con Ualdo. Revisa tu internet e intenta de nuevo."
   - Ante credenciales inválidas: "Correo o contraseña incorrectos."
   - Nunca se crea un token local. Después del login, llama a `fetchMe()` y guarda el usuario (con su `role`) que
     devuelve el servidor.
4. **Sin escrituras directas a RunFood:**
   - En `aiEngine.js` elimina las rutas locales del chat (simulación offline con regex, Ollama y
     `executeLocalTool`).
   - En `appEcosystem.js` elimina los tools `doblefilo_create_order` y `doblefilo_set_tables_count` (y cualquier
     otro que haga `POST`, `PUT` o `DELETE` a RunFood).
   - Las vistas que solo **leen** de RunFood (por ejemplo, el estado de mesas en `DobleFiloCard`) pueden seguir
     por ahora, pero solo con `GET` y marcadas con un comentario `// TODO(migrar-a-motor)`.
   - Documenta en el resumen final qué funciones se eliminaron y cuáles quedan en solo lectura.
5. **Configuración de la API:**
   - `apiBaseUrl` sale **solo** de `import.meta.env.VITE_API_BASE_URL` en builds de producción.
   - El campo editable en `SettingsView` se muestra únicamente cuando `import.meta.env.DEV` es verdadero.
   - En producción, `storage.getSettings()` ignora cualquier `apiBaseUrl` guardado en localStorage.
   - Rechaza URLs que no sean `https://` en producción.
6. Al cerrar sesión (y ante el evento `ualdo:unauthorized`), borra la conversación guardada localmente del
   usuario y el aviso de privacidad aceptado en caché.

### Parte B: chat del asistente

7. **Servicio `src/services/assistantClient.js`:** funciones `sendMessage(text)`, `approveAction(token)` y
   `cancelAction(token)` sobre `request()`.
   - Normaliza las respuestas a `{ok, reply, pendingActions, message, status}`.
   - Mapea 429 a "Estás enviando mensajes muy rápido. Espera un momento.", 409 al `message` del servidor y los
     errores de red a un mensaje claro.
   - Timeout de 30 s para el chat. Sin `console.log`.
8. **Vista** (reemplaza a `ChatView.jsx` en la pestaña `asistente`; separa en componentes pequeños):
   - `src/components/assistant/AssistantChat.jsx`: contenedor con la lista, la entrada y el estado.
   - `MessageBubble.jsx`: texto plano con `white-space: pre-wrap`. **Nunca** `dangerouslySetInnerHTML`.
   - `PendingActionCard.jsx`: una tarjeta por cada elemento de `pendingActions`, con el `summary` del servidor, la
     expiración relativa ("vence en 14 min") y los botones pastilla **Confirmar** y **Cancelar**.
     - Mientras se procesa, ambos botones se deshabilitan; un doble toque no envía dos confirmaciones.
     - Al terminar, la tarjeta cambia a un estado final: "Hecho: <result>", "No se pudo: <message>",
       "Cancelado" o "Vencido" (si pasó `expires_at`, sin llamar al servidor).
   - `SuggestionChips.jsx`: atajos según el rol leído del usuario guardado.
     - `staff`: "Pedir insumos", "Mis pedidos", "Buscar un insumo".
     - `owner`: "Pedidos por aprobar", "Lista de compras", "Pedir insumos".
     - Sin emojis; iconos solo de `lucide-react` (SVG).
   - `PrivacyNotice.jsx`: la primera vez que el usuario abre el asistente, muestra el aviso (texto de
     `docs/PRIVACIDAD-asistente.md` de UaldoBusiness, sección del aviso al personal) con el botón "Entendido".
     Guarda la aceptación en localStorage con la clave `ualdo_privacy_ack_<userId>_v1`. Si el aviso cambia de
     versión, se vuelve a mostrar.
   - **Entrada:**
     - Límite de 1000 caracteres, con un contador visible desde los 900.
     - Enviar está deshabilitado si el texto está vacío o hay un envío en curso.
     - La entrada por voz (Web Speech API) se mantiene si existe, sin `alert()`: si no hay soporte, el botón no
       se muestra.
   - **Estados:** "Escribiendo..." mientras espera; errores en línea (no `alert`) con el botón "Reintentar"; sin
     conexión, un banner "Sin conexión con Ualdo".
   - **Persistencia local:** los últimos 50 mensajes por usuario en localStorage con la clave
     `ualdo_chat_<userId>`, en try/catch, solo como comodidad (el servidor guarda el historial real). Las
     tarjetas pendientes **no** se restauran como accionables tras recargar: se muestran como "Vencido o ya
     procesado".
9. **Marca:**
   - Colores solo vía las variables CSS existentes (si falta alguna, agrégala en `:root` según
     `docs/ualdo-brand.md`), tipografía Poppins y botones pastilla.
   - Estilos en `src/styles/assistant.css`, importado una vez, **sin estilos inline** nuevos.
   - Accesibilidad: botones con `aria-label`, la lista de mensajes con `aria-live="polite"`, contraste AA y
     objetivos táctiles de al menos 44 px.
   - Debe verse bien a 360 px de ancho, sin scroll horizontal.
10. **Limpieza de emojis:** elimina **todos** los emojis de los archivos que toques en este brief (textos, mensajes
    y comentarios). El resto del repo se limpiará en otro brief; lístalos en el resumen.

### Parte C: tests (nuevo en el repo)

11. Agrega `vitest`, `@testing-library/react`, `@testing-library/user-event` y `jsdom` como devDependencies
    (justificación: el repo no tiene tests). Agrega los scripts `"test": "vitest run"` y
    `"test:coverage": "vitest run --coverage"` (con `@vitest/coverage-v8`).
12. Los tests, en `src/**/__tests__/`, mockean `fetch` (sin red real):
    - **`auth.test.js`:** credenciales demo, rechazadas. Un 401 del servidor no crea sesión ni token. Un error de
      red no crea sesión. Un 200 guarda el token y el usuario de `/me`.
    - **`assistantClient.test.js`:** normaliza `pending_actions`; mapea 429, 409, 400 y el error de red.
    - **`PendingActionCard.test.jsx`:**
      - Confirmar llama a approve una sola vez aunque se haga doble clic.
      - Un 409 muestra el mensaje del servidor.
      - Al vencer `expires_at` se muestra "Vencido" sin llamar al servidor.
      - Cancelar llama a cancel.
    - **`AssistantChat.test.jsx`:**
      - Enviar muestra "Escribiendo..." y luego la respuesta.
      - Las tarjetas se renderizan según `pending_actions`.
      - Los atajos de `staff` no incluyen "Lista de compras".
      - Una respuesta con `<script>` se muestra como texto.
      - El aviso de privacidad se muestra una vez por usuario.
    - **`storage.test.js`:** en producción simulada, ignora `apiBaseUrl` de localStorage y rechaza `http://`.
    - **Guardia:** un test que recorre `src/services` y falla si encuentra `doblefilo_create_order`,
      `doblefilo_set_tables_count`, `admin123` o `demo-token`.
    - Cobertura de al menos 80 % en `src/services/assistantClient.js`, `src/services/auth.js` y `src/components/assistant/`.

### Parte D: UaldoBusiness (observaciones de la auditoría del Brief 08)

13. En `tests/Feature/TelegramNutgramIntegrationTest.php` y `tests/Feature/TelegramStaffInventoryFlowTest.php`,
    vuelve a la aserción estricta: `assertSame('executed', ...)`.
14. En `database/seeders/AssistantEvalSeeder.php`, al inicio: si `app()->isProduction()`, lanza una excepción
    ("AssistantEvalSeeder no puede ejecutarse en produccion."). Agrega un test que lo verifique.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md` (paleta vía variables CSS, Poppins, logo oficial, botones pastilla, tono, consentimiento LOPDP).
- Sigue las convenciones existentes del repo (componentes funcionales, servicios en `src/services`, `request()` de `apiClient`).
- **Seguridad:**
  - No hay sesiones locales sin servidor ni credenciales en el código.
  - No hay llamadas de escritura directas a RunFood.
  - La URL de la API es fija en producción.
  - Nada de `dangerouslySetInnerHTML`; todo texto del servidor se muestra como texto.
  - El token solo viaja a la API configurada.
  - Ningún secreto en el repo.
- **Rendimiento:** la lista de mensajes se limita a 50 en memoria y en almacenamiento, y no se re-renderiza toda la lista al escribir (el estado de la entrada va separado de la lista).
- Diseño: componentes pequeños (menos de 200 líneas cada uno), funciones de menos de 50 líneas, inmutabilidad en el estado (sin mutar arreglos), sin anidación de más de 4 niveles, manejo explícito de errores. Sin `console.log` en el código nuevo.
- No cambies los contratos del motor. Fuera de la Parte D, no toques UaldoBusiness. No toques NexoTeams. Las pestañas "Trabajo" e "Inventario" (que apuntan a NexoTeams) quedan como están; su migración es otro brief.

## Tests

Ver la Parte C. Comandos:

```
npm test
npm run test:coverage
```

En UaldoBusiness: `vendor/bin/pest`.

## Verificación final

En `C:\laragon\www\UALDO`:

```
npm ci
npm test
npm run test:coverage
npm run build
git status --short
```

En `C:\laragon\www\UaldoBusiness`:

```
vendor/bin/pint --test
vendor/bin/phpstan analyse --memory-limit=1G
vendor/bin/pest
```

**Verificación manual** (`npm run dev` con el motor local):
- Inicia sesión con un usuario `staff`. Pide "falta carne molida 5 kilos urgente", confirma la tarjeta y comprueba
  que aparece "Hecho: Pedido #N creado...".
- Inicia sesión como `owner` y aprueba ese pedido desde el chat.
- Revisa la vista a 360 px de ancho.

## Criterios de aceptación

- [ ] Un login con contraseña incorrecta o sin conexión **no** crea sesión; no quedan credenciales demo.
- [ ] La PWA no escribe directamente en RunFood (verificado por el test de guardia y por el diff).
- [ ] En producción la URL de la API es fija, solo `https`, y no se puede cambiar desde la app.
- [ ] El chat usa `/assistant/chat` y muestra una tarjeta por cada `pending_action`, con confirmación de un solo envío y estados finales claros (hecho, no se pudo, cancelado, vencido).
- [ ] Los atajos dependen del rol del usuario devuelto por el servidor.
- [ ] El aviso de privacidad se muestra una vez por usuario y por versión.
- [ ] Las respuestas del servidor se muestran como texto plano (sin inyección HTML).
- [ ] Sin `alert()`, sin `console.log` y sin emojis en los archivos tocados; marca aplicada vía variables CSS; usable a 360 px.
- [ ] Tests de la Parte C en verde, con cobertura de al menos 80 % en los módulos nuevos o tocados.
- [ ] Parte D hecha: asserts estrictos y seeder bloqueado en producción.
- [ ] `npm run build` y la suite de UaldoBusiness en verde; Pint y PHPStan sin errores.
