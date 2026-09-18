<#-- Wrapper branded dos e-mails (override de base/email/html/template.ftl).
     Estiliza TODOS os e-mails: cabecalho com a logo/nome do realm, card de conteudo
     e rodape. HTML email-safe (tabelas + estilos inline). Fontes: Manrope (texto) e
     JetBrains Mono (codigo) via Google Fonts nos clientes que carregam web fonts
     (Apple Mail, iOS); os demais caem no stack do sistema. Helpers: h1, p, button, code.
     Cores de marca: appColorPrimary (cabecalho, titulos, CTA, codigo) e appColorOnPrimary
     (texto sobre ela) do theme.properties de cada marca; sem elas, valem as da casa. -->
<#assign fontStack = "'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<#assign monoStack = "'JetBrains Mono',ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace">
<#assign brand = (realmName!'')?has_content?then(realmName, properties.appBrandName!'Uptech')>
<#assign colorPrimary = (properties.appColorPrimary!'')?has_content?then(properties.appColorPrimary, '#07111F')>
<#assign colorOnPrimary = (properties.appColorOnPrimary!'')?has_content?then(properties.appColorOnPrimary, '#FFFFFF')>

<#macro emailLayout>
<!DOCTYPE html>
<html lang="${locale.language!'pt-BR'}" dir="${(ltr!true)?then('ltr','rtl')}" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${brand}</title>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&amp;family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0; padding:0; background:#F5F7FA; -webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F7FA;">
        <tr>
            <td align="center" style="padding:32px 16px;">

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border:1px solid #EEF2F6; border-radius:8px; overflow:hidden; font-family:${fontStack};">

                    <#-- Cabecalho -->
                    <tr>
                        <td bgcolor="${colorPrimary}" style="background:${colorPrimary}; padding:24px 32px; text-align:center;">
                            <#if (properties.appLogoUrl!'')?has_content>
                                <img src="${properties.appLogoUrl}" alt="${brand}" height="80" style="display:block; height:80px; width:auto; margin:0 auto; border:0; outline:none;" />
                            <#else>
                                <span style="display:inline-block; color:${colorOnPrimary}; font-size:18px; font-weight:700; letter-spacing:.04em;">${brand}</span>
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
                                <a href="${(properties.appPrivacyUrl!'')?has_content?then(properties.appPrivacyUrl, '#')}" style="color:#667085; text-decoration:none;">${msg("appPrivacyPolicy")}</a>
                                <span style="color:#D0D5DD;">&nbsp;|&nbsp;</span>
                                <a href="${(properties.appTermsUrl!'')?has_content?then(properties.appTermsUrl, '#')}" style="color:#667085; text-decoration:none;">${msg("appTermsPolicy")}</a>
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

<#macro h1>
<h1 style="margin:0 0 16px; font-size:20px; line-height:1.4; color:${colorPrimary}; font-weight:700; font-family:${fontStack};"><#nested></h1>
</#macro>

<#macro p muted=false>
<p style="margin:0 0 14px; font-size:${muted?then('13','15')}px; line-height:1.62; color:${muted?then('#667085','#344054')}; font-family:${fontStack};"><#nested></p>
</#macro>

<#-- CTA "bulletproof": o fundo vem do <td> porque o Outlook ignora padding/fundo em <a>. -->
<#macro button href label>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
        <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td align="center" bgcolor="${colorPrimary}" style="border-radius:4px;">
                        <a href="${href}" target="_blank" style="display:inline-block; padding:13px 30px; color:${colorOnPrimary}; font-size:15px; font-weight:700; text-decoration:none; border-radius:4px; font-family:${fontStack};">${label}</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</#macro>

<#macro code value>
<div style="margin:24px 0; text-align:center;">
    <span style="display:inline-block; padding:14px 26px; font-family:${monoStack}; font-size:30px; font-weight:700; letter-spacing:.28em; color:${colorPrimary}; background:#F5F7FA; border:1px solid #EEF2F6; border-radius:8px;">${value}</span>
</div>
</#macro>
