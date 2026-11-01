# Brief 34p: subir la factura por foto o PDF

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; empaquetada para Android con Capacitor según el Brief 18p). Crea la rama `feat/pwa-subir-factura` desde `main` con el Brief 33p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 34 del motor desplegado: `C:\laragon\www\UaldoBusiness\docs\briefs\34_lectura-de-facturas-foto-o-pdf.md` y `C:\laragon\www\UaldoBusiness\docs\API-purchase-documents.md`.

**Por qué.** El dueño quiere que administración adjunte la foto o el PDF de la factura y que Ualdo proponga la compra, marcando lo dudoso para revisar. El motor recibe el archivo, lo lee en segundo plano y crea un borrador con marcas `needs_review`. La app necesita subir el archivo, esperar el resultado y dejar revisar línea por línea antes de confirmar.

**Lee primero:** `docs/ualdo-brand.md`; `src/services/apiClient.js` (hoy envía JSON: revisa cómo añadir `FormData` sin romper los encabezados ni el token); `src/components/inventory/purchases/*` (`PurchaseForm.jsx`, `PurchaseLinesEditor.jsx`, `SupplierForm.jsx`); `src/hooks/usePurchaseForm.js`; `docs/briefs/18p_pwa-catalogo-y-publicacion-android.md` (permisos de cámara en Android).

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos y cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Desde Compras, administración toma una foto o elige un PDF. La app lo sube, muestra "Leyendo la factura" y abre el borrador propuesto con cada línea marcada como lista o para revisar. La persona corrige, elige o crea el proveedor si hace falta, y confirma. La recepción sigue siendo un paso aparte (Brief 33p).

## Requerimientos

1. **`apiClient`.** Añade `uploadFile(path, file, fieldName = 'file')`, que envía `FormData` con el mismo token y manejo de errores, sin fijar `Content-Type` a mano. Tamaño máximo de 10 MB comprobado antes de subir; tipos `image/jpeg`, `image/png`, `image/webp` y `application/pdf`.
2. **Cliente** `src/services/purchaseDocumentsClient.js`: `uploadInvoice(file)`, `getInvoiceDocument(id)`, `confirmInvoice(id, lines)` y `invoiceFileUrl(id)`. La URL del archivo se pide con el token; nunca se pone el token en la URL.
3. **Subir** (`InvoiceUploadButton.jsx`, visible con `purchases.manage` en Compras):
   - `<input type="file" accept="image/*,application/pdf" capture="environment">`, que en Android abre la cámara o la galería.
   - Antes de subir, las imágenes de más de 2000 px de lado se reducen en el navegador con `canvas` (calidad 0,85) para ahorrar datos. Los PDF se suben tal cual.
4. **Esperar** (`useInvoiceDocument.js`):
   - Consulta el estado cada 3 segundos durante 2 minutos como máximo, con retroceso tras errores de red, y se detiene al desmontar.
   - Muestra "Leyendo la factura" con un indicador.
   - En `failed`, el mensaje según `error_code` ("No se pudo leer la foto. Prueba con más luz o sube el PDF.") y la opción de cargar la compra a mano.
   - Un duplicado (`200` con documento existente) muestra "Esta factura ya se subió" y abre ese documento.
5. **Revisar** (`InvoiceReview.jsx` e `InvoiceReviewLine.jsx`):
   - Arriba, la vista previa de la imagen o un enlace al PDF.
   - Cabecera con proveedor (si no coincidió, elegir uno existente o "Crear proveedor" con los datos leídos precargados en `SupplierForm`), número, fecha y total.
   - Por línea: lo leído (descripción, cantidad, unidad, precio, total), el insumo sugerido con el buscador para cambiarlo, la opción "Otras compras" y el factor de unidad (por ejemplo, "1 caja = 12 unidades").
   - Etiqueta "Revisar" con el motivo del motor en las líneas `needs_review`.
   - "Confirmar compra" se habilita cuando no quedan líneas en revisión sin tocar (marcar una línea como revisada cuenta) y hay proveedor.
   - Las marcas de cabecera (totales que no cuadran) se muestran arriba y no bloquean, pero exigen marcar "Revisé los totales".
6. **Después de confirmar**: se abre el detalle de la compra en borrador, con el botón "Recibir" del Brief 33p.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Seguridad: tipo y tamaño validados antes de subir; nada del archivo se renderiza como HTML; la vista previa usa `URL.createObjectURL` y se libera al desmontar; sin token en URLs.
- Rendimiento: consulta con límite y cancelación; nada de consultas en segundo plano después de salir de la pantalla.
- Diseño: componentes de menos de 200 líneas, funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (reutiliza el buscador de insumos y `SupplierForm`).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- `uploadFile`: usa `FormData`, mantiene el token y rechaza tipos y tamaños inválidos sin llamar a la red.
- Reducción de imagen (con `canvas` simulado) solo por encima de 2000 px.
- `useInvoiceDocument`: se detiene en `extracted` y en `failed`, respeta el límite de 2 minutos y se limpia al desmontar (temporizadores falsos).
- Revisión: "Confirmar" deshabilitado con líneas sin revisar o sin proveedor; cambiar el insumo y marcar como otra compra; los totales que no cuadran exigen "Revisé los totales".
- Duplicado abre el documento existente.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Prueba manual en Android: tomar una foto con la cámara y verificar que se sube. Anota el resultado en la descripción del commit.

## Criterios de aceptación

- [ ] Subir una foto o un PDF desde Compras, también con la cámara en Android.
- [ ] Espera con estados claros y salida a carga manual si falla.
- [ ] Revisión línea por línea; nada se confirma con dudas sin revisar.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
