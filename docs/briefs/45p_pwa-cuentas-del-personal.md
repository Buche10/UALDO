# Brief 45p: cuentas del personal en la PWA

## Contexto

Repo: `C:\laragon\www\UALDO` (React 18, Vite, Capacitor 8, Vitest y Testing Library). Rama: `feat/pwa-cuentas-del-personal`, desde `main` con el Brief 44p fusionado (si no lo está, desde `30bd466`; usa solo variables CSS y funcionará con cualquiera de los dos temas).

**Depende del Brief 52 del motor** (`C:\laragon\www\UaldoBusiness\docs\briefs\52_cuentas-del-personal-y-permisos-por-cargo.md`), que añade:

| Endpoint | Uso |
|---|---|
| `GET /api/v1/team?estado=activos\|inactivos\|todos` | lista con `is_active` y `must_change_password` |
| `POST /api/v1/team` `{ name, email, role, password? }` | 201 `{ data, temporary_password }` |
| `POST /api/v1/team/{id}/deactivate` / `reactivate` | 200 `{ data }` |
| `POST /api/v1/team/{id}/reset-password` | 200 `{ data, temporary_password }` |
| `PUT /api/v1/me/password` `{ current_password, password, password_confirmation }` | 200 |
| Cualquier endpoint con contraseña temporal sin cambiar | 403 `{ code: 'password_change_required' }` |
| `POST /api/v1/login` con cuenta desactivada | 403 `{ message }` |

`GET /me` y la respuesta de login traen `must_change_password` en el usuario.

Estado actual de la PWA:

- `src/components/settings/TeamSection.jsx` (168 líneas) y `TeamMemberRow.jsx` (109) listan el equipo y cambian el cargo, solo con `team.manage`.
- `src/services/teamClient.js`: `listTeam(page)` y `updateRole(userId, role)`, con validación local.
- `src/services/permissions.js`: `ROLES`, `ROLE_LABELS` ("Jefe de salón", "Salón", "Cocina", ...), `can(user, ability)` con las habilidades que manda el motor.
- `src/services/apiClient.js`: `request()` maneja 401 (`handleUnauthorized`); no conoce `password_change_required`.
- `src/App.jsx`: guarda `user` y muestra `LoginView` si no hay sesión.

Lee primero `docs/ualdo-brand.md` y esos archivos.

## Objetivo

El dueño, en Más > Ajustes > Equipo, crea cuentas del personal, ve la contraseña temporal una sola vez para entregarla, desactiva, reactiva y restablece contraseñas. Quien entra con una contraseña temporal tiene que cambiarla antes de usar la app.

## Requerimientos

### 1. Cliente (`src/services/teamClient.js`)

Añade `createMember({ name, email, role })`, `deactivateMember(id)`, `reactivateMember(id)`, `resetMemberPassword(id)` y que `listTeam(page, estado)` acepte `activos|inactivos|todos`. Misma validación local que `updateRole` (id numérico, cargo de `ROLES`, nombre de 2 a 80 caracteres, correo con forma válida). Corrige el mensaje "uno de los siete cargos" para que no dependa de un número fijo.

En `src/services/accountClient.js` (nuevo): `changePassword({ currentPassword, password, passwordConfirmation })` contra `PUT /me/password`.

### 2. Crear cuenta (`src/components/settings/TeamCreateForm.jsx`, nuevo)

- Botón pastilla "Crear cuenta" en `TeamSection`, solo con `team.manage`.
- Campos: nombre, correo, cargo (lista de `ROLE_LABELS`, por defecto "Salón"). Debajo del correo, ayuda: "Si la persona no tiene correo, usa uno inventado con el dominio del negocio, por ejemplo maria@doblefilo.ualdocorp.com. No se envía nada a ese correo."
- Al crear, muestra `TemporaryPasswordDialog.jsx` (nuevo): nombre, correo, la contraseña temporal en grande (fuente mono), botón "Copiar" (Clipboard API con manejo de error) y el texto "Entrégala en persona. No se vuelve a mostrar. Al entrar por primera vez tendrá que cambiarla." Al cerrar el diálogo, la contraseña se borra del estado (no queda en ningún `useState` ni en `localStorage`).
- Errores 422 por campo ("Ese correo ya tiene cuenta.").

### 3. Acciones por persona (`TeamMemberRow.jsx`)

- Etiqueta "Desactivada" y "Debe cambiar contraseña" cuando corresponda.
- Menú con "Restablecer contraseña" (abre `TemporaryPasswordDialog`), "Desactivar" (confirmación: "{nombre} ya no podrá entrar. Puedes reactivarla después.") y "Reactivar".
- No muestra "Desactivar" en la fila del propio dueño. Muestra el 422 del último dueño tal cual llega.
- Filtro en `TeamSection`: Activas, Desactivadas, Todas.
- Si `TeamMemberRow` pasa de 200 líneas, extrae el menú a `TeamMemberActions.jsx`.

### 4. Cambio de contraseña obligatorio

- `src/components/ChangePasswordView.jsx` (nuevo): contraseña actual (la temporal), nueva y repetir. Reglas visibles: mínimo 8 caracteres, letras y números. Botón "Guardar contraseña". Al guardar, refresca el usuario con `GET /me` y entra a la app.
- `App.jsx`: si `user.must_change_password` es `true`, muestra `ChangePasswordView` en lugar de la app (con opción "Salir").
- `apiClient.js`: si una respuesta es 403 con `code === 'password_change_required'`, avisa a la app (mismo patrón que `handleUnauthorized`, por ejemplo un evento o un callback registrado) para que muestre `ChangePasswordView`.
- `LoginView`: el 403 de cuenta desactivada muestra el mensaje del motor.
- En Ajustes > Cuenta (`AccountSection.jsx`), opción "Cambiar contraseña" que abre la misma vista para cualquier usuario.

## Restricciones técnicas

- CERO EMOJIS, sin excepción: ni en interfaz, textos, código, comentarios, logs, consola, commits, docs, tests, datos semilla o nombres de archivo. Iconos solo en SVG.
- Marca: sigue estrictamente `docs/ualdo-brand.md` (variables CSS, Poppins, botones pastilla, tono). Ningún color escrito a mano. Conserva las tildes.
- Seguridad: la contraseña temporal nunca en `localStorage`, `sessionStorage`, logs ni URL; campos de contraseña con `type="password"` y `autoComplete` correcto (`current-password`, `new-password`); escapa todo lo que viene del motor (React ya lo hace; no uses `dangerouslySetInnerHTML`).
- Diseño: SOLID, DRY, KISS, funciones de menos de 50 líneas, archivos de menos de 800 (componentes de menos de 200), sin anidación de más de 4 niveles, inmutabilidad.
- No añadas dependencias. No toques archivos fuera del alcance.

## Tests (Vitest y Testing Library)

1. `teamClient`: validaciones locales de cada función nueva; rutas y métodos correctos.
2. `TeamCreateForm`: sin `team.manage` no aparece; crea, muestra la temporal una vez, al cerrar ya no está en el DOM; muestra el 422 de correo repetido.
3. `TeamMemberRow`: desactivar pide confirmación; no aparece "Desactivar" en la propia fila; restablecer abre el diálogo.
4. `ChangePasswordView`: valida longitud y coincidencia; envía; con 422 muestra el error.
5. `App`: con `must_change_password` muestra `ChangePasswordView`; un 403 `password_change_required` desde `apiClient` también.
6. `LoginView`: 403 de cuenta desactivada muestra el mensaje.
7. Ningún test deja la contraseña temporal en `localStorage` (compruébalo).
8. Los tests existentes siguen en verde.

Cobertura de al menos 80 % del código nuevo.

## Verificación final

```bash
cd C:/laragon/www/UALDO && npm run lint
cd C:/laragon/www/UALDO && npm test
cd C:/laragon/www/UALDO && npm run build
```

Prueba manual con el motor local (Brief 52 fusionado): crea una cuenta "Salón", entra con ella en otra ventana privada, cambia la contraseña, comprueba que ve Reservas y la declaración del cierre de caja, y no ve Horas extra ni totales de venta; desactívala y comprueba que ya no entra.

## Criterios de aceptación

- [ ] El dueño crea, desactiva, reactiva y restablece cuentas desde Equipo.
- [ ] La contraseña temporal se ve una sola vez y no se guarda en ningún lado.
- [ ] Con contraseña temporal, la app obliga a cambiarla antes de seguir.
- [ ] Cuenta desactivada: el login muestra el mensaje del motor.
- [ ] Cualquier usuario puede cambiar su contraseña desde Ajustes > Cuenta.
- [ ] Sin colores escritos a mano, sin emojis y sin tildes perdidas en el diff.
- [ ] Lint, tests y build en verde; prueba manual hecha.
