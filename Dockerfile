FROM node:12 AS builder

WORKDIR /usr/src/app

# Install packages
COPY package*.json ./
RUN npm install

# Copy sources
COPY . .

# Rename configuration files
COPY webpack.config.js.dist webpack.config.js
COPY src/client_config.js.dist src/client_config.js
COPY src/map_tilelayers.js.dist src/map_tilelayers.js

# Run webpack to create the bundle
RUN npm run-script build


# Copy the bundle to a plain web server
FROM nginx:1

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html/sealog
COPY nginx.conf /etc/nginx/conf.d/default.conf 
