# Brief 44p: la PWA y la APK en tema blanco

## Contexto

Repo: `C:\laragon\www\UALDO` (React 18, Vite, Capacitor 8, Android `minSdk 24`, `targetSdk 36`). Rama: `feat/pwa-tema-blanco`, desde `main` en `30bd466`.

El usuario pidió el 2026-11-06 cambiar el color de la app de Ualdo por uno blanco. Hoy todo es oscuro:

| Dónde | Valor actual |
|---|---|
| `src/styles/main.css` `:root` | `--bg-dark: #1d1d1b`, tarjetas `rgba(32, 45, 47, ...)`, texto `#f1f7f7`, `--accent: #62c9c8` usado como texto |
| `src/styles/main.css` `body` | `background-color: #151513` |
| `index.html` | `<meta name="theme-color" content="#0b0f19">` |
| `public/manifest.json` | `background_color` y `theme_color` `#0b0f19` |
| `public/icon.svg` | degradado oscuro `#0b0f19` a `#161e31` |
| `android/app/src/main/res/values/ic_launcher_background.xml` | `#1d1d1b` |
| `android/app/src/main/res/values/styles.xml` | `AppTheme.NoActionBar` hereda de `Theme.AppCompat.DayNight.NoActionBar` (se vuelve oscuro si el teléfono está en modo oscuro); referencia `@color/colorPrimary`, `colorPrimaryDark` y `colorAccent` sin `colors.xml` propio |
| `android/app/src/main/res/drawable*/splash.png` | imagen de arranque oscura (11 densidades) |
| `capacitor.config.ts` | bloque `plugins.SplashScreen` con `backgroundColor: '#1d1d1b'`, pero **`@capacitor/splash-screen` no está instalado**: ese bloque no hace nada. El arranque real lo pinta `androidx.core:core-splashscreen` con el tema `AppTheme.NoActionBarLaunch` |

Colores escritos a mano fuera de `:root`: 23 en `main.css`, 30 en `src/styles/assistant.css` y estilos en línea en 11 componentes (`LoginView.jsx`, `NetworkView.jsx`, `sales/SalesHoursChart.jsx`, `sales/SalesItemsList.jsx`, `sales/SalesSummary.jsx`, `settings/AccountSection.jsx`, `settings/AdvancedSettingsSection.jsx`, `settings/NotificationPreferencesSection.jsx`, `settings/SettingsAboutSection.jsx`, `TaskDetailView.jsx`, `TrabajoView.jsx`).

Logos: `public/brand/ualdo-claro.png` es en realidad el logo **para fondo oscuro** (mismo archivo que `docs/brand-assets/ualdo-logo-horizontal-fondo-oscuro.png`: "aldo." en blanco). Sobre blanco no se vería. Lo usan `Header.jsx:70` y `LoginView.jsx:52`.

Lee primero `docs/ualdo-brand.md`, en especial la tabla de contraste (sobre blanco: texto `#1d1d1b` o `#00737f`; `#2d9ba1` solo en títulos grandes; **nunca `#62c9c8` como texto**).

## Objetivo

La PWA y la APK se ven con fondo blanco y texto negro de marca en todas las pantallas, con buen contraste; la barra de estado, la barra de navegación, el arranque y el ícono de Android son blancos y legibles, también con el teléfono en modo oscuro. No queda ningún color escrito a mano fuera de `:root`.

## Requerimientos

### 1. Variables de color (`src/styles/main.css`)

Conserva los nombres de las variables (renombrarlas sería un cambio enorme; queda fuera de alcance) y cambia sus valores. Añade un comentario en `:root`: "Tema claro (Brief 44p). Los nombres heredados como --bg-dark ya no significan oscuro."

| Variable | Valor nuevo |
|---|---|
| `--bg-dark` | `#ffffff` |
| `--bg-card` | `#f5fafa` |
| `--bg-card-hover` | `#eaf4f4` |
| `--bg-glass` | `rgba(255, 255, 255, 0.92)` |
| `--border-glass` | `rgba(29, 29, 27, 0.10)` |
| `--border-glow` | `rgba(0, 115, 127, 0.35)` |
| `--primary` / `--primary-2` / `--secondary` | `#00737f` / `#2d9ba1` / `#2d9ba1` |
| `--primary-glow` / `--primary-soft` | `rgba(0, 115, 127, 0.25)` / `rgba(0, 115, 127, 0.10)` |
| `--accent` | `#00737f` (se usa como texto; el aqua no puede ser texto sobre blanco) |
| `--accent-blue` | `#2d9ba1` |
| `--accent-soft` | `rgba(98, 201, 200, 0.15)` |
| `--text-main` / `--text-muted` / `--text-subtle` | `#1d1d1b` / `#4d4d4b` / `#6f6f6c` |
| `--success` / `--success-soft` / `--border-success` | `#0e7a52` / `rgba(14, 122, 82, 0.10)` / `rgba(14, 122, 82, 0.30)` |
| `--warning` / `--warning-soft` / `--border-warning` | `#9a5b00` / `rgba(154, 91, 0, 0.08)` / `rgba(154, 91, 0, 0.30)` |
| `--error` / `--error-soft` / `--error-soft-strong` / `--border-error` | `#c8102e` / `rgba(200, 16, 46, 0.06)` / `rgba(200, 16, 46, 0.12)` / `rgba(200, 16, 46, 0.30)` |
| `--success-glow` | `rgba(14, 122, 82, 0.20)` |
| `--overlay` | `rgba(29, 29, 27, 0.45)` |
| `--chip-bg` / `--surface-soft` / `--surface-strong` | `#eef5f5` / `#f5fafa` / `#eaf3f3` |
| `--track-bg` | `rgba(29, 29, 27, 0.08)` |
| `--badge-active-bg` / `--badge-inactive-bg` | `rgba(0, 115, 127, 0.12)` / `rgba(29, 29, 27, 0.06)` |
| `--card-subtle-bg` / `--card-subtle-border` | `rgba(29, 29, 27, 0.03)` / `rgba(29, 29, 27, 0.06)` |
| `--grad-surface` | `linear-gradient(180deg, #ffffff 0%, #f3f9f9 100%)` |
| `--grad-glow` | `linear-gradient(90deg, rgba(0, 115, 127, 0.08), rgba(98, 201, 200, 0.12))` |
| `--shadow-dialog` | `0 8px 32px rgba(29, 29, 27, 0.12)` |
| `--storage-ambient-color` / `--storage-refrigerated-color` / `--storage-frozen-color` | `var(--ualdo-petroleo)` en los tres (texto) |
| `--badge-inactive-bg` (segunda definición, línea de catálogo) | elimínala: está duplicada |
| `--badge-inactive-color` | `var(--text-muted)` |

Nuevas variables, para no dejar colores sueltos:

- `--body-bg: #eef6f6` (fondo alrededor del marco en escritorio);
- `--root-shadow: 0 0 60px rgba(29, 29, 27, 0.10), 0 0 1px rgba(0, 115, 127, 0.25)`;
- `--scrollbar-thumb: rgba(29, 29, 27, 0.18)`;
- `--on-accent-graphic: #1d1d1b` (texto encima de un relleno aqua, si existe alguno);
- las que necesites para los gráficos de ventas (por ejemplo `--chart-bar`, `--chart-bar-muted`), siempre de la paleta.

`--grad-primary`, `--on-primary` y las `--ualdo-*` no cambian.

### 2. Cero colores escritos a mano fuera de `:root`

1. `main.css` (después de `:root`), `assistant.css` y los 11 componentes de la lista: reemplaza cada hex, `rgb()` y `rgba()` por una variable. Los estilos en línea pasan a `var(--...)` o a una clase.
2. `body` usa `var(--body-bg)`; `#root` usa `var(--root-shadow)`; el borde del marco en escritorio usa `var(--border-glass)`.
3. Revisa a ojo cada pantalla: textos que antes eran blancos sobre oscuro (por ejemplo `color: #fff` en tarjetas) deben pasar a `var(--text-main)`; los que van sobre un botón petróleo siguen en `var(--on-primary)`.
4. Los botones primarios siguen siendo pastilla petróleo con texto blanco; los secundarios, fondo blanco, borde suave y texto petróleo (`docs/ualdo-brand.md`).

### 3. Logos

1. Copia `docs/brand-assets/ualdo-logo-horizontal-fondo-claro.png` a `public/brand/ualdo-fondo-claro.png`.
2. Renombra `public/brand/ualdo-claro.png` a `public/brand/ualdo-fondo-oscuro.png` (el nombre actual es engañoso) y borra `public/brand/ualdo-oscuro.png` si nadie lo usa (búscalo con `grep`).
3. `Header.jsx` y `LoginView.jsx` usan `/brand/ualdo-fondo-claro.png`.

### 4. PWA

1. `index.html`: `theme-color` `#ffffff`.
2. `public/manifest.json`: `background_color` y `theme_color` `#ffffff`.
3. `public/icon.svg`: fondo blanco con el isotipo de marca (la "U" aqua y el punto petróleo), sin el degradado oscuro.

### 5. APK Android

1. Crea `android/app/src/main/res/values/colors.xml` con `ualdo_blanco #FFFFFF`, `ualdo_negro #1D1D1B`, `colorPrimary #00737F`, `colorPrimaryDark #FFFFFF`, `colorAccent #2D9BA1`.
2. `values/ic_launcher_background.xml`: `#FFFFFF`.
3. `values/styles.xml`:
   - `AppTheme.NoActionBar` hereda de `Theme.AppCompat.Light.NoActionBar` (siempre claro, aunque el teléfono esté en modo oscuro);
   - añade `android:statusBarColor` y `android:navigationBarColor` `@color/ualdo_blanco`, `android:windowLightStatusBar` `true` y `android:windowBackground` `@color/ualdo_blanco`;
   - `AppTheme.NoActionBarLaunch`: `windowSplashScreenBackground` `@color/ualdo_blanco`, `windowSplashScreenAnimatedIcon` `@mipmap/ic_launcher_foreground`, `postSplashScreenTheme` `@style/AppTheme.NoActionBar`, y deja `android:background` en `@drawable/splash`.
4. Crea `values-v27/styles.xml` solo con `android:windowLightNavigationBar` `true` en `AppTheme.NoActionBar` (heredando del tema base), porque ese atributo no existe en API 24-26.
5. Arranque en Android 11 y anteriores: borra los 11 `splash.png` (`drawable/` y `drawable-land-*`, `drawable-port-*`) y crea `drawable/splash.xml`, un `layer-list` con fondo `@color/ualdo_blanco` y el isotipo centrado (`drawable-nodpi/splash_logo.png`, copiado de `docs/brand-assets/ualdo-isotipo.png`, reducido a 288 px de ancho como máximo).
6. Ícono: regenera los íconos de lanzador con Android Studio (`File > New > Image Asset`, tipo "Launcher Icons (Adaptive and Legacy)"), primer plano `docs/brand-assets/ualdo-isotipo.png`, fondo color `#FFFFFF`. Sustituye los `mipmap-*/ic_launcher*.png`. No cambies `mipmap-anydpi-v26/*.xml`.
7. `capacitor.config.ts`: borra el bloque `plugins.SplashScreen` (el plugin no está instalado y el bloque confunde). No instales `@capacitor/splash-screen` ni `@capacitor/status-bar`: el tema de Android basta.
8. Sube `versionCode` y `versionName` en `android/app/build.gradle` y la versión de `package.json` a `1.3.0`.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG.
- Marca: sigue estrictamente `docs/ualdo-brand.md` (paleta vía variables CSS, Poppins, logo oficial, botones pastilla, contraste). Conserva las tildes: en cada diff compara líneas quitadas y añadidas.
- Sigue las convenciones existentes del repo.
- No cambies comportamiento, textos ni lógica: solo color, logos y recursos de Android.
- Contraste mínimo 4.5:1 en texto normal y 3:1 en texto grande y en iconos.
- No añadas dependencias. No toques archivos fuera de los indicados.
- Archivos de menos de 800 líneas: si `assistant.css` o `main.css` crecen, no los partas en este brief; solo no los hagas crecer más de 30 líneas.

## Tests (Vitest)

1. `src/__tests__/themeTokens.test.js`:
   - lee `src/styles/main.css` y comprueba que `--bg-dark` es `#ffffff`, `--text-main` es `#1d1d1b` y `--accent` no es `#62c9c8`;
   - recorre `src/styles/*.css` y `src/components/**/*.jsx` (sin `__tests__`) y falla si encuentra un hex de 3 o 6 dígitos, `rgb(` o `rgba(` fuera del bloque `:root` de `main.css`. Mensaje de fallo con archivo y línea.
2. `src/__tests__/brandLogos.test.jsx`: `Header` y `LoginView` pintan `/brand/ualdo-fondo-claro.png`.
3. Los tests existentes siguen en verde; si alguno comprueba un color, actualízalo al valor nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
cd C:/laragon/www/UALDO && npx cap sync android
```

Prueba manual en Android (APK con `npm run android:release`), con el teléfono en modo claro y luego en modo oscuro:

1. El arranque es blanco con el isotipo; no aparece ningún destello oscuro.
2. La barra de estado es blanca con hora e iconos oscuros, legibles; la barra de navegación también.
3. Chat, Más, Inventario, Caja, Reservas, Horas extra, Incidencias y Ajustes: fondo blanco, texto negro, botones petróleo, sin textos blancos perdidos.
4. El ícono en el lanzador tiene fondo blanco.

## Criterios de aceptación

- [ ] `:root` de `main.css` tiene los valores de la tabla y las variables nuevas.
- [ ] El test de tokens no encuentra ningún color escrito a mano fuera de `:root`.
- [ ] Cabecera y login usan el logo para fondo claro; el archivo mal nombrado quedó renombrado.
- [ ] `index.html`, `manifest.json` e `icon.svg` son blancos.
- [ ] Android: `colors.xml`, estilos claros también en modo oscuro, barra de estado legible, arranque blanco sin `splash.png`, ícono con fondo blanco.
- [ ] `capacitor.config.ts` sin el bloque `SplashScreen` muerto; versión 1.3.0.
- [ ] Sin emojis y sin tildes perdidas en el diff.
- [ ] Lint, tests y build en verde; prueba manual en Android hecha en modo claro y oscuro.
