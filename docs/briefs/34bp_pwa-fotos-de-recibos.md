# Brief 34bp: subir la foto o el PDF de un recibo

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; empaquetada para Android con Capacitor según el Brief 18p). Crea la rama `feat/pwa-fotos-de-recibos` desde `main` con los Briefs 34ap, 38p_fix, 39p y 40p fusionados. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 34b del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\34b_lectura-de-recibos-con-gemini.md` y `C:\laragon\www\UaldoBusiness\docs\API-purchase-documents.md`.

**Por qué.** El 34ap cubrió las facturas electrónicas del SRI. Quedan las compras sin factura electrónica: notas de venta, recibos del mercado y facturas en papel. El motor ya lee fotos y PDF con Gemini y crea el mismo borrador, con marcas de revisión en todo lo dudoso. La app necesita tomar la foto o elegir el PDF, subirlo y reutilizar la espera y la revisión del 34ap.

**Lee primero:** `docs/ualdo-brand.md`; `docs/briefs/34ap_pwa-facturas-sri.md` y el código que dejó (`uploadFile`, `purchaseDocumentsClient.js`, `useInvoiceDocument.js`, `InvoiceReview.jsx`, `InvoiceReviewLine.jsx`, `InvoiceSriEntry.jsx`); `docs/briefs/18p_pwa-catalogo-y-publicacion-android.md` (permisos de cámara en Android).

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos y cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Desde Compras, administración toma una foto del recibo o elige un PDF. La app lo sube, muestra "Leyendo el recibo" y abre la misma revisión del 34ap, con la imagen o el PDF a la vista para comparar.

## Requerimientos

1. **Cliente.** En `purchaseDocumentsClient.js`, `uploadInvoiceFile(file)`: tipos `image/jpeg`, `image/png`, `image/webp` y `application/pdf`, hasta 10 MB, comprobado antes de subir. `invoiceFileBlob(id)` pide el archivo con el token y devuelve un `Blob`; nunca pone el token en la URL.
2. **Subir** (`InvoicePhotoButton.jsx`, visible con `purchases.manage` en Compras, junto a las opciones del 34ap):
   - `<input type="file" accept="image/*,application/pdf" capture="environment">`, que en Android abre la cámara o la galería.
   - Antes de subir, las imágenes de más de 2000 px de lado se reducen en el navegador con `canvas` (calidad 0,85) para ahorrar datos. Los PDF se suben tal cual.
   - Texto de ayuda corto: "Si es factura electrónica, mejor usa la clave de acceso: los datos salen exactos del SRI."
3. **Esperar.** Reutiliza `useInvoiceDocument.js`, con el texto "Leyendo el recibo" para `source` `image` o `pdf`. Mensajes de `failed` según `error_code`:
   - `unreadable`: "No se pudo leer la foto. Prueba con más luz o sube el PDF."
   - `timeout` y `provider_error`: "No pudimos leer el recibo ahora. Prueba en unos minutos o carga la compra a mano."
   - Siempre con la opción "Cargar la compra a mano".
4. **Revisar.** Reutiliza `InvoiceReview.jsx` y añade arriba la vista previa: la imagen con `URL.createObjectURL` (liberada al desmontar) o un botón "Ver PDF" que abre el `Blob`. Si la cabecera trae "No se pudo confirmar con el SRI.", muéstralo como el resto de motivos.

### Pendientes menores de las auditorías del 38p_fix, 39p y 40p

- `src/components/assets/AssetCountSheet.jsx` tiene exactamente 200 líneas; el límite es menos de 200. Extrae la barra de acciones a `AssetCountSheetActions.jsx`.
- El motivo para usar otro lote admite 300 caracteres en la app (`LOT_REASON_MAX` en `src/services/lotSelection.js`), pero el motor acepta hasta 255. Bájalo a 255 y ajusta su test.
- `src/components/InventoryView.jsx` y `src/components/SettingsView.jsx` pasan de 200 líneas desde antes de estos briefs. Extrae al menos las secciones de lotes y de reservas a componentes propios hasta dejarlos por debajo de 200, sin cambiar el comportamiento.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Seguridad: tipo y tamaño validados antes de subir; nada del archivo se renderiza como HTML; la vista previa usa `URL.createObjectURL` y se libera al desmontar; sin token en URLs.
- Diseño: componentes de menos de 200 líneas (compruébalo con `wc -l`), funciones de menos de 50, DRY (no dupliques nada del 34ap).
- Los mocks de los tests usan la forma real de la respuesta del motor (`{ data: ... }`).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- `uploadInvoiceFile`: rechaza tipos y tamaños inválidos sin llamar a la red.
- Reducción de imagen (con `canvas` simulado) solo por encima de 2000 px.
- La vista previa libera la URL al desmontar.
- Mensajes de `failed` por `error_code`.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Prueba manual en Android: tomar una foto con la cámara y verificar que se sube y se lee. Anota el resultado en la descripción del commit.

## Criterios de aceptación

- [ ] Subir una foto o un PDF desde Compras, también con la cámara en Android.
- [ ] Imágenes grandes reducidas antes de subir.
- [ ] Misma revisión del 34ap, con la imagen o el PDF a la vista.
- [ ] Pendientes menores: `AssetCountSheet.jsx`, `InventoryView.jsx` y `SettingsView.jsx` por debajo de 200 líneas; motivo de lote hasta 255.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
