# Brief 34bp_fix: cuenta en Ajustes, tests borrados, foto o PDF y descarga del archivo

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; app de Android con Capacitor). Trabaja sobre la rama `feat/pwa-fotos-de-recibos` (commit `0ba3a61`, Brief 34bp). No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 34b_fix del motor: `C:\laragon\www\UaldoBusiness\docs\briefs\34b_fix_clave-duplicada-modelo-y-documentos.md`. Ese brief añade el `error_code` `duplicate` y el campo `duplicate_of_id`.

**Por qué.** La auditoría del 34bp encontró estos problemas:

1. **Ajustes cambió de comportamiento.** El brief pedía partir `SettingsView.jsx` "sin cambiar el comportamiento", pero se reescribió la sección de cuenta:
   - **El botón "Salir" puede no cerrar la sesión.** `handleLogout` llama a `logout()`, que es asíncrona, sin `await`, y recarga la página enseguida. La recarga corta la petición `/logout`, y `clearAuthSession()` (en el `finally`) puede no llegar a correr. El token sigue en el teléfono y en el servidor.
   - **Datos inventados.** Cuando falta un dato, la cuenta muestra "Usuario Ualdo", "admin@ualdo.app", "Negocio Principal" y "Administrador". Así, alguien de cocina sin cargo cargado aparece como "Administrador". Esto contradice la regla del Brief 41p: nunca datos inventados.
   - **Cuenta sin sesión.** La tarjeta de cuenta se muestra aunque no haya sesión. Antes decía "No hay sesión activa. Ingresa desde el módulo correspondiente.".
   - **Color fijo** nuevo, `rgba(0,115,127,0.2)`.
   - **Texto cambiado sin pedirlo:** "Restablecer Datos Locales" pasó a "Limpiar Todos los Datos Locales".
2. **Tests borrados.** En `src/services/__tests__/purchaseDocumentsClient.test.js` se eliminaron tres tests existentes del 34ap y del 34a_fix:
   - "envía source_index solo en las líneas de la factura y conserva la compra";
   - "valida proveedor, líneas y datos obligatorios antes de la red";
   - el `describe('uploadFile')` con "usa FormData, mantiene el token y no fija Content-Type".
3. **En Android no se puede elegir un PDF.** Con `capture="environment"`, Android abre la cámara directamente y no deja elegir un archivo. El error venía del brief 34bp, no de la construcción.
4. **La descarga se salta `apiClient`.** `invoiceFileBlob` usa `fetch` directo: no tiene tiempo máximo, no maneja el `401` (sesión vencida) y repite la lógica de URL y token. La regla del repo es "todo por `apiClient`".
5. **Clave duplicada.** El motor ahora puede devolver `failed` con `duplicate`, y la app no tiene mensaje para ese caso.

**Lee primero:**
- `docs/ualdo-brand.md` y `docs/briefs/34bp_pwa-fotos-de-recibos.md`.
- `docs/briefs/41p_*.md` (regla de no inventar datos).
- `git show main:src/components/SettingsView.jsx` (versión anterior de la cuenta).
- `git show main:src/services/__tests__/purchaseDocumentsClient.test.js` (tests borrados).
- `src/services/apiClient.js`, `src/services/purchaseDocumentsClient.js`, `src/components/inventory/purchases/InvoicePhotoButton.jsx`, `src/components/inventory/purchases/InvoiceFilePreview.jsx` y `src/hooks/useInvoiceDocument.js`.

## Objetivo

1. Ajustes vuelve a comportarse como antes del 34bp, partido en componentes de menos de 200 líneas.
2. Los tests borrados vuelven.
3. En Android se puede tomar una foto o elegir una foto o un PDF.
4. La descarga del archivo pasa por `apiClient`.
5. Una factura repetida muestra un mensaje claro.

## Requerimientos

### A. Cuenta en Ajustes (HIGH)

1. Mueve la sección de cuenta a `src/components/settings/AccountSection.jsx` y conserva el comportamiento de `main`:
   - sin sesión, muestra "No hay sesión activa. Ingresa desde el módulo correspondiente.";
   - con sesión, muestra nombre, negocio y correo **reales**, sin valores inventados de respaldo. Si falta un dato, no muestres esa línea;
   - el botón dice "Cerrar sesión".
2. Cerrar sesión pide confirmación dentro de la tarjeta, sin `confirm()`:
   - el primer toque muestra "¿Cerrar sesión?" con los botones "Sí, cerrar" y "Cancelar";
   - al confirmar: `await logout()` y después `window.location.reload()`;
   - mientras tanto el botón queda deshabilitado.
3. Quita la línea de cargo con "Administrador" de respaldo. Si el usuario tiene `role_title`, puedes mostrarlo; si no, no muestres nada.
4. Colores solo con variables CSS: elimina `rgba(0,115,127,0.2)`.
5. Devuelve el texto "Restablecer Datos Locales" en `AdvancedSettingsSection.jsx`.
6. Deja el título y la descripción de la cabecera como en `main`: "Ajustes" y "Configuración de cuenta, apariencia y preferencias del sistema.".

### B. Tests borrados (MEDIUM)

7. Restituye en `purchaseDocumentsClient.test.js` los tres tests eliminados, con sus aserciones originales, junto a los nuevos.
   - Si alguno ya no aplica, explica en el commit por qué. No lo borres en silencio.

### C. Foto o PDF en Android (MEDIUM)

8. En `InvoicePhotoButton.jsx`, crea dos botones que compartan el mismo manejador de archivo (DRY):
   - "Tomar foto": `<input type="file" accept="image/*" capture="environment">`.
   - "Elegir foto o PDF": `<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf">`, sin `capture`.
9. Deja el componente por debajo de 200 líneas.
10. Ajusta los tests: los dos inputs existen y solo el de foto tiene `capture`.

### D. Descarga por `apiClient` (MEDIUM)

11. Crea `requestBlob(path, { timeout = 30000 } = {})` en `src/services/apiClient.js`:
    - reutiliza la URL base, el token en la cabecera `Authorization` y el manejo del `401` de `request` (extrae una ayuda común; no copies el bloque);
    - aplica un tiempo máximo con `AbortController`;
    - devuelve `{ ok, status, blob, error }`.
12. `invoiceFileBlob` usa `requestBlob` y deja de importar `getApiBaseUrl` y `getAuthToken`.
13. El token nunca va en la URL.

### E. Clave duplicada (MEDIUM)

14. En `INVOICE_ERROR_MESSAGES` (`useInvoiceDocument.js`), añade `duplicate`: "Esta factura ya se cargó antes.".
15. Si el documento trae `duplicate_of_id`, `InvoiceReview` muestra el botón "Ver la factura cargada", que abre ese documento con el mismo flujo de `openInvoice`.
16. Deja también la opción "Cargar la compra a mano".

### F. Prueba manual en Android

17. Con el APK de prueba, comprueba y anota el resultado en el mensaje del commit:
    - tomar una foto;
    - elegir un PDF;
    - ver la vista previa de la foto;
    - "Ver PDF".
18. Si "Ver PDF" no abre en el WebView de Capacitor, anótalo. No lo arregles en este brief.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`.
  - **Conserva las tildes**: revisa el diff de las líneas borradas contra las añadidas.
  - Colores solo con variables CSS.
- Nunca datos inventados en pantalla (regla del 41p).
- Sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.
- Seguridad: sin token en URLs; la vista previa usa `URL.createObjectURL` y la libera.
- Diseño: componentes de menos de 200 líneas (`wc -l`), funciones de menos de 50, DRY.
- Los mocks usan la forma real de la respuesta del motor (`{ data: ... }`).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- **`AccountSection`:**
  - sin sesión muestra el texto de "No hay sesión activa";
  - con sesión muestra los datos reales y ningún texto de respaldo inventado;
  - cerrar sesión pide confirmación y llama a `logout` antes de recargar (con un mock que resuelve más tarde, la recarga ocurre después).
- **`purchaseDocumentsClient.test.js`:** los tres tests restituidos pasan.
- **`requestBlob`:**
  - devuelve el blob con `Authorization` en la cabecera;
  - un `401` dispara `ualdo:unauthorized`;
  - el tiempo máximo aborta la petición.
- **`InvoicePhotoButton`:** dos inputs, y solo el de foto con `capture`.
- **`duplicate`:** muestra su mensaje y el botón "Ver la factura cargada".
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El primer comando debe mostrar `feat/pwa-fotos-de-recibos`.

## Criterios de aceptación

- [ ] "Cerrar sesión" espera a `logout()` antes de recargar y pide confirmación sin `confirm()`.
- [ ] La cuenta no muestra datos inventados y, sin sesión, muestra el aviso de `main`.
- [ ] Los tres tests borrados volvieron y pasan.
- [ ] En Android se puede tomar una foto y también elegir una foto o un PDF.
- [ ] `invoiceFileBlob` usa `requestBlob` de `apiClient`, con tiempo máximo y manejo del `401`.
- [ ] `duplicate` tiene su mensaje y el enlace a la factura original.
- [ ] Lint, tests y build en verde; cero emojis; tildes conservadas; sin colores fijos.
