<#import "footer.ftl" as loginFooter>
<#import "theme-resources.ftl" as themeResourceTags>

<#macro appLegalFooter>
    <div class="app-footer__legal">
        <span>&copy; ${.now?string('yyyy')} ${(properties.appBrandName!'Uptech')?upper_case}. ${msg("appRights")}</span>
        <a href="${(properties.appPrivacyUrl!'')?has_content?then(properties.appPrivacyUrl, '#')}">${msg("appPrivacyPolicy")}</a>
        <a href="${(properties.appTermsUrl!'')?has_content?then(properties.appTermsUrl, '#')}">${msg("appTermsPolicy")}</a>
    </div>
</#macro>

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
    <title>${title!}</title>
    <#if themeResources?? && themeResources.favicons?has_content>
        <@themeResourceTags.renderFavicons themeResources.favicons url.resourcesPath />
    <#else>
        <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    </#if>
    <#if themeResources?? && themeResources.stylesCommon?has_content>
        <@themeResourceTags.renderStyles themeResources.stylesCommon url.resourcesCommonPath />
    <#elseif properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if themeResources?? && themeResources.styles?has_content>
        <@themeResourceTags.renderStyles themeResources.styles url.resourcesPath />
    <#elseif properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if themeResources?? && themeResources.scripts?has_content>
        <@themeResourceTags.renderScripts themeResources.scripts url.resourcesPath "text/javascript" />
    <#elseif properties.scripts?has_content>
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
        <#outputformat "JavaScript">
        import { startSessionPolling } from ${(url.resourcesPath + "/js/authChecker.js")?c};

        startSessionPolling(
            ${url.ssoLoginInOtherTabsUrl?c}
        );
        </#outputformat>
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
            <#outputformat "JavaScript">
            import { checkAuthSession } from ${(url.resourcesPath + "/js/authChecker.js")?c};

            checkAuthSession(
                ${authenticationSession.authSessionIdHash?c}
            );
            </#outputformat>
        </script>
    </#if>
</head>

<body class="app-body" data-page-id="login-${pageId}" data-toast-close="${msg('appClose')}" data-passkey-waiting="${msg('appPasskeyWaiting')}">
<div class="app-login">

    <aside class="app-aside">
        <div class="app-aside__content">

            <img class="app-aside__logo" src="${url.resourcesPath}/img/idm.png" alt="${properties.appBrandName!'Uptech'}" />
            <h2 class="app-aside__title">${msg("appWelcomeTitle")?no_esc}</h2>
        </div>
        <footer class="app-footer--aside"><@appLegalFooter/></footer>
    </aside>

    <main class="app-main">
        <div class="app-main__inner">

            <#-- Renderizado como no base, mas oculto: .app-locale { display:none } no style.css. -->
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
                    <img class="app-form__logo" src="${url.resourcesPath}/img/logo-single.png" alt="${properties.appBrandName!'Uptech'}" />
                    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                        <#if displayRequiredFields>
                            <div class="app-required-note"><span class="required">*</span> ${msg("requiredFields")}</div>
                        </#if>
                        <h1 id="kc-page-title" class="app-form__title"><#nested "header"></h1>
                    <#else>
                        <#-- Aqui o base troca o titulo pelo bloco do usuario; nas telas
                             abaixo reinjetamos titulo + ajuda proprios (o e-mail vira linha
                             secundaria). Nova tela = nova entrada + chaves app* nos 3 bundles. -->
                        <#assign appPageTitle = {"login-otp": "appOtpTitle", "webauthn-authenticate": "appPasskeyTitle", "select-authenticator": "appChooseTitle"}>
                        <#assign appPageHelp = {"login-otp": "appOtpHelp", "webauthn-authenticate": "appPasskeyHelp", "select-authenticator": "appChooseHelp"}>
                        <#if appPageTitle[pageId]??>
                            <h1 id="kc-page-title" class="app-form__title">${msg(appPageTitle[pageId])}</h1>
                            <#if appPageHelp[pageId]??>
                                <p class="app-form__subhead">${msg(appPageHelp[pageId])}</p>
                            </#if>
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

                    <#-- Sem os ids #kc-info / #kc-info-wrapper de proposito: no login.css do KC
                         eles trazem fundo cinza + margens negativas que quebram o alinhamento. -->
                    <#if displayInfo>
                        <div class="app-form__subhead">
                            <#nested "info">
                        </div>
                    </#if>
                </header>

                <div id="kc-content">
                    <div id="kc-content-wrapper">

                        <#-- O divisor "ou" depende do CSS :not(:has(#kc-social-providers))
                             p/ nao sobrar solto em paginas sem social (ex.: OTP). -->
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

                        <#if switchOrganizationEnabled?? && switchOrganizationEnabled>
                            <form id="kc-switch-organization-form" action="${url.loginAction}" method="post">
                                <div class="${properties.kcFormGroupClass!}">
                                    <input type="hidden" name="switchOrganization" value="true"/>
                                    <a href="#" id="switch-organization"
                                       onclick="document.forms['kc-switch-organization-form'].requestSubmit();return false;">${msg("doSwitchOrganization")}</a>
                                </div>
                            </form>
                        </#if>

                    </div>
                </div>

            </div>

            <#-- Rodape do mobile: o CSS so o mostra <=860px, quando a aside some. -->
            <footer class="app-footer--form">
                <@appLegalFooter/>
                <@loginFooter.content/>
            </footer>
        </div>
    </main>
</div>

<div class="app-toasts" id="app-toasts">
<#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
    <div class="app-toast app-toast--${message.type}" id="app-toast" role="alert" aria-live="assertive" data-autohide="6000">
        <span class="app-toast__icon" aria-hidden="true"></span>
        <span class="app-toast__msg">${kcSanitize(message.summary)?no_esc}</span>
        <button type="button" class="app-toast__close" aria-label="${msg('appClose')}">&times;</button>
    </div>
</#if>
</div>
</body>
</html>
</#macro>
