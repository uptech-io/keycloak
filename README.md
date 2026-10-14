# Keycloak · temas

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
├── uptech/                  # marca Uptech: só theme.properties (cores e logo = casa, os do default)
│   ├── login/ · email/ · account/
└── upchip/                  # marca Upchip: theme.properties + css/brand.css (login e account)
    ├── login/ · email/ · account/   # + img/ com o monograma (e-mails e login) e o favicon
tests/cpf-mask.html          # autoteste da máscara de CPF (navegador; fora da imagem)
Dockerfile · build.sh        # imagem de produção
CLAUDE.md                    # arquitetura interna (local, fora do git): templates, acoplamentos CSS/JS
```

## Desenvolvimento

O comando abaixo sobe a imagem oficial do Keycloak com a pasta `themes/` montada como
volume. No modo `start-dev` o cache de temas já vem desativado, então qualquer alteração
nos arquivos aparece ao recarregar a página, sem rebuild.

```bash
docker container run --rm -it \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -p 8082:8080 -v ./themes:/opt/keycloak/themes/ \
    quay.io/keycloak/keycloak:26.8.1 start-dev
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

### Testes

Sem subir o Keycloak, a máscara de CPF tem um autoteste: abra `tests/cpf-mask.html` no
navegador (uma carga por variante, pelos links no topo da página) e leia o resultado na
própria página, ou rode as quatro variantes no Chrome headless, da raiz do repositório:

```bash
bad=0
for q in pre=12345678909 mode=cpf-or-email pre=someone@idp mode=email; do
  out=$(google-chrome --headless=new --no-sandbox --disable-gpu --user-data-dir=/tmp/cpf-mask-chrome \
        --dump-dom "file://$PWD/tests/cpf-mask.html?$q" 2>/dev/null \
        | grep -oE '<li>(FAIL|SKIP)[^<]*|cpf-mask: [0-9]+ ok, [0-9]+ fail')
  printf '%-20s %s\n' "?$q" "${out:-SEM RESUMO: a pagina nao rodou ate o fim}"
  case "$out" in *" ok, 0 fail") ;; *) bad=1 ;; esac
done
[ "$bad" -eq 0 ] && echo "cpf-mask: OK nas 4 variantes" || { echo "cpf-mask: FALHOU"; false; }
```

Esperado: `18 ok`, `16 ok`, `7 ok` e `5 ok`, sempre com `0 fail` (a página aberta sem query,
antes de clicar num link, roda o modo `cpf` sem valor do servidor e mostra `16 ok`: faltam só
as duas verificações do valor pré-preenchido). Rode-o sempre que mexer em
`themes/default/login/resources/js/cpf-mask.js` e acrescente um caso para cada regra nova; a
pasta `tests/` fica fora de `themes/` de propósito e não entra na imagem.

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

A imagem é a oficial (`26.8.1`) com os temas copiados para `/opt/keycloak/themes/`;
não há etapa de build do Keycloak. Se o tempo de inicialização for um problema,
adicione ao `Dockerfile` um `RUN /opt/keycloak/bin/kc.sh build --db=…` com as mesmas
opções usadas em produção e inicie com `start --optimized`.

O `Dockerfile` também fixa `KC_SPI_THEME__STATIC_MAX_AGE=3600` (opção
`--spi-theme--static-max-age`, lida em tempo de execução). Sem ela, no modo `start` o
Keycloak manda o navegador guardar CSS, JS e imagens do tema por 30 dias (`Cache-Control:
max-age=2592000`, sem ETag), e as URLs `/resources/<tag>/…` só mudam quando a versão do
Keycloak muda: um deploy só de tema deixaria quem já visitou o login com o CSS/JS antigos
por até 30 dias, embaixo do HTML novo. Com 1 h, a mudança chega a todos em no máximo uma
hora, desde que `/opt/keycloak/data` não sobreviva ao deploy: no modo `start` o Keycloak
guarda o gzip de cada arquivo do tema em `data/tmp/kc-gzip-cache/<tag>/` e o reaproveita
enquanto o `<tag>` não muda; com um volume nesse diretório, apague
`data/tmp/kc-gzip-cache/` a cada deploy. A variável vale também em `start-dev` (vence o
`-1` que o perfil dev do Keycloak usa como padrão); o laço de desenvolvimento acima usa a
imagem oficial, sem ela, e por isso recebe `no-cache`. Para conferir na imagem rodando com
`start` (qualquer `<tag>` bem formado, como `zzzzz`, redireciona para o atual):

```bash
curl -sL -D - -o /dev/null http://localhost:8082/resources/zzzzz/login/uptech/css/style.css \
    | grep -i cache-control                     # max-age=3600
```

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
- O **slogan e o globo são identidade do produto**, iguais em todas as marcas: o slogan
  `appWelcomeTitle` e o globo do painel de marca, no login, ficam no `default` e não devem
  ser sobrescritos. A marca entra nas cores (botão, links, painel e destaque do globo), no
  monograma `login/resources/img/logo-single.png` — a logo do cabeçalho dos e-mails e do
  canto superior esquerdo do login (36 px, alinhado ao seletor de idioma; o token
  `--app-logo-filter` do `brand.css` decide se ele aparece como está ou em silhueta
  branca sobre a superfície escura) —, nos favicons, no nome e nos links. A antiga logo
  do produto (`idm.png`) só resta no masthead do console da conta
  (`account/resources/img/idm.png`).
- **No login, atributos do realm e do cliente sobrepõem o `theme.properties`.** O
  `template.ftl` lê `appBrandName`, `appPrivacyUrl` e `appTermsUrl` nesta ordem: atributo
  do cliente → atributo do realm → `theme.properties` da marca → padrão da casa; o
  atributo tem o mesmo nome da chave e vale quando não está vazio. Nos links, o valor que
  vencer só vale se começar com `https://` ou `http://`; qualquer outro (`javascript:`,
  `data:`, endereço sem esquema) vira `#` — não cai para o `theme.properties`. Os
  atributos entram pela API Admin e saem no export do realm; um `PUT /admin/realms/{realm}`
  com `attributes` **substitui o conjunto inteiro** de atributos do realm (confirmado no
  26.7.2), então envie sempre o mapa completo — é o que o console faz ao salvar, por isso
  ele os preserva mesmo sem ter tela para eles. Os e-mails não participam: o modelo deles
  não expõe realm nem cliente, só `realmName` (o *Display name* ou, sem ele, o nome do realm
  capitalizado).

### Nova marca (ou completar a Upchip)

1. `login/theme.properties`: `parent=default`, `appBrandName`, `appPrivacyUrl`, `appTermsUrl`.
2. `login/resources/css/brand.css`: copie o do `default` e troque os valores — todos os
   tokens precisam existir (o `style.css` não tem fallback). O formulário fica sobre a
   superfície escura do `default` (`--app-surface`, `#111418`): `--app-accent` (links e
   foco) e `--app-ink` (títulos) precisam de ≥ 4,5:1 sobre ela, e `--app-primary-contrast`
   de ≥ 4,5:1 sobre `--app-primary`. Uma cor de marca escura demais para virar texto ganha
   um tom mais claro do mesmo matiz em `--app-accent` (é o caso da UPchip). O `rgba()` de
   `--app-ring` usa o RGB de `--app-accent`; as sombras são pretas. No painel de marca,
   `--app-aside-ink` (slogan e seletor de idioma) precisa de ≥ 4,5:1 sobre
   `--app-aside-bg`; `--app-aside-map` e `--app-aside-map-hi` são as cores dos pontos do
   globo (terra e Brasil).
3. `login/resources/img/`: `logo-single.png` (monograma da marca com fundo transparente,
   desenhado para fundo **claro**: é a logo do cabeçalho branco dos e-mails, exibida com
   64 px de altura, e no canto superior esquerdo do login, com 36 px; basta entregá-lo com
   256 px de altura, em PNG com paleta; sem ele a marca herdaria o monograma da casa) e
   `favicon.ico`. No `brand.css` do login, defina `--app-logo-filter` (`none` se o
   monograma já aparece sobre a superfície escura; `brightness(0) invert(1)` para virar
   silhueta branca).
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
do `style.css` (`--app-surface*`, `--app-text`, `--app-muted`, `--app-placeholder`,
`--app-border*`, `--app-bg`, `--app-error-text`, `--app-toast-info`, `--app-control-h`,
`--app-radius*`, `--app-font`); `--app-icon` é local, definido por cada `.app-icon--*`.

A `upchip` segue o *Manual de Identidade Visual da UPchip* (documento da marca, mantido
fora do repositório). O laranja
em uso é `#BD4B00`: o Pantone Orange 021 C `#FF6600` com o matiz mantido e ~25% menos
luminosidade — decisão da marca, porque o `#FF6600` chapado ficou forte demais em tela; de
quebra passa WCAG AA (5,0:1 com branco). Ele vale para o botão, o painel de marca chapado,
o masthead do console, o cabeçalho e o CTA dos e-mails (hover `#A34100`). Como texto sobre
a superfície escura do login ele daria só 3,6:1, então links e foco usam `#FF9752`, o
mesmo matiz mais claro (8,7:1). O amarelo 1235 C `#FFC200` marca o Brasil no globo
(`--app-aside-map-hi`). O losango da marca é o favicon (recortado do render do manual em 600 dpi —
troque pela arte vetorial se a agência fornecer). Só os links das políticas continuam vazios, marcados `PROVISORIO`. Para voltar
ao `#FF6600` oficial basta trocar os hex nos dois `brand.css` e em `appColorPrimary`
(lembrando que branco sobre `#FF6600` tem só 2,9:1).

## Personalização

Caminhos relativos a `themes/default/`, salvo indicação.

| O quê | Onde |
|---|---|
| Monograma da marca (cabeçalho dos e-mails e canto superior esquerdo do login) | `login/resources/img/logo-single.png` no tema da marca (PNG com paleta, 256 px de altura) — é o arquivo que o `appLogoUrl` aponta; vai sobre o cabeçalho **branco** dos e-mails, com 64 px de altura, então precisa funcionar em fundo claro. No login (36 px, superfície escura) o `--app-logo-filter` do `brand.css` o mostra como está (`none`) ou em silhueta branca (`brightness(0) invert(1)`, caso da casa) |
| Logo do masthead do console da conta | `account/resources/img/idm.png` (`logo=`), versão branca sobre a cor primária da marca. Padrão para todas as marcas |
| Globo do painel de marca | `login/resources/js/globe.js` (canvas, pontos de terra embutidos) e `login/resources/img/globe.svg` (imagem estática sem JS); cores em `--app-aside-map` / `--app-aside-map-hi` do `brand.css` |
| URL da logo nos e-mails | `email/theme.properties` **da marca** → `appLogoUrl` (veja a seção **E-mails**) |
| Favicon do login | `login/resources/img/favicon.ico` no tema da marca (o do `default` é o da casa) |
| Favicon do console da conta | `account/resources/img/favicon.ico` no tema da marca (`favIcon=/img/favicon.ico`, precisa começar com `/`) |
| Cores da marca | `login/resources/css/brand.css` e `account/resources/css/brand.css` no tema da marca (login e console); `appColorPrimary` / `appColorOnPrimary` no `email/theme.properties` da marca (e-mails) |
| Neutros, fontes, altura dos controles e raio das bordas | tokens `--app-*` e `--font-*` no bloco `:root` de `login/resources/css/style.css`. Os neutros do login são escuros e só valem no login; o console da conta (`account/resources/css/account.css`, `html:root`) e os e-mails (estilos inline de `email/html/template.ftl`) continuam claros, com neutros próprios que mudam juntos entre si |
| Textos do login | `login/messages/`: painel lateral `appWelcomeTitle` (aceita HTML simples, filtrado pelo `kcSanitize` do Keycloak: ficam `<span>`, `<br>`, `<strong>`, `<em>`; scripts, `<mark>`, `aria-*` e `data-*` saem; slogan do produto, igual para todas as marcas); rodapé `appRights`, `appPrivacyPolicy`, `appTermsPolicy`; OTP `appOtpTitle`, `appOtpHelp`; chave de segurança `appPasskeyTitle`, `appPasskeyHelp`, `appPasskeyWaiting`; escolha de método `appChooseTitle`, `appChooseHelp` |
| Textos dos e-mails | `email/messages/`: assuntos `*Subject`, corpo `app<Email>Title / Intro / Cta / Ignore` e a versão em texto puro `*Body` |
| Nome de usuário = CPF (máscara e textos) | `login/resources/js/cpf-mask.js`; chaves do base reescritas em `login/messages/` e `account/messages/` (veja **CPF como nome de usuário**) |
| Links das políticas | `appPrivacyUrl` e `appTermsUrl`, nos dois `theme.properties` **da marca**; no login, um atributo de realm ou de cliente com o mesmo nome sobrepõe, e só valem valores `http(s)://` (veja **Marcas**) |
| Nome da marca | `appBrandName`, nos dois `theme.properties` **da marca**: `alt` do monograma no login e, em maiúsculas, © do rodapé no login e nos e-mails; no login, um atributo de realm ou de cliente com o mesmo nome sobrepõe. Título, `alt` da logo e aviso final dos e-mails usam o *Display name* do realm (ou, sem ele, o nome do realm capitalizado) |

A cor primária da casa (Uptech) é `#07111F`, escrita em três lugares que mudam juntos:
`login/resources/css/brand.css` (`--app-aside-bg`, via `--grey-900`), `account/resources/css/brand.css`
(hex) e o fallback de `appColorPrimary` em `email/html/template.ftl`. No login ela fica no
painel de marca: sobre a superfície escura o navy sumiria, então botão, links e foco usam
o teal da paleta (`--secondary-main` `#00C7B9` / `--secondary-light` `#5FE3D9`), o mesmo
dos destaques do mapa em uptech.com.br. As fontes são Manrope, para o texto, e
JetBrains Mono, para códigos — ambas sob licença SIL OFL 1.1, compartilhadas por todas as
marcas. No login elas são servidas localmente (`login/resources/fonts/`, woff2 variável,
subconjunto latino). Os e-mails não carregam web fonts, de propósito (abrir a mensagem não
faz requisição a terceiros para carregar fontes; a única imagem remota é o monograma do
`appLogoUrl`): o `font-family` deles começa por Manrope e JetBrains Mono, que só aparecem
para quem as tem instaladas — os demais leitores veem a fonte do sistema.

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
  dígitos (em modo `cpf`, sempre), um CPF completo digitado com a própria pontuação
  também, e o resto vai como foi digitado. O script guarda o texto digitado sem os
  separadores que ele mesmo põe, então no modo `cpf-or-email` nada que o usuário digita se
  perde; durante a composição de um teclado virtual (IME) ele não mexe no campo. Vale para
  login, cadastro, *esqueci a senha*, atualização de perfil e revisão de perfil após login
  por provedor externo — todas usam o `#username` do tema base. Se o servidor
  pré-preencher o campo com algo que não é CPF (e-mail, usuário vindo do provedor externo,
  username legado, 12+ dígitos), o script nunca reescreve o valor; em modo `cpf` o campo
  fica sem máscara nessa tela e só um CPF completo digitado no lugar ainda é enviado em
  dígitos. Sem JavaScript o campo aceita os dígitos crus. Nas telas em que o usuário já
  foi identificado (OTP, chave de segurança, senha após o CPF) o `template.ftl` mostra o
  CPF formatado; um e-mail passa intacto. No console da conta não roda JS do tema: o CPF
  aparece em dígitos crus, só com o rótulo trocado. O dígito verificador não é conferido.
- **Textos** (nos três bundles de `login/messages/`), conforme onde o Keycloak 26.7.2 (bundles e templates idênticos na 26.8.1) usa
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
  erro de campo, o tema o mostra num *toast* (o aviso flutuante em que os erros aparecem)
  com o nome do campo na frente — "CPF: Campo obrigatório."; sem JavaScript o erro fica
  inline, junto ao campo. `usernameExistsMessage` ("CPF já
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
de idioma aparece no canto superior direito quando o realm tem *Internationalization*
ligado e mais de um idioma; os nomes curtos ("Português", "English", "Español") vêm das
chaves `locale_pt-BR`, `locale_en` e `locale_es` dos bundles do login.

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

O cabeçalho dos e-mails é branco, com uma barra fina na cor da marca (`appColorPrimary`)
acima dele e o monograma da marca (`logo-single.png`) ao centro; por isso a imagem precisa
funcionar sobre fundo claro. Ela precisa também de uma **URL pública e absoluta**, porque
os clientes de e-mail não carregam arquivos do tema. Hoje é servida pelo próprio Keycloak,
e cada marca informa a sua no `email/theme.properties` dela:

```
appLogoUrl=${env.UPTECH_LOGO_URL,env.APP_LOGO_URL:https://sso.uptech.com.br/resources/<tag>/login/uptech/img/logo-single.png}
```

Um deploy que ainda defina `UPTECH_LOGO_URL`/`APP_LOGO_URL` apontando para a antiga logo
branca precisa trocar (ou remover) a variável: branco sobre o cabeçalho branco não aparece.

O Keycloak passa os valores de `theme.properties` pelo `StringPropertyReplacer`: as
variáveis de ambiente antes do primeiro `:` são tentadas na ordem (`UPTECH_LOGO_URL` e, como
nome antigo ainda aceito, `APP_LOGO_URL` — migre os deploys para o novo); se nenhuma
existir no container, vale a URL escrita após o `:` (os `:` e `/` da própria URL não
atrapalham). A variável só existe para as marcas que declaram `appLogoUrl` assim; a
`upchip` usa `UPCHIP_LOGO_URL` e o monograma dela (`login/upchip/img/logo-single.png`). O
caminho usa o nome da marca mesmo quando o arquivo mora no `default` (caso da Uptech) — o
Keycloak resolve recursos pela cadeia de herança.

O segmento `<tag>` é um identificador aleatório que o Keycloak gera para cada banco de
dados a cada migração — ou seja, muda a cada upgrade e é diferente entre desenvolvimento e
produção; é o mesmo `<tag>` das URLs de CSS/JS do login (daí o cache de 1 h fixado no
`Dockerfile`, ver *Produção*). Um `<tag>` defasado, desde que bem formado (5 caracteres
`[0-9a-z]`), continua funcionando: o Keycloak responde 307 para o atual; atualizá-lo
depois de um upgrade (copiando de uma URL real da produção) só evita o redirect. Se
preferir algo imune a upgrades, hospede a logo em um endereço estável e informe-o na
variável de ambiente. Sem `appLogoUrl` (ou vazio), o cabeçalho mostra em texto o *Display
name* do realm; sem Display name o Keycloak usa o nome do realm capitalizado, e
`appBrandName` só entra se o Display name tiver sido salvo vazio.

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
   CPF, seletor de idioma abrindo, fechando e trocando o idioma, globo girando, monograma
   no canto superior esquerdo, rodapé com um `appBrandName` gravado como atributo do
   realm), OTP (com a política OTP do realm em 8 dígitos, a tela mostra 8 caixas) e
   cadastro, além de um e-mail de teste, em cada marca.

Atenção para o Keycloak 27: ele deve remover o tema de login `keycloak` v1 (PatternFly 4), do
qual o nosso herda (`parent=keycloak`; issue keycloak#43241, marco 27.0), e o `keycloak.v2`
(PR #52371, que cria o `keycloak.v3` em PatternFly 6). Migrar para a 27 é refazer o login
sobre o `keycloak.v3` — `style.css` e `template.ftl` inteiros —, não um passo deste checklist;
e-mails e console da conta não entram nisso.
