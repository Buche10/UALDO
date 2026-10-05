# Brief 10 (corrección): PWA — eliminar el flujo de comandas directas, emojis y reutilización del token

## Contexto

**Repo:** `C:\laragon\www\UALDO` (React 18 + Vite 5, Vitest ya configurado). Rama `feat/connect-engine`; el
Brief 09 tiene commit `7e27e09`. Lee primero `docs/briefs/09_pwa-chat-asistente-y-seguridad.md` y
`docs/ualdo-brand.md`.

**Auditoría del Brief 09: RECHAZADO.** Lo principal quedó bien:
- El login solo funciona con el servidor y ya no hay credenciales demo.
- El chat usa `/assistant/chat` con tarjetas de confirmación de un solo envío y estados finales.
- Los atajos dependen del rol y el aviso de privacidad se muestra por usuario y versión.
- Las respuestas se muestran como texto plano.
- La URL de la API es fija y en HTTPS en producción.
- Hay 37 tests en verde con 91 % de líneas cubiertas, y el build pasa.
- La Parte D en UaldoBusiness está hecha (commit `ce8d81f`).

Quedan estos problemas:

1. **HIGH: referencia rota y escritura al POS todavía en el código.** En `src/components/DobleFiloCard.jsx` se
   quitó el import de `createDoblefiloOrder`, pero `handleSendOrder` (línea 143) **todavía lo llama**. Al enviar
   una comanda desde la pestaña Mesas, la app lanza `ReferenceError` y se rompe. El build no lo detecta porque
   el repo no tiene linter. Además, `src/services/doblefiloEngine.js` sigue exportando `createDoblefiloOrder`
   (con `addOneItemToOrder` y el puente `http://<host>:4000/api/add-item`) y `setDoblefiloTablesCount`. La
   capacidad de escribir comandas sigue en el código, a un import de distancia. El test de guardia solo busca
   los nombres de los tools, no estas funciones, y solo revisa `src/services`.
2. **HIGH: emojis en archivos tocados por el brief:** `src/components/DobleFiloCard.jsx` (6) y
   `src/components/SettingsView.jsx` (2). Además, `src/components/ChatView.jsx` quedó como **código muerto**
   (nadie lo importa), con emojis y con la ruta legacy `/admin/chat`. Hay emojis también en otros componentes
   no tocados.
3. **MEDIUM: el token de UaldoBusiness se reutiliza en NexoTeams.** `auth.js` copia el token de Sanctum de
   UaldoBusiness a `teams_token`, y `teamsClient.js` lo envía a NexoTeams (otro backend). El token de un sistema
   no debe viajar a otro. `teamsClient.js` ya tiene su propio `teamsLogin`.
4. **LOW:**
   - Quedan 4 estilos inline en `src/components/assistant/*.jsx` (el brief pedía cero).
   - `AssistantChat.jsx` tiene 296 líneas (el brief pedía menos de 200 por componente).
   - La cobertura de ramas de `auth.js` es de 48 %.
5. **Fuera de alcance, para el brief de migración:** `DobleFiloCard` también escribe en la app de bodega de Vercel
   (`updateVercelStock`) y ejecuta el cierre de caja local (`executeDoblefiloCashClose`) sin pasar por el motor.
   No se toca aquí, pero hay que listarlo en el resumen final.

## Objetivo

Que en la PWA no quede ningún camino de escritura directa a RunFood ni referencias rotas, que no queden emojis en
`src/`, que el token de UaldoBusiness solo viaje a UaldoBusiness, y que un linter detecte en adelante los
identificadores no definidos.

## Requerimientos

1. **Eliminar el flujo de comandas directas:**
   - En `DobleFiloCard.jsx`, elimina `handleSendOrder`, el carrito (`orderCart` y sus handlers), el modal de
     pedido y los botones que lo abren. La vista de mesas queda en **solo lectura**, con el texto "Las comandas se
     registran en el punto de venta." (sin emojis).
   - En `doblefiloEngine.js`, elimina `createDoblefiloOrder`, `addOneItemToOrder`, `setDoblefiloTablesCount` y
     cualquier constante del puente `:4000/api/add-item`. Si `resolveRunfoodArticle` queda sin uso, elimínalo
     también.
   - Verifica con búsqueda que no queden referencias.
2. **Linter** (devDependencies justificadas: el build no detecta identificadores indefinidos): agrega `eslint`
   (configuración plana), `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks` y `globals`.
   - Reglas mínimas: `no-undef: error`, `no-unused-vars: warn`, `react/jsx-no-undef: error`,
     `react-hooks/rules-of-hooks: error` y `no-console: ["error", { "allow": ["warn", "error"] }]`.
   - Script `"lint": "eslint src"`. Debe terminar **sin errores** (los warnings se pueden listar en el resumen).
3. **Test de guardia ampliado** (`src/services/__tests__/securityGuard.test.js`): recorre **todo `src/`**,
   recursivamente, excluyendo `__tests__`, y falla si encuentra:
   - `createDoblefiloOrder`, `setDoblefiloTablesCount`, `/api/add-item`, `doblefilo_create_order`,
     `doblefilo_set_tables_count`, `admin123`, `demo-token` o `dangerouslySetInnerHTML`.
   - Cualquier emoji (regex de rangos Unicode `\u{1F000}-\u{1FAFF}`, `\u{2600}-\u{27BF}`, `\u{2B00}-\u{2BFF}`,
     `\u{FE0F}`, `\u{200D}`, con la bandera `u`).
4. **Emojis:** elimina **todos** los emojis de `src/`. Reemplázalos por texto o, si un icono aporta, por un icono
   de `lucide-react`. Elimina `src/components/ChatView.jsx` (código muerto).
5. **Token por sistema:**
   - En `auth.js`, deja de escribir `teams_token` y `teams_user` con los datos de UaldoBusiness.
   - La pestaña Trabajo usa su propio `teamsLogin` (ya existe en `teamsClient.js`). Si no hay sesión de
     NexoTeams, muestra un formulario de acceso a "Ualdo Teams" dentro de la pestaña, sin bloquear el resto de la app.
   - `logout` sigue limpiando las dos sesiones.
   - Agrega un test: después del login en UaldoBusiness, `localStorage.teams_token` sigue vacío.
6. **LOW:**
   - Mueve los 4 estilos inline de `src/components/assistant/` a `src/styles/assistant.css`.
   - Divide `AssistantChat.jsx` en un hook `useAssistantConversation.js` (estado, envío, persistencia) y el
     componente de presentación, cada uno de menos de 200 líneas.
   - Agrega tests de `auth.js` para las ramas faltantes (falla de `/me` tras el login, logout con error de red y
     limpieza ante un 401) hasta llegar a 80 % de ramas en ese archivo.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono).
- Seguridad:
  - No hay escrituras directas a RunFood.
  - El token de cada backend viaja solo a ese backend.
  - Sin credenciales ni tokens en el código.
  - Sin `dangerouslySetInnerHTML`.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50 líneas, estado inmutable, sin `console.log`.
- No toques los contratos del motor, UaldoBusiness ni NexoTeams. Las escrituras a Vercel y el cierre de caja local (punto 5 del Contexto) quedan para el brief de migración: solo lístalos.

## Tests

- El guardia ampliado (punto 3) y el test de token por sistema (punto 5).
- Tests de `auth.js` hasta llegar a 80 % de ramas.
- Un test de `DobleFiloCard` que renderiza la vista de mesas en solo lectura y verifica que no exista un botón de "Enviar pedido".
- La suite completa en verde.

## Verificación final

En `C:\laragon\www\UALDO`:

```
npm ci
npm run lint
npm test
npm run test:coverage
npm run build
git status --short
```

## Criterios de aceptación

- [ ] No existe en `src/` ningún camino de escritura a RunFood ni referencias a las funciones eliminadas; la pestaña Mesas funciona en solo lectura, sin errores en consola.
- [ ] `npm run lint` termina sin errores, con `no-undef` y `react/jsx-no-undef` activos.
- [ ] Cero emojis en `src/` (verificado por el test de guardia) y `ChatView.jsx` eliminado.
- [ ] El token de UaldoBusiness nunca se guarda como `teams_token`; Trabajo usa su propio login.
- [ ] Componentes del asistente sin estilos inline y de menos de 200 líneas; `auth.js` con al menos 80 % de ramas.
- [ ] El resumen lista las escrituras restantes a Vercel y al cierre local, pendientes de migrar al motor.
- [ ] Tests, cobertura y build en verde.
