#!/bin/bash


SRV='./db'
MONGODIR=${SRV}'/mongodb/'
MONGOLOGS=${SRV}'/mongo_logs.txt'
# FLASKLOGS='app/flask_logs.txt'

# make sure we exit flask & mongo as child processes:
trap  "kill 0" EXIT

if ! [ -d $SRV ]; then
  mkdir $SRV
fi

if ! [ -d $MONGODIR ]; then
  mkdir $MONGODIR
  touch ${SRV}/README.md
  touch ${MONGOLOGS}
  echo 'running MongoDB from here, @ `'${MONGODIR}'`' >> ${MONGODIR}/README.md
fi

echo "starting MongoDB..."
mongod --dbpath ./db/mongodb/ --port 27017 &> ${MONGOLOGS} &

#echo "starting react-scripts..."
#npm start &

echo "starting Flask..."
flask run

exit 0
