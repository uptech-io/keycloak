FROM quay.io/keycloak/keycloak:26.6 AS builder

COPY --chown=keycloak:keycloak themes/ /opt/keycloak/themes/

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.6

COPY --from=builder /opt/keycloak/ /opt/keycloak/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
