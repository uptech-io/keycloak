/*
 * SSO — Globo pontilhado do painel de marca (script externo; theme.properties `scripts=`).
 * Desenha num <canvas class="app-aside__globe"> inserido como PRIMEIRO filho do
 * .app-aside (o style.css posiciona, corta na direita e faz o fade quando o
 * .app-aside ganha o atributo data-globe, posto aqui depois do primeiro quadro).
 * Projecao ortografica de uma grade de pontos sobre a terra firme (Natural Earth
 * 110m land, dominio publico), girando de oeste para leste (a superficie da frente
 * anda da esquerda para a direita) em ~PERIODO por volta; os pontos do Brasil saem
 * na cor de destaque. As duas cores vem do CSS, lidas do proprio .app-aside:
 * --app-aside-map e --app-aside-map-hi (sem elas, branco translucido).
 * Progressive enhancement: sem JS o style.css usa img/globe.svg (o mesmo primeiro
 * quadro) como imagem de fundo. Com prefers-reduced-motion desenha UM quadro e para.
 * Abaixo de 860px o CSS esconde o painel (display:none): o laco para e so volta se
 * o painel reaparecer (resize/ResizeObserver/visibilitychange).
 *
 * Os dados sao a grade empacotada em ASCII: uma linha por paralelo, de LAT_TOP
 * para baixo de LAT_STEP em LAT_STEP (sem a Antartida); cada linha tem
 * round(360*cos(lat)/LAT_STEP) colunas igualmente espacadas em longitude, as
 * linhas impares deslocadas meia coluna (a grade escalonada do mapa de
 * uptech.com.br). Cada char de MAP/HI carrega 6 colunas (bit j do char k = coluna
 * 6k+j, valor = posicao em ALPHA); zeros a direita ficam implicitos.
 */
(function () {
    "use strict";

    var LAT_TOP = 84;                  // primeiro paralelo (graus)
    var LAT_STEP = 2.2;                 // espacamento dos paralelos (graus)
    var ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    var MAP = ",0T,0qpW,0eF2G,0qu1GS,0cY70YV,GmU-02u_7,yVav1uG___,p__C71V____,m__P62-____V,m__Hm0mz____V,mv_X1007____F1,00_FS00Yz____X,G0__y108o____F8,00-_tF0Wx_____F4,00u___00y______7,000__V20W_______1,00W___000-_z-___N,000-__300WtZx____9,000-__100uRES____31,000y__10007K_x___V,000u__1000E8zF___V61,000m__70000V0y____7T,0000__3000W_1m_____m,0000-_70000-VN_____F,0000uF00000-__-z____,0000eFm0000y__tl-___3,0000GF00000y__V_2___V,00000S01000u___zVu__F,00000yC4000m___t_0_u3,00000mFW200W___V-1yXV,000000z0000W____U0u0-W,000000m10000-___V0W1u34,0000000X0000-___710103C,0000000i_000u____30C,0000000m_100m____10800W,0000000W_F0001___300W4C,0000000m_V0000y__000017,0000000m_V0000u__0000Cl1,0000000u__3000y_V0000CNG,0000000u__V000u_F0000CmWF,0000000u___000u_7000080Gl,0000000m___000u_700000MXA,0000000m__F000u_7,0000000m__F000y_71000007,0000000m__3000__H00000yO,0000000W__3000_VC00000_D,0000000W__000m_330000u_3,0000000W_V000m_X1000W__34,0000000m_3000u_O0000y__,0000000u_0000y700000__V,0000000yV0000_10000m__1,0000000-70000V00000y_V,0000000_1000m30000W7_1,000000WF00000000008WF,000000u700000000000y,000000y0000000000000W,000000700000000000803,00000030000000000004,00000u0000000000004,00000S,000003,000001,0000m,".split(",");
    var HI = ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,00000000mG,00000000uV,00000000y_3,00000000y_V,00000000___,00000000___,00000000w_F,00000000m_F,00000000W_3,00000000W_3,00000000m_,00000000mV,00000000m3,00000000m,00000000S,000000006,,,,,,,,,,,,".split(",");

    var TILT = 18;          // inclinacao do eixo: polo norte na direcao do observador
    var ROLL = 14;          // ... e caido para a esquerda (para longe do corte)
    var LON0 = -15;         // meridiano central do 1o quadro: o Brasil cai abaixo e a
                            // esquerda do centro, longe do slogan e do corte da direita
    var PERIOD = 135000;    // ms por volta
    var FRAME = 33;         // ~30 fps
    var MARGIN = 0.98;      // diametro = 100% da caixa menos uma folga
    var DOT = 0.0042;       // raio do ponto em fracao do diametro
    var STEPS = 10;         // faixas de profundidade da cor base (1 fill por faixa)
    var STEPS_HI = 40;      // idem do destaque: cor opaca, precisa de degrau mais fino
    var DISC = 0.05;        // disco tenue atras dos pontos, em fracao do alfa base
    var DEF = "rgba(255,255,255,.26)";
    var DEF_HI = "rgba(255,255,255,.9)";

    var RAD = Math.PI / 180, TAU = Math.PI * 2;

    // Pontos: a/b levam a longitude base (a = cos(lat)sin(lon), b = cos(lat)cos(lon))
    // para o quadro virar 4 multiplicacoes por ponto; y = sin(lat).
    var pa = [], pb = [], py = [], ph = [];

    function unpack() {
        var lut = {}, i;
        for (i = 0; i < ALPHA.length; i++) lut[ALPHA.charAt(i)] = i;

        for (var r = 0; r < MAP.length; r++) {
            var lat = (LAT_TOP - r * LAT_STEP) * RAD;
            var cl = Math.cos(lat), sl = Math.sin(lat);
            var n = Math.max(1, Math.round(360 * cl / LAT_STEP));
            var step = TAU / n;
            var off = (r % 2) ? 0.5 : 0;
            var m = MAP[r], h = HI[r];
            for (var c = 0; c < n; c++) {
                var k = c / 6 | 0, bit = 1 << (c % 6);
                if (k >= m.length || !(lut[m.charAt(k)] & bit)) continue;
                var lon = -Math.PI + (c + off) * step;
                pa.push(cl * Math.sin(lon));
                pb.push(cl * Math.cos(lon));
                py.push(sl);
                ph.push(k < h.length && (lut[h.charAt(k)] & bit) ? 1 : 0);
            }
        }
    }

    function init() {
        var aside = document.querySelector(".app-aside");
        if (!aside) return;                                  // so nas paginas com o painel
        if (aside.querySelector(".app-aside__globe")) return; // idempotente

        var canvas = document.createElement("canvas");
        canvas.className = "app-aside__globe";
        canvas.setAttribute("aria-hidden", "true");

        var ctx = null;
        try {
            ctx = canvas.getContext && canvas.getContext("2d");
        } catch (e) { /* sem canvas: fica so o fundo do CSS */ }
        if (!ctx) return;

        aside.insertBefore(canvas, aside.firstChild);
        unpack();

        // Faixas de profundidade: buckets[0..STEPS-1] = base, o resto = destaque.
        // counts[] diz quanto de cada array esta em uso no quadro: os arrays so
        // crescem, entao o quadro nao gera lixo para o coletor.
        var buckets = [], counts = [], b;
        for (b = 0; b < STEPS + STEPS_HI; b++) { buckets.push([]); counts.push(0); }

        var W = 0, H = 0, R = 0, rad = 0, dpr = 0;
        var color = DEF, colorHi = DEF_HI;
        var dirty = true, shown = false;
        var t0 = 0, last = -1e9, raf = 0;

        function ratio() {
            return Math.min(window.devicePixelRatio || 1, 2);
        }

        function measure() {
            var w = canvas.clientWidth, h = canvas.clientHeight;
            if (!w || !h) return false;
            dpr = ratio();
            var cw = Math.round(w * dpr), ch = Math.round(h * dpr);
            if (canvas.width !== cw || canvas.height !== ch) {
                canvas.width = cw;
                canvas.height = ch;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);          // desenha em px de CSS
            W = w; H = h;
            R = Math.min(w, h) / 2 * MARGIN;
            rad = Math.max(0.6, DOT * 2 * R);
            // barato, e pega troca de marca (brand.css) junto com o resize
            var cs = window.getComputedStyle(aside);
            color = (cs.getPropertyValue("--app-aside-map") || "").trim() || DEF;
            colorHi = (cs.getPropertyValue("--app-aside-map-hi") || "").trim() || DEF_HI;
            return true;
        }

        // Uma chamada de fill por faixa (nao por ponto). Alem do alfa, o raio tambem
        // cai com a profundidade: perto do limbo as fileiras ficam a poucos pixels
        // uma da outra e pontos de raio cheio se fundiriam em arcos continuos.
        function paint(off, steps, fill) {
            ctx.fillStyle = fill;
            for (var k = 0; k < steps; k++) {
                var n = counts[off + k];
                if (!n) continue;
                var pts = buckets[off + k];
                var u = (k + 0.5) / steps;
                var rk = rad * (0.5 + 0.5 * u);
                ctx.globalAlpha = 0.2 + 0.8 * u;
                ctx.beginPath();
                for (var i = 0; i < n; i += 2) {
                    ctx.moveTo(pts[i] + rk, pts[i + 1]);
                    ctx.arc(pts[i], pts[i + 1], rk, 0, TAU);
                }
                ctx.fill();
            }
        }

        function draw(theta) {
            var ct = Math.cos(TILT * RAD), st = Math.sin(TILT * RAD);
            var cr = Math.cos(ROLL * RAD), sr = Math.sin(ROLL * RAD);
            var cth = Math.cos(theta), sth = Math.sin(theta);
            var cx = W / 2, cy = H / 2, i;

            for (i = 0; i < counts.length; i++) counts[i] = 0;

            for (i = 0; i < pa.length; i++) {
                var a = pa[i], bb = pb[i];
                var x0 = a * cth + bb * sth;                 // gira em torno do eixo
                var z0 = bb * cth - a * sth;
                var y0 = py[i];
                var y1 = y0 * ct - z0 * st;                  // inclina o eixo
                var z = y0 * st + z0 * ct;
                if (z <= 0) continue;                        // so o hemisferio da frente
                var x = x0 * cr - y1 * sr;                   // e deita para a esquerda
                var y = x0 * sr + y1 * cr;
                var hi = ph[i], s = hi ? STEPS_HI : STEPS;
                var k = (z * s) | 0;                         // limbo mais apagado
                if (k > s - 1) k = s - 1;
                if (hi) k += STEPS;
                var pts = buckets[k], c = counts[k];
                pts[c] = cx + x * R;
                pts[c + 1] = cy - y * R;
                counts[k] = c + 2;
            }

            ctx.clearRect(0, 0, W, H);
            if (DISC > 0) {
                ctx.globalAlpha = DISC;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(cx, cy, R, 0, TAU);
                ctx.fill();
            }
            paint(0, STEPS, color);
            paint(STEPS, STEPS_HI, colorHi);
            ctx.globalAlpha = 1;

            if (!shown) {
                shown = true;
                aside.setAttribute("data-globe", "");
            }
        }

        // Nao desenha quando nao esta na tela (CSS escondeu o painel, aba em segundo plano).
        function hidden() {
            return document.hidden || !canvas.clientWidth || aside.offsetParent === null;
        }

        // Remede quando o CSS mudou o tamanho (ResizeObserver) ou quando o zoom do
        // navegador / a troca de monitor mudou o devicePixelRatio (que nao mexe no
        // tamanho em px de CSS, entao o ResizeObserver nao dispara).
        function ready() {
            if (dpr !== ratio()) dirty = true;
            if (!dirty) return true;
            if (!measure()) return false;
            dirty = false;
            return true;
        }

        function once() {
            if (hidden() || !ready()) return;
            draw(-LON0 * RAD);
        }

        function frame(now) {
            raf = 0;
            if (now - last >= FRAME) {
                last = now;
                if (hidden()) return;             // para o laco; os listeners acordam
                if (ready()) {
                    if (!t0) t0 = now;
                    draw(-LON0 * RAD + TAU * ((now - t0) % PERIOD) / PERIOD);
                }
            }
            raf = window.requestAnimationFrame(frame);
        }

        function stop() {
            if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        }

        var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

        function apply() {
            stop();
            if (mq && mq.matches) {
                t0 = 0;
                once();
            } else {
                last = -1e9;
                raf = window.requestAnimationFrame(frame);
            }
        }

        // Painel redimensionado, reaparecido ou aba de volta: remede e, se o laco
        // tinha parado, retoma.
        function resized() {
            dirty = true;
            if (mq && mq.matches) once();
            else if (!raf) { last = -1e9; raf = window.requestAnimationFrame(frame); }
        }

        // O zoom do navegador dispara resize; arrastar a janela para um monitor com
        // outra densidade nao: essa media query avisa e se re-arma no valor novo.
        function watchDpr() {
            if (!window.matchMedia) return;
            var q = window.matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
            var on = function () {
                if (q.removeEventListener) q.removeEventListener("change", on);
                else if (q.removeListener) q.removeListener(on);
                resized();
                watchDpr();
            };
            if (q.addEventListener) q.addEventListener("change", on);
            else if (q.addListener) q.addListener(on);
        }

        if (mq) {
            if (mq.addEventListener) mq.addEventListener("change", apply);
            else if (mq.addListener) mq.addListener(apply);
        }
        if (window.ResizeObserver) new window.ResizeObserver(resized).observe(canvas);
        window.addEventListener("resize", resized);
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) resized();
        });
        watchDpr();

        apply();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
