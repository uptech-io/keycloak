<#-- Wrapper branded dos e-mails Uptech (override de base/email/html/template.ftl).
     Estiliza TODOS os e-mails: cabecalho com o nome do realm, card de conteudo e
     rodape. HTML email-safe (tabelas + estilos inline; fontes do sistema, pois
     clientes de e-mail nao carregam fontes web). Helpers: h1, p, button, code. -->
<#assign fontStack = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<#assign brand = (realmName!'')?has_content?then(realmName, properties.appBrandName!'Uptech')>

<#macro emailLayout>
<!DOCTYPE html>
<html lang="${locale.language!'pt-BR'}" dir="${(ltr!true)?then('ltr','rtl')}" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${brand}</title>
</head>
<body style="margin:0; padding:0; background:#F5F7FA; -webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F7FA;">
        <tr>
            <td align="center" style="padding:32px 16px;">

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border:1px solid #EEF2F6; border-radius:8px; overflow:hidden; font-family:${fontStack};">

                    <#-- Cabecalho: apenas a logo. Sem logo (appLogoUrl vazio), cai p/
                         o nome do realm como texto, p/ o cabecalho nao ficar vazio. -->
                    <tr>
                        <td style="background:#07111F; padding:24px 32px; text-align:center;">
                            <#if (properties.appLogoUrl!'')?has_content>
                                <img src="${properties.appLogoUrl}" alt="${brand}" height="80" style="display:block; height:80px; width:auto; margin:0 auto; border:0; outline:none;" />
                            <#else>
                                <span style="display:inline-block; color:#ffffff; font-size:18px; font-weight:700; letter-spacing:.04em;">${brand}</span>
                            </#if>
                        </td>
                    </tr>

                    <#-- Corpo -->
                    <tr>
                        <td style="padding:34px 32px 28px; color:#344054; font-size:15px; line-height:1.62; font-family:${fontStack};">
                            <#nested>
                        </td>
                    </tr>

                    <#-- Rodape -->
                    <tr>
                        <td style="padding:22px 32px; background:#F5F7FA; border-top:1px solid #EEF2F6; text-align:center; color:#667085; font-size:12px; line-height:1.7; font-family:${fontStack};">
                            <div>&copy; ${.now?string('yyyy')} ${(properties.appBrandName!'Uptech')?upper_case}. ${msg("appRights")}</div>
                            <div style="margin-top:2px;">
                                <a href="${properties.appPrivacyUrl!'#'}" style="color:#667085; text-decoration:none;">${msg("appPrivacyPolicy")}</a>
                                <span style="color:#D0D5DD;">&nbsp;|&nbsp;</span>
                                <a href="${properties.appTermsUrl!'#'}" style="color:#667085; text-decoration:none;">${msg("appTermsPolicy")}</a>
                            </div>
                        </td>
                    </tr>

                </table>

                <p style="margin:18px 0 0; color:#98A2B3; font-size:11px; font-family:${fontStack};">${msg("appEmailDisclaimer", brand)}</p>

            </td>
        </tr>
    </table>
</body>
</html>
</#macro>

<#-- Titulo principal do corpo -->
<#macro h1>
<h1 style="margin:0 0 16px; font-size:20px; line-height:1.4; color:#07111F; font-weight:700; font-family:${fontStack};"><#nested></h1>
</#macro>

<#-- Paragrafo (muted=true para textos secundarios) -->
<#macro p muted=false>
<p style="margin:0 0 14px; font-size:${muted?then('13','15')}px; line-height:1.62; color:${muted?then('#667085','#344054')}; font-family:${fontStack};"><#nested></p>
</#macro>

<#-- Botao CTA centralizado (bulletproof: tabela full-width + cell central) -->
<#macro button href label>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" bgcolor="#07111F" style="border-radius:4px;">
                        <a href="${href}" target="_blank" style="display:inline-block; padding:13px 30px; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none; border-radius:4px; font-family:${fontStack};">${label}</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</#macro>

<#-- Codigo de verificacao em destaque -->
<#macro code value>
<div style="margin:24px 0; text-align:center;">
    <span style="display:inline-block; padding:14px 26px; font-family:ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace; font-size:30px; font-weight:700; letter-spacing:.28em; color:#07111F; background:#F5F7FA; border:1px solid #EEF2F6; border-radius:8px;">${value}</span>
</div>
</#macro>
