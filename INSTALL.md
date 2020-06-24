# Installation Instructions

### Prerequisites

 - [sealog-server v2.0.0+](https://github.com/oceandatatools/sealog-server)
 - [nodeJS v12.x+](https://nodejs.org)
 - [npm](https://www.npmjs.com)
 - [git](https://git-scm.com)
 
#### Installing NodeJS/npm on Ubuntu 18.04LTS
The standard Ubuntu repositories for Ubuntu 18.04 only provide install packages for NodeJS v10.  Sealog-client-vehicle (and Sealog-Server) require nodeJS >= v12.x
 
To install nodeJS v12.x on Ubuntu 18.04LTS run the following commands:
 ```
sudo apt-get install curl build-essential
cd ~
curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt-get install nodejs

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

### Install the nodeJS modules

From a terminal run:
```
cd ~/sealog-client-vehicle
npm install
```

### Build the client

From a terminal run:
```
cd ~/sealog-client-vehicle
npm run build
```

This will create the `dist` directory containing the required html, js, css, images, and fonts.

### Install the client

Create a symbolic link from the dist directory to the directory where Apache will server the client.  Modify the paths appropriately for your installation.  This example assumes the client will live at `http://<serverIP>/sealog` and the git repo is located at: `/home/sealog/sealog-client-vehicle`:

`sudo ln -s /home/sealog/sealog-client-vehicle/dist /var/www/html/sealog`

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

**Be sure to reload Apache for these changes to take affect.**
`sudo service apache2 reload`

### Running in development mode ###
Optionally you can run the client using node's development web-server.  This removes the need to run Apache however the client will only be accessable from the local machine.

To run the client using development mode run the following commands in terminal:
```
cd /home/sealog/sealog-client-vehicle
npm start
```
