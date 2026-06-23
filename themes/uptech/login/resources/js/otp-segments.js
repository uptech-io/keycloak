/*
 * Uptech SSO — OTP segmentado (caixas por digito)
 * Progressive enhancement: transforma o campo unico #otp (login-otp.ftl) em N
 * caixas de 1 digito. O valor e remontado no proprio #otp, que continua sendo o
 * campo enviado ao Keycloak. Sem JS, o #otp aparece normal (fallback gracioso).
 * Carregado como script externo (o CSP do KC bloqueia <script> inline).
 *
 * Recursos: auto-avanco ao digitar, backspace volta uma caixa, setas navegam,
 * colar distribui os digitos, estado de erro espelhado de aria-invalid e
 * auto-envio do formulario ao completar todos os digitos.
 */
(function () {
    "use strict";

    function onlyDigits(str) {
        return (str || "").replace(/\D/g, "");
    }

    function init() {
        var otp = document.getElementById("otp");
        if (!otp) return;                               // so na pagina de OTP

        var form = otp.closest("form") || document.body;
        if (form.dataset && form.dataset.otpEnhanced != null) return; // idempotente

        var len = parseInt(otp.getAttribute("data-otp-length") || "6", 10);
        if (!(len > 0)) len = 6;

        // As caixas passam a ser os controles; #otp vira espelho oculto/submetivel.
        var labelEl = form.querySelector('label[for="otp"]');
        var groupLabel = (labelEl && labelEl.textContent.trim()) || "Codigo";
        var invalid = otp.getAttribute("aria-invalid") === "true";

        var wrap = document.createElement("div");
        wrap.className = "app-otp-segments";
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", groupLabel);

        var boxes = [];
        for (var i = 0; i < len; i++) {
            var b = document.createElement("input");
            b.type = "text";
            b.inputMode = "numeric";
            b.autocomplete = i === 0 ? "one-time-code" : "off";
            b.setAttribute("maxlength", "1");
            b.setAttribute("aria-label", groupLabel + " — " + (i + 1) + "/" + len);
            b.className = "app-otp-box";
            if (invalid) b.classList.add("app-otp-box--error");
            // respiro maior no meio (ex.: 6 digitos = 3 + 3)
            if (len % 2 === 0 && i === len / 2 - 1) b.classList.add("app-otp-box--group-end");
            wrap.appendChild(b);
            boxes.push(b);
        }

        otp.parentNode.insertBefore(wrap, otp.nextSibling);
        otp.setAttribute("tabindex", "-1");
        otp.setAttribute("aria-hidden", "true");
        if (form.dataset) form.dataset.otpEnhanced = "";

        function sync() {
            otp.value = boxes.map(function (b) { return b.value; }).join("");
        }

        // Envia o form assim que todos os digitos estiverem preenchidos.
        // Clica no botao real (preserva o onsubmit do KC) e trava p/ nao enviar 2x.
        var submitted = false;
        function maybeSubmit() {
            if (submitted || otp.value.length < len) return;
            submitted = true;
            var btn = document.getElementById("kc-login") || form.querySelector('[type="submit"]');
            setTimeout(function () {
                if (btn) btn.click();
                else if (form.requestSubmit) form.requestSubmit();
                else form.submit();
            }, 60);
        }

        function clearError() {
            for (var i = 0; i < boxes.length; i++) {
                boxes[i].classList.remove("app-otp-box--error");
            }
        }

        function focusBox(i) {
            if (i < 0) i = 0;
            if (i > boxes.length - 1) i = boxes.length - 1;
            boxes[i].focus();
            boxes[i].select();
        }

        // Distribui uma sequencia de digitos a partir de startAt; retorna a proxima vaga.
        function fill(str, startAt) {
            var ds = onlyDigits(str);
            var i = startAt || 0;
            for (var k = 0; k < ds.length && i < boxes.length; k++, i++) {
                boxes[i].value = ds.charAt(k);
            }
            sync();
            return i;
        }

        boxes.forEach(function (b, idx) {
            b.addEventListener("input", function () {
                clearError();
                var d = onlyDigits(b.value);
                if (d.length <= 1) {
                    b.value = d;
                    sync();
                    if (d.length === 1 && idx < boxes.length - 1) focusBox(idx + 1);
                } else {
                    // teclado/autofill jogou varios digitos de uma vez
                    focusBox(fill(d, idx));
                }
                maybeSubmit();
            });

            b.addEventListener("keydown", function (e) {
                if (e.key === "Backspace") {
                    if (b.value) {
                        b.value = "";
                        sync();
                        clearError();
                    } else if (idx > 0) {
                        e.preventDefault();
                        boxes[idx - 1].value = "";
                        sync();
                        focusBox(idx - 1);
                    }
                } else if (e.key === "ArrowLeft" && idx > 0) {
                    e.preventDefault();
                    focusBox(idx - 1);
                } else if (e.key === "ArrowRight" && idx < boxes.length - 1) {
                    e.preventDefault();
                    focusBox(idx + 1);
                }
            });

            b.addEventListener("paste", function (e) {
                e.preventDefault();
                var data = (e.clipboardData || window.clipboardData).getData("text");
                clearError();
                var next = fill(data, idx);
                focusBox(next);
                maybeSubmit();
            });

            b.addEventListener("focus", function () { b.select(); });
        });

        if (otp.value) fill(otp.value, 0);          // valor pre-existente (raro)
        focusBox(0);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
