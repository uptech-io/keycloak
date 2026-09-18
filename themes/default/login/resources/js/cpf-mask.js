/*
 * SSO — Mascara de CPF no campo de usuario (script externo; theme.properties `scripts=`).
 * O nome de usuario do produto e o CPF, guardado no Keycloak so com os 11 digitos.
 * Progressive enhancement sobre o #username que o tema base emite (login.ftl,
 * login-username.ftl, login-reset-password.ftl e o campo `username` do User
 * Profile em register.ftl / login-update-profile.ftl / idp-review-user-profile.ftl).
 * O modo vem de <body data-username-format>, calculado pelo template.ftl a partir
 * do realm (Email as username / Login with email) e da tela:
 *   cpf          - so CPF: formata 000.000.000-00 ao digitar, teclado numerico,
 *                  descarta o que nao for digito, no maximo 11;
 *   cpf-or-email - CPF ou e-mail (login e "esqueci a senha" com Login with email):
 *                  formata enquanto o texto digitado for so digitos (ate 11); letra,
 *                  @, pontuacao do proprio usuario ou 12+ digitos ficam como digitados;
 *   email        - o username e o e-mail: nao faz nada.
 * O script guarda o texto do usuario (U) sem os separadores que ele mesmo poe: cada
 * evento input e lido como uma edicao (prefixo/sufixo comuns com o ultimo valor
 * exibido, prefixo limitado pelo cursor) aplicada a U, e o campo mostra format(U)
 * ou U. Assim nada digitado se perde no modo misto. Durante uma composicao de IME
 * (teclado virtual) nada e reescrito; a mascara entra no compositionend.
 * Delete/Backspace sobre um separador (keydown) pulam para o digito vizinho.
 * Ao enviar, o que a mascara exibe vai so em digitos (em modo cpf, sempre).
 * Valor posto pelo servidor (login.username apos erro, auth.attemptedUsername, valor
 * do User Profile): ate 11 digitos e formatado; qualquer outro (e-mail, username
 * legado ou vindo de IdP, 12+ digitos) nunca e reescrito — em modo cpf o campo fica
 * sem mascara nessa carga (so um CPF completo digitado no lugar ainda vai em digitos).
 * Campo desabilitado/somente leitura fica em paz. Nao confere digito verificador.
 * Sem JS o campo cru continua aceitando os digitos.
 */
(function () {
    "use strict";

    var LEN = 11;

    function digits(str) {
        return (str || "").replace(/\D/g, "");
    }

    // So digitos e separadores de CPF
    function looksLikeCpf(str) {
        return /^[\d.\-]*$/.test(str || "");
    }

    // Texto que a mascara formata: ate 11 digitos, nada mais
    function isCpfText(u) {
        return u.length <= LEN && /^\d*$/.test(u);
    }

    // 12345678909 -> 123.456.789-09 (parcial enquanto digita: 123.45)
    function format(d) {
        var out = "";
        for (var i = 0; i < d.length; i++) {
            if (i === 3 || i === 6) out += ".";
            else if (i === 9) out += "-";
            out += d.charAt(i);
        }
        return out;
    }

    function init() {
        var mode = (document.body && document.body.getAttribute("data-username-format")) || "cpf";
        if (mode === "email") return;
        var strict = mode === "cpf";

        var field = document.getElementById("username");
        if (!field || field.tagName !== "INPUT" || field.type !== "text") return;
        if (field.dataset && field.dataset.cpfMask != null) return; // idempotente
        if (field.disabled || field.readOnly) return;                // nada a digitar

        // Em modo cpf, valor do servidor que nao e um CPF (letras, 12+ digitos: username
        // de IdP ou legado) nao tem o que mascarar — e reescrever seria destruir o valor.
        // Nessa carga so um CPF completo digitado no lugar ainda e normalizado no envio.
        var pre = field.value;
        if (strict && pre && (!looksLikeCpf(pre) || digits(pre).length > LEN)) {
            if (field.form) {
                field.form.addEventListener("submit", function () {
                    var v = field.value;
                    if (looksLikeCpf(v) && digits(v).length === LEN) field.value = digits(v);
                });
            }
            return;
        }

        if (field.dataset) field.dataset.cpfMask = mode;
        if (strict) {
            field.setAttribute("inputmode", "numeric");
            if (!field.getAttribute("placeholder")) field.setAttribute("placeholder", "000.000.000-00");
        }

        var U = "";          // texto do usuario, sem os separadores da mascara
        var shown = "";      // ultimo valor que este script escreveu no campo
        var masked = false;  // shown === format(U)
        var composing = false; // IME/teclado virtual compondo: escrever no campo agora
                               // cancelaria a composicao e o texto entraria duplicado

        function caret() {
            try { return field.selectionStart; } catch (e) { return null; }
        }

        function setCaret(pos) {
            if (document.activeElement !== field) return;
            try { field.setSelectionRange(pos, pos); } catch (e) { /* input sem selecao */ }
        }

        // Indice em `s` logo apos o k-esimo digito e os separadores que o seguem
        function afterDigits(s, k) {
            var i = 0, seen = 0;
            while (i < s.length && seen < k) { if (/\d/.test(s.charAt(i))) seen++; i++; }
            while (i < s.length && !/\d/.test(s.charAt(i))) i++;
            return i;
        }

        // Posicao no valor exibido -> posicao em U
        function toU(pos) {
            return masked ? digits(shown.slice(0, pos)).length : pos;
        }

        function render(uCaret, moveCaret) {
            masked = isCpfText(U);
            shown = masked ? format(U) : U;
            if (field.value !== shown) field.value = shown;
            if (moveCaret) setCaret(masked ? afterDigits(shown, uCaret) : uCaret);
        }

        // Valor que nao passou por onInput: carga, restauracao do navegador, autofill
        function sync(value) {
            var v = value || "";
            if (strict) v = digits(v).slice(0, LEN);
            else if (looksLikeCpf(v) && digits(v).length === LEN) v = digits(v); // CPF completo com pontuacao
            U = v;
            render(0, false);
        }

        function onInput() {
            if (composing) return;
            var raw = field.value;
            if (raw === shown) return;
            var n = 0, m = 0;
            while (n < raw.length && n < shown.length && raw.charAt(n) === shown.charAt(n)) n++;
            // Texto inserido igual ao que estava sob o cursor ("0" antes de "0"): o prefixo
            // por comparacao passaria por cima dele; o cursor diz onde a edicao terminou.
            var c = caret();
            if (c != null) {
                var grew = Math.max(0, raw.length - shown.length);
                if (n > c - grew) n = Math.max(0, c - grew);
            }
            while (m < raw.length - n && m < shown.length - n && raw.charAt(raw.length - 1 - m) === shown.charAt(shown.length - 1 - m)) m++;
            var inserted = raw.slice(n, raw.length - m);
            if (strict) inserted = digits(inserted);
            else if (inserted.length > 1 && looksLikeCpf(inserted)) inserted = digits(inserted); // CPF colado com pontuacao
            var a = toU(n), b = toU(shown.length - m);
            U = U.slice(0, a) + inserted + U.slice(b);
            if (strict) U = U.slice(0, LEN);
            render(a + inserted.length, true);
        }

        field.addEventListener("input", onInput);
        field.addEventListener("compositionstart", function () { composing = true; });
        field.addEventListener("compositionend", function () { composing = false; onInput(); });
        field.addEventListener("focus", function () { if (field.value !== shown) sync(field.value); });

        // Delete/Backspace em cima de um separador: pula o separador para a tecla
        // apagar o digito vizinho (senao a mascara repoe o separador e nada acontece).
        field.addEventListener("keydown", function (e) {
            if (!masked || (e.key !== "Delete" && e.key !== "Backspace") || e.ctrlKey || e.altKey || e.metaKey) return;
            var s = caret();
            if (s == null || s !== field.selectionEnd) return;
            if (e.key === "Delete" && /[.\-]/.test(shown.charAt(s))) setCaret(s + 1);
            else if (e.key === "Backspace" && /[.\-]/.test(shown.charAt(s - 1))) setCaret(s - 1);
        });

        // O que a mascara exibe vai so em digitos (em modo cpf, sempre); o resto vai como
        // o usuario digitou. Um valor que chegou sem input (autofill) e sincronizado
        // antes. Roda depois do onsubmit inline do base (login.disabled = true), que nao
        // mexe no valor do campo.
        if (field.form) {
            field.form.addEventListener("submit", function () {
                if (field.value !== shown) sync(field.value);
                if (strict || masked) field.value = U;
            });
        }

        sync(pre);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
