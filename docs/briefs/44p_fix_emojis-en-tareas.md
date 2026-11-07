# Brief 44p_fix: emojis que quedan en el detalle de tareas

## Contexto

Repo: `C:\laragon\www\UALDO`. La auditoría del Brief 44p (2026-11-06) aprobó el tema blanco: variables, logos, PWA y Android están bien, y lint, tests y build quedan en verde. Hay un solo hallazgo HIGH: quedan dos emojis heredados en `src/components/TaskDetailView.jsx`, y uno está en una línea que tocó el 44p.

- Línea 225: `⏳ Qué falta:`
- Línea 309: `⏳ ¿Qué pendiente queda para el siguiente?`

El test de colores (`src/__tests__/themeTokens.test.js`) no busca emojis, así que no lo detectó.

El trabajo del 44p está sin commitear y en `main`. Antes de este arreglo, pásalo a su rama: `git switch -c feat/pwa-tema-blanco` (lleva consigo los cambios sin commitear).

## Objetivo

No queda ningún emoji en `src/`, y un test impide que vuelva a entrar alguno.

## Requerimientos

1. `src/components/TaskDetailView.jsx`: quita los dos `⏳` y el espacio que les sigue. El texto queda "Qué falta:" y "¿Qué pendiente queda para el siguiente?", con sus tildes.
2. `src/__tests__/noEmojis.test.js` (nuevo): recorre `src/**/*.{js,jsx,css}` (sin `node_modules`) y falla con archivo y línea si encuentra un carácter en estos rangos Unicode: `U+2190-21FF`, `U+2300-23FF`, `U+2460-24FF`, `U+25A0-27BF`, `U+2900-297F`, `U+2B00-2BFF`, `U+3030`, `U+303D`, `U+FE0F` y `U+1F000-1FAFF`. Usa la expresión regular con la bandera `u`. Escribe los rangos con escapes `\u{...}`, nunca con el carácter literal, para que el propio test no contenga emojis.
   - Si el test encuentra otros caracteres en `src/` que no son emojis (por ejemplo una flecha usada como texto), cámbialos por texto o por un icono SVG.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG.
- Conserva las tildes.
- No toques nada más del 44p.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Después, la prueba manual en Android del Brief 44p (arranque, barra de estado, pantallas e ícono, con el teléfono en modo claro y en modo oscuro), si no está hecha.

## Criterios de aceptación

- [ ] El trabajo del 44p y este arreglo están en la rama `feat/pwa-tema-blanco`, no en `main`.
- [ ] Ya no hay `⏳` en `TaskDetailView.jsx` y los textos conservan sus tildes.
- [ ] `noEmojis.test.js` pasa y fallaría si alguien añade un emoji.
- [ ] Lint, tests y build en verde; prueba manual en Android hecha.
