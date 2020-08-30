#!/bin/bash

# generate new self-signed openssl keys
# run from:
# `npm run-script sslgen-demos`

echo -e "sslgen: generating new ssl keys, useful if using a base http-server + Chrome.
- Not needed for development w/ Flask.
- production ssl certs are currently being handled by Heroku.\n"

# provide option to pass different domain name:
if [ $# -eq 0 ] ; then
    DOMAIN='demos'
else
    DOMAIN=$1
fi

# heard this may not work on OSX + Chrome, YMMV
openssl req -newkey rsa:2048 -nodes -keyout ../$DOMAIN.key -x509 -days 365 -out ../$DOMAIN.crt