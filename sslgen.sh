#!/bin/bash

# generate new self-signed openssl keys
# run from:
# `npm run-script sslgen-demos`

# provide option to pass different domain name:
if [ $# -eq 0 ] ; then
    DOMAIN='demos'
else
    DOMAIN=$1
fi

openssl req -newkey rsa:2048 -nodes -keyout keys/$DOMAIN.key -x509 -days 365 -out keys/$DOMAIN.crt