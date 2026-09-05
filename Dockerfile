FROM --platform=$BUILDPLATFORM node:20.19 AS builder

WORKDIR /work

# Install packages
COPY package*.json ./
RUN npm ci

# Copy sources
COPY public ./public
COPY src ./src
COPY index.html ./
COPY vite.config.mjs ./

# Build the application
RUN mkdir ./config  `# Must be present for copy stage` \
 && npm run build


FROM nginx:1

WORKDIR /usr/src/app

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the default Sealog config files
COPY config/client_config.js.dist ./config/client_config.js
COPY config/map_tilelayers.js.dist ./config/map_tilelayers.js

# Copy the built code, including source maps for field debugging
COPY --from=builder /work/build/ ./
RUN test -n "$(find . -type f -name '*.map' -print -quit)"
