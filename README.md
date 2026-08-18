# MediaFranca

Sitio público de [mediafranca.net](https://mediafranca.net/).

MediaFranca es una iniciativa que busca socios fundadores para constituir, a futuro, una corporación de derecho privado sin fines de lucro en Valparaíso, Chile. Custodiará tecnologías convivenciales para la comunicación humana: software, estándares, esquemas y contenidos de lenguaje abierto.[^1]

El puño alzado expresa su postura de soberanía tecnológica: las herramientas
deben amplificar la agencia de las personas y permanecer bajo el gobierno de las
comunidades que las habitan. El activo vive en `assets/logo/raised-fist.svg` y
se acredita en el propio sitio.

El sitio está escrito deliberadamente en tiempo futuro: describe lo que MediaFranca será, no lo que ya es. Sirve para explicar la filosofía del proyecto a amigos, colaboradores y potenciales socios.

## Filosofía técnica del sitio

El sitio encarna los mismos principios que enuncia. Por eso es lo más simple y auditable posible: HTML, CSS y JavaScript estáticos, sin framework, sin build, sin trackers y sin dependencias de ejecución externas. La constelación de proyectos se dibuja en canvas nativo, no con una librería CDN, para no depender de terceros ni obligar a auditar código ajeno.[^2]

```mermaid
graph TD
    A[index.html<br/>una sola página, navegación por anclas] --> B[assets/css/tokens.css<br/>tokens de stella-nova-gui]
    A --> C[assets/css/site.css<br/>layout, componentes, accesibilidad]
    A --> D[assets/js/i18n.js<br/>idioma es-CL / en-GB, tema, navegación]
    A --> E[assets/js/constellation.js<br/>grafo de proyectos en canvas nativo]
```

## Estructura del repositorio

```
mediafranca.github.io/
├── index.html              Página única, bilingüe, con las secciones del sitio
├── assets/
│   ├── css/
│   │   ├── tokens.css      Tokens de diseño (portados de stella-nova-gui)
│   │   └── site.css        Estilos de layout, componentes y accesibilidad
│   └── js/
│       ├── i18n.js         Conmutación de idioma, tema y navegación por anclas
│       └── constellation.js  Grafo de proyectos (canvas 2D, sin librerías)
├── CNAME                   Dominio para GitHub Pages (mediafranca.net)
├── .nojekyll               Desactiva el procesado Jekyll en GitHub Pages
├── robots.txt
├── sitemap.xml
├── LICENSE                 Dual: MIT (código) y CC BY 4.0 (contenido)
└── README.md               Este archivo
```

## Multilenguaje

El sitio es bilingüe español de Chile (es-CL) e inglés británico (en-GB). El contenido traducible vive como pares de `<span data-lang="es|en">` dentro del HTML, de modo que el texto es auditable en el propio fuente.

El comportamiento es progresivo: sin JavaScript, el HTML muestra el español por defecto. Con JavaScript, `assets/js/i18n.js` detecta el idioma del navegador (cualquier variante de inglés abre el sitio en inglés), permite conmutar con los botones ES/EN, recuerda la elección en `localStorage` y actualiza el atributo `lang` de `<html>` para lectores de pantalla.

## Lenguaje de diseño

Los tokens provienen de [stella-nova-gui](https://github.com/hspencer/stella-nova-gui): metáfora de "página de papel" sobre atelier gris, acento carmesí (la *nova*), tipografía IBM Plex y modelo de color en tres capas (primitivos, semánticos, componente). El tema claro/oscuro respeta la preferencia del sistema y puede conmutarse manualmente.

## Accesibilidad

Objetivo WCAG 2.1 AA: enlace de salto al contenido, foco visible, navegación operable por teclado, contraste suficiente en ambos temas, imágenes y controles rotulados, respeto a `prefers-reduced-motion` (la constelación se asienta sin animar) y a `prefers-color-scheme`.

## Edición local

No requiere instalación. Basta un servidor estático:

```bash
cd ~/Sites/mediafranca.github.io
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. También puede abrirse `index.html` directamente en el navegador; las fuentes se cargan por CDN.

### Acceso desde otros dispositivos con Tailscale

Para probar el sitio desde otro equipo de la misma *tailnet* (por ejemplo, un
teléfono), instalar [Tailscale](https://tailscale.com/download), iniciar sesión y
mantener el servidor local anterior en ejecución. En otra terminal:

```bash
tailscale serve --bg 8000
tailscale serve status
```

`tailscale serve status` muestra la URL HTTPS privada. Solo los dispositivos
autorizados en la misma *tailnet* pueden abrirla. Al terminar:

```bash
tailscale serve reset
```

### Vista previa pública temporal con Cloudflare Tunnel

Para compartir una revisión sin publicar en GitHub Pages, instalar
[`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
y, con el servidor local ejecutándose en el puerto 8000, abrir un túnel rápido:

```bash
cloudflared tunnel --url http://localhost:8000
```

El comando entrega una URL temporal `https://….trycloudflare.com`; debe mantenerse
en ejecución mientras se usa y se cierra con `Ctrl+C`. Es una dirección pública:
no debe usarse para contenido privado ni como despliegue permanente. Para una
URL estable y controles de acceso corresponde configurar un túnel administrado
en Cloudflare Zero Trust.

## Despliegue en GitHub Pages

1. Crear el repositorio `mediafranca/mediafranca.github.io` y empujar `main`.
2. En `Settings > Pages`: Source = `Deploy from a branch`, Branch = `main`, Folder = `/ (root)`.
3. En `Custom domain` ingresar `mediafranca.net`. GitHub leerá el archivo `CNAME` y emitirá el certificado HTTPS.
4. Activar `Enforce HTTPS`.

El DNS de `mediafranca.net` ya apunta a GitHub Pages desde Namecheap (cuatro registros `A` al apex).

## Licencia

Contenido bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); código bajo [MIT](https://opensource.org/license/mit). Ver [LICENSE](LICENSE).

## Notas

[^1]: La visión y misión canónicas viven en el grafo Logseq privado del custodio (`MediaFranca - Visión y Misión`). Este repositorio contiene solo el sitio público; los documentos de gobernanza (estatutos, plan operativo, modelo de fiscal host) no se versionan aquí.

[^2]: El sitio de referencia previo usaba p5.js desde un CDN para la constelación. Esta versión la reescribe en canvas 2D puro para eliminar la dependencia externa, coherente con el principio de soberanía tecnológica.
