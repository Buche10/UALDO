# Instalación en la PC del local: agente Ualdo para RunFood

Guía para instalar en la computadora del restaurante (DESKTOP-4AP0OJ6) el agente que lee RunFood y envía los datos al motor de Ualdo (`https://api.ualdocorp.com`).

RunFood no ofrece API, así que el agente lee directamente la base de datos SQL Server de RunFood con un usuario de **solo lectura**. Nunca escribe, modifica ni borra nada en RunFood.

Tiempo estimado: 45 minutos. Hay que estar físicamente en la PC del local (o conectado por escritorio remoto) con una cuenta de administrador de Windows.

Instalado por primera vez en Doble Filo el 2026-10-30. El registro de esa instalación está en `UaldoBusiness/docs/runfood/INSTALACION-doblefilo-2026-10-30.md`.

---

## 1. Qué se instala en la computadora

| Qué | Dónde | Para qué | ¿Se descarga algo? |
|---|---|---|---|
| Scripts de reconocimiento (archivos `.sql`, `.bat` y `.ps1`) | `C:\UaldoRecon\` | Verificar que las tablas de RunFood coinciden con lo que espera el agente (solo consultas `SELECT`) y crear el usuario de lectura. | No, vienen en `UaldoAgent.zip` |
| Usuario de SQL Server `ualdo_lector` | Dentro de SQL Server, solo en la base `RUNFOODN` | Permite leer las tablas de RunFood sin poder modificarlas (rol `db_datareader` más bloqueos `DENY` explícitos). No tiene acceso a las otras bases. | No |
| Agente de caja (archivos `.js`, sin dependencias externas) | `C:\UaldoAgent\` | Lee el cierre de caja del día y lo envía al motor. | No, viene en `UaldoAgent.zip` |
| Archivo de configuración `agent.config.json` | `C:\UaldoAgent\` | Guarda la dirección del motor, el token del agente y la clave de `ualdo_lector`. Solo lo pueden leer Administradores y SYSTEM. | No, lo crea `crear_config.ps1` |
| Tarea programada `UaldoRunFoodCashSnapshot` | Programador de tareas de Windows | Ejecuta el agente como SYSTEM todos los días a las 00:30, 02:00 y 05:30, aunque nadie haya iniciado sesión. | No |

**Lo que ya debe estar en la PC** (viene con RunFood Core 18, no hay que instalarlo):

| Requisito | Cómo comprobarlo |
|---|---|
| Node.js 22 | `node --version` debe responder `v22.x` |
| SQL Server 2019 con `sqlcmd` | `sqlcmd -?` debe mostrar la ayuda |
| Base `RUNFOODN` | La usa RunFood a diario |
| Salida a internet por HTTPS | Paso 0 de esta guía |

**Lo que NO se instala:** ningún servicio que reciba conexiones desde internet. No se abre ningún puerto en el router ni en el firewall. La PC solo habla hacia afuera.

**Lo que NO se toca:** RunFood, sus servicios (`runfoodcore.exe`, pm2), sus puertos (999 a 1004) ni sus datos.

---

## 2. Qué hace el agente

1. Tres veces cada madrugada (00:30, 02:00 y 05:30) lee el cierre de caja del día anterior de la bodega 2, que es la que lleva la operación diaria:
   - las formas de pago;
   - el arqueo de RunFood (`ArqueoCierreRunFood`);
   - los documentos de venta (facturas y notas de entrega).
2. Arma una "foto" del día y la envía al motor en `POST https://api.ualdocorp.com/api/v1/agent/cash-days`, autenticado con su token.
3. Revisa también los días anteriores y envía los que falten o hayan cambiado. Repetir el envío no duplica datos.
4. Si no hay internet, guarda la foto en una cola local (`C:\UaldoAgent\data\`) y la reintenta en la siguiente ejecución.

Hoy el agente solo cubre la caja diaria. El consumo de insumos por ventas (explosión de recetas) es una fase posterior que usará el mismo usuario de solo lectura.

---

## 3. Antes de ir al local

- [ ] Copiar `UaldoAgent.zip` a un pendrive. Contiene `UaldoAgent\` (el agente), `UaldoRecon\` (los scripts de revisión) y esta guía. No contiene claves ni tokens.
- [ ] Tener a mano el gestor de contraseñas para guardar la clave de `ualdo_lector` y el token del agente.
- [ ] Coordinar un horario sin servicio. Nada de esto detiene RunFood, pero conviene no trabajar en la caja mientras se atiende.
- [ ] Tener acceso a la terminal del servidor (Coolify) para generar el token del agente (paso 4).

**Cómo escribir los comandos** (lo que más falló en la primera instalación):

- Escribe o pega **un comando por vez** y pulsa Enter. Si copias desde esta guía en el Bloc de notas, copia solo las líneas de comando: nunca las que tienen tres comillas invertidas ni la palabra `bat` o `powershell`.
- Si un comando falla de forma rara, escríbelo a mano en vez de pegarlo: al pegar a veces se cuelan caracteres invisibles.
- En teclado español: la barra `\` es **AltGr + º**, la barra vertical `|` es **AltGr + 1**.
- Fíjate en el cero de `09_columnas_caja.sql`: no es la letra O.

---

## 4. Pasos

### Paso 0. Comprobar requisitos (2 min)

Abrir `cmd` **como administrador** (clic derecho en Símbolo del sistema, "Ejecutar como administrador") y ejecutar, uno por uno:

```bat
node --version
```

```bat
sqlcmd -?
```

```bat
curl.exe -s -o NUL -w "%{http_code}" https://api.ualdocorp.com/up
```

Resultado esperado: `v22...`, la ayuda de sqlcmd y `200`. Si alguno falla, detenerse y avisar.

### Paso 1. Extraer el zip y verificar las columnas de caja (5 min, solo lectura)

1. Clic derecho en `UaldoAgent.zip`, "Extraer todo...", y como destino escribir `C:\`. Deben quedar `C:\UaldoAgent\` y `C:\UaldoRecon\`. Si `C:\UaldoRecon\` ya existía de una instalación anterior, renómbrala antes (por ejemplo a `C:\UaldoRecon_viejo`): los scripts viejos usan columnas que ya no existen en Core 18.
2. En el `cmd` de administrador:

```bat
cd C:\UaldoRecon
```

```bat
sqlcmd -S localhost -E -d RUNFOODN -i 09_columnas_caja.sql -s, -W -o columnas_caja.csv
```

Si responde "Invalid filename", usar esta otra forma:

```bat
type 09_columnas_caja.sql | sqlcmd -S localhost -E -d RUNFOODN -s, -W -o columnas_caja.csv
```

3. Comprobar con `dir columnas_caja.csv` que pesa más de 0 bytes y enviarlo para revisión (`type columnas_caja.csv | clip` lo copia al portapapeles). Solo contiene nombres y tipos de columna, sin datos de clientes ni montos.

**No seguir al paso 2 hasta que la revisión confirme que las columnas coinciden.**

### Paso 2. Crear el usuario de solo lectura `ualdo_lector` (5 min)

Requiere la autorización del dueño del negocio. Solo da acceso a `RUNFOODN`.

```bat
C:\UaldoRecon\crear_lector.bat
```

- Pide la clave dos veces **sin mostrarla en pantalla**.
- La clave debe tener 16 caracteres o más, con mayúsculas, minúsculas, números y algún símbolo (`-` `_` `.` `#` `@`). No se aceptan comillas ni la secuencia `$(`.
- Al terminar prueba la conexión y dice "Listo" si todo salió bien.
- Guardar la clave en el gestor de contraseñas. No escribirla en el chat, en correos ni en notas.

Si después hay que cambiarla (o si la clave no conecta): `C:\UaldoRecon\cambiar_clave_lector.bat`.

### Paso 3. Reconocimiento completo (opcional, 10 min)

Sirve para confirmar el estado actual de RunFood después de sus actualizaciones automáticas:

```bat
cd C:\UaldoRecon
```

```bat
run_recon.bat -U ualdo_lector RUNFOODN
```

```bat
findstr /M /C:"Msg " C:\UaldoRecon\salida\*\*.csv
```

El `findstr` no debe listar ningún archivo. Enviar la carpeta `C:\UaldoRecon\salida\` para revisión.

### Paso 4. Generar el token del agente (en el servidor, 2 min)

En la terminal del servidor (no en la PC del local):

```bash
docker exec -u www-data -w /var/www/html $(docker ps -q -f name=olk9lor10oqsm6c5sbvgwfli | head -1) php artisan ualdo:agent-token 2
```

- `2` es el id del negocio Doble Filo.
- El token se muestra **una sola vez**. Copiarlo directo al gestor de contraseñas.
- Si hay que reemplazar un token anterior, añadir `--rotate`: revoca los tokens previos.

### Paso 5. Crear la configuración del agente (3 min)

En PowerShell **como administrador**:

```powershell
powershell -ExecutionPolicy Bypass -File C:\UaldoAgent\crear_config.ps1
```

- Pide el token (paso 4) y la clave de `ualdo_lector` (paso 2) **sin mostrarlos**.
- Prueba la clave contra SQL Server antes de escribir nada.
- Crea `C:\UaldoAgent\agent.config.json`, lo protege para que solo lo lean Administradores y SYSTEM, y recién entonces escribe los secretos.
- No sobrescribe un `agent.config.json` existente. Para rehacerlo, borrar primero el archivo.

No editar `agent.config.json` a mano con el Bloc de notas.

### Paso 6. Probar el agente a mano (5 min)

En el `cmd` de administrador:

```bat
cd C:\UaldoAgent
```

```bat
node cash_snapshot.js diagnostico
```

Debe mostrar `[OK] Esquema verificado con éxito.`. Ojo: el diagnóstico no prueba el token; el token recién se valida en el primer envío.

Luego generar la foto de ayer **sin enviarla**, para revisar los números contra el cierre de RunFood (cambiar la fecha por la de ayer):

```bat
node cash_snapshot.js generar --fecha=2026-10-29
```

Si los montos por forma de pago coinciden con el cierre de RunFood de ese día, enviarla. La respuesta debe ser `sent`; si dice error de autenticación, revisar el token:

```bat
node cash_snapshot.js generar --fecha=2026-10-29 --enviar
```

### Paso 7. Instalar la tarea programada (2 min)

En PowerShell **como administrador**:

```powershell
powershell -ExecutionPolicy Bypass -File C:\UaldoAgent\cash\instalar_tarea.ps1
```

Debe mostrar `Script: C:\UaldoAgent\cash_snapshot.js` y `Directorio de trabajo: C:\UaldoAgent`. Si alguna ruta no existe, el script se detiene sin registrar nada.

Probarla una vez y revisar el resultado (`LastTaskResult` debe ser `0`):

```powershell
Start-ScheduledTask -TaskName UaldoRunFoodCashSnapshot
```

```powershell
Get-ScheduledTask -TaskName UaldoRunFoodCashSnapshot | Get-ScheduledTaskInfo
```

La tarea corre como SYSTEM, así que funciona aunque nadie haya iniciado sesión. La PC debe quedar encendida de noche; si está apagada a esas horas, la tarea corre al encender (`StartWhenAvailable`).

### Paso 7b. Ventas durante el día (opcional, 2 min)

Para que el dueño pueda ver en la app cómo va la venta durante el servicio (foto parcial cada 20 minutos sin bloquear a RunFood), instalar la tarea de intradía.

En PowerShell **como administrador**:

```powershell
powershell -ExecutionPolicy Bypass -File C:\UaldoAgent\cash\instalar_tarea_intradia.ps1
```

- Registra la tarea `UaldoRunFoodIntraday` que corre como SYSTEM cada 20 minutos.
- El agente aplica su propia ventana horaria (`intradayWindow: "10:00-23:59"` en `agent.config.json`); fuera de ese horario termina de inmediato sin hacer nada.
- Usa consultas con `READ UNCOMMITTED` y un tiempo máximo de 20 segundos para no tomar bloqueos compartidos sobre RunFood durante la atención en vivo.
- Solo envía a UaldoBusiness si hubo cambios en los datos desde la última captura enviada.

Probarla una vez y revisar el resultado:

```powershell
Start-ScheduledTask -TaskName UaldoRunFoodIntraday
Get-ScheduledTask -TaskName UaldoRunFoodIntraday | Get-ScheduledTaskInfo
```

### Paso 8. Verificar al día siguiente

- Revisar `C:\UaldoAgent\data\logs\cash-AAAA-MM.log`: debe tener las ejecuciones de la madrugada sin errores.
- Confirmar en la app que aparecen los cierres de los días anteriores y que coinciden con RunFood forma de pago por forma de pago.

---

## 5. Cómo deshacerlo

| Qué | Cómo |
|---|---|
| Quitar la tarea programada | `powershell -ExecutionPolicy Bypass -File C:\UaldoAgent\cash\desinstalar_tarea.ps1` |
| Quitar la tarea de intradía | `powershell -ExecutionPolicy Bypass -File C:\UaldoAgent\cash\desinstalar_tarea_intradia.ps1` |
| Revocar el token del agente | En el servidor: `php artisan ualdo:agent-token 2 --rotate` y descartar el token nuevo |
| Borrar el usuario de lectura | En SQL Server Management Studio, eliminar el usuario `ualdo_lector` de RUNFOODN y luego el login `ualdo_lector` |
| Borrar los archivos | Eliminar `C:\UaldoAgent\` y `C:\UaldoRecon\` |

Nada de esto afecta a RunFood.

---

## 6. Seguridad

- El usuario `ualdo_lector` solo puede leer RUNFOODN. No puede crear, modificar ni borrar datos, y no tiene acceso a las bases `runfood`, `JP` ni `MONICA`.
- La clave de `ualdo_lector` y el token del agente solo viven en `agent.config.json` (solo Administradores y SYSTEM) y en el gestor de contraseñas. Nunca pasan por la pantalla, el chat ni la línea de comandos.
- El agente solo se conecta a `https://api.ualdocorp.com` por HTTPS. No abre puertos ni acepta conexiones entrantes.
- La configuración de RunFood (`configuracion.json`) tiene la clave del usuario `sa` en texto plano. El agente no la usa. Conviene que el proveedor de RunFood la cambie.
- Si se pierde o se expone el token: ejecutar `ualdo:agent-token 2 --rotate`, borrar `agent.config.json` y repetir el paso 5.

---

## 7. Checklist final

- [ ] Paso 0: Node 22, sqlcmd y salida HTTPS confirmados.
- [ ] Paso 1: `columnas_caja.csv` revisado y aprobado.
- [ ] Paso 2: `ualdo_lector` creado con `crear_lector.bat` y su clave guardada en el gestor.
- [ ] Paso 4: token generado y guardado en el gestor.
- [ ] Paso 5: `agent.config.json` creado con `crear_config.ps1`.
- [ ] Paso 6: diagnóstico en OK, la foto de ayer coincide con el cierre de RunFood y el envío respondió `sent`.
- [ ] Paso 7: tarea `UaldoRunFoodCashSnapshot` registrada como SYSTEM y prueba con resultado 0.
- [ ] Paso 8: al día siguiente, el registro no tiene errores y los cierres aparecen en la app.
