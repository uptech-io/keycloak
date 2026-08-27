FROM quay.io/keycloak/keycloak:26.7.2

COPY --chown=keycloak:keycloak themes/ /opt/keycloak/themes/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
