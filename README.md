# Keycloak · temas

O repositório não tem código de aplicação: são apenas
templates FreeMarker, CSS e JavaScript estáticos e os textos em português (pt-BR),
inglês e espanhol.

São três temas. O `default` é o tema-mãe: tem todos os templates, CSS, JS, fontes e
textos, e por si só renderiza com a identidade da casa. `uptech` e `upchip` estendem o
`default` (`parent=default`) e trazem **apenas** a identidade de cada marca: nome, links
das políticas, cores e, quando houver, logo. No realm de cada marca seleciona-se o tema
dela; o `default` é abstrato (`abstract=true`) e não aparece na lista de temas do Admin
Console.

O que muda em relação ao tema padrão do Keycloak:

- Login em duas colunas: painel escuro com logo e título à esquerda, formulário à
  direita. A logo e o slogan do painel entram com um fade suave, desligado quando o
  sistema pede movimento reduzido. Abaixo de 860 px o painel some e o rodapé passa para
  baixo do formulário.
- A mensagem do servidor aparece como *toast* no canto superior direito; quando não há
  mensagem do servidor, cada erro de validação vira um toast próprio, com o nome do campo,
  empilhados no mesmo canto. Sem JavaScript, os erros ficam inline, junto ao campo.
- Código OTP em seis caixas, com avanço automático, colar, envio automático ao
  completar e teclado numérico no celular. Sem JavaScript o campo único continua
  funcionando.
- O nome de usuário do produto é o **CPF**: o campo se chama "CPF" em todas as telas
  (login, cadastro, esqueci a senha, console da conta). Nas telas de login ele ganha a
  máscara `000.000.000-00` enquanto se digita e envia ao Keycloak só os 11 dígitos, que é
  como o usuário fica guardado; no console da conta só o rótulo muda. Se o realm permitir
  login por e-mail, rótulo e máscara acompanham. Sem JavaScript o campo aceita os dígitos
  crus (veja **CPF como nome de usuário**).
- Seletor de idioma oculto; o idioma vem do navegador ou do usuário (veja **Idiomas**).
- Telas de chave de segurança (WebAuthn/passkey) e de escolha do método de login com
  título próprio, cards e ícones do tema — o fluxo continua sendo o do Keycloak.
- Todos os e-mails do Keycloak saem com cabeçalho, card e rodapé da marca.

```
themes/
├── default/                 # tema-mãe (parent=keycloak / keycloak.v3)
│   ├── login/               # telas de login e derivadas (cadastro, senha, OTP, termos…)
│   │   ├── template.ftl · login-otp.ftl · theme.properties
│   │   ├── messages/        # textos em pt_BR, en e es
│   │   └── resources/       # css (style.css + brand.css), js, fontes e imagens
│   ├── email/               # e-mails
│   │   ├── html/            # wrapper comum + os quatro e-mails principais
│   │   ├── messages/        # assuntos e textos em pt_BR, en e es
│   │   └── theme.properties
│   └── account/             # console "Minha conta" (CSS, logo e um texto sobre o keycloak.v3)
│       ├── theme.properties
│       ├── messages/        # só username=CPF, em pt_BR, en e es
│       └── resources/       # css/account.css + css/brand.css, img
├── uptech/                  # marca Uptech: só theme.properties (cores e logo = casa)
│   ├── login/ · email/ · account/
└── upchip/                  # marca Upchip: theme.properties + css/brand.css (login e account)
    ├── login/ · email/ · account/   # + img/ com o monograma e o favicon da marca
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

1. Em **Realm settings → Themes**, selecione a marca (`uptech` ou `upchip`) em *Login theme*,
   *Account theme* e *Email theme*.
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

## Marcas

Como o Keycloak resolve temas em cadeia (`upchip` → `default` → `keycloak`), cada marca
só precisa do que difere:

- **`theme.properties`** é herdado chave a chave: o filho declara `parent=default` e as
  chaves de identidade; tudo o mais (idiomas, `styles`, `scripts`, ícones) vem do
  `default`. Por isso um filho **nunca** deve redeclarar `styles=` ou `scripts=` — o valor
  do filho substitui a lista inteira, não a complementa.
- **Arquivos** (templates, CSS, imagens) são herdados arquivo a arquivo: o Keycloak serve o
  do filho se existir, senão o do pai. As cores do login e do console ficam em um único
  arquivo, `resources/css/brand.css` (um no `login/`, outro no `account/`); a marca que tem
  cores próprias entrega a sua versão dele, com o mesmo caminho, e o resto do CSS não
  muda. As dos e-mails são `appColorPrimary`/`appColorOnPrimary` no `email/theme.properties`
  da marca.
- O `default` não tem nome de marca, links nem cores de marca no `theme.properties` de
  propósito: uma chave esquecida no filho cai no fallback do template — que para
  `appBrandName` é literalmente `Uptech`, a casa — e nunca no `theme.properties` de outra
  marca; por isso confira as chaves de identidade de toda marca nova.
- O **painel lateral é identidade do produto**, igual em todas as marcas: a logo
  `login/resources/img/idm.png` (também o cabeçalho dos e-mails, via `appLogoUrl`, e o
  masthead do console, `account/resources/img/idm.png`) e o slogan `appWelcomeTitle` ficam
  no `default` e não devem ser sobrescritos. A marca entra no monograma acima do
  formulário (`login/resources/img/logo-single.png`), nos favicons, nas cores, no nome e
  nos links.

### Nova marca (ou completar a Upchip)

1. `login/theme.properties`: `parent=default`, `appBrandName`, `appPrivacyUrl`, `appTermsUrl`.
2. `login/resources/css/brand.css`: copie o do `default` e troque os valores — todos os
   tokens precisam existir (o `style.css` não tem fallback). Os `rgba()` de `--app-ring`,
   `--app-shadow` e `--app-shadow-strong` usam o RGB de `--app-primary`; o de
   `--app-shadow-toast` usa o de `--app-ink` (os toasts têm fundo de status); os alfas
   podem ser ajustados, anotando o motivo. O painel lateral (`--app-aside-bg`) precisa ser
   escuro o bastante para texto claro: a logo é forçada a branco e o título é `--grey-300`
   (mire ≥ 4,5:1 com branco e ≥ 3:1 com `#D0D5DD`); o rodapé legal e o separador `|` dele
   têm cor própria (`--app-aside-muted`, `--app-aside-rule`) para acompanhar o fundo.
3. `login/resources/img/`: `logo-single.png` (monograma da marca sobre fundo branco, exibido
   com 78 px de altura) e `favicon.ico`. **Não** entregar `idm.png`: é a logo do produto.
4. `email/theme.properties`: `parent=default`, as mesmas chaves de identidade, `appColorPrimary`
   / `appColorOnPrimary` e `appLogoUrl` (veja **E-mails**).
5. `account/theme.properties` com `parent=default`, `account/resources/css/brand.css` (três
   tokens em hex) e `account/resources/img/favicon.ico` (a logo do masthead é a do produto).
6. Selecione a marca nos três temas do realm.

**Token de marca novo** (um `var(--app-…)` a mais no `style.css`): declare-o no
`brand.css` do `default` **e** no `brand.css` de cada marca que tem o seu (hoje: `upchip`);
se a cor valer para e-mail, reflita em `appColorPrimary`/`appColorOnPrimary`. Conferência:
`grep -o 'var(--app-[a-z-]*' themes/default/login/resources/css/style.css | sort -u | grep -v -- '--app-icon$'`
contra as declarações de cada `brand.css` — a diferença deve ser só os neutros do `:root`
do `style.css` (`--app-text`, `--app-muted`, `--app-border`, `--app-border-strong`,
`--app-bg`, `--app-radius*`, `--app-font`); `--app-icon` é local, definido por cada
`.app-icon--*`.

A `upchip` segue o *Manual de Identidade Visual* (PDF na raiz do repositório). O laranja
em uso é `#BD4B00`: o Pantone Orange 021 C `#FF6600` com o matiz mantido e ~25% menos
luminosidade — decisão da marca, porque o `#FF6600` chapado ficou forte demais em tela; de
quebra passa WCAG AA (5,0:1 com branco). Ele vale para tudo: botão, links, foco, painel
lateral chapado, masthead do console, cabeçalho e CTA dos e-mails (hover `#A34100`). O
amarelo 1235 C `#FFC200` fica no token `--app-aside-accent`, reservado para destacar uma
palavra do `appWelcomeTitle` (`<span class="app-aside__accent">`) — hoje nenhuma mensagem
usa essa marcação, então ele não aparece em tela; o losango da marca é o monograma e o favicon
(recortado do render do manual em 600 dpi — troque pela arte vetorial se a agência
fornecer). Só os links das políticas continuam vazios, marcados `PROVISORIO`. Para voltar
ao `#FF6600` oficial basta trocar os hex nos dois `brand.css` e em `appColorPrimary`
(lembrando que branco sobre `#FF6600` tem só 2,9:1).

## Personalização

Caminhos relativos a `themes/default/`, salvo indicação.

| O quê | Onde |
|---|---|
| Logo do produto (painel lateral, e-mails, masthead do console) | `login/resources/img/idm.png` — versão branca, exibida sobre fundo escuro; nos e-mails sai com 80 px de altura. Padrão para todas as marcas |
| Monograma da marca acima do título do formulário | `login/resources/img/logo-single.png` no tema da marca (sobre branco, 78 px de altura, centralizado) |
| URL da logo nos e-mails | `email/theme.properties` **da marca** → `appLogoUrl` (veja a seção **E-mails**) |
| Favicon do login | `login/resources/img/favicon.ico` no tema da marca (o do `default` é o da casa) |
| Favicon do console da conta | `account/resources/img/favicon.ico` no tema da marca (`favIcon=/img/favicon.ico`, precisa começar com `/`); a logo do masthead, `account/resources/img/idm.png` (`logo=`), é a do produto |
| Cores da marca | `login/resources/css/brand.css` e `account/resources/css/brand.css` no tema da marca (login e console); `appColorPrimary` / `appColorOnPrimary` no `email/theme.properties` da marca (e-mails) |
| Neutros, fontes e raio das bordas | tokens `--app-*` e `--font-*` no bloco `:root` de `login/resources/css/style.css`; os neutros têm mais duas cópias em hex que mudam junto — `account/resources/css/account.css` (`html:root`) e os estilos inline de `email/html/template.ftl` |
| Textos do login | `login/messages/`: painel lateral `appWelcomeTitle` (aceita HTML; slogan do produto, igual para todas as marcas); rodapé `appRights`, `appPrivacyPolicy`, `appTermsPolicy`; OTP `appOtpTitle`, `appOtpHelp`; chave de segurança `appPasskeyTitle`, `appPasskeyHelp`, `appPasskeyWaiting`; escolha de método `appChooseTitle`, `appChooseHelp` |
| Textos dos e-mails | `email/messages/`: assuntos `*Subject`, corpo `app<Email>Title / Intro / Cta / Ignore` e a versão em texto puro `*Body` |
| Nome de usuário = CPF (máscara e textos) | `login/resources/js/cpf-mask.js`; chaves do base reescritas em `login/messages/` e `account/messages/` (veja **CPF como nome de usuário**) |
| Links das políticas | `appPrivacyUrl` e `appTermsUrl`, nos dois `theme.properties` **da marca** |
| Nome da marca | `appBrandName`, nos dois `theme.properties` **da marca**: `alt` da logo no login e © do rodapé no login e nos e-mails (em maiúsculas); título, cabeçalho e aviso final dos e-mails usam o *Display name* do realm, quando houver |

A cor primária da casa (Uptech) é `#07111F`, escrita em três lugares que mudam juntos:
`login/resources/css/brand.css` (tokens e os `rgba(7, 17, 31, …)`), `account/resources/css/brand.css`
(hex) e o fallback de `appColorPrimary` em `email/html/template.ftl`. As fontes são Manrope, para o texto, e
JetBrains Mono, para códigos — ambas sob licença SIL OFL 1.1, compartilhadas por todas as
marcas. No login elas são servidas localmente (`login/resources/fonts/`, woff2 variável,
subconjunto latino); nos e-mails vêm do Google Fonts e só carregam em clientes que aceitam
web fonts (Apple Mail, iOS) — os demais usam a fonte do sistema.

## CPF como nome de usuário

No produto o nome de usuário é o CPF, em todas as marcas — a regra mora no `default` e
segue a configuração de login do realm (*Realm settings → Login*) e a tela:

| Email as username | Login with email | Modo | Rótulo | Máscara |
|---|---|---|---|---|
| desligado | desligado | `cpf` | CPF | sempre: `000.000.000-00`, teclado numérico, só dígitos |
| desligado | ligado | `cpf-or-email` no login e no *esqueci a senha*; `cpf` no cadastro e no perfil, onde o campo é sempre o CPF | CPF ou e-mail / CPF | só enquanto o texto digitado for apenas dígitos (até 11); letra, `@`, pontuação própria ou 12+ dígitos ficam como foram digitados |
| ligado | qualquer | `email` | E-mail (com *Login with email* desligado o rótulo do Keycloak diz "CPF": evite essa combinação) | nenhuma |

O produto usa o modo `cpf` — os dois desligados (*Login with email* vem ligado em realm
novo). O modo é calculado no `template.ftl` e emitido em `<body data-username-format>`.

- **Valor guardado**: só os 11 dígitos (`12345678909`). É assim que o usuário deve ser
  criado no Admin Console, importado ou cadastrado; a máscara nunca chega ao servidor.
- **Máscara**: `login/resources/js/cpf-mask.js` lê o modo e formata o campo `#username`
  enquanto o texto digitado for só dígitos; ao enviar, o que a máscara exibe vai só em
  dígitos (em modo `cpf`, sempre) e o resto vai como foi digitado. O script guarda o texto
  digitado sem os separadores que ele mesmo põe, então no modo `cpf-or-email` nada que o
  usuário digita se perde; durante a composição de um teclado virtual (IME) ele não mexe
  no campo. Vale para login, cadastro, *esqueci a senha*, atualização de perfil e revisão
  de perfil após login por provedor externo — todas usam o `#username` do tema base. Se o
  servidor pré-preencher o campo com algo que não é CPF (e-mail, usuário vindo do provedor
  externo, username legado, 12+ dígitos), o script nunca reescreve o valor; em modo `cpf`
  o campo fica sem máscara nessa tela e só um CPF completo digitado no lugar ainda é
  enviado em dígitos. Sem JavaScript o campo aceita os dígitos crus. Nas
  telas em que o usuário já foi identificado (OTP, chave de segurança, senha após o CPF) o
  `template.ftl` mostra o CPF formatado; um e-mail passa intacto. No console da conta não
  roda JS do tema: o CPF aparece em dígitos crus, só com o rótulo trocado. O dígito
  verificador não é conferido.
- **Textos** (nos três bundles de `login/messages/`), conforme onde o Keycloak 26.7.2 usa
  cada chave: `username` e `usernameOrEmail` ("CPF ou e-mail") são os rótulos.
  `invalidUserMessage`, `accountTemporarilyDisabledMessage` e
  `accountPermanentlyDisabledMessage` são o que o fluxo `browser` padrão responde a CPF
  errado, senha errada e bloqueio por força bruta — os três iguais e neutros ("Dados de
  acesso inválidos.") para não revelar o bloqueio. `invalidUsernameMessage` ("CPF
  inválido.") só sai do *Username Form* com *Login with email* desligado (usuário não
  encontrado) e, com o recurso Organizations, de um envio em branco;
  `invalidUsernameOrEmailMessage` ("Conta não encontrada.") só do *Username Form* com
  *Login with email* ligado — nenhum dos dois aparece no fluxo padrão.
  `missingUsernameMessage` ("Campo obrigatório.") é o erro de campo em branco no *esqueci
  a senha* e onde o User Profile renderiza o username (cadastro, perfil); como é sempre
  erro de campo, o toast o prefixa com o nome do campo. `usernameExistsMessage` ("CPF já
  cadastrado.") é o duplicado no cadastro; em modo `email` o Keycloak reaproveita a chave
  no campo de e-mail, modo que o produto não usa. A ajuda de *esqueci a senha* é escolhida
  pelo `template.ftl` conforme o modo (`appResetHelpCpf`, `appResetHelpCpfOrEmail`,
  `appResetHelpEmail`), porque o tema base só a escolhe por *Duplicate emails*. Cadastro e atualização de perfil herdam o rótulo porque o *display
  name* do atributo `username` no User Profile é `${username}`; o console da conta lê a
  mesma chave em `account/messages/` (`username=CPF`).
- **Fluxo de login**: o `browser` padrão do Keycloak, com CPF e senha na mesma tela. Não
  use um fluxo "usuário primeiro" (*Username Form* + *Password Form*): ele procura o CPF
  antes de pedir a senha e responde "CPF inválido." (`invalidUsernameMessage`), o que
  permite descobrir quais CPFs estão cadastrados. No fluxo padrão, CPF errado e senha
  errada recebem a mesma resposta ("Dados de acesso inválidos."). Pelo mesmo motivo,
  desligue *User registration* se o produto provisiona os usuários — "CPF já cadastrado."
  também revela existência.
- **Opcional**: em *Realm settings → User profile → username*, adicione o validador
  `pattern` com `^[0-9]{11}$` para o servidor recusar cadastros fora do formato.

## Idiomas

O tema oferece pt-BR, en e es (`locales=` nos três `theme.properties` do `default` — login,
email e account; a chave informa os idiomas do tema, não restringe os *Supported locales*
do realm), no login, nos e-mails e no console da conta (este só com `username=CPF`). Assim que o
usuário é identificado (OTP, e-mails, pós-login) vale o atributo `locale` dele; antes
disso, o `ui_locales` enviado pelo cliente ou o `Accept-Language` do navegador. O seletor
de idioma é renderizado, mas fica oculto por CSS.

Toda chave `app*` precisa existir nos três arquivos de `messages/` — e login, e-mail e conta
têm arquivos separados. Como os valores passam pelo `MessageFormat` do Java, apóstrofos
devem ser escritos como `''`. Os textos são compartilhados pelas marcas; uma marca que
precise de outro texto sobrescreve só aquela chave num `messages/messages_xx.properties`
próprio (os bundles também são herdados chave a chave).

## E-mails

O wrapper `email/html/template.ftl` aplica o cabeçalho com a logo, o card de conteúdo e
o rodapé a **todos** os e-mails enviados pelo Keycloak. Quatro deles têm corpo próprio,
com texto da marca: redefinição de senha, verificação de e-mail, atualização de conta e
código de verificação. Cada um desses quatro também é enviado em texto puro, a partir
das chaves `passwordResetBody`, `emailVerificationBody`, `executeActionsBody` e
`emailVerificationBodyCode` — ao mudar um texto, mude as duas versões.

A logo dos e-mails precisa de uma **URL pública e absoluta**, porque os clientes de
e-mail não carregam arquivos do tema. Hoje ela é servida pelo próprio Keycloak, e cada
marca informa a sua no `email/theme.properties` dela:

```
appLogoUrl=${env.UPTECH_LOGO_URL,env.APP_LOGO_URL:https://sso.uptech.com.br/resources/<tag>/login/uptech/img/idm.png}
```

O Keycloak passa os valores de `theme.properties` pelo `StringPropertyReplacer`: as
variáveis de ambiente antes do primeiro `:` são tentadas na ordem (`UPTECH_LOGO_URL` e, como
nome antigo ainda aceito, `APP_LOGO_URL` — migre os deploys para o novo); se nenhuma
existir no container, vale a URL escrita após o `:` (os `:` e `/` da própria URL não
atrapalham). A variável só existe para as marcas que declaram `appLogoUrl` assim; a
`upchip` usa `UPCHIP_LOGO_URL` com a mesma logo do produto sob o caminho dela
(`login/upchip/img/idm.png`). O caminho usa o nome da marca mesmo quando o arquivo mora no
`default` — o Keycloak resolve recursos pela cadeia de herança.

O segmento `<tag>` é um identificador aleatório que o Keycloak gera para cada banco de
dados a cada migração — ou seja, muda a cada upgrade e é diferente entre desenvolvimento
e produção. Um `<tag>` defasado, desde que bem formado (5 caracteres `[0-9a-z]`), continua
funcionando: o Keycloak responde 307 para o atual; atualizá-lo depois de um upgrade
(copiando de uma URL real da produção) só evita o redirect. Se preferir algo imune a
upgrades, hospede a logo em um endereço estável e informe-o na variável de ambiente. Sem
`appLogoUrl` (ou vazio), o cabeçalho mostra em texto o *Display name* do realm (ou
`appBrandName`, se ele estiver vazio).

## Console da conta

O console "Minha conta" é uma aplicação React do próprio Keycloak (`keycloak.v3`); não há
template para sobrescrever. O tema `account/` só troca o que o Keycloak permite: logo e
link do cabeçalho, favicon, título, os textos (`messages/`, hoje só o rótulo `username=CPF`)
e um CSS carregado depois do PatternFly, que aplica a
marca por variáveis `--pf-v5-*` (cores, fontes, cabeçalho na cor primária da marca, menu lateral claro). O
modo escuro automático fica desligado (`darkMode=false`) para manter a marca clara. As
fontes são as mesmas do login, referenciadas por caminho relativo ao tema `default`
(`../../../login/default/fonts/…`) — não há cópia.

## Upgrade do Keycloak

1. Atualize a versão no `Dockerfile` e no comando de desenvolvimento acima.
2. Compare os arquivos sobrescritos com os equivalentes do tema base da nova versão
   (`themes/src/main/resources/theme/base/` no repositório do Keycloak) e ressincronize,
   em `themes/default/`: `login/template.ftl`, `login/login-otp.ftl`,
   `email/html/template.ftl` e os quatro e-mails.
3. Recomendado: atualize o `<tag>` em `appLogoUrl` no `email/theme.properties` de cada
   marca (o antigo continua funcionando por redirect).
4. Suba o ambiente de desenvolvimento e confira as telas de login (rótulo e máscara do
   CPF), OTP e cadastro, além de um e-mail de teste, em cada marca.
