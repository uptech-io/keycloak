<#import "template.ftl" as layout>
<@layout.emailLayout>
    <@layout.h1>${msg("appCodeTitle")}</@layout.h1>
    <@layout.p>${msg("appCodeIntro")}</@layout.p>
    <@layout.code value=code />
    <@layout.p muted=true>${msg("appCodeIgnore")}</@layout.p>
</@layout.emailLayout>
