# Brief 34ap: cargar facturas del SRI por XML o clave de acceso

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Vitest 2, Testing Library, ESLint 9, `lucide-react`; empaquetada para Android con Capacitor según el Brief 18p). Crea la rama `feat/pwa-facturas-sri` desde `main` con el Brief 33p fusionado. No toques el motor.

**Construye:** el usuario (Antigravity). Audita: Claude.

**Requiere** el Brief 34a y su fix (34a_fix) del motor desplegados: `C:\laragon\www\UaldoBusiness\docs\briefs\34a_facturas-sri-xml-y-clave-de-acceso.md` y `C:\laragon\www\UaldoBusiness\docs\API-purchase-documents.md`.

**Este brief reemplaza al antiguo 34p** junto con el 34bp.

**Por qué.** El dueño quiere que administración cargue la factura y que Ualdo proponga la compra. En Ecuador casi todas las facturas de proveedores formales son electrónicas: traen un XML y una clave de acceso de 49 dígitos impresa con código de barras en el PDF. El motor ya lee el XML o lo pide al SRI con la clave, y crea un borrador. La app necesita subir el XML o enviar la clave, esperar el resultado y dejar revisar línea por línea antes de confirmar.

**Lee primero:**
- `docs/ualdo-brand.md`.
- `src/services/apiClient.js`: hoy envía JSON; revisa cómo añadir `FormData` sin romper los encabezados ni el token. **Ojo:** `request` no desenvuelve el JSON; el motor responde `{ "data": ... }` (ver la lección del Brief 32p_fix).
- `src/components/inventory/purchases/*` (`PurchasesView.jsx`, `PurchaseDetail.jsx`, `PurchaseLinesEditor.jsx`, `SupplierForm.jsx`) y `src/hooks/usePurchaseForm.js`.
- El buscador de insumos que ya usan los formularios de compra.

**Reglas que se mantienen:** cero emojis; colores solo con variables CSS; montos y cantidades como texto validado; todo por `apiClient`; sin `alert`, `confirm` ni `dangerouslySetInnerHTML`.

## Objetivo

Desde Compras, administración sube el XML de la factura o escribe (o escanea) la clave de acceso. La app muestra "Consultando la factura", abre el borrador propuesto con cada línea marcada como lista o para revisar, deja elegir o crear el proveedor y confirmar. La recepción sigue siendo un paso aparte (Brief 33p).

## Requerimientos

1. **`apiClient`.** Añade `uploadFile(path, file, fieldName = 'file')`, que envía `FormData` con el mismo token y el mismo manejo de errores, sin fijar `Content-Type` a mano.
2. **Cliente** `src/services/purchaseDocumentsClient.js`:
   - `uploadInvoiceXml(file)`: solo `.xml` (`text/xml` o `application/xml`), hasta 1 MB, comprobado antes de subir.
   - `submitAccessKey(key)`: quita espacios y guiones; exige 49 dígitos y valida el dígito verificador módulo 11 del SRI en el navegador (misma regla del 34a) antes de llamar a la red.
   - `getInvoiceDocument(id)`, `listInvoiceDocuments({ status, page })` y `confirmInvoice(id, { supplier_id, lines })`.
   - En `confirmInvoice`, cada línea que viene de la factura lleva `source_index` (su posición en `extraction.lines`, Brief 34a_fix); las líneas agregadas a mano van sin él. Así el motor aprende las equivalencias aunque la persona reordene o quite líneas.
   - Desenvuelve `res.data.data` en un solo sitio, como `withdrawalsClient.js`.
3. **Cargar** (`InvoiceSriEntry.jsx`, visible con `purchases.manage` en Compras), con dos opciones:
   - "Subir XML": `<input type="file" accept=".xml,text/xml,application/xml">`.
   - "Clave de acceso": campo de texto numérico que muestra el conteo (por ejemplo, "47 de 49") y el error de dígito verificador en vivo.
   - "Escanear código de barras": solo si el navegador tiene `BarcodeDetector` con formato `code_128` (Chrome en Android). Abre la cámara, lee el código del RIDE y llena el campo. Si no está disponible, el botón no aparece. Sin dependencias nuevas.
4. **Esperar** (`useInvoiceDocument.js`):
   - Consulta el estado cada 3 segundos durante 2 minutos como máximo, con retroceso tras errores de red, y se detiene al desmontar.
   - Muestra "Consultando la factura" con un indicador.
   - En `failed`, el mensaje según `error_code`:
     - `not_authorized`: "El SRI no tiene esa factura como autorizada. Revisa la clave."
     - `sri_unavailable`: "El SRI no responde. Prueba en unos minutos o sube el XML."
     - `invalid_xml`: "Ese archivo no es una factura electrónica válida."
     - Siempre con la opción "Cargar la compra a mano".
   - Un duplicado (`duplicate: true`) muestra "Esta factura ya se cargó" y abre ese documento.
5. **Revisar** (`InvoiceReview.jsx` e `InvoiceReviewLine.jsx`; los reutiliza el 34bp):
   - Cabecera con proveedor (si no coincidió, elegir uno existente o "Crear proveedor" con nombre y RUC precargados en `SupplierForm`), número, fecha y total. Los motivos de `header_review_reasons` arriba, sin bloquear, pero exigen marcar "Revisé la cabecera".
   - Por línea: lo leído (descripción, código, cantidad, precio, total), el insumo sugerido con el buscador para cambiarlo, la opción "Otras compras" y el factor de unidad ("1 caja = 12 unidades").
   - Etiqueta "Revisar" con los motivos de `review_reasons` en las líneas `needs_review`.
   - "Confirmar compra" se habilita cuando no quedan líneas en revisión sin tocar (marcar una línea como revisada cuenta) y hay proveedor.
6. **Después de confirmar**: se abre el detalle de la compra en borrador, con el botón "Recibir" del Brief 33p.
7. **Historial**: en Compras, una lista corta "Facturas cargadas" (`listInvoiceDocuments`) con estado y acceso a la revisión de las que siguen pendientes.
8. **Ajustes de compras** (`PurchasingSettingsForm.jsx`): campo "RUC del negocio" (`buyer_tax_id`, 13 dígitos, opcional) para que el motor avise si una factura no está a nombre del negocio.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG (`lucide-react`).
- Marca: sigue estrictamente `docs/ualdo-brand.md`. Conserva las tildes.
- Seguridad: tipo y tamaño validados antes de subir; nada del archivo se renderiza como HTML; sin token en URLs; la cámara se libera al cerrar el escáner.
- Rendimiento: consulta con límite y cancelación; nada de consultas en segundo plano después de salir de la pantalla.
- Diseño: componentes de menos de 200 líneas (compruébalo con `wc -l` antes de entregar), funciones de menos de 50, sin anidación de más de 4 niveles, inmutabilidad, DRY (reutiliza el buscador de insumos y `SupplierForm`).
- Los mocks de los tests usan la forma real de la respuesta del motor (`{ data: ... }`).
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests

- `uploadFile`: usa `FormData`, mantiene el token y no fija `Content-Type`.
- `uploadInvoiceXml`: rechaza otros tipos y más de 1 MB sin llamar a la red.
- `submitAccessKey`: 48 dígitos, letras y verificador incorrecto se rechazan sin llamar a la red; una clave válida con espacios se limpia y se envía.
- Escáner: no aparece sin `BarcodeDetector`; con un `BarcodeDetector` simulado llena el campo.
- `useInvoiceDocument`: se detiene en `extracted` y en `failed`, respeta los 2 minutos y se limpia al desmontar (temporizadores falsos).
- Revisión: "Confirmar" deshabilitado con líneas sin revisar o sin proveedor; cambiar el insumo y marcar como otra compra; la cabecera con motivos exige "Revisé la cabecera".
- Duplicado abre el documento existente.
- Cobertura de 80 % o más del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && git branch --show-current
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

El lint debe seguir con 0 errores y no más de 47 avisos. Prueba manual en Android: escanear el código de barras de un RIDE y verificar que la clave se llena. Anota el resultado en la descripción del commit.

## Criterios de aceptación

- [ ] Cargar una factura desde Compras por XML, por clave escrita o escaneada.
- [ ] Clave validada en el navegador antes de enviarla.
- [ ] Espera con estados claros y salida a carga manual si falla.
- [ ] Revisión línea por línea; nada se confirma con dudas sin revisar.
- [ ] RUC del negocio configurable en los ajustes de compras.
- [ ] Lint, tests y build en verde; cero emojis; marca Ualdo; sin colores fijos.
