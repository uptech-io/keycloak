<#import "template.ftl" as layout>
<@layout.emailLayout>
    <@layout.h1>${msg("appVerifyTitle")}</@layout.h1>
    <@layout.p>${msg("appVerifyIntro")}</@layout.p>
    <@layout.button href=link label=msg("appVerifyCta") />
    <@layout.p muted=true>${msg("appLinkExpires", linkExpirationFormatter(linkExpiration))}</@layout.p>
    <@layout.p muted=true>${msg("appVerifyIgnore")}</@layout.p>
</@layout.emailLayout>
