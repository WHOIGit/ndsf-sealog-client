FROM nginx:1

WORKDIR /usr/src/app

# Install Node.js from NodeSource's binary distribution
# https://github.com/nodesource/distributions/blob/master/README.md
RUN apt update && apt install -y curl \
 && curl -sL https://deb.nodesource.com/setup_12.x | bash - \
 && apt install -y nodejs \
 && rm -rf /var/lib/apt/lists/*


# Install packages
COPY package*.json ./
RUN npm install

# Copy sources
COPY . .

# Rename configuration files
COPY webpack.config.js.dist webpack.config.js
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
