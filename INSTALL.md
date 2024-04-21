# Installation Instructions

### Prerequisites

 - [sealog-server v2.2.10+](https://github.com/oceandatatools/sealog-server)
 - [nodeJS v20.x+](https://nodejs.org)
 - [git](https://git-scm.com)
 - Apache2 Webserver (alternatively NGINX can be used)
 
#### Installing NodeJS/npm on Ubuntu 22.04 LTS

Download the nvm install script:
```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
Install the LTS version of NodeJS using `nvm`
```
nvm install --lts
sudo ln -s $HOME/.nvm/versions/node/v20.11.0/bin/npm /usr/local/bin/
sudo ln -s $HOME/.nvm/versions/node/v20.11.0/bin/node /usr/local/bin/
```
### Clone the repository

```
git clone https://github.com/oceandatatools/sealog-client-vehicle.git
```

This should clone the repo to a directory called `sealog-client-vehicle`

### Create a new configuration file

```
cd ~/sealog-client-vehicle
cp ./src/client_config.js.dist ./src/client_config.js
```

### Modify the configuration file

Set the `API_ROOT_URL`, `WS_ROOT_URL`, `ROOT_PATH`, and `IMAGES_PATH` values in the `./sealog-client-vehicle/src/client_config.js` file to meet your specific installation requirements.

By default the file assumes the sealog-server is available on port 8000 on the same server that is hosting the sealog-server.  The default configuration file also assumes the client will be available from the /sealog directory of the webserver; i.e. `http://<serverIP>/sealog`.  If you want the webclient available at the root directory of the webserver or some custom location :  you need to set `ROOT_PATH` variable appropriately; i.e. `/`, `/custom_path/`. ***NOTICE the starting `/` **AND** trailing `/`.

### Create a deployment file
```
cd ~/sealog-client-vehicle
cp ./webpack.config.js.dist ./webpack.config.js
```

### Create a new map tiles file
```
cd ~/sealog-client-vehicle
cp ./src/map_tilelayers.js.dist ./src/map_tilelayers.js
```

### Move the repo to the installation directory (/opt)
```
sudo mv ~/sealog-client-vehicle /opt
```

### Install the nodeJS modules
From a terminal run:
```
cd /opt/sealog-client-vehicle
npm install
```

### Build the client
From a terminal run:
```
cd /opt/sealog-client-vehicle
npm run build
```

This will create the `dist` directory containing the required html, js, css, images, and fonts.

### Configure Apache to host the client
Add the following to your Apache vhosts file (i.e. `/etc/apache2/sites-available/000-default.conf`).  Modify the path appropriately for your installation. This example assumes the client will live at `http://<serverIP>/sealog`:
```
  <Directory "/var/www/html/sealog">
    Options +Indexes +FollowSymLinks
    RewriteEngine on
  
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # Rewrite everything else to index.html to allow html5 state links
    RewriteRule ^ index.html [L]
  </Directory>
```

Create a symbolic link from the dist directory to the directory where Apache will server the client.  Modify the paths appropriately for your installation.  This example assumes the client will live at `http://<serverIP>/sealog` and the git repo is located at: `/opt/sealog-client-vehicle`:
```
sudo ln -s /opt/sealog-client-vehicle/dist /var/www/html/sealog`
```

**Be sure to reload Apache for these changes to take affect.**
`sudo service apache2 reload`

### Configure Nginx to host the client
Add the following to your nginx server file (i.e. `/etc/nginx/sites-available/sealog_vehicle.conf`).  Modify the path appropriately for your installation. This example assumes the client will live at `http://<serverIP>/sealog`:
```
  server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;

    index index.html;

    server_name _;

    location /sealog {
      # First attempt to serve request as file, then
      # as directory, then fall back to displaying a 404.
      try_files $uri $uri/ /index.html;
    }
  }
```

Enable the site config:
```
sudo ln -s /etc/nginx/sites-available/sealog-vehicle.conf /etc/nginx/sites-enabled
```

Create a symbolic link from the dist directory to the directory where Apache will server the client.  Modify the paths appropriately for your installation.  This example assumes the client will live at `http://<serverIP>/sealog` and the git repo is located at: `/opt/sealog-client-vehicle`:
```
sudo ln -s /opt/sealog-client-vehicle/dist /var/www/html/sealog
```

**Be sure to reload Nginx for these changes to take affect.**
`sudo service nginx reload`

### Running in development mode ###
Optionally you can run the client using node's development web-server.  This removes the need to run Apache however the client will only be accessable from the local machine.

To run the client using development mode run the following commands in terminal:
```
cd /opt/sealog-client-vehicle
npm start
```
The client should now be accessible from http://localhost:8080/sealog
