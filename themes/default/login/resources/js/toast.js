/*
 * SSO — Toast / Snackbar (script externo; theme.properties `scripts=`).
 * Poe html.js na carga: so com JS o style.css esconde os erros de campo inline
 * (sem JS eles ficam visiveis, como no base).
 * Com #app-toast no HTML (mensagem global do KC), so liga fechar + auto-hide.
 * Sem ele, promove CADA erro de campo (#input-error / .pf-m-error) a um toast
 * proprio, prefixado com o rotulo do campo quando houver (dois campos com o mesmo
 * erro = dois toasts), empilhados no container #app-toasts (criado aqui se o
 * template nao o emitiu).
 */
(function () {
    "use strict";

    document.documentElement.classList.add("js");

    var AUTOHIDE = 6000; // ms

    function container() {
        var c = document.getElementById("app-toasts");
        if (!c) {
            c = document.createElement("div");
            c.className = "app-toasts";
            c.id = "app-toasts";
            document.body.appendChild(c);
        }
        return c;
    }

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
        container().appendChild(t);
        return t;
    }

    // "input-error-<campo>" (user-profile-commons.ftl do base) -> texto do label[for=campo]
    function fieldLabel(err, txt) {
        var m = /^input-error-(.+)$/.exec(err.id || "");
        var label = m && document.querySelector('label[for="' + m[1] + '"]');
        var name = label ? (label.textContent || "").replace(/\s+/g, " ").trim() : "";
        return name && txt.indexOf(name) === -1 ? name + ": " + txt : txt;
    }

    function init() {
        var server = document.getElementById("app-toast");
        if (server) { wire(server); return; }

        var errs = document.querySelectorAll("#input-error, .pf-c-form__helper-text.pf-m-error");
        for (var i = 0; i < errs.length; i++) {
            var txt = (errs[i].textContent || "").replace(/\s+/g, " ").trim();
            if (!txt) continue;
            wire(build(fieldLabel(errs[i], txt), "error"));
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
