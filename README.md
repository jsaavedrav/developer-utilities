# Developer Utilities

Utilitario standalone y multiplataforma con herramientas del día a día para desarrolladores. Funciona completamente offline: ningún dato sale de tu computador.

## Herramientas

| Grupo | Herramienta |
|---|---|
| Codificación | URL · Decodificar / Codificar (percent-encoding) |
| Codificación | Base64 · Decodificar / Codificar (UTF-8, acepta URL-safe) |
| Criptografía | Hash: MD5, SHA-1, SHA-256, SHA-384 y SHA-512 a la vez |
| Criptografía | Cifrar / Descifrar con contraseña (AES-256-GCM, clave derivada con PBKDF2-SHA256) |
| Generadores | RUT: generar al azar, validar y formatear |
| Generadores | Valores aleatorios: UUID v4, tokens hex y Base64 URL-safe, contraseñas |

Los resultados de decodificación se pueden formatear como JSON con un clic.

## Cómo usarla

**Como app de escritorio:** descarga el instalador para tu sistema desde la página de [Releases](../../releases) (Windows `.msi`/`.exe`, macOS `.dmg`, Linux `.deb`/`.rpm`/`.AppImage`).

> En macOS la app no está firmada con una cuenta de desarrollador de Apple, así que la primera vez el sistema la bloquea. Ábrela con clic derecho → **Abrir**, o en **Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente**. En Windows, SmartScreen puede mostrar "Windows protegió su PC": elige **Más información → Ejecutar de todas formas**.

**En el navegador:** abre `src/index.html`. No requiere instalación ni servidor.

**Como sitio web en un contenedor:** ver [Versión web (contenedor)](#versión-web-contenedor).

## App de escritorio (Tauri)

La app de escritorio es la misma carpeta `src/` empaquetada con [Tauri](https://tauri.app). La configuración está en `src-tauri/`; no hay código nativo propio.

Requisitos para compilar en tu computador: Node 22 y [Rust](https://rustup.rs), más los [prerrequisitos de Tauri](https://tauri.app/start/prerequisites/) de tu sistema.

```
npm install
npm run dev     # abre la app con recarga automática
npm run build   # genera el instalador en src-tauri/target/release/bundle/
```

No es necesario compilar localmente: GitHub lo hace solo (workflow `Instaladores`).

- **En cada PR** que cambia la app se compilan los instaladores de Windows, macOS (Apple Silicon e Intel) y Linux. Se descargan desde la ejecución del workflow, en la sección *Artifacts*.
- **Para publicar una versión:** sube el número en `package.json` (por ejemplo `0.2.0`), haz merge a `main` y crea el tag:

  ```
  git tag v0.2.0
  git push origin v0.2.0
  ```

  El workflow crea un release en borrador con todos los instaladores. Revísalo en *Releases* y presiona **Publish**.

## Versión web (contenedor)

La versión web es la misma carpeta `src/` servida por nginx en un contenedor (sin root, puerto 8080). El servidor solo entrega archivos estáticos: todo se procesa en el navegador de quien la usa, igual que en la app de escritorio.

Cada push a `main` publica la imagen en GitHub Container Registry, y cada tag `vX.Y.Z` publica además la versión correspondiente (para `amd64` y `arm64`):

```
docker run -d -p 8080:8080 ghcr.io/jsaavedrav/developer-utilities:latest
```

Luego abre <http://localhost:8080>. Para construirla localmente desde el código: `docker compose up --build`.

> **Usa HTTPS al desplegarla.** Los navegadores solo permiten Web Crypto (hash, cifrado AES) y el portapapeles en sitios `https://` o en `localhost`. Por HTTP plano esas herramientas no funcionan. El certificado lo entrega normalmente la plataforma donde despliegas (Cloud Run, Azure Container Apps, Fly.io) o un proxy como Caddy o Traefik.

> La primera vez que se publica, el paquete en GHCR queda **privado**. Para descargarlo sin iniciar sesión, cámbialo a público en GitHub → *Packages* → `developer-utilities` → *Package settings*.

Archivos: `Dockerfile`, `docker/nginx.conf` (cabeceras de seguridad, misma política de contenido que la app de escritorio), `compose.yaml` y el workflow `.github/workflows/web.yml`. El contenedor expone `/healthz` para chequeos de salud.

## Pruebas

```
npm test
```

Prueban la lógica de cada herramienta (`Utilitario.lib`) con Node 22, sin dependencias. Se ejecutan en GitHub en cada PR.

## Estructura

```
src/
  index.html      Página principal: carga el núcleo y la lista de herramientas
  css/styles.css  Estilos (modo claro y oscuro automáticos)
  js/core.js      Registro de herramientas, menú lateral y helpers compartidos
  tools/          Una herramienta (o familia de herramientas) por archivo
tests/            Pruebas de la lógica de las herramientas
docker/           Configuración de nginx para la versión web
```

## Agregar una herramienta

1. Crea un archivo en `src/tools/`, por ejemplo `src/tools/mayusculas.js`.
2. Regístrala con `Utilitario.register(...)`. Para el caso típico de "texto de entrada → texto de salida" usa `transformTool`:

   ```js
   (function () {
     const { register, transformTool } = window.Utilitario;

     register(transformTool({
       id: 'mayusculas',            // único; también es la URL (#mayusculas)
       group: 'Texto',              // título del grupo en el menú
       name: 'Mayúsculas',          // nombre en el menú
       description: 'Convierte el texto a mayúsculas.',
       inputLabel: 'Texto',
       actionLabel: 'Convertir',
       transform: text => text.toUpperCase()
       // Para mostrar un error, lanza: throw new Error('Mensaje para el usuario');
     }));
   })();
   ```

3. Agrega `<script src="tools/mayusculas.js"></script>` al final de `src/index.html`.

Para herramientas con una interfaz distinta (varios campos, opciones, etc.), registra un objeto con `id`, `group`, `name`, `description` y una función `render(container)` que dibuje su propia interfaz. Si la herramienta tiene lógica que vale la pena probar, exponla en `Utilitario.lib` y agrega una prueba en `tests/`. En `Utilitario.helpers` hay utilidades como `html`, `copyButton` y `showToast`.
