#!/bin/bash

echo -e "$CONSOLE Starting MongoDB Server..."
exec $(mongod --dbpath ./srv/mongodb/ --port 27017 &> $MONGOLOG &)