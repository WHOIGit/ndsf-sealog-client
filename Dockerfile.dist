# Use the latest Node.js Alpine image as the base image
FROM node:alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Copy configuration files
COPY webpack.config.js.dist webpack.config.js
COPY src/client_config.js.dist src/client_config.js
COPY src/map_tilelayers.js.dist src/map_tilelayers.js

# Expose port 8080 (This needs to match what's in the ./webpack.config.js file)
# EXPOSE 8080

# Command to run the Node.js application
CMD [ "npm", "start" ]
