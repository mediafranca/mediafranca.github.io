/*
  i18n.js — Conmutación de idioma (es-CL / en-GB) y navegación

  El sitio es bilingüe mediante pares de <span data-lang="es|en">. Este
  módulo decide cuál idioma mostrar, permite conmutarlo, recuerda la
  elección y sincroniza el atributo lang de <html> para lectores de
  pantalla.

  Progresivo por diseño: sin JavaScript, el HTML ya trae el español visible.
*/

(function () {
  "use strict";

  var LANGS = ["es", "en"];
  var STORE_LANG = "mf.lang";

  /* ---- Idioma ------------------------------------------------------- */

  /*
    Aplica un idioma: activa los <span> correspondientes, fija <html lang>
    con la variante regional (es-CL / en-GB), actualiza el estado de los
    botones y persiste la elección. Se llama al cargar y en cada cambio.
  */
  function applyLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = "es";
    var regional = lang === "en" ? "en-GB" : "es-CL";
    document.documentElement.setAttribute("lang", regional);

    var nodes = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-lang") === lang) el.classList.add("is-active");
      else el.classList.remove("is-active");
    }

    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var j = 0; j < buttons.length; j++) {
      var b = buttons[j];
      b.setAttribute("aria-pressed", b.getAttribute("data-set-lang") === lang ? "true" : "false");
    }

    try { localStorage.setItem(STORE_LANG, lang); } catch (e) {}
  }

  /*
    Decide el idioma inicial. Prioridad: elección guardada > idioma del
    navegador (cualquier variante de inglés abre en inglés) > español.
  */
  function initialLang() {
    try {
      var saved = localStorage.getItem(STORE_LANG);
      if (saved && LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) {}
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    if (nav.indexOf("en") === 0) return "en";
    return "es";
  }

  /* ---- Navegación por anclas --------------------------------------- */

  /*
    Resalta en la barra el enlace de la sección visible usando
    IntersectionObserver.
  */
  function initNav() {
    var links = {};
    var linkEls = document.querySelectorAll('.site-nav a[href^="#"]');
    for (var i = 0; i < linkEls.length; i++) {
      links[linkEls[i].getAttribute("href").slice(1)] = linkEls[i];
    }
    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          for (var k in links) { if (links.hasOwnProperty(k)) links[k].removeAttribute("aria-current"); }
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    var sections = document.querySelectorAll("section[id]");
    for (var s = 0; s < sections.length; s++) observer.observe(sections[s]);
  }

  /* ---- Arranque ----------------------------------------------------- */

  function init() {
    // Idioma
    var langButtons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < langButtons.length; i++) {
      langButtons[i].addEventListener("click", function (e) {
        applyLang(e.currentTarget.getAttribute("data-set-lang"));
      });
    }
    applyLang(initialLang());

    // Navegación
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
