# Brief 42p: el chat como inicio, adjuntar en el chat, tarjetas y permiso de cámara

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; app de Android con Capacitor 8). Crea la rama `feat/pwa-chat-al-inicio` desde `main` con el Brief 41p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** en el motor los Briefs 42 (herramientas que faltan) y 43 (adjuntos y tarjetas): `C:\laragon\www\UaldoBusiness\docs\briefs\42_chat-herramientas-que-faltan.md`, `C:\laragon\www\UaldoBusiness\docs\briefs\43_chat-adjuntos-y-tarjetas.md` y el contrato del chat en `C:\laragon\www\UaldoBusiness\docs\API-cash-sheets-y-chat.md`.

**Por qué.** Decisión del dueño del 2026-11-02, al probar la app 1.1.0 en su teléfono: hay demasiados menús. Todo debe poder hacerse **por el chat**, que pasa a ser la pantalla de inicio. Los menús quedan como respaldo en "Más".

Además, al probar el escáner de la clave del SRI, la app dijo "No se pudo abrir la cámara. Revisa el permiso e inténtalo otra vez." La causa: `android/app/src/main/AndroidManifest.xml` solo declara `INTERNET`. Sin el permiso `CAMERA`, el WebView de Android no puede abrir la cámara, ni para escanear ni para tomar fotos.

Hoy la barra inferior tiene Trabajo, Negocios, Asistente y Ajustes, y la app abre en Trabajo (`src/App.jsx`, `useState('trabajo')`).

**Lee primero:**
- `docs/ualdo-brand.md`.
- `src/App.jsx`, `src/components/BottomNav.jsx`, `src/components/EcosystemView.jsx` y `src/components/modules/moduleRegistry.js`.
- `src/components/assistant/*` (`AssistantChat.jsx`, `MessageBubble.jsx`, `PendingActionCard.jsx`, `SuggestionChips.jsx`, `useAssistantConversation.js`) y `src/services/assistantClient.js`.
- `src/services/apiClient.js` (`uploadFile`), `src/components/inventory/purchases/InvoiceBarcodeScanner.jsx` (escáner del 34ap) y `src/services/purchaseDocumentsClient.js` (validación de la clave).
- `docs/runbooks/RUNBOOK-publicacion-android.md` y `android/app/src/main/AndroidManifest.xml`.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`; los mocks de los tests usan la forma real de las respuestas del motor.

## Objetivo

La app abre en el chat. Desde el chat se adjunta una foto, el XML de una factura o se escanea la clave del SRI. Las respuestas con listas se ven como tarjetas, con botones de respuesta rápida. La cámara funciona en Android. Los menús siguen disponibles en "Más".

## Requerimientos

### A. Navegación

1. La barra inferior queda con tres pestañas, en este orden: **Ualdo** (el chat, icono del asistente), **Más** y **Ajustes**. La app abre en **Ualdo**.
2. **Más** muestra lo que hoy está en Negocios (la tarjeta del restaurante y los módulos) y, debajo, el acceso a Trabajo (Ualdo Teams), solo si el usuario lo tiene hoy. Encabezado: "Más herramientas", con el texto "Todo esto también lo puedes pedir en el chat."
3. Los avisos que hoy abren una pantalla de Negocios (`notificationRoutes.js`) siguen abriendo esa pantalla, dentro de **Más**. Los que abren el chat lo abren en **Ualdo**.
4. Los atajos que hoy cambian a la pestaña Asistente pasan a **Ualdo**.

### B. Adjuntar en el chat

5. En la barra de escritura, un botón de clip (`Paperclip`) abre tres opciones:
   - **Tomar foto:** `<input type="file" accept="image/*" capture="environment">`.
   - **Foto o archivo:** `accept="image/*,application/pdf,.xml,text/xml,application/xml"`.
   - **Escanear clave del SRI:** reutiliza `InvoiceBarcodeScanner`. La clave leída se valida con la función de `purchaseDocumentsClient.js` y se envía como mensaje ("Carga la factura con la clave {clave}").
6. Cliente en `src/services/assistantClient.js`:
   - `uploadChatAttachment(file)`: `POST /assistant/attachments` con `uploadFile`. Valida antes de subir los tipos y tamaños del Brief 43 (XML hasta 1 MB, imagen hasta 8 MB, PDF hasta 10 MB).
   - `sendMessage(message, attachmentIds)`: envía `attachment_ids` cuando hay adjuntos.
7. Las imágenes de más de 2000 px de lado se reducen en el navegador con `canvas` (calidad 0,85) antes de subir.
8. Los adjuntos pendientes se muestran como fichas sobre la barra de escritura (nombre corto, tipo, botón para quitar), hasta 3. Si solo hay adjunto y no hay texto, se envía "Te adjunto un archivo." En la conversación, el mensaje de la persona muestra los adjuntos que llevaba.

### C. Tarjetas y respuestas rápidas

9. `src/components/assistant/ChatCard.jsx` dibuja los tipos `list`, `table` y `stat` del Brief 43, con variables CSS de la marca. En el teléfono, una `table` se muestra como lista de filas apiladas. Solo texto plano. Un tipo desconocido no se dibuja y no rompe la conversación.
10. `quick_replies` se muestran como botones bajo la respuesta; al tocar uno se envía su texto como mensaje y los botones desaparecen.
11. Las tarjetas de aprobación (`PendingActionCard`) siguen como están.

### D. Accesos rápidos por cargo

12. Ajusta `SuggestionChips.jsx` para que muestre hasta 5 accesos según el cargo:
    - **Cocina:** "Voy a la bodega", "Registrar porcionado", "Reportar un problema".
    - **Salón:** "Reservas de hoy", "Reportar un problema".
    - **Jefe de salón:** se agrega "Hacer el cierre de caja".
    - **Bodega:** "Llegó una compra", "Contar el cierre del día".
    - **Administración y dueño:** "Pedidos por aprobar", "Lista de compras", "Resumen del día", "Cargar una factura".

    Conserva los accesos condicionados que ya existen ("Cerrar mi retiro", "¿Qué lote uso?").

### E. Cámara en Android

13. En `android/app/src/main/AndroidManifest.xml`, agrega `<uses-permission android:name="android.permission.CAMERA" />` y `<uses-feature android:name="android.hardware.camera" android:required="false" />`. Comprueba que el WebView de Capacitor pida el permiso en tiempo de ejecución al abrir la cámara (escáner y "Tomar foto"). Si no lo hace, pídelo antes de abrir la cámara con el mecanismo de Capacitor, sin añadir plugins nuevos salvo que sea imprescindible (en ese caso, justifícalo en el resumen).
14. Si el usuario niega el permiso, el mensaje dice cómo activarlo: "Activa el permiso de cámara de Ualdo en Ajustes del teléfono > Aplicaciones > Ualdo > Permisos."

### F. Versión

15. Sube la versión a `1.2.0` en `package.json` (con `npm version 1.2.0 --no-git-tag-version`).

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes. Uso con una mano: botones grandes en la barra de escritura.
- Seguridad: tipo y tamaño validados antes de subir; nada de un archivo se dibuja como HTML; vistas previas con `URL.createObjectURL` liberadas al desmontar; sin token en URLs; la cámara se libera al cerrar el escáner.
- Compatibilidad: si el motor todavía no envía `cards` ni `quick_replies`, el chat funciona igual que hoy.
- Diseño: componentes de menos de 200 líneas (compruébalo con `wc -l`), funciones de menos de 50, DRY (reutiliza el escáner, la validación de la clave y `uploadFile`).
- No añadas dependencias sin justificarlo. No toques archivos fuera del alcance.

## Tests

- La app abre en **Ualdo**; la barra tiene Ualdo, Más y Ajustes; **Más** muestra los módulos y el texto del chat.
- Un aviso que abre una pantalla de Negocios la abre dentro de **Más**.
- Adjuntar: rechaza tipos y tamaños inválidos sin llamar a la red; sube y envía `attachment_ids`; reduce imágenes grandes (con `canvas` simulado); quita un adjunto pendiente.
- Escanear: con un `BarcodeDetector` simulado, envía el mensaje con la clave válida y rechaza una clave inválida.
- Tarjetas: dibuja `list`, `table` y `stat`; ignora un tipo desconocido; las respuestas rápidas envían su texto y desaparecen.
- Accesos rápidos según el cargo.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El lint debe seguir con 0 errores y no más de 47 avisos.

**Prueba manual en Android** (genera el APK con `npm run android:release`, según el runbook):
1. La app abre en el chat.
2. "Tomar foto" pide el permiso de cámara la primera vez y adjunta la foto.
3. "Escanear clave del SRI" abre la cámara y lee el código de barras de un RIDE.
4. Adjuntar el XML de una factura y pedir "cárgala" muestra la tarjeta de aprobación.
5. "Pedidos por aprobar" muestra una tarjeta de lista.

Anota el resultado en la descripción del commit.

## Criterios de aceptación

- [ ] La app abre en el chat; los menús están en "Más".
- [ ] Se adjuntan fotos, XML y PDF, y se escanea la clave del SRI desde el chat.
- [ ] Las tarjetas y las respuestas rápidas se ven bien en el teléfono.
- [ ] La cámara funciona en Android y, si se niega el permiso, la app explica cómo activarlo.
- [ ] Accesos rápidos según el cargo.
- [ ] Versión 1.2.0.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
