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

Abre `src/index.html` en cualquier navegador. No requiere instalación ni servidor.

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

Para herramientas con una interfaz distinta (varios campos, opciones, etc.), registra un objeto con `id`, `group`, `name`, `description` y una función `render(container)` que dibuje su propia interfaz. Si la herramienta tiene lógica que vale la pena probar, expónla en `Utilitario.lib` y agrega una prueba en `tests/`. En `Utilitario.helpers` hay utilidades como `html`, `copyButton` y `showToast`.
