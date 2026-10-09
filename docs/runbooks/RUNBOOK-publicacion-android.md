# Runbook: Publicación y distribución de la app Android de Ualdo

Este documento describe el procedimiento estándar para compilar, firmar, verificar y distribuir la aplicación móvil Android de Ualdo (PWA empaquetada mediante Capacitor).

## 1. Requisitos previos

Antes de generar un paquete de producción para Android, el entorno de compilación debe contar con:

1. **Node.js y npm**: Node.js 18+ (o Node.js 22 LTS) con dependencias instaladas (`npm install`). Incluye `typescript` como `devDependency` para la lectura y validación de `capacitor.config.ts`.
2. **Java Development Kit (JDK)**: JDK 21 (versión recomendada) o JDK 17, configurado en la variable de entorno `JAVA_HOME`.
   - **Incompatibilidad de JDK 25**: El JDK distribuido por defecto en instalaciones recientes de Android Studio (por ejemplo en `C:\Program Files\Android\Android Studio\jbr`) corresponde a OpenJDK 25. La versión de Gradle configurada en el proyecto es 8.14.3 (`gradle-wrapper.properties`), la cual no admite clases compiladas para Java 25 y falla con el error `Unsupported class file major version 69`. Asimismo, la versión de Java del sistema (Java 8) resulta obsoleta para Gradle 8. No debe modificarse la versión de Gradle ni del plugin de Android en este proyecto; la solución es utilizar un JDK compatible (21 o 17).
   - **Instalación y configuración recomendada**:
     - Instalar Eclipse Temurin JDK 21 (por ejemplo, mediante `winget install --id EclipseAdoptium.Temurin.21.JDK -e` o descargando el instalador oficial de Adoptium).
     - Definir la variable de entorno de usuario o de sistema `JAVA_HOME` apuntando al directorio de instalación del JDK 21 (por ejemplo `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot`).
     - Definir la variable de entorno `ANDROID_HOME` apuntando a la ruta del Android SDK en Windows: `C:\Users\<usuario>\AppData\Local\Android\Sdk`.
     - Alternativa en Android Studio: si se compila desde el IDE, ir a **Settings > Build, Execution, Deployment > Build Tools > Gradle** y en **Gradle JDK** seleccionar un JDK 21 o JDK 17 en lugar del JBR integrado de versión 25.
   - **Comprobación del entorno**:
     - Verificar la versión de Java activa: `java -version`.
     - Verificar que el wrapper de Gradle reconozca la JVM adecuada: dentro del directorio `android`, ejecutar `.\gradlew.bat --version`. Debe indicar una versión de JVM 21 o 17.
3. **Android SDK**: Android SDK Command-line Tools y build-tools (versiones 35 o 36 instaladas en `C:\Users\<usuario>\AppData\Local\Android\Sdk\build-tools`) con la ruta configurada en `ANDROID_HOME`.
4. **Variables de entorno de producción**: Archivo `.env.production` en la raíz del proyecto (basado en `.env.production.example`). Ambas variables son obligatorias y deben utilizar HTTPS estricto:
   - `VITE_API_BASE_URL`: URL base del motor central UaldoBusiness (por ejemplo, `https://api.ualdo.ejemplo.com/api/v1`).
   - `VITE_TEAMS_API_URL`: URL base del backend de Ualdo Teams (por ejemplo, `https://teams.ualdo.ejemplo.com/api`).
5. **Configuración de desarrollo (`CAP_DEV`)**: La variable `CAP_DEV=1` se reserva exclusivamente para desarrollo local con recarga en vivo (habilita tráfico sin cifrar y contenido mixto en Capacitor). Para cualquier compilación de prueba o producción, `CAP_DEV` debe permanecer sin definir o con valor distinto de 1.

## 2. Custodia del almacén de claves (keystore)

El archivo de firma de producción es `android/ualdo-release.jks`, y sus parámetros de acceso se configuran en `android/keystore.properties`:

- Ambos archivos están explícitamente ignorados en el control de versiones (`.gitignore`) y nunca deben subirse al repositorio.
- **Importancia crítica**: Perder el archivo `ualdo-release.jks` o su contraseña impide de forma irreversible publicar actualizaciones tanto en Google Play como en dispositivos con versiones previas instaladas, obligando a recrear la aplicación y perder la base instalada.
- **Protocolo de respaldo**:
  1. Almacenar la clave de acceso, el alias (`keyAlias`) y la contraseña del alias en el gestor de contraseñas corporativo del equipo.
  2. Guardar una copia de seguridad cifrada del archivo `.jks` en un medio de almacenamiento externo seguro fuera del equipo de desarrollo principal.
  3. Restringir el acceso a los administradores autorizados de la infraestructura.

## 3. Procedimiento paso a paso para publicar una versión

### Paso 1: Incrementar la versión del paquete

En `package.json`, actualiza el campo `"version"` siguiendo el esquema semántico `mayor.menor.parche` (por ejemplo, de `"1.0.0"` a `"1.0.1"` o `"1.1.0"`).

El script de Gradle en `android/app/build.gradle` calcula automáticamente:
- `versionName`: la cadena literal de versión (por ejemplo, `"1.0.1"`).
- `versionCode`: la fórmula numérica `mayor * 10000 + menor * 100 + parche` (por ejemplo, `10001`).

### Paso 2: Generar y sincronizar la aplicación

Ejecuta el script de sincronización o directamente el de liberación:

```bash
# Paso 2.1: Compilar la PWA para producción y sincronizar con Android
npm run android:sync

# Paso 2.2: Generar el APK firmado de producción
npm run android:release
```

En entornos Windows, el script `npm run android:release` ejecuta internamente:
`npm run android:clean-release && npm run android:sync && cd android && .\gradlew.bat assembleRelease`

Este comando:
1. Elimina de forma garantizada cualquier compilación previa en `android/app/build/outputs/apk/release/` mediante `android:clean-release` (script en Node.js multiplataforma), impidiendo que artefactos viejos pasen inadvertidos como nuevos.
2. Ejecuta `android:sync`, el cual valida la configuración con `android:check-config`, compila la PWA para producción con `build:prod` y sincroniza los recursos mediante `npx cap sync android`.
3. Se desplaza a la carpeta `android` y ejecuta `.\gradlew.bat assembleRelease`, compatible tanto con el símbolo del sistema (`cmd.exe`) como con PowerShell.

En entornos Linux o macOS, puedes compilar ejecutando:
`npm run android:clean-release && npm run android:sync && cd android && ./gradlew assembleRelease`

Para generar un Android App Bundle (AAB) destinado a Google Play Console, ejecuta dentro de la carpeta `android`:
`./gradlew bundleRelease` (o `gradlew.bat bundleRelease` en Windows).

### Paso 3: Ubicación de los artefactos generados

- **APK de producción**:
  `android/app/build/outputs/apk/release/app-release.apk`
- **AAB de producción**:
  `android/app/build/outputs/bundle/release/app-release.aab`

### Paso 4: Verificación de la firma criptográfica

Antes de distribuir el archivo APK, comprueba la validez de la firma con la herramienta oficial `apksigner` del Android SDK:

```bash
apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
```

La salida esperada debe confirmar `Verifies: true` para los esquemas de firma aplicables (v2 y v3).

## 4. Estrategia de distribución

Para el despliegue en los dispositivos del restaurante se contemplan dos alternativas:

### Opción A: Instalación directa del APK (Sideloading)
- **Ventajas**: Inmediata, no requiere proceso de revisión externa por parte de Google ni cuenta comercial de desarrollador de Google Play, ideal para pruebas de campo inmediatas en los dispositivos del local.
- **Desventajas**: Requiere habilitar la opción de "Instalar aplicaciones de fuentes desconocidas" en cada teléfono Android y actualizar los terminales manualmente o mediante un enlace de descarga interno.
- **Recomendación**: Estrategia recomendada para la fase piloto inicial en el restaurante, agilizando la puesta en marcha.

### Opción B: Canal de pruebas internas en Google Play Console
- **Ventajas**: Actualizaciones automáticas y transparentes para el personal a través de la tienda oficial, soporte nativo de Android App Bundle (AAB) y métricas de fallos centralizadas.
- **Desventajas**: Requiere cuenta de desarrollador de Google Play (costo único), configuración de ficha técnica y tiempos de propagación de versiones (generalmente de unas horas).
- **Recomendación**: Estrategia recomendada para la operación regular y expansión una vez validado el piloto.

## 5. Lista de verificación en el teléfono móvil

Tras instalar el paquete en el dispositivo de prueba o en el teléfono del encargado del restaurante, realiza las siguientes comprobaciones en orden:

1. **Pantalla de inicio y logotipo**: Verificar que el ícono de la app en el lanzador muestre el isotipo oficial de Ualdo con fondo oscuro (`#1d1d1b`), y que la pantalla de inicio (splash screen) cargue sin parpadeos ni deformaciones.
2. **Inicio de sesión**: Ingresar con las credenciales del usuario y comprobar que la conexión se realice mediante HTTPS con el motor central.
3. **Catálogo de inventario**:
   - Abrir la sección de Inventario y verificar la presencia de los insumos con sus códigos, categorías (formato "Familia / Categoría"), fichas de almacenamiento (Ambiente, Refrigerado, Congelado) y estados.
   - Activar el interruptor "Mostrar inactivos" y confirmar que los insumos dados de baja se presenten con estilo atenuado y su distintivo correspondiente.
4. **Centro de avisos y alertas**: Confirmar la recepción y visualización de notificaciones operativas (como alertas de stock bajo y arqueos de caja).
5. **Sección Trabajo (Ualdo Teams)**: Navegar a la pestaña de Trabajo y validar que la comunicación HTTPS con la API de Ualdo Teams funcione correctamente (tareas, notas y relevos de turno).
