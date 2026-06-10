## Estrutura

```
.
├── Dockerfile                          # imagem de produção (kc.sh build embute o tema)
├── .dockerignore
├── .gitignore
├── README.md
└── themes/
    └── uptech/
        └── login/
            ├── theme.properties        # herança (parent=keycloak) + config da marca
            ├── template.ftl            # override do registrationLayout (layout split)
            ├── messages/               # textos i18n
            │   ├── messages_pt_BR.properties
            │   ├── messages_en.properties
            │   └── messages_es.properties
            └── resources/
                ├── css/style.css       # estilos do tema
                ├── js/toast.js         # lógica do toast (fechar / auto-hide)
                ├── fonts/              # Manrope (woff2)
                └── img/                # logo, favicon
```

## Desenvolvimento local

Sobe o Keycloak montando o tema como volume e com o cache desligado — as mudanças
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
2. Em **Realm settings → Themes → Login theme**, selecione **`uptech`** e salve.

## Build / Produção

O `Dockerfile` embute o tema na imagem (build multi-stage que roda `kc.sh build`):

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
| Logo | `resources/img/logo-single.png` (monocromática; exibida em branco sobre o painel escuro via `filter`) |
| Favicon | `resources/img/favicon.ico` |
| Cores · fonte · raio | tokens em `resources/css/style.css` (bloco `:root`) |
| Título / subtítulo do painel lateral | mensagens `appWelcomeTitle` / `appWelcomeSubtitle` (um valor por idioma) |
| Textos do rodapé | mensagens `appRights` / `appPrivacyPolicy` / `appTermsPolicy` |
| URLs das políticas | `theme.properties` → `appPrivacyUrl` / `appTermsUrl` |
| Nome da marca (alt do logo) | `theme.properties` → `appBrandName` |

## Internacionalização

Idiomas: **pt-BR**, **en** e **es** (arquivos em `messages/`). O Keycloak detecta
o idioma pelo cabeçalho `Accept-Language` do navegador — o seletor manual foi
removido. Após o login, o Keycloak passa a usar o atributo `locale` do **perfil
do usuário**, se definido.

Textos que não podem vir de uma mensagem (gerados por CSS, como o prefixo
"Continuar com " dos botões sociais e a recomendação de app no OTP) são
traduzidos por seletores `html[lang="…"]` no `style.css`.
