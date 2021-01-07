#!/bin/sh

WHITE='\033[1;37m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BROWN='\033[1;33m'
BLUE='\033[1;34m'
PURPLE='\033[1;35m'
CYAN='\033[0;36m'
GREY='\033[1;30m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# FLASK SETUP

echo "${BLUE}CONFIGURATION:${NC}"
echo

# Defaults
SECRET_KEY=`cat /dev/urandom | head -c 24 | base64`
FLASK_PORT_DEFAULT=5000
FLASK_DIRECTORY_DEFAULT="$(pwd)/api/"
MONGO_HOSTNAME_DEFAULT="localhost"
FRONTEND_DOMAIN_DEFAULT="http://localhost"
MONGO_APP_DATABASE__DEFAULT="new-app"

# Domain the Flask app will be running on
read -p "Flask API Directory [$FLASK_DIRECTORY_DEFAULT]: " FLASK_DIRECTORY
FLASK_DIRECTORY=${FLASK_DIRECTORY:-$FLASK_DIRECTORY_DEFAULT}
echo

# Port the Flask app will be running on
read -p "Flask App Port [$FLASK_PORT_DEFAULT]: " FLASK_PORT
FLASK_PORT=${FLASK_PORT:-$FLASK_PORT_DEFAULT}
echo

# Domain of the front-end JavaScript application
read -p "Front-End Domain [$FRONTEND_DOMAIN_DEFAULT]:  " FRONTEND_DOMAIN
FRONTEND_DOMAIN=${FRONTEND_DOMAIN:-$FRONTEND_DOMAIN_DEFAULT}
echo

# MongoDB hostname
read -p "Mongo Hostname [$MONGO_HOSTNAME_DEFAULT]: " MONGO_HOSTNAME
MONGO_HOSTNAME=${MONGO_HOSTNAME:-$MONGO_HOSTNAME_DEFAULT}
echo

# MongoDB database name for the app
read -p "Mongo App Database Name: [$MONGO_APP_DATABASE__DEFAULT]: " MONGO_APP_DATABASE
MONGO_APP_DATABASE=${MONGO_APP_DATABASE:-$MONGO_APP_DATABASE__DEFAULT}
echo

# Rename config.cfg.sample to config.cfg
CONFIG_EXAMPLE_FILE=./api/main/config/config.cfg.sample
CONFIG_FILE="./api/main/config/config.cfg"
cp -R $CONFIG_EXAMPLE_FILE $CONFIG_FILE

# Save configuration values to config.cfg
########################################################################
#
# use GNU sed utility if on Mac, e.g.
#
# `brew install gnu-sed`
#
#    gsed -i "s~##SECRET_KEY##~$SECRET_KEY~g" $CONFIG_FILE
#    gsed -i "s~##FLASK_PORT##~$FLASK_PORT~g" $CONFIG_FILE
#    gsed -i "s~##FRONTEND_DOMAIN##~$FRONTEND_DOMAIN~g" $CONFIG_FILE
#    gsed -i "s~##FLASK_DOMAIN##~$FRONTEND_DOMAIN~g" $CONFIG_FILE
#    gsed -i "s~##FLASK_DIRECTORY##~$FLASK_DIRECTORY~g" $CONFIG_FILE
#    gsed -i "s~##MONGO_HOSTNAME##~$MONGO_HOSTNAME~g" $CONFIG_FILE
#    gsed -i "s~##MONGO_APP_DATABASE##~$MONGO_APP_DATABASE~g" $CONFIG_FILE
#
########################################################################

sed -i "s~##SECRET_KEY##~$SECRET_KEY~g" $CONFIG_FILE
sed -i "s~##FLASK_PORT##~$FLASK_PORT~g" $CONFIG_FILE
sed -i "s~##FRONTEND_DOMAIN##~$FRONTEND_DOMAIN~g" $CONFIG_FILE
sed -i "s~##FLASK_DOMAIN##~$FRONTEND_DOMAIN~g" $CONFIG_FILE
sed -i "s~##FLASK_DIRECTORY##~$FLASK_DIRECTORY~g" $CONFIG_FILE
sed -i "s~##MONGO_HOSTNAME##~$MONGO_HOSTNAME~g" $CONFIG_FILE
sed -i "s~##MONGO_APP_DATABASE##~$MONGO_APP_DATABASE~g" $CONFIG_FILE

echo "${GREEN}\nFlask configuration saved!\n${NC}"

exit 0
