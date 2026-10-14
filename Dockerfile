FROM quay.io/keycloak/keycloak:26.8.1

ENV KC_SPI_THEME__STATIC_MAX_AGE=3600

COPY --chown=keycloak:keycloak themes/ /opt/keycloak/themes/
