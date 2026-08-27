/*
 * Uptech SSO — botao "Entrar com chave de seguranca" (<input> em webauthn-authenticate,
 * <a> no login com passkeys do 26.7). O fluxo WebAuthn e do base
 * (webauthnAuthenticate.js); aqui so o feedback: ao clicar, o botao entra em espera
 * (aria-busy + texto de body[data-passkey-waiting]) enquanto o navegador fala com a chave.
 * Sucesso ou erro recarregam a pagina; se nada acontecer, restaura apos 60 s.
 */
(function () {
    "use strict";

    function init() {
        var btn = document.getElementById("authenticateWebAuthnButton");
        if (!btn) return;                               // so nas telas de chave
        var waiting = document.body.getAttribute("data-passkey-waiting");
        var isInput = btn.tagName === "INPUT";
        var label = isInput ? btn.value : btn.textContent;
        function setText(t) { if (isInput) btn.value = t; else btn.textContent = t; }
        btn.addEventListener("click", function () {
            if (btn.getAttribute("aria-busy") === "true") return;
            btn.setAttribute("aria-busy", "true");
            if (waiting) setText(waiting);
            setTimeout(function () {
                btn.removeAttribute("aria-busy");
                setText(label);
            }, 60000);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
