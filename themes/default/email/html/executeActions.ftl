<#import "template.ftl" as layout>
<@layout.emailLayout>
    <@layout.h1>${msg("appActionsTitle")}</@layout.h1>
    <@layout.p>${msg("appActionsIntro")}</@layout.p>
    <@layout.button href=link label=msg("appActionsCta") />
    <@layout.p muted=true>${msg("appLinkExpires", linkExpirationFormatter(linkExpiration))}</@layout.p>
    <@layout.p muted=true>${msg("appActionsIgnore")}</@layout.p>
</@layout.emailLayout>
