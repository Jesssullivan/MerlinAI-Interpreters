#!/bin/bash

# generate a new self-signed openssl key
#
# run with:
# `npm run-script sslgen`


echo -e "sslgen: generating new ssl keys, useful if using a base http-server + Chrome.
- Not needed for development w/ Flask.
- production ssl certs are currently being handled by Heroku.\n"

# provide option to pass different domain name:
if [ $# -eq 0 ] ; then
    DOMAIN='./demos/demos'
else
    DOMAIN=$1
fi

# openssl on fruit is dodgy at best:
if [[ "$OSTYPE" == "darwin"* ]] ; then
  echo -e "\nsslgen: Detected fruit-based operating system! \n...openssl may not work as expected on Mac OSX."
fi

openssl req -new -newkey rsa:4096 -nodes \
    -keyout ${DOMAIN}.key -out ${DOMAIN}.csr \
    -subj "/C=US/ST=Oregon/L=Portland/O=Company Name/OU=Org/CN=127.0.0.1"

openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
    -subj "/C=US/ST=Oregon/L=Portland/O=Company Name/OU=Org/CN=127.0.0.1" \
    -keyout ${DOMAIN}.key  -out ${DOMAIN}.cert

# run, something like:
#  npx http-server -p 5000 -S -C ${DOMAIN}.cert -K ${DOMAIN}.key