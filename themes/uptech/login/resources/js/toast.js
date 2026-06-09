/*
 * Uptech SSO — Toast / Snackbar
 * Carregado como script externo (via theme.properties `scripts=js/toast.js`)
 * porque o CSP do Keycloak bloqueia <script> inline.
 *
 * Comportamento:
 *  - Se o servidor renderizou um toast global (#app-toast, mensagem global do KC),
 *    apenas liga o fechar + auto-hide.
 *  - Senao, se houver erro de campo (ex.: credenciais invalidas, que o KC mostra
 *    inline via messagesPerField), gera um toast de erro a partir desse texto.
 *    O erro inline e mantido como registro persistente apos o toast sumir.
 */
(function () {
    "use strict";

    var AUTOHIDE = 6000; // ms

    function wire(t) {
        var done = false;
        function hide() {
            if (done) return;
            done = true;
            t.classList.add("app-toast--hiding");
            setTimeout(function () {
                if (t.parentNode) t.parentNode.removeChild(t);
            }, 260);
        }
        var btn = t.querySelector(".app-toast__close");
        if (btn) btn.addEventListener("click", hide);
        var ms = parseInt(t.getAttribute("data-autohide") || AUTOHIDE, 10);
        if (ms > 0) setTimeout(hide, ms);
    }

    function build(msg, type) {
        var t = document.createElement("div");
        t.className = "app-toast app-toast--" + type;
        t.setAttribute("role", "alert");
        t.setAttribute("data-autohide", AUTOHIDE);

        var icon = document.createElement("span");
        icon.className = "app-toast__icon";
        icon.setAttribute("aria-hidden", "true");

        var span = document.createElement("span");
        span.className = "app-toast__msg";
        span.textContent = msg;

        var close = document.createElement("button");
        close.type = "button";
        close.className = "app-toast__close";
        close.setAttribute("aria-label", document.body.getAttribute("data-toast-close") || "Close");
        close.innerHTML = "&times;";

        t.appendChild(icon);
        t.appendChild(span);
        t.appendChild(close);
        document.body.appendChild(t);
        return t;
    }

    function init() {
        var t = document.getElementById("app-toast");
        if (!t) {
            var err = document.querySelector("#input-error, .pf-c-form__helper-text.pf-m-error");
            var txt = err && err.textContent ? err.textContent.trim() : "";
            if (txt) t = build(txt, "error");
        }
        if (t) wire(t);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
