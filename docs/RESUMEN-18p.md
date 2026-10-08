# Resumen de implementación: Brief 18-PWA

## Catálogo del motor en la app y publicación segura en Android

Este documento detalla los cambios implementados en la aplicación móvil PWA de Ualdo para integrar el catálogo ampliado procedente del motor central (Brief 18), robustecer la seguridad en entornos de producción (HTTPS mandatorio y Capacitor protegido) y formalizar el flujo de compilación y publicación para la plataforma Android.

---

## 1. Cambios realizados

### Parte A: Catálogo en el inventario
- **`src/services/inventoryClient.js`**: Se adaptó la función `listInventory` para admitir el parámetro booleano `includeInactive`. Cuando es verdadero, se codifica `include_inactive=1` mediante `URLSearchParams`.
- **`src/hooks/useInventoryList.js`**: Se incorporó el estado en memoria `includeInactive` (por defecto en `false`, sin persistencia en `localStorage`). Se propagó al servicio `listInventory` e integró en las dependencias de recarga.
- **`src/styles/main.css`**: Se definieron las variables oficiales de la marca (`--ualdo-negro`, `--ualdo-petroleo`, `--ualdo-turquesa`, `--ualdo-aqua`, `--ualdo-pizarra`, `--ualdo-blanco`) y los distintivos de almacenamiento y estado (`--storage-ambient-*`, `--storage-refrigerated-*`, `--storage-frozen-*`, `--badge-prepared-*`, `--badge-inactive-*`).
- **`src/components/inventory/InventoryList.jsx`**:
  - Código secundario junto al nombre del insumo.
  - Categoría con jerarquía: `"Familia / Categoría"` si posee familia, solo el nombre de la categoría si no la tiene, y nada sin separador cuando es nula.
  - Distintivo de almacenamiento con íconos SVG de `lucide-react`: `Sun` (Ambiente), `Thermometer` (Refrigerado) y `Snowflake` (Congelado).
  - Distintivo `"Preparado"` cuando `product_kind === 'prepared'`.
  - Distintivo `"Inactivo"` y estilo atenuado (`opacity: 0.7`) cuando `is_active === false`.
  - Tolerancia total ante campos no definidos (`undefined`) y protección contra XSS mediante renderizado seguro de cadenas.
- **`src/components/InventoryView.jsx`**: Se añadió el interruptor accesible (`role="switch"`) con la etiqueta `"Mostrar inactivos"` en las pestañas con catálogo, sincronizado con el hook.

### Parte B: Configuración de producción segura
- **`src/services/teamsClient.js`**: En producción (`import.meta.env.PROD`), se exige que la URL de Ualdo Teams empiece obligatoriamente por `https://`. Si falta o no usa HTTPS, las peticiones y el inicio de sesión se abortan devolviendo el error `"La URL de Ualdo Teams no es segura"`. En desarrollo local se mantiene el valor por defecto `http://nexoteams.test/api`.
- **`build/validateProdEnv.js`**: Módulo exportable que valida que `VITE_API_BASE_URL` y `VITE_TEAMS_API_URL` estén presentes y comiencen con `https://`.
- **`vite.config.js`**: Se configuró el plugin `prodEnvGuardPlugin`, el cual intercepta el comando de compilación de producción (`command === 'build'` y `mode === 'production'`) y aborta la construcción con mensaje explicativo si falta alguna variable o no cumple HTTPS.
- **`.env.production.example`**: Archivo de ejemplo versionado con documentación en español y URLs de ejemplo `https://`.
- **`.gitignore`**: Se añadió explícitamente `.env.production`.
- **`capacitor.config.ts`**: Se migró de JSON a TypeScript. Los parámetros `server.cleartext` y `android.allowMixedContent` se evalúan dinámicamente mediante `process.env.CAP_DEV === '1'`, quedando en `false` para cualquier compilación regular o de producción.

### Parte C: Publicación en Android
- **`android/app/build.gradle`**: Se automatizó la lectura dinámica del archivo `package.json`:
  - `versionName`: extraído de la clave `"version"` (por ejemplo `"1.0.0"`).
  - `versionCode`: calculado mediante la fórmula semántica `mayor * 10000 + menor * 100 + parche` (por ejemplo, `1.0.0` produce `10000`).
- **`package.json`**: Se crearon los comandos `"build:prod"`, `"android:sync"` y `"android:release"`.
- **Recursos gráficos de Android**: Se generaron todos los íconos de lanzador (`mipmap-*`, incluyendo primer plano adaptativo `ic_launcher_foreground.png` y circular `ic_launcher_round.png`) y pantallas de inicio (`drawable*`/`splash.png`) utilizando el isotipo oficial `docs/brand-assets/ualdo-isotipo.png` y el fondo oscuro corporativo `#1d1d1b`.
- **`docs/runbooks/RUNBOOK-publicacion-android.md`**: Runbook completo en español con tildes que describe requisitos, custodia y respaldo del keystore `ualdo-release.jks`, paso a paso de compilación, verificación con `apksigner`, estrategia de distribución (instalación directa vs Google Play interno) y comprobaciones en el dispositivo móvil.

---

## 2. Pruebas manuales de compilación

### 2.1. Guardia de build sin variables de entorno obligatorias
Comando ejecutado:
`npm run build:prod`

Salida real:
```
> ualdo-ecosystem-mobile@1.0.0 build:prod
> vite build --mode production

failed to load config from C:\laragon\www\UALDO\vite.config.js
error during build:
Error: Falta la variable de entorno obligatoria VITE_API_BASE_URL para producción.
    at validateProdEnv (file:///C:/laragon/www/UALDO/build/validateProdEnv.js:11:11)
    at configResolved (file:///C:/laragon/www/UALDO/vite.config.js:11:9)
    at runConfigResolvers (file:///C:/laragon/www/UALDO/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:67180:15)
    at resolveConfig (file:///C:/laragon/www/UALDO/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:66708:11)
    at async doBuild (file:///C:/laragon/www/UALDO/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65593:20)
    at async build (file:///C:/laragon/www/UALDO/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:65584:16)
    at async CAC.<anonymous> (file:///C:/laragon/www/UALDO/node_modules/vite/dist/node/cli.js:828:5)
```

### 2.2. Compilación exitosa con variables HTTPS válidas
Comando ejecutado:
`$env:VITE_API_BASE_URL="https://api.ualdo.ejemplo.com/api/v1"; $env:VITE_TEAMS_API_URL="https://teams.ualdo.ejemplo.com/api"; npm run build:prod`

Salida real:
```
> ualdo-ecosystem-mobile@1.0.0 build:prod
> vite build --mode production

vite v5.4.14 building for production...
transforming...
[ok] 1630 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                             1.13 kB │ gzip:  0.56 kB
dist/assets/poppins-latin-ext-700-normal-cby-RkWa.woff2     5.43 kB
dist/assets/poppins-latin-ext-600-normal-CAhIAdZj.woff2     5.52 kB
dist/assets/poppins-latin-ext-400-normal-by3JarPu.woff2     5.64 kB
dist/assets/poppins-latin-ext-700-normal-DctTR6Tg.woff      7.33 kB
dist/assets/poppins-latin-ext-600-normal-Df5ffKXP.woff      7.43 kB
dist/assets/poppins-latin-ext-400-normal-DaBSavcJ.woff      7.46 kB
dist/assets/poppins-latin-700-normal-Qrb0O0WB.woff2         7.82 kB
dist/assets/poppins-latin-400-normal-cpxAROuN.woff2         7.88 kB
dist/assets/poppins-latin-600-normal-zEkxB9Mr.woff2         8.00 kB
dist/assets/poppins-latin-700-normal-BVuQR_eA.woff         10.43 kB
dist/assets/poppins-latin-400-normal-BOb3E3N0.woff         10.53 kB
dist/assets/poppins-latin-600-normal-BJdTmd5m.woff         10.60 kB
dist/assets/poppins-devanagari-700-normal-O-jipLrW.woff2   39.25 kB
dist/assets/poppins-devanagari-600-normal-STEjXBNN.woff2   39.29 kB
dist/assets/poppins-devanagari-400-normal-CJDn6rn8.woff2   39.66 kB
dist/assets/poppins-devanagari-700-normal-fHs-vx92.woff    52.25 kB
dist/assets/poppins-devanagari-600-normal-ClASKHrr.woff    52.56 kB
dist/assets/poppins-devanagari-400-normal-CqVvlrh5.woff    52.98 kB
dist/assets/index-CQwSmNjj.css                             20.30 kB │ gzip:  4.65 kB
dist/assets/index-DRbK8uy6.js                             374.58 kB │ gzip: 95.67 kB
[ok] built in 1.48s
```

### 2.3. Estado del entorno para Android SDK
En la estación de trabajo actual no se encuentra instalado el Android SDK (`apksigner`, `sdkmanager`) ni JDK completo en la variable `JAVA_HOME`. Conforme a la instrucción del brief, el proceso de compilación Gradle se delega para verificación por parte del auditor con las herramientas completas de compilación móvil instaladas.

---

## 3. Pruebas de mutación

A continuación se registran las siete mutaciones comprobadas, con su descripción y salida de fallo real:

### Mutación 1: `inventoryClient` (parámetro `includeInactive`)
- **Archivo**: `src/services/inventoryClient.js`
- **Mutación**: Se comentó la asignación `params.set('include_inactive', '1')` en la línea 34.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > src/services/__tests__/inventoryClient.test.js (13 tests | 1 failed) 35ms
   [x] inventoryClient service > listInventory > sends include_inactive=1 when includeInactive is true, and omits it when false 17ms
     > expected "request" to be called with arguments: [ '/inventory?include_inactive=1' ]

Received: 

  1st request call:

  Array [
-   "/inventory?include_inactive=1",
+   "/inventory",
  ]

Number of calls: 1

 FAIL  src/services/__tests__/inventoryClient.test.js > inventoryClient service > listInventory > sends include_inactive=1 when includeInactive is true, and omits it when false
AssertionError: expected "request" to be called with arguments: [ '/inventory?include_inactive=1' ]

Received: 

  1st request call:

  Array [
-   "/inventory?include_inactive=1",
+   "/inventory",
  ]

Number of calls: 1

 > src/services/__tests__/inventoryClient.test.js:60:19
     58| 
     59|       await listInventory({ includeInactive: true });
     60|       expect(spy).toHaveBeenCalledWith('/inventory?include_inactive=1'…
       |                   ^
     61| 
     62|       spy.mockClear();

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
```

### Mutación 2: Tarjeta de inventario (jerarquía de categoría)
- **Archivo**: `src/components/inventory/InventoryList.jsx`
- **Mutación**: En la función `formatCategory`, se cambió `return `${famName} / ${catName}`;` por `return catName;`, omitiendo el nombre de la familia.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > src/components/inventory/__tests__/InventoryList.test.jsx (9 tests | 1 failed) 333ms
   [x] InventoryList component > renders code, "Familia / Categoría", storage label with icon, "Preparado" and "Inactivo" 25ms
     > Unable to find an element with the text: Carnes / Res. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

 FAIL  src/components/inventory/__tests__/InventoryList.test.jsx > InventoryList component > renders code, "Familia / Categoría", storage label with icon, "Preparado" and "Inactivo"
TestingLibraryElementError: Unable to find an element with the text: Carnes / Res. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

 > Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 > node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 > node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 > node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 > src/components/inventory/__tests__/InventoryList.test.jsx:172:19
    170|     expect(screen.getByText('Carne Molida')).toBeInTheDocument();
    171|     expect(screen.getByText('CAR-001')).toBeInTheDocument();
    172|     expect(screen.getByText('Carnes / Res')).toBeInTheDocument();
       |                   ^
    173|     expect(screen.getByText('Refrigerado')).toBeInTheDocument();
    174|     expect(screen.getByText('Preparado')).toBeInTheDocument();

 Test Files  1 failed (1)
      Tests  1 failed | 8 passed (9)
```

### Mutación 3: Filtro de inactivos (`useInventoryList.js`)
- **Archivo**: `src/hooks/useInventoryList.js`
- **Mutación**: Se eliminó `includeInactive` de la llamada a `listInventory` en `loadData`.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > src/hooks/__tests__/useInventoryList.test.js (6 tests | 1 failed) 65ms
   [x] useInventoryList hook > reloads list with includeInactive=true when toggled, and defaults to false 20ms
     > expected last "listInventory" call to have been called with [ ObjectContaining{...} ]

 FAIL  src/hooks/__tests__/useInventoryList.test.js > useInventoryList hook > reloads list with includeInactive=true when toggled, and defaults to false
AssertionError: expected last "listInventory" call to have been called with [ ObjectContaining{...} ]

- Expected
+ Received

  Array [
-   ObjectContaining {
-     "includeInactive": false,
+   Object {
+     "low_stock": false,
+     "page": 1,
+     "search": "",
    },
  ]

 > src/hooks/__tests__/useInventoryList.test.js:197:21
    195| 
    196|     expect(result.current.includeInactive).toBe(false);
    197|     expect(listSpy).toHaveBeenLastCalledWith(
       |                     ^
    198|       expect.objectContaining({ includeInactive: false })
    199|     );

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

### Mutación 4: Exigencia de HTTPS en `teamsClient` en producción
- **Archivo**: `src/services/teamsClient.js`
- **Mutación**: Se comentó la validación `if (!envUrl || !envUrl.startsWith('https://')) return null;` dentro de `resolveTeamsBaseUrl`.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > src/services/__tests__/teamsClient.test.js (10 tests | 2 failed) 58ms
   [x] teamsClient service > in production (PROD = true) > rejects teamsRequest without calling fetch when URL uses http:// 18ms
     > expected 'Cannot read properties of undefined (...' to be 'La URL de Ualdo Teams no es segura' // Object.is equality
   [x] teamsClient service > in production (PROD = true) > rejects teamsLogin without calling fetch when URL is insecure 5ms
     > expected 'Cannot read properties of undefined (...' to be 'La URL de Ualdo Teams no es segura' // Object.is equality

 FAIL  src/services/__tests__/teamsClient.test.js > teamsClient service > in production (PROD = true) > rejects teamsRequest without calling fetch when URL uses http://
AssertionError: expected 'Cannot read properties of undefined (...' to be 'La URL de Ualdo Teams no es segura' // Object.is equality

Expected: "La URL de Ualdo Teams no es segura"
Received: "Cannot read properties of undefined (reading 'status')"

 > src/services/__tests__/teamsClient.test.js:93:25
     91|       expect(res.ok).toBe(false);
     92|       expect(res.status).toBe(0);
     93|       expect(res.error).toBe('La URL de Ualdo Teams no es segura');
       |                         ^
     94|       expect(mockFetch).not.toHaveBeenCalled();
     95|     });

 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

### Mutación 5: Validación de entorno en producción (`validateProdEnv.js`)
- **Archivo**: `build/validateProdEnv.js`
- **Mutación**: Se relajó la comprobación para aceptar URLs que inicien con `http://` en `VITE_API_BASE_URL`.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > build/__tests__/validateProdEnv.test.js (5 tests | 1 failed) 17ms
   [x] validateProdEnv module > throws error when VITE_API_BASE_URL uses http:// 11ms
     > expected [Function] to throw an error

 FAIL  build/__tests__/validateProdEnv.test.js > validateProdEnv module > throws error when VITE_API_BASE_URL uses http://
AssertionError: expected [Function] to throw an error

- Expected: 
null

+ Received: 
undefined

 > build/__tests__/validateProdEnv.test.js:15:9
     13|       VITE_API_BASE_URL: 'http://api.ualdo.test/api/v1',
     14|       VITE_TEAMS_API_URL: 'https://teams.ualdo.test/api',
     15|     })).toThrow(/https:\/\//);
       |         ^
     16|   });

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

### Mutación 6: Configuración de tráfico claro en Capacitor
- **Archivo**: `capacitor.config.ts`
- **Mutación**: Se fijó `const isDev = true;` ignorando el valor de la variable de entorno `CAP_DEV`.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > build/__tests__/capacitorConfig.test.js (2 tests | 1 failed) 44ms
   [x] capacitor.config.ts > sets cleartext and allowMixedContent to false when CAP_DEV is undefined 38ms
     > expected true to be false // Object.is equality

 FAIL  build/__tests__/capacitorConfig.test.js > capacitor.config.ts > sets cleartext and allowMixedContent to false when CAP_DEV is undefined
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 > build/__tests__/capacitorConfig.test.js:17:38
     15|     delete process.env.CAP_DEV;
     16|     const config = (await import('../../capacitor.config.ts')).default;
     17|     expect(config.server?.cleartext).toBe(false);
       |                                      ^
     18|     expect(config.android?.allowMixedContent).toBe(false);
     19|     expect(config.appId).toBe('com.ualdo.ecosystem');

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

### Mutación 7: Cálculo de versión de Android
- **Archivo**: `build/__tests__/androidVersion.test.js`
- **Mutación**: Se modificó la fórmula multiplicadora de versión a `parts[0] * 1000 + parts[1] * 10 + parts[2]`.
- **Salida del test**:
```
 RUN  v2.1.9 C:/laragon\www\UALDO

 > build/__tests__/androidVersion.test.js (4 tests | 3 failed) 31ms
   [x] Android version calculation > calculates 10000 for version 1.0.0 22ms
     > expected 1000 to be 10000 // Object.is equality
   [x] Android version calculation > calculates 10203 for version 1.2.3 2ms
     > expected 1023 to be 10203 // Object.is equality
   [x] Android version calculation > calculates correct versionCode for package.json current version 2ms
     > expected 1000 to be 10000 // Object.is equality

 FAIL  build/__tests__/androidVersion.test.js > Android version calculation > calculates 10000 for version 1.0.0
AssertionError: expected 1000 to be 10000 // Object.is equality

- Expected
+ Received

- 10000
+ 1000

 > build/__tests__/androidVersion.test.js:15:50
     13| describe('Android version calculation', () => {
     14|   it('calculates 10000 for version 1.0.0', () => {
     15|     expect(calculateAndroidVersionCode('1.0.0')).toBe(10000);
       |                                                  ^
     16|   });

 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
```

---

## 4. Tabla de cobertura de pruebas (`npm run test:coverage`)

Salida obtenida con Vitest v8 tras la suite completa (44 archivos de prueba, 276 pruebas ejecutadas y aprobadas):

```
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.66 |    84.38 |   79.92 |   96.66 |                   
 build             |     100 |      100 |     100 |     100 |                   
  ...ateProdEnv.js |     100 |      100 |     100 |     100 |                   
 src/components    |   88.37 |     87.8 |    42.3 |   88.37 |                   
  ...CloseView.jsx |   73.63 |    84.84 |      50 |   73.63 | ...16-118,131-133 
  ...eFiloCard.jsx |     100 |    93.75 |      80 |     100 | 134-136           
  ...ntoryView.jsx |   85.63 |    82.35 |   18.18 |   85.63 | ...,73-75,182-187 
 ...ents/assistant |   91.51 |    70.43 |   83.33 |   91.51 |                   
  ...stantChat.jsx |   78.72 |    86.66 |      60 |   78.72 | ...,65-77,151-159 
  ...ageBubble.jsx |   96.77 |       80 |     100 |   96.77 | 8                 
  ...ctionCard.jsx |   95.65 |       80 |     100 |   95.65 | 17-18,24-25       
  ...acyNotice.jsx |   89.47 |    55.55 |     100 |   89.47 | 12-13,26-27       
  ...tionChips.jsx |     100 |       75 |     100 |     100 | 23                
  ...nversation.js |   98.62 |    59.57 |     100 |   98.62 | 100,119           
 ...ents/cashclose |   97.05 |    86.44 |   68.18 |   97.05 |                   
  ...edActions.jsx |   97.88 |    81.08 |   76.92 |   97.88 | 60-62             
  ...oseDetail.jsx |   98.88 |    89.74 |   66.66 |   98.88 | 50-51             
  ...CloseList.jsx |   88.77 |    85.18 |   83.33 |   88.77 | ...19-131,155-156 
  ...anualForm.jsx |     100 |    89.28 |   33.33 |     100 | 81-86             
  ...eviewForm.jsx |   98.17 |    83.92 |   93.33 |   98.17 | 84-86             
  ...entsPanel.jsx |     100 |    88.09 |      75 |     100 | ...21,124,129,152 
 ...nts/cashconfig |   99.15 |    93.39 |   70.58 |   99.15 |                   
  ...onfigView.jsx |     100 |      100 |   66.66 |     100 |                   
  ...atesPanel.jsx |   99.49 |    92.85 |      75 |   99.49 | 217               
  ...ingsPanel.jsx |   98.42 |    90.69 |   66.66 |   98.42 | 63-65             
 ...ents/inventory |   98.86 |    85.59 |    61.9 |   98.86 |                   
  ...ntoryList.jsx |     100 |     92.5 |     100 |     100 | 27,32,225         
  ...eateModal.jsx |   98.88 |       80 |    37.5 |   98.88 | 36-37             
  ...mentModal.jsx |   96.62 |    77.77 |      50 |   96.62 | 109-111,155-157   
  ...toryModal.jsx |     100 |    85.36 |     100 |     100 | ...33,133-136,146 
 .../notifications |    98.7 |    80.35 |      80 |    98.7 |                   
  ...ationItem.jsx |   96.15 |    81.81 |   83.33 |   96.15 | 19-20,61-62       
  ...ionsPanel.jsx |     100 |    79.41 |      75 |     100 | ...29-131,144,208 
 src/hooks         |   98.44 |    80.33 |      98 |   98.44 |                   
  useCashClose.js  |     100 |    63.15 |     100 |     100 | ...07-113,125-131 
  ...mentSubmit.js |     100 |       84 |     100 |     100 | 91-92,100         
  ...hMovements.js |   98.44 |    90.32 |     100 |   98.44 | 116-117           
  ...ssionRates.js |     100 |    62.06 |     100 |     100 | ...17-118,126-131 
  ...entoryList.js |     100 |    89.47 |     100 |     100 | 50-52,68,75       
  ...mentSubmit.js |   88.42 |       70 |     100 |   88.42 | 13-21,92-93       
  ...ifications.js |     100 |    85.71 |     100 |     100 | 33,35,37,54,66    
  ...ntMappings.js |     100 |    80.85 |     100 |     100 | ...1,81,89,95,102 
  ...nreadCount.js |    97.5 |    93.75 |      80 |    97.5 | 96-98             
 src/services      |    97.2 |    86.64 |     100 |    97.2 |                   
  ...tantClient.js |     100 |    63.82 |     100 |     100 | ...06-114,131,138 
  auth.js          |   98.03 |    84.84 |     100 |   98.03 | 20-21             
  ...loseClient.js |   91.21 |     92.5 |     100 |   91.21 | ...26-131,171-176 
  ...nfigClient.js |   96.31 |       95 |     100 |   96.31 | 156-161           
  ...entsClient.js |     100 |    93.93 |     100 |     100 | 76,104            
  ...toryClient.js |    98.6 |    85.41 |     100 |    98.6 | 39-40             
  money.js         |   98.03 |    97.67 |     100 |   98.03 | 34-35             
  ...tionRoutes.js |   94.44 |    80.76 |     100 |   94.44 | 26-27,54-55,88    
  ...ionsClient.js |     100 |      100 |     100 |     100 |                   
  teamsClient.js   |   98.58 |    85.07 |     100 |   98.58 | 76-77             
-------------------|---------|----------|---------|---------|-------------------
```

Todos los archivos requeridos superan holgadamente el 80 % en sentencias y en ramas:
- `build/validateProdEnv.js`: 100 % sentencias, 100 % ramas.
- `src/components/inventory/InventoryList.jsx`: 100 % sentencias, 92.5 % ramas.
- `src/components/InventoryView.jsx`: 85.63 % sentencias, 82.35 % ramas.
- `src/hooks/useInventoryList.js`: 100 % sentencias, 89.47 % ramas.
- `src/services/inventoryClient.js`: 98.6 % sentencias, 85.41 % ramas.
- `src/services/teamsClient.js`: 98.58 % sentencias, 85.07 % ramas.

---

## 5. Verificación de archivos ignorados

Comando ejecutado:
`git check-ignore -v android/keystore.properties android/ualdo-release.jks .env.production`

Salida real:
```
.gitignore:15:android/keystore.properties	android/keystore.properties
.gitignore:14:*.jks	android/ualdo-release.jks
.gitignore:5:.env.production	.env.production
```
Ningún secreto, clave ni credencial forma parte del control de versiones.
