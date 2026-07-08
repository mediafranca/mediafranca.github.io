/*
  i18n.js — Conmutación de idioma (es-CL / en-GB), tema y navegación

  El sitio es bilingüe mediante pares de <span data-lang="es|en">. Este
  módulo decide cuál idioma mostrar, permite conmutarlo, recuerda la
  elección y sincroniza el atributo lang de <html> para lectores de
  pantalla. También gestiona el tema claro/oscuro y el menú móvil.

  Progresivo por diseño: sin JavaScript, el HTML ya trae el español visible.
*/

(function () {
  "use strict";

  var LANGS = ["es", "en"];
  var STORE_LANG = "mf.lang";
  var STORE_THEME = "mf.theme";

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

  /* ---- Tema (claro / oscuro) --------------------------------------- */

  /*
    Aplica el tema fijando data-sn-theme en <html>. El valor "auto" retira
    el atributo para que mande la preferencia del sistema (media query en
    tokens.css). Actualiza el rótulo accesible del botón.
  */
  function applyTheme(theme) {
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-sn-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-sn-theme");
      theme = "auto";
    }
    try { localStorage.setItem(STORE_THEME, theme); } catch (e) {}
    var toggle = document.querySelector(".theme-toggle button");
    if (toggle) {
      var isDark = document.documentElement.getAttribute("data-sn-theme") === "dark";
      toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    }
  }

  /*
    Alterna entre claro y oscuro tomando como base lo que se ve ahora
    (incluida la preferencia del sistema cuando el tema está en "auto").
  */
  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-sn-theme");
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var showingDark = current === "dark" || (!current && systemDark);
    applyTheme(showingDark ? "light" : "dark");
  }

  /* ---- Navegación por anclas --------------------------------------- */

  /*
    Resalta en la barra el enlace de la sección visible usando
    IntersectionObserver, y cierra el menú móvil al elegir un destino.
  */
  function initNav() {
    var nav = document.querySelector(".site-nav");
    var toggle = document.querySelector(".nav-toggle");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.getAttribute("data-open") === "true";
        nav.setAttribute("data-open", open ? "false" : "true");
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
      });
      nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          nav.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

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

    // Tema
    var themeBtn = document.querySelector(".theme-toggle button");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
    var savedTheme = "auto";
    try { savedTheme = localStorage.getItem(STORE_THEME) || "auto"; } catch (e) {}
    applyTheme(savedTheme);

    // Navegación
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
