<#import "footer.ftl" as loginFooter>

<#macro appLegalFooter>
    <div class="app-footer__legal">
        <span>&copy; ${.now?string('yyyy')} UPTECH. ${msg("appRights")}</span>
        <a href="${properties.appPrivacyUrl!'#'}">${msg("appPrivacyPolicy")}</a>
        <a href="${properties.appTermsUrl!'#'}">${msg("appTermsPolicy")}</a>
    </div>
</#macro>
<#-- registrationLayout: layout split (aside de marketing + formulario branco).
     Mantem a assinatura/secoes do template base p/ nao quebrar as paginas herdadas. -->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${lang}"<#if realm.internationalizationEnabled> dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <script src="${url.resourcesPath}/js/menu-button-links.js" type="module"></script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module">
        import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";

        startSessionPolling(
            "${url.ssoLoginInOtherTabsUrl?no_esc}"
        );
    </script>
    <script type="module">
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[data-once-link]");

            if (!link) {
                return;
            }

            if (link.getAttribute("aria-disabled") === "true") {
                event.preventDefault();
                return;
            }

            const { disabledClass } = link.dataset;

            if (disabledClass) {
                link.classList.add(...disabledClass.trim().split(/\s+/));
            }

            link.setAttribute("role", "link");
            link.setAttribute("aria-disabled", "true");
        });
    </script>
    <#if authenticationSession??>
        <script type="module">
            import { checkAuthSession } from "${url.resourcesPath}/js/authChecker.js";

            checkAuthSession(
                "${authenticationSession.authSessionIdHash}"
            );
        </script>
    </#if>
</head>

<body class="app-body" data-page-id="login-${pageId}" data-toast-close="${msg('appClose')}">
<div class="app-login">

    <#-- ============ Painel de marketing (aside) ============ -->
    <aside class="app-aside">
        <div class="app-aside__content">
           
            <img class="app-aside__logo" src="${url.resourcesPath}/img/idm.png" alt="${properties.appBrandName!'Uptech'}" />
            <h2 class="app-aside__title">${msg("appWelcomeTitle")?no_esc}</h2>
            <p class="app-aside__subtitle">${msg("appWelcomeSubtitle")}</p>
        </div>
        <footer class="app-footer--aside"><@appLegalFooter/></footer>
    </aside>

    <#-- ============ Painel do formulario ============ -->
    <main class="app-main">
        <div class="app-main__inner">

            <#-- Seletor de idioma -->
            <#if realm.internationalizationEnabled && locale.supported?size gt 1>
                <div class="app-locale" id="kc-locale">
                    <div id="kc-locale-wrapper" class="${properties.kcLocaleWrapperClass!}">
                        <div id="kc-locale-dropdown" class="menu-button-links ${properties.kcLocaleDropDownClass!}">
                            <button tabindex="1" id="kc-current-locale-link" aria-label="${msg("languages")}" aria-haspopup="true" aria-expanded="false" aria-controls="language-switch1">${locale.current}</button>
                            <ul role="menu" tabindex="-1" aria-labelledby="kc-current-locale-link" aria-activedescendant="" id="language-switch1" class="${properties.kcLocaleListClass!}">
                                <#assign i = 1>
                                <#list locale.supported as l>
                                    <li class="${properties.kcLocaleListItemClass!}" role="none">
                                        <a role="menuitem" id="language-${i}" class="${properties.kcLocaleItemClass!}" href="${l.url}">${l.label}</a>
                                    </li>
                                    <#assign i++>
                                </#list>
                            </ul>
                        </div>
                    </div>
                </div>
            </#if>

            <div class="app-form" id="kc-form-card">
                <header class="app-form__header">
                    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                        <#if displayRequiredFields>
                            <div class="app-required-note"><span class="required">*</span> ${msg("requiredFields")}</div>
                        </#if>
                        <h1 id="kc-page-title" class="app-form__title"><#nested "header"></h1>
                    <#else>
                        <#-- Telas que ja identificaram o usuario substituem o titulo padrao
                             pelo bloco do usuario. So na tela de OTP injetamos titulo + ajuda
                             proprios; o e-mail abaixo vira linha secundaria. -->
                        <#if pageId == "login-otp">
                            <h1 id="kc-page-title" class="app-form__title">${msg("appOtpTitle")}</h1>
                            <p class="app-form__subhead">${msg("appOtpHelp")}</p>
                        </#if>
                        <#if displayRequiredFields>
                            <div class="app-required-note"><span class="required">*</span> ${msg("requiredFields")}</div>
                        </#if>
                        <#nested "show-username">
                        <div id="kc-username" class="app-attempted-user ${properties.kcFormGroupClass!}">
                            <label id="kc-attempted-username">${auth.attemptedUsername}</label>
                            <a id="reset-login" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
                                <div class="kc-login-tooltip">
                                    <i class="${properties.kcResetFlowIcon!}"></i>
                                    <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
                                </div>
                            </a>
                        </div>
                    </#if>

                    <#-- Info/cadastro abaixo do titulo. Sem os ids #kc-info / #kc-info-wrapper
                         de proposito: herdam do login.css do KC um fundo cinza + margens
                         negativas que quebram o alinhamento. -->
                    <#if displayInfo>
                        <div class="app-form__subhead">
                            <#nested "info">
                        </div>
                    </#if>
                </header>

                <div id="kc-content">
                    <div id="kc-content-wrapper">

                        <#-- Social no topo + divisor "ou". O divisor depende do CSS
                             :has(#kc-social-providers) p/ nao aparecer solto em paginas
                             sem social (ex.: OTP). -->
                        <#nested "socialProviders">

                        <#if social?? && social.providers?has_content>
                            <div class="app-divider"><span>${msg("appOr")}</span></div>
                        </#if>

                        <#nested "form">

                        <#if auth?has_content && auth.showTryAnotherWayLink()>
                            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                                <div class="${properties.kcFormGroupClass!}">
                                    <input type="hidden" name="tryAnotherWay" value="on"/>
                                    <a href="#" id="try-another-way"
                                       onclick="document.forms['kc-select-try-another-way-form'].requestSubmit();return false;">${msg("doTryAnotherWay")}</a>
                                </div>
                            </form>
                        </#if>

                    </div>
                </div>

            </div>

            <#-- Rodape abaixo do form (mobile, quando a aside some) -->
            <footer class="app-footer--form">
                <@appLegalFooter/>
                <@loginFooter.content/>
            </footer>
        </div>
    </main>
</div>

<#-- ============ Toast / Snackbar ============
     Mensagem GLOBAL do KC (server-rendered); erros de campo viram toast via toast.js. -->
<#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
    <div class="app-toast app-toast--${message.type}" id="app-toast" role="alert" aria-live="assertive" data-autohide="6000">
        <span class="app-toast__icon" aria-hidden="true"></span>
        <span class="app-toast__msg">${kcSanitize(message.summary)?no_esc}</span>
        <button type="button" class="app-toast__close" aria-label="${msg('appClose')}">&times;</button>
    </div>
</#if>
<#-- Logica do toast (fechar/auto-hide + erro de campo) em resources/js/toast.js. -->
</body>
</html>
</#macro>
