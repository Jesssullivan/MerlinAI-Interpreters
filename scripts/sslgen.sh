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
    DOMAIN='demos'
else
    DOMAIN=$1
fi

KEY=${DOMAIN}_key

# openssl on fruit is dodgy at best:
if [[ "$OSTYPE" == "darwin"* ]] ; then
  echo -e "\nsslgen: Detected fruit-based operating system! \n...openssl may not work as expected on Mac OSX."
fi

echo "sslgen:  continuing..."
openssl req -x509 -newkey rsa:4096 -nodes -keyout ./demos/$KEY.pem -out ./demos/$DOMAIN.pem -days 365 -subj '/CN=127.0.0.1:8080'
