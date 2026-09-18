<#import "template.ftl" as layout>
<@layout.emailLayout>
    <@layout.h1>${msg("appResetTitle")}</@layout.h1>
    <@layout.p>${msg("appResetIntro")}</@layout.p>
    <@layout.button href=link label=msg("appResetCta") />
    <@layout.p muted=true>${msg("appLinkExpires", linkExpirationFormatter(linkExpiration))}</@layout.p>
    <@layout.p muted=true>${msg("appResetIgnore")}</@layout.p>
</@layout.emailLayout>
