# Brief 18-PWA: catálogo del motor en la app y publicación segura en Android

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8 para Android, Vitest 2, Testing
Library, ESLint 9, `lucide-react`). Rama base `feat/pwa-cash-config` (Brief 15c-PWA en `136ff60`). Crea la rama
`feat/pwa-catalog-release` desde ahí. **No toques** el motor ni NexoTeams.

**Se construye en paralelo con el Brief 18 del motor**, que agrega el catálogo importado de DobleFilo. Este brief
consume su **contrato**, descrito abajo. Si tu motor local todavía no lo tiene, los tests lo simulan.

**Decisiones del dueño del producto (2026-10-08):**
- El inventario se migra desde DobleFilo al motor. Los insumos tendrán código, categoría con familia, tipo de
  almacenamiento, tipo de producto y estado activo.
- La pestaña **Trabajo** sigue usando **NexoTeams**, que también se despliega en producción con HTTPS.
- La app se publica para Android.

**Estado actual, verificado por el auditor:**

1. **Inventario** (`src/components/InventoryView.jsx`, `src/components/inventory/InventoryList.jsx` y
   `src/hooks/useInventoryList.js`): muestra nombre, stock, unidad y mínimo. No conoce código, categoría,
   almacenamiento ni el estado activo.
2. **NexoTeams sin HTTPS obligatorio.**
   - `src/services/teamsClient.js:4` usa
     `VITE_TEAMS_API_URL || VITE_NEXO_API_URL || 'http://nexoteams.test/api'`.
   - A diferencia de `apiClient.js:71`, **no exige HTTPS en producción**: un build sin la variable apunta a una URL
     local por HTTP.
3. **Capacitor permite tráfico sin cifrar.** `capacitor.config.json` tiene `server.cleartext: true` y
   `android.allowMixedContent: true`. En un APK de producción eso permite tráfico sin cifrar y mezclado.
4. **Configuración de producción.**
   - `storage.js:11` usa `VITE_API_BASE_URL || 'http://ualbusiness.test/api/v1'`. Hay una exigencia de HTTPS en
     tiempo de ejecución, pero **el build no falla** si la variable falta.
   - No hay `.env.production.example`.
5. **Android.**
   - `android/app/build.gradle` firma con `keystore.properties`, ignorado por git, igual que `*.jks`: bien.
   - `versionCode 1` y `versionName "1.0"` están fijos y no salen de `package.json` (`1.0.0`).
   - No hay script ni runbook de publicación.
   - Los íconos y la pantalla de inicio son los de Capacitor, salvo que alguien los haya cambiado; verifícalo.
6. **Marca.** `docs/brand-assets/` tiene `ualdo-isotipo.png`, los logos horizontales y la mascota.

**Contrato del motor (Brief 18) que se consume:**
- **`GET /api/v1/inventory`** agrega a cada insumo:
  - `code` (texto o `null`);
  - `category`: `{ id, name, family }` o `null`, donde `family` es `{ id, name }` o `null`;
  - `storage_type`: `ambient`, `refrigerated`, `frozen` o `null`;
  - `product_kind`: `raw_material` o `prepared`;
  - `requires_weight_control`, `requires_daily_control` e `is_active` (booleanos).
- **Inactivos:** por defecto la respuesta **no** los incluye; con `?include_inactive=1`, sí.
- **Alertas:** `/inventory/alerts` excluye los inactivos.

**Lee primero:** `docs/ualdo-brand.md`, `src/services/apiClient.js`, `src/services/teamsClient.js`,
`src/services/storage.js`, `src/services/inventoryClient.js`, `src/hooks/useInventoryList.js`,
`src/components/inventory/*`, `capacitor.config.json`, `android/app/build.gradle`, `vite.config.js` y
`package.json`.

## Objetivo

Que el inventario de la app muestre el catálogo importado (código, categoría, almacenamiento y estado). Que un build
de producción no se pueda generar con URLs inseguras o faltantes, ni para el motor ni para NexoTeams. Y que publicar
una versión de Android sea un procedimiento documentado y repetible.

## Requerimientos

### Parte A: catálogo en el inventario

1. **`inventoryClient.listInventory`** acepta `includeInactive` y lo envía como `include_inactive=1` solo cuando es
   verdadero, codificado con `URLSearchParams`.
2. **`InventoryList` y su tarjeta**, para cada insumo:
   - el **código** junto al nombre, en texto secundario;
   - la **categoría**: "Familia / Categoría" si hay familia, solo la categoría si no, nada si es `null`;
   - el **almacenamiento**, como etiqueta con ícono SVG de `lucide-react`: Ambiente, Refrigerado o Congelado, con
     colores de variables de la marca (agrega variables en `src/styles/main.css` si hacen falta);
   - "Preparado" como etiqueta si `product_kind = prepared`;
   - "Inactivo" en un estilo atenuado si `is_active` es falso.
3. **Filtro "Mostrar inactivos"** en `InventoryView`:
   - un interruptor que, al activarse, recarga la lista con `includeInactive`;
   - por defecto está apagado y su estado vive en el hook, no en `localStorage`;
   - la búsqueda sigue funcionando igual.
4. **Tolerancia:** si el motor todavía no envía los campos nuevos (por ejemplo, `undefined`), la tarjeta se ve como
   hoy, sin errores.

### Parte B: configuración de producción segura

5. **`teamsClient.js`:** en producción (`import.meta.env.PROD`), exige que la URL de NexoTeams venga de la variable y
   empiece por `https://`. Si no, las peticiones devuelven un error claro ("La URL de Ualdo Teams no es segura"),
   igual que `apiClient`. En desarrollo se conserva el valor por defecto local.
6. **Guardia de build** en `vite.config.js`: un plugin pequeño que, con `mode === 'production'` en `vite build`,
   **corta el build** con un mensaje claro si:
   - falta `VITE_API_BASE_URL` o no empieza por `https://`;
   - falta `VITE_TEAMS_API_URL` o no empieza por `https://`.

   Debe poder probarse aislado: exporta la función de validación desde un módulo, por ejemplo
   `build/validateProdEnv.js`.
7. **`.env.production.example`** (versionado, sin valores reales) con `VITE_API_BASE_URL` y `VITE_TEAMS_API_URL`, con
   comentarios en español. Verifica que `.env.production` esté en `.gitignore`, y si no, agrégalo.
8. **Capacitor:**
   - convierte `capacitor.config.json` a `capacitor.config.ts`, conservando `appId`, `appName`, `webDir` y la
     configuración de `SplashScreen`;
   - `server.cleartext` y `android.allowMixedContent` solo valen `true` cuando `process.env.CAP_DEV === '1'`
     (desarrollo con recarga en vivo); en cualquier otro caso, `false`;
   - documenta la variable en el runbook.

### Parte C: publicación en Android

9. **Versión:**
   - `android/app/build.gradle` lee `versionName` de `package.json` (`version`);
   - `versionCode` se calcula como `mayor * 10000 + menor * 100 + parche` (por ejemplo, `1.0.0` da `10000`).
   - Agrega un test o un script verificable que lo compruebe.
10. **Scripts en `package.json`:**
    - `build:prod`: `vite build --mode production`;
    - `android:sync`: `npm run build:prod && npx cap sync android`;
    - `android:release`: `npm run android:sync` y después el `assembleRelease` de Gradle, con `gradlew.bat` en
      Windows (documenta cómo correrlo).

    Los scripts no deben imprimir secretos.
11. **Ícono y pantalla de inicio de la marca:**
    - genera los íconos de lanzador (`mipmap-*`, incluido el ícono adaptativo) a partir de
      `docs/brand-assets/ualdo-isotipo.png`;
    - la pantalla de inicio (`drawable*`/splash) usa el isotipo sobre el fondo oscuro de la marca (`#1d1d1b`, el
      mismo de `SplashScreen.backgroundColor`).
    - Usa la herramienta oficial de Capacitor si ya está disponible sin agregar dependencias permanentes (por
      ejemplo, `npx @capacitor/assets generate` ejecutado una vez). Si eso exige instalar una dependencia, justifícalo
      en el resumen o genera los archivos con las herramientas de Android Studio. **Los archivos generados sí se
      versionan.**
12. **`docs/runbooks/RUNBOOK-publicacion-android.md`**, en español con tildes:
    - requisitos: JDK, Android SDK y las variables `.env.production`;
    - **custodia del keystore**: dónde está `ualdo-release.jks`, que **perderlo impide publicar actualizaciones**,
      cómo respaldarlo (en el gestor de contraseñas y una copia cifrada fuera del PC) y que nunca va al repo;
    - el paso a paso de una versión: subir `version`, `npm run android:release`, dónde queda el APK o el AAB y cómo
      verificar la firma (`apksigner verify`);
    - **distribución**: instalar el APK directamente en los teléfonos del local, o con Google Play (pruebas
      internas). Pros y contras breves, y la recomendación para el piloto;
    - **verificación en el teléfono**: iniciar sesión, ver el inventario, recibir un aviso y abrir Trabajo
      (NexoTeams);
    - `CAP_DEV=1` solo para desarrollo.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, tests, documentación, commits o nombres de archivo. Tampoco símbolos decorativos de terminal pegados en la documentación. Íconos solo en SVG (`lucide-react`).
- **Marca:** sigue `docs/ualdo-brand.md`, con el isotipo y los colores oficiales. Colores solo con variables de
  `src/styles/main.css`; este `grep` debe salir vacío:

  ```
  grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src/components/inventory src/components/InventoryView.jsx
  ```

  En archivos de Android, el color va en `values/colors.xml`.
- **Seguridad:**
  - ningún secreto ni contraseña del keystore en el repo, en los scripts ni en el resumen;
  - HTTPS obligatorio en producción para el motor y para NexoTeams;
  - sin tráfico sin cifrar en el APK de producción;
  - los textos del motor (nombres, categorías) son texto plano.
- **Español con tildes** en interfaz y documentos.
- **Diseño:** componentes de menos de 250 líneas, funciones de menos de 50 y sin mutaciones de estado.
- **Alcance:**
  - No cambies el login, el chat, la caja ni la pestaña Trabajo, salvo la exigencia de HTTPS en `teamsClient.js`.
  - Sin dependencias permanentes nuevas. Si una herramienta de generación de íconos se usa una sola vez con `npx`,
    no queda en `package.json`.

## Tests

Usa Vitest con Testing Library. **Cada test debe fallar si se revierte lo que protege.** Anota en
`docs/RESUMEN-18p.md` al menos **siete** mutaciones con la **salida real completa** del test que falla, sin
símbolos de terminal (reemplázalos por `[ok]`, `[x]` y `>`). El auditor repetirá cada una y revisará que no se hayan
quitado tildes.

1. **`inventoryClient`:** `includeInactive: true` envía `include_inactive=1`; `false` no envía el parámetro.
2. **Tarjeta:**
   - muestra código, "Familia / Categoría", la etiqueta del almacenamiento, "Preparado" e "Inactivo";
   - sin categoría no muestra el separador;
   - con campos `undefined` no falla;
   - un nombre de categoría `<img src=x onerror=alert(1)>` se muestra como texto.
3. **Filtro de inactivos:** al activarlo, el hook vuelve a pedir la lista con `include_inactive=1`. Mutación: no
   pasar el parámetro.
4. **`teamsClient` en producción:** con una URL `http://`, o sin variable, no hace la petición y devuelve el error
   claro; con `https://`, sí la hace. Mutación: quitar la comprobación.
5. **`validateProdEnv`:** falla sin `VITE_API_BASE_URL`, con `http://` en cualquiera de las dos variables y sin
   `VITE_TEAMS_API_URL`; pasa con las dos en `https://`. Mutación: aceptar `http://`.
6. **Capacitor:** con `CAP_DEV` sin definir, la configuración exportada tiene `cleartext` y `allowMixedContent` en
   `false`; con `CAP_DEV=1`, en `true`. Mutación: dejar `true` fijo.
7. **Versión:** `1.0.0` da `versionCode` 10000, y `1.2.3` da 10203.
8. **Regresión:** los 246 tests existentes siguen en verde, sin borrar aserciones.
9. **Cobertura:** al menos 80 % de sentencias y de ramas en los archivos nuevos o modificados de inventario, en
   `teamsClient.js` y en `validateProdEnv`. Agrégalos a `coverage.include` y pega la tabla por archivo tal cual.

**Prueba manual obligatoria, documentada en el resumen:**
- `npm run build:prod` **sin** variables debe fallar con el mensaje de la guardia (pega la salida).
- Con variables `https://` de ejemplo, debe compilar.
- Si tienes el SDK de Android, `npm run android:release` genera el APK firmado y `apksigner verify` lo acepta (pega
  la salida, sin rutas personales ni secretos). Si no tienes el SDK, indícalo, y el auditor lo verifica.

## Verificación final

```
npm run lint
npm test
npm run test:coverage
npm run build:prod
git status --short
git check-ignore -v android/keystore.properties android/ualdo-release.jks .env.production
```

## Criterios de aceptación

- [ ] El inventario muestra código, categoría con familia, almacenamiento, tipo y estado, con el filtro "Mostrar inactivos", y tolera respuestas sin esos campos.
- [ ] Un build de producción falla sin URLs `https://` del motor y de NexoTeams, y `teamsClient` exige HTTPS en producción.
- [ ] El APK de producción no permite tráfico sin cifrar; solo `CAP_DEV=1` lo habilita en desarrollo.
- [ ] La versión de Android sale de `package.json`; existen `build:prod`, `android:sync` y `android:release`.
- [ ] El ícono y la pantalla de inicio son los de la marca Ualdo.
- [ ] `RUNBOOK-publicacion-android.md` cubre la custodia del keystore, la publicación, la distribución y la verificación en el teléfono.
- [ ] Ningún secreto en el repo; el keystore y `.env.production` siguen ignorados.
- [ ] `docs/RESUMEN-18p.md` tiene al menos siete mutaciones con su salida real completa y la tabla de cobertura.
- [ ] Cero emojis; marca Ualdo; español con tildes; sin dependencias permanentes nuevas.
- [ ] `lint`, `test`, `test:coverage` y `build:prod` (con variables) en verde.
