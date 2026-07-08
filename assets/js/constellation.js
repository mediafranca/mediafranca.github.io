/*
  constellation.js — Grafo de proyectos bajo custodia

  Dibuja el ecosistema MediaFranca como una constelación: MediaFranca al
  centro y los proyectos orbitando, agrupados por el círculo de la misión
  al que pertenecen (1 convivencialidad, 2 lenguaje abierto, 3 CAA). El
  layout parte radial y se relaja con un solver de fuerzas simple
  (repulsión entre nodos, resorte en las aristas, anclaje del centro).

  Escrito en canvas 2D puro, sin librerías externas: honra la soberanía
  tecnológica del proyecto (nada de dependencias CDN que auditar). Toma
  los colores de las variables CSS, de modo que respeta el tema claro/oscuro
  y el movimiento reducido.
*/

(function () {
  "use strict";

  var container = document.getElementById("constellation");
  if (!container) return;

  /*
    Nodos del grafo. Cada proyecto declara su círculo (color) y su URL.
    Los repos fueron verificados: hspencer/* y mediafranca/* (algunos fork).
  */
  var nodes = [
    { id: "mf",      label: "MediaFranca",  circle: 0, url: "#que-es", anchor: true },
    // Círculo 3 · accesibilidad cognitiva y CAA
    { id: "pictos",  label: "pictos.net",   circle: 3, url: "https://pictos.net" },
    { id: "icap",    label: "ICAP",         circle: 3, url: "https://github.com/mediafranca/ICAP" },
    { id: "mfsvg",   label: "mf-svg-schema",circle: 3, url: "https://github.com/mediafranca/mf-svg-schema" },
    { id: "nlu",     label: "nlu-schema",   circle: 3, url: "https://github.com/mediafranca/nlu-schema" },
    // Círculo 2 · lenguaje abierto
    { id: "constel", label: "con·§tel",     circle: 2, url: "https://github.com/hspencer/constel" },
    { id: "pix",     label: "partituras",   circle: 2, url: "https://github.com/mediafranca/pix" },
    { id: "lecto",   label: "lectografo",   circle: 2, url: "https://github.com/hspencer/lectografo" },
    // Círculo 1 · convivencialidad / soberanía
    { id: "filippo", label: "filippo3d",    circle: 1, url: "https://github.com/mediafranca/filippo3d" },
    { id: "lombardi",label: "lombardi",     circle: 1, url: "https://github.com/hspencer/lombardi" }
  ];

  var edges = [
    ["mf", "pictos"], ["mf", "icap"], ["mf", "mfsvg"], ["mf", "nlu"],
    ["mf", "constel"], ["mf", "pix"], ["mf", "lecto"],
    ["mf", "filippo"], ["mf", "lombardi"],
    // Afinidades dentro del dominio CAA
    ["pictos", "icap"], ["pictos", "mfsvg"], ["mfsvg", "nlu"], ["nlu", "icap"],
    // Herramientas de lenguaje abierto que se relacionan
    ["constel", "lecto"], ["constel", "pix"], ["lecto", "nlu"],
    // Soberanía del dato / visualización
    ["lombardi", "constel"], ["filippo", "pix"]
  ];

  /*
    Lee un color desde las variables CSS del documento. Permite que la
    constelación siga el tema activo sin recodificar la paleta aquí.
  */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function palette() {
    return {
      edge:  cssVar("--sn-hairline", "#ddd6c7"),
      label: cssVar("--sn-ink", "#221f1a"),
      nova:  cssVar("--sn-nova", "#ae2d13"),
      circles: {
        0: cssVar("--sn-nova", "#ae2d13"),
        1: cssVar("--sn-circulo-1", "#1d416e"),
        2: cssVar("--sn-circulo-2", "#2f6f43"),
        3: cssVar("--sn-circulo-3", "#ae2d13")
      }
    };
  }

  var canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label",
    "Constelación de los proyectos bajo custodia de MediaFranca, enlazados al nodo central.");
  container.insertBefore(canvas, container.firstChild);
  var ctx = canvas.getContext("2d");
  var tip = container.querySelector(".constellation-tip");

  var W = 600, H = 600, dpr = 1;
  var pos = {}, vel = {};
  var hovered = null;
  var colors = palette();
  var frame = 0;
  var settled = false;
  var rafId = null;

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Distribuye los nodos en un anillo alrededor del centro anclado. */
  function layout() {
    pos = {}; vel = {};
    var cx = W / 2, cy = H / 2;
    var others = nodes.filter(function (n) { return n.id !== "mf"; });
    pos.mf = { x: cx, y: cy };
    vel.mf = { x: 0, y: 0 };
    var r = Math.min(W, H) * 0.34;
    others.forEach(function (n, i) {
      var a = (i / others.length) * Math.PI * 2 - Math.PI / 2;
      pos[n.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
      vel[n.id] = { x: 0, y: 0 };
    });
  }

  /* Un paso del solver: repulsión N², resorte en aristas, anclaje central. */
  function step() {
    var k = 0.02, restLen = Math.min(W, H) * 0.20, repulse = 1400, damp = 0.82;

    for (var i = 0; i < nodes.length; i++) {
      var a = pos[nodes[i].id];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = pos[nodes[j].id];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = Math.max(60, dx * dx + dy * dy);
        var d = Math.sqrt(d2);
        var f = repulse / d2;
        var fx = (dx / d) * f, fy = (dy / d) * f;
        vel[nodes[i].id].x -= fx; vel[nodes[i].id].y -= fy;
        vel[nodes[j].id].x += fx; vel[nodes[j].id].y += fy;
      }
    }

    edges.forEach(function (e) {
      var A = pos[e[0]], B = pos[e[1]];
      var dx = B.x - A.x, dy = B.y - A.y;
      var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var f = k * (d - restLen);
      var fx = (dx / d) * f, fy = (dy / d) * f;
      vel[e[0]].x += fx; vel[e[0]].y += fy;
      vel[e[1]].x -= fx; vel[e[1]].y -= fy;
    });

    var cx = W / 2, cy = H / 2, c = pos.mf;
    vel.mf.x += (cx - c.x) * 0.06;
    vel.mf.y += (cy - c.y) * 0.06;

    var margin = 34, moved = 0;
    nodes.forEach(function (n) {
      var v = vel[n.id], p = pos[n.id];
      v.x *= damp; v.y *= damp;
      p.x += v.x; p.y += v.y;
      p.x = Math.max(margin, Math.min(W - margin, p.x));
      p.y = Math.max(margin, Math.min(H - margin, p.y));
      moved += Math.abs(v.x) + Math.abs(v.y);
    });
    return moved;
  }

  function nodeRadius(n) {
    if (n.id === "mf") return Math.max(9, W * 0.020);
    return Math.max(5, W * 0.012);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Aristas
    edges.forEach(function (e) {
      var A = pos[e[0]], B = pos[e[1]];
      var hl = hovered && (hovered.id === e[0] || hovered.id === e[1]);
      ctx.strokeStyle = hl ? colors.nova : colors.edge;
      ctx.globalAlpha = hl ? 0.7 : 0.5;
      ctx.lineWidth = hl ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Nodos
    nodes.forEach(function (n) {
      var p = pos[n.id], r = nodeRadius(n);
      var hl = hovered && hovered.id === n.id;
      if (n.id === "mf") {
        ctx.strokeStyle = colors.nova;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = hl ? colors.nova : colors.circles[n.circle];
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rótulo del centro, siempre visible
    var center = pos.mf;
    ctx.fillStyle = colors.label;
    ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MEDIAFRANCA", center.x, center.y + nodeRadius({ id: "mf" }) + 14);
  }

  /* Bucle de animación: da varios pasos al inicio para asentar el grafo. */
  function loop() {
    var steps = frame < 90 ? 3 : 1;
    var moved = 0;
    for (var s = 0; s < steps; s++) moved = step();
    draw();
    frame++;
    if (moved < 0.4 && frame > 60) { settled = true; return; } // detiene cuando se estabiliza
    rafId = requestAnimationFrame(loop);
  }

  function restart() {
    settled = false;
    frame = 0;
    if (rafId) cancelAnimationFrame(rafId);
    if (reduceMotion) {
      // Sin animación: asienta el grafo de una vez y dibuja el resultado.
      for (var i = 0; i < 220; i++) step();
      draw();
    } else {
      loop();
    }
  }

  function resize() {
    var rect = container.getBoundingClientRect();
    W = Math.max(280, Math.floor(rect.width));
    H = W;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    layout();
    restart();
  }

  /* ---- Interacción -------------------------------------------------- */

  function nodeAt(mx, my) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i], p = pos[n.id], r = nodeRadius(n) + 5;
      if ((p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my) < r * r) return n;
    }
    return null;
  }

  function pointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var h = nodeAt(mx, my);
    if (h !== hovered) {
      hovered = h;
      if (h && tip) {
        tip.textContent = h.label;
        tip.style.display = "block";
        tip.style.left = pos[h.id].x + "px";
        tip.style.top = pos[h.id].y + "px";
      } else if (tip) {
        tip.style.display = "none";
      }
      if (settled) draw(); // redibuja el resaltado aunque el grafo esté quieto
    } else if (h && tip) {
      tip.style.left = pos[h.id].x + "px";
      tip.style.top = pos[h.id].y + "px";
    }
    canvas.style.cursor = h ? "pointer" : "default";
  }

  function openNode(n) {
    if (!n || !n.url) return;
    if (n.url.charAt(0) === "#") location.hash = n.url;
    else window.open(n.url, "_blank", "noopener");
  }

  canvas.addEventListener("mousemove", pointerMove);
  canvas.addEventListener("mouseleave", function () {
    hovered = null;
    if (tip) tip.style.display = "none";
    if (settled) draw();
  });
  canvas.addEventListener("click", function () { openNode(hovered); });

  // Redibuja con la nueva paleta cuando cambia el tema.
  var themeObserver = new MutationObserver(function () {
    colors = palette();
    if (settled) draw(); else restart();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sn-theme"] });
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      colors = palette();
      if (settled) draw();
    });
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
})();
