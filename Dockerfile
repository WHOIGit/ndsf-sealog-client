ARG NETWORK_ACCESS=online

FROM node:16 AS builder-online


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

FROM builder-online AS builder-offline

ARG NETWORK_ACCESS

RUN if [ "${NETWORK_ACCESS}" = "offline" ]; then \
        curl http://199.92.162.241/squid-ca-cert.crt \
            > /usr/local/share/ca-certificates/squid-ca-cert.crt \
        && update-ca-certificates; \
    fi
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

### End of at-sea development modifications  ###


FROM builder-${NETWORK_ACCESS} AS builder

WORKDIR /work

# Install packages
COPY package*.json ./
RUN npm install

# Copy sources
COPY public ./public
COPY src ./src

# Rename configuration files
COPY src/client_config.js.dist src/client_config.js
COPY src/map_tilelayers.js.dist src/map_tilelayers.js

# Build the application
RUN npm run build


FROM nginx:1

WORKDIR /usr/src/app

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built code
COPY --from=builder work/build/ .

# Attach git metadata to this container image
ARG GIT_SOURCE
LABEL org.opencontainers.image.source=${GIT_SOURCE}
ENV GIT_SOURCE=${GIT_SOURCE}

ARG GIT_REVISION
LABEL org.opencontainers.image.revision=${GIT_REVISION}
ENV GIT_REVISION=${GIT_REVISION}
