# Keycloak · tema

O repositório não tem código de aplicação: são apenas
templates FreeMarker, CSS e JavaScript estáticos e os textos em português (pt-BR),
inglês e espanhol.

O que muda em relação ao tema padrão do Keycloak:

- Login em duas colunas: painel escuro com logo e título à esquerda, formulário à
  direita. Abaixo de 860 px o painel some e o rodapé passa para baixo do formulário.
- A mensagem do servidor aparece como *toast* no canto superior direito; quando não há
  mensagem do servidor, cada erro de validação vira um toast próprio, com o nome do campo,
  empilhados no mesmo canto. Sem JavaScript, os erros ficam inline, junto ao campo.
- Código OTP em seis caixas, com avanço automático, colar, envio automático ao
  completar e teclado numérico no celular. Sem JavaScript o campo único continua
  funcionando.
- Seletor de idioma oculto; o idioma vem do navegador ou do usuário (veja **Idiomas**).
- Telas de chave de segurança (WebAuthn/passkey) e de escolha do método de login com
  título próprio, cards e ícones do tema — o fluxo continua sendo o do Keycloak.
- Todos os e-mails do Keycloak saem com cabeçalho, card e rodapé da marca.

```
themes/uptech/
├── login/                   # telas de login e derivadas (cadastro, senha, OTP, termos…)
│   ├── template.ftl · login-otp.ftl · theme.properties
│   ├── messages/            # textos em pt_BR, en e es
│   └── resources/           # css, js, fontes (Manrope e JetBrains Mono) e imagens
└── email/                   # e-mails
    ├── html/                # wrapper comum + os quatro e-mails principais
    ├── messages/            # assuntos e textos em pt_BR, en e es
    └── theme.properties
Dockerfile · build.sh        # imagem de produção
CLAUDE.md                    # arquitetura interna (templates, acoplamentos entre CSS e JS)
```

## Desenvolvimento

O comando abaixo sobe a imagem oficial do Keycloak com a pasta `themes/` montada como
volume. No modo `start-dev` o cache de temas já vem desativado, então qualquer alteração
nos arquivos aparece ao recarregar a página, sem rebuild.

```bash
docker container run --rm -it \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -p 8082:8080 -v ./themes:/opt/keycloak/themes/ \
    quay.io/keycloak/keycloak:26.7.2 start-dev
```

Depois, no Admin Console (<http://localhost:8082>):

1. Em **Realm settings → Themes**, selecione `uptech` em *Login theme* e em *Email theme*.
2. Em **Realm settings → Localization**, habilite *Internationalization*, adicione
   **pt-BR, en e es** em *Supported locales* e defina **pt-BR** como *Default locale*.
   Sem isso, o Keycloak renderiza todas as telas em inglês.
3. Para os e-mails, configure o SMTP em **Realm settings → Email**. O botão
   *Test connection* envia apenas um e-mail genérico ao admin logado (que precisa ter
   e-mail cadastrado) e mostra só o cabeçalho e o rodapé; para ver os corpos
   personalizados, use *Esqueceu sua senha?* na tela de login ou a ação obrigatória
   *Verify Email* em um usuário.

## Produção

```bash
./build.sh                                      # docker build -t ghcr.io/uptech-io/keycloak:26 .
docker run --rm -it -p 8082:8080 \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -e KC_HTTP_ENABLED=true -e KC_HOSTNAME_STRICT=false \
    ghcr.io/uptech-io/keycloak:26 start
```

O segundo comando serve só para conferir a imagem localmente (HTTP, banco H2 em
arquivo). Em produção, informe o banco (`KC_DB`, `KC_DB_URL`, `KC_DB_USERNAME`,
`KC_DB_PASSWORD`), o `KC_HOSTNAME` e o TLS — ou termine o TLS no proxy e use
`KC_HTTP_ENABLED=true` com `KC_PROXY_HEADERS=xforwarded`.

A imagem é a oficial (`26.7.2`) com os temas copiados para `/opt/keycloak/themes/`;
não há etapa de build do Keycloak. Se o tempo de inicialização for um problema,
adicione ao `Dockerfile` um `RUN /opt/keycloak/bin/kc.sh build --db=…` com as mesmas
opções usadas em produção e inicie com `start --optimized`.

O `build.sh` só constrói a imagem; o envio ao registro é manual
(`docker push ghcr.io/uptech-io/keycloak:26`). A tag `:26` é móvel — quem fixa a
versão é o `FROM` do `Dockerfile`.

## Personalização

| O quê | Onde |
|---|---|
| Logo (painel escuro e e-mails) | `login/resources/img/idm.png` — versão branca, exibida sobre fundo escuro; nos e-mails sai com 80 px de altura |
| Monograma acima do título do formulário (só no mobile, ≤ 860 px) | `login/resources/img/logo-single.png` (escuro, 78 px de altura, centralizado) |
| URL da logo nos e-mails | `email/theme.properties` → `appLogoUrl` (veja a seção **E-mails**) |
| Favicon | `login/resources/img/favicon.ico` |
| Cores, fontes e raio das bordas | tokens `--app-*` e `--font-*` no bloco `:root` de `login/resources/css/style.css` |
| Textos do login | `login/messages/`: painel lateral `appWelcomeTitle` (aceita HTML); rodapé `appRights`, `appPrivacyPolicy`, `appTermsPolicy`; OTP `appOtpTitle`, `appOtpHelp`; chave de segurança `appPasskeyTitle`, `appPasskeyHelp`, `appPasskeyWaiting`; escolha de método `appChooseTitle`, `appChooseHelp` |
| Textos dos e-mails | `email/messages/`: assuntos `*Subject`, corpo `app<Email>Title / Intro / Cta / Ignore` e a versão em texto puro `*Body` |
| Links das políticas | `appPrivacyUrl` e `appTermsUrl`, nos dois `theme.properties` |
| Nome da marca | `appBrandName`, nos dois `theme.properties`: `alt` da logo no login e © do rodapé no login e nos e-mails (em maiúsculas); título, cabeçalho e aviso final dos e-mails usam o *Display name* do realm, quando houver |

A cor primária atual é `#07111F`. As fontes são Manrope, para o texto, e JetBrains Mono,
para códigos — ambas sob licença SIL OFL 1.1. No login elas são servidas localmente
(`login/resources/fonts/`, woff2 variável, subconjunto latino); nos e-mails vêm do
Google Fonts e só carregam em clientes que aceitam web fonts (Apple Mail, iOS) — os
demais usam a fonte do sistema.

## Idiomas

O tema oferece pt-BR, en e es (`locales=` nos dois `theme.properties` — a chave informa
os idiomas do tema, não restringe os *Supported locales* do realm), no login e nos
e-mails. Assim que o
usuário é identificado (OTP, e-mails, pós-login) vale o atributo `locale` dele; antes
disso, o `ui_locales` enviado pelo cliente ou o `Accept-Language` do navegador. O seletor
de idioma é renderizado, mas fica oculto por CSS.

Toda chave `app*` precisa existir nos três arquivos de `messages/` — e login e e-mail têm
arquivos separados. Como os valores passam pelo `MessageFormat` do Java, apóstrofos
devem ser escritos como `''`.

## E-mails

O wrapper `email/html/template.ftl` aplica o cabeçalho com a logo, o card de conteúdo e
o rodapé a **todos** os e-mails enviados pelo Keycloak. Quatro deles têm corpo próprio,
com texto da marca: redefinição de senha, verificação de e-mail, atualização de conta e
código de verificação. Cada um desses quatro também é enviado em texto puro, a partir
das chaves `passwordResetBody`, `emailVerificationBody`, `executeActionsBody` e
`emailVerificationBodyCode` — ao mudar um texto, mude as duas versões.

A logo dos e-mails precisa de uma **URL pública e absoluta**, porque os clientes de
e-mail não carregam arquivos do tema. Hoje ela é servida pelo próprio Keycloak:

```
appLogoUrl=${env.APP_LOGO_URL:https://sso.uptech.com.br/resources/<tag>/login/uptech/img/idm.png}
```

O Keycloak passa os valores de `theme.properties` pelo `StringPropertyReplacer`: se a
variável de ambiente `APP_LOGO_URL` existir no container, ela vence; senão vale a URL
escrita após o primeiro `:` (os `:` e `/` da própria URL não atrapalham).

O segmento `<tag>` é um identificador aleatório que o Keycloak gera para cada banco de
dados a cada migração — ou seja, muda a cada upgrade e é diferente entre desenvolvimento
e produção. Depois de um upgrade, copie o valor de uma URL real da produção; se preferir
algo imune a upgrades, hospede a logo em um endereço estável e informe-o em `APP_LOGO_URL`. Com `appLogoUrl` vazio, o
cabeçalho mostra em texto o *Display name* do realm (ou `appBrandName`, se ele estiver
vazio).

## Upgrade do Keycloak

1. Atualize a versão no `Dockerfile` e no comando de desenvolvimento acima.
2. Compare os arquivos sobrescritos com os equivalentes do tema base da nova versão
   (`themes/src/main/resources/theme/base/` no repositório do Keycloak) e ressincronize:
   `login/template.ftl`, `login/login-otp.ftl`, `email/html/template.ftl` e os quatro
   e-mails.
3. Atualize o `<tag>` em `appLogoUrl`.
4. Suba o ambiente de desenvolvimento e confira as telas de login, OTP e cadastro, além
   de um e-mail de teste.
