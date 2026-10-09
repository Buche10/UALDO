# Brief 18-PWA_fix: que la publicación en Android funcione de punta a punta

## Contexto

**Repo:** `C:\laragon\www\UALDO` (PWA de Ualdo: React 18, Vite 5, Capacitor 8, Vitest 2). Rama
`feat/pwa-catalog-release`; el Brief 18-PWA quedó en el commit `7ee0251`. Trabaja sobre esa rama. **No toques** el
motor ni NexoTeams.

Lee primero `docs/briefs/18p_pwa-catalogo-y-publicacion-android.md`, `docs/RESUMEN-18p.md`,
`docs/runbooks/RUNBOOK-publicacion-android.md`, `capacitor.config.ts`, `package.json` y
`android/gradle/wrapper/gradle-wrapper.properties`.

**Resultado de la auditoría del 18-PWA (2026-10-08).** El catálogo y la seguridad están bien:
- lint sin errores, 276 tests en verde y cobertura de más del 80 % en los archivos tocados;
- la guardia del build corta sin `VITE_API_BASE_URL`, y corta con NexoTeams en `http://`;
- `teamsClient` exige HTTPS en producción;
- `cleartext` y `allowMixedContent` solo se activan con `CAP_DEV=1`;
- la versión de Android sale de `package.json`, y el keystore y `.env.production` siguen ignorados;
- siete mutaciones reales.

**Pero la publicación no funciona:**

1. **HIGH: `cap sync` está roto.** Al pasar la configuración a `capacitor.config.ts`, `npm run android:sync` falla
   en `npx cap sync android` con este error:

   ```
   [error] Could not find installation of TypeScript.
           To use capacitor.config.ts files, you must install TypeScript in your project, e.g. w/ npm install -D typescript
   ```

   - El build web termina, pero **no se copia a Android**. `android:release` empaquetaría los archivos web
     **anteriores**, sin aviso.
   - Los tests no lo detectan porque Vitest compila TypeScript por su cuenta.
2. **MEDIUM: el runbook no indica qué JDK usar.**
   - El proyecto usa Gradle 8.14.3 (`gradle-wrapper.properties`).
   - El JDK que trae Android Studio en este PC es la versión **25**, y Gradle falla con
     `Unsupported class file major version 69`.
   - El `java` del sistema es la versión 8, demasiado vieja.
   - Hace falta un JDK **21**, o el 17. El runbook solo dice "JDK".
3. **MEDIUM: la evidencia del SDK es incorrecta.** `docs/RESUMEN-18p.md` (sección 2.3) dice que el Android SDK no
   está instalado. **Sí lo está**: `C:\Users\cbuch\AppData\Local\Android\Sdk`, con `build-tools` 35 y 36 y
   `platform-tools`. Lo que faltaba eran las variables `ANDROID_HOME` y `JAVA_HOME` y un JDK compatible. El APK que
   existe en `android/app/build/outputs/apk/release/` es **del 16 de septiembre**, con `versionCode 1`: no sale de
   este brief.
4. **LOW: el mensaje del commit no tiene tildes** ("catalogo", "publicacion"). No reescribas el historial; en los
   próximos commits, usa tildes.

## Objetivo

Que `npm run android:release` genere, desde cero, un APK firmado con los archivos web actuales y la versión de
`package.json`, y que el runbook diga exactamente qué instalar y configurar para lograrlo en este PC.

## Requerimientos

1. **Arreglar `cap sync`.** Elige una de estas dos opciones y justifícala en el resumen:
   - **A, recomendada:** agrega `typescript` como `devDependency`. Es una dependencia solo de desarrollo, la que
     exige la propia CLI de Capacitor para leer `capacitor.config.ts`. Fija una versión compatible con Capacitor 8.
   - **B:** vuelve a una configuración que la CLI lea sin TypeScript, manteniendo `cleartext` y `allowMixedContent`
     en `false` salvo con `CAP_DEV=1`. Antes, verifica en la documentación de Capacitor 8 que ese formato existe.

   En cualquiera de las dos, `npx cap sync android` debe terminar sin errores.
2. **Que el error no pase en silencio:**
   - agrega el script `android:check-config`, que ejecute `npx cap config` (o el comando equivalente de Capacitor 8
     que carga e imprime la configuración);
   - `android:sync` lo ejecuta antes del `cap sync`;
   - si la configuración no carga, el script falla con código distinto de 0.
3. **JDK en el runbook** (`RUNBOOK-publicacion-android.md`, sección de requisitos):
   - **JDK 21**, o el 17, compatible con Gradle 8.14.3, y por qué el JDK 25 de Android Studio no sirve;
   - cómo configurarlo:
     - instalar Temurin 21;
     - definir `JAVA_HOME` y `ANDROID_HOME` (`C:\Users\<usuario>\AppData\Local\Android\Sdk`);
     - o, en Android Studio, ajustar **Gradle JDK** a la versión 21;
   - cómo comprobarlo: `java -version` y `gradlew.bat --version`;
   - **no** subas la versión de Gradle ni del plugin de Android en este brief.
4. **`android:release`:**
   - debe funcionar desde la raíz del repo en Windows: usa `cd android && .\\gradlew.bat assembleRelease`, o el
     equivalente que funcione en `cmd` y en PowerShell;
   - antes de compilar, borra el APK anterior de `android/app/build/outputs/apk/release/` (con `gradlew clean` o con
     el borrado de esa carpeta), para que nunca quede uno viejo que parezca nuevo;
   - documéntalo.
5. **`docs/RESUMEN-18p.md`:** corrige la sección 2.3 (el SDK está instalado) y agrega una sección "Corrección 18p_fix"
   con la salida real de:
   - `npm run android:check-config`;
   - `npm run android:sync`, sin el error de TypeScript;
   - si instalas el JDK 21: `npm run android:release`, `output-metadata.json` (debe mostrar `versionCode` 10000 y
     `versionName` 1.0.0) y `apksigner verify --print-certs` sobre el APK nuevo. Sin rutas personales ni secretos:
     reemplaza el usuario por `<usuario>` y no copies huellas completas, basta con indicar que el certificado es el
     de `ualdo-release`.

   Si no instalas el JDK, dilo, y deja los pasos exactos para que el auditor lo verifique.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en código, comentarios, scripts, documentación, tests ni mensajes de commit. Tampoco símbolos decorativos de terminal pegados en la documentación.
- **Español con tildes** en documentos y mensajes de commit.
- **Seguridad:**
  - el keystore, `keystore.properties` y `.env.production` siguen ignorados;
  - ninguna contraseña en scripts, documentos ni salidas pegadas;
  - `cleartext` y `allowMixedContent` en `false` salvo `CAP_DEV=1`.
- **Alcance:** solo `package.json` y su lock, la configuración de Capacitor si eliges la opción B, el runbook, el
  resumen y un test si hace falta. No cambies Gradle, el plugin de Android ni el código de la app.

## Tests

1. **Configuración de Capacitor:** los tests de `build/__tests__/capacitorConfig.test.js` siguen en verde.
2. **Que la CLI de Capacitor pueda cargar la configuración.** Agrega un test o un script que lo compruebe. Por
   ejemplo, un test que ejecute `npx cap config --json` con `child_process`, compruebe que sale con 0 y que
   `server.cleartext` vale `false`. Márcalo para que corra solo si existe `node_modules/@capacitor/cli`.
   **Mutación:** quitar la dependencia o volver a una configuración que la CLI no lea; el test debe fallar. Pega la
   salida real completa, sin símbolos de terminal (reemplázalos por `[ok]`, `[x]` y `>`).
3. **Regresión:** los 276 tests existentes siguen en verde.

## Verificación final

```
npm run lint
npm test
npm run android:check-config
npm run android:sync
git status --short
git check-ignore -v android/keystore.properties android/ualdo-release.jks .env.production
```

Si tienes el JDK 21: `npm run android:release` y `apksigner verify` sobre el APK nuevo.

## Criterios de aceptación

- [ ] `npm run android:sync` termina sin errores y copia los archivos web actuales a Android.
- [ ] Si la configuración de Capacitor no carga, `android:sync` falla en lugar de seguir en silencio.
- [ ] `android:release` borra el APK anterior y funciona desde la raíz en Windows.
- [ ] El runbook exige JDK 21 (o el 17) y explica cómo configurarlo y comprobarlo.
- [ ] `docs/RESUMEN-18p.md` corrige lo del SDK y trae las salidas reales del sync y, si es posible, del APK firmado con `versionCode` 10000.
- [ ] Cero emojis; español con tildes, también en el commit; ningún secreto expuesto.
- [ ] `lint` y `test` en verde.
