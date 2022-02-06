ARG NETWORK_ACCESS=online

FROM nginx:1 AS base-online


# /!\ NOTE FOR AT-SEA DEVELOPMENT
#
# Building this container image fetches many Docker containers, apt and node
# packages, etc. from the Internet.
#
# On one of the Alvin data servers there is a proxy that serves as many of these
# from its cache as it can. Set the build arg NETWORK_ACCESS=offline to include
# the TLS certificate for this proxy so that it can intercept HTTPS connections.
#
# You also need to configure the Docker client appropriately.
# https://docs.docker.com/network/proxy/#configure-the-docker-client

FROM base-online AS base-offline

ARG NETWORK_ACCESS

RUN if [ "${NETWORK_ACCESS}" = "offline" ]; then \
        curl http://199.92.162.241/squid-ca-cert.crt \
            > /usr/local/share/ca-certificates/squid-ca-cert.crt \
        && update-ca-certificates; \
    fi
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

### End of at-sea development modifications  ###


FROM base-${NETWORK_ACCESS}

WORKDIR /usr/src/app

# Install Node.js from NodeSource's binary distribution
# https://github.com/nodesource/distributions/blob/master/README.md
RUN apt update && apt install -y curl \
 && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
 && apt install -y nodejs \
 && rm -rf /var/lib/apt/lists/*


# Install packages
COPY package*.json ./
RUN npm install

# Copy sources
COPY . .

# Rename configuration files
COPY src/client_config.js.dist src/client_config.js
COPY src/map_tilelayers.js.dist src/map_tilelayers.js


# Create the start script
RUN (echo '#!/bin/sh -e'; \
     echo 'cd /usr/src/app'; \
     echo 'npm run-script build'; \
     echo 'ROOT_PATH=$(NODE_PATH=src node -e "console.log(require' \
          '(\"client_config\").ROOT_PATH.replace(/\/*$/, \"/\"));")'; \
     echo 'sed -e "s,%ROOT_PATH%/*,$ROOT_PATH,g" ' \
          '/usr/src/app/nginx.conf ' \
          '> /etc/nginx/conf.d/default.conf'; \
    ) > /docker-entrypoint.d/99-build-sealog.sh \
 && chmod +x /docker-entrypoint.d/99-build-sealog.sh

# Attach git metadata to this container image
ARG GIT_SOURCE
LABEL org.opencontainers.image.source=${GIT_SOURCE}
ENV GIT_SOURCE=${GIT_SOURCE}

ARG GIT_REVISION
LABEL org.opencontainers.image.revision=${GIT_REVISION}
ENV GIT_REVISION=${GIT_REVISION}
