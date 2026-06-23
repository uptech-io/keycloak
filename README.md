## Estrutura

```
.
├── Dockerfile                          # imagem de produção (kc.sh build embute os temas)
├── .dockerignore
├── .gitignore
├── README.md
└── themes/
    └── uptech/
        ├── login/
        │   ├── theme.properties        # herança (parent=keycloak) + config da marca
        │   ├── template.ftl            # override do registrationLayout (layout split)
        │   ├── login-otp.ftl           # override do OTP (inputmode numérico no campo)
        │   ├── messages/               # textos i18n
        │   │   ├── messages_pt_BR.properties
        │   │   ├── messages_en.properties
        │   │   └── messages_es.properties
        │   └── resources/
        │       ├── css/style.css       # estilos do tema (tokens em :root)
        │       ├── js/toast.js         # toast (fechar / auto-hide)
        │       ├── js/otp-segments.js  # OTP em caixas por dígito (auto-avanço, colar, auto-envio)
        │       ├── fonts/              # Manrope (woff2)
        │       └── img/                # idm.png (logo), favicon
        └── email/
            ├── theme.properties        # parent=keycloak + URLs/marca + appLogoUrl
            ├── html/                   # wrapper branded + e-mails principais
            │   ├── template.ftl        # wrapper de TODOS os e-mails (cabeçalho/logo + card + rodapé)
            │   ├── password-reset.ftl
            │   ├── email-verification.ftl
            │   ├── executeActions.ftl
            │   └── email-verification-with-code.ftl
            └── messages/               # assuntos + textos i18n (HTML e texto puro)
                ├── messages_pt_BR.properties
                ├── messages_en.properties
                └── messages_es.properties
```

## Desenvolvimento local

Sobe o Keycloak montando os temas como volume e com o cache desligado — as mudanças
nos arquivos aparecem ao recarregar a página, **sem rebuild**:

```bash
docker run --rm -it \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -p 8082:8080 \
    -v ./themes:/opt/keycloak/themes/ \
    quay.io/keycloak/keycloak:26.6 \
    start-dev \
      --spi-theme-static-max-age=-1 \
      --spi-theme-cache-themes=false \
      --spi-theme-cache-templates=false
```

Depois:

1. Acesse o **Admin Console** em <http://localhost:8082>;
2. Em **Realm settings → Themes**, selecione **`uptech`** em **Login theme** e em
   **Email theme**, e salve.

## Build / Produção

O `Dockerfile` embute os temas na imagem (build multi-stage que roda `kc.sh build`):

```bash
docker build -t registry.uptech.com.br/keycloak:26.6 .
```

Rodar a imagem buildada:

```bash
docker run --rm -it \
    -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
    -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
    -p 8082:8080 \
    registry.uptech.com.br/keycloak:26.6 start
```

## Personalização da marca

| O quê | Onde |
|---|---|
| Logo (login) | `login/resources/img/idm.png` (monocromática branca; exibida no painel escuro) |
| Logo (e-mail) | `email/theme.properties` → `appLogoUrl` (URL pública absoluta — ver seção **Tema de e-mail**) |
| Favicon | `login/resources/img/favicon.ico` |
| Cores · fonte · raio | tokens em `login/resources/css/style.css` (bloco `:root`). Cor primária = `#07111F` (tokens `--app-primary` / `--app-accent`) |
| Título / subtítulo do painel lateral | mensagens `appWelcomeTitle` / `appWelcomeSubtitle` (um valor por idioma) |
| Textos do rodapé | mensagens `appRights` / `appPrivacyPolicy` / `appTermsPolicy` |
| URLs das políticas | `theme.properties` → `appPrivacyUrl` / `appTermsUrl` (login e e-mail) |
| Nome da marca (fallback) | `theme.properties` → `appBrandName` |

## Tela de OTP ("Código de uso único")

O `login/template.ftl` injeta título + ajuda próprios na tela de OTP (chaves
`appOtpTitle` / `appOtpHelp`). O campo é transformado em **caixas por dígito** por
`login/resources/js/otp-segments.js` (progressive enhancement): auto-avanço, colar,
backspace, navegação por setas e **auto-envio ao completar**. Sem JS, o campo único
continua funcionando (fallback). O `login/login-otp.ftl` adiciona `inputmode="numeric"`
(teclado numérico no mobile).

## Tema de e-mail

Estrutura branded em `themes/uptech/email/` (`parent=keycloak`):

- **`html/template.ftl`** — wrapper aplicado a **todos** os e-mails: cabeçalho com a
  logo, card de conteúdo e rodapé (© + políticas). HTML *email-safe* (tabelas +
  estilos inline; fontes do sistema, pois clientes de e-mail não carregam fontes web).
- **4 e-mails principais** com botão/código branded: redefinição de senha, verificação
  de e-mail, executar ações (atualizar conta) e código de verificação (OTP por e-mail).
  Os demais e-mails herdam apenas o wrapper.
- **`messages/`** — assuntos e textos nos 3 idiomas, tanto HTML quanto **texto puro**
  (o tema base do Keycloak só traz inglês para e-mail).

### Logo nos e-mails (`appLogoUrl`)

Clientes de e-mail **não** carregam imagens locais do tema — a `<img>` precisa de uma
**URL pública e absoluta**, definida em `email/theme.properties` → `appLogoUrl`. Vazio
⇒ o cabeçalho usa o **nome do realm** como texto.

Atualmente aponta para a própria instância do Keycloak (o tema de login serve a imagem):

```
appLogoUrl=https://sso.uptech.com.br/resources/<versão>/login/uptech/img/idm.png
```

> ⚠️ O segmento `<versão>` (ex.: `vvbjh`) é a **versão de recursos do Keycloak** e
> **muda a cada upgrade de versão**. Ao atualizar o Keycloak, atualize esta URL —
> senão o e-mail exibe imagem quebrada. Para algo imune a upgrades, hospede a logo
> num caminho estável (site/CDN).

### Ativar / testar

`Realm settings → Themes → Email theme = uptech`. Configure o SMTP em
`Realm settings → Email` e use **Test connection** (ou dispare "Esqueceu sua senha?").

## Internacionalização

Idiomas: **pt-BR**, **en** e **es** (login e e-mail). O Keycloak detecta o idioma
pelo cabeçalho `Accept-Language` do navegador — o seletor manual foi removido. Após o
login, passa a usar o atributo `locale` do **perfil do usuário**, se definido.

Textos que não podem vir de uma mensagem (gerados por CSS, como o prefixo "Continuar
com " dos botões sociais e a recomendação de app no OTP) são traduzidos por seletores
`html[lang="…"]` no `style.css`.

## Notas de manutenção (upgrade do Keycloak)

Como o tema **sobrescreve** arquivos da base, ao subir a versão do Keycloak revise:

- `login/template.ftl` e `login/login-otp.ftl` — comparar com os templates base da
  nova versão e re-sincronizar.
- `email/html/template.ftl` e os 4 e-mails — idem.
- `email/theme.properties` → `appLogoUrl` — atualizar o segmento da versão de recursos.
