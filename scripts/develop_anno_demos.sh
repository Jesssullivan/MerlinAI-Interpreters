#!/bin/bash

# A cringy build script for Annotator demos

DOMAIN=annotator

# stdout to these log files instead of to the console
PACKLOG=anno_pack.log
SSLLOG=anno_ssl.log

# check python path:
VENVPATH=$(which python3)


## precheck ##


# check node modules:
if [[ ! -d "./node_modules" ]] ; then

  echo -e "\n ...did not find ./node_modules!
  please install node node depends, e.g.


  npm install


  ...and try again. \n"

  exit 0

fi


# make sure we actually in the right venv:
if [[ ! $VENVPATH == *_venv/bin/* ]] ; then

  echo -e "\n  ...venv path not contain identified!
  please source into venv and try again, e.g. \n

    # create new venv:
    python3 -m venv merlinai_venv

    # source:
    source merlinai_venv/bin/activate

    # install Python depends:
    pip3 install -r requirements.txt
    \n"

  exit 0

fi


## build ##


# use a trap to make sure we quit child processes,
# upon receiving ` ^C `
# (e.g. flask @ `stdin`)
trap "kill 0" EXIT

# lol
echo """
      ___  ___          _ _        ___ _____
      |  \/  |         | (_)      / _ |_   _|
      | .  . | ___ _ __| |_ _ __ / /_\ \| |
      | |\/| |/ _ | '__| | | '_ \|  _  || |
      | |  | |  __| |  | | | | | | | | _| |_
      \_|  |_/\___|_|  |_|_|_| |_\_| |_\___/

     """

echo "annotator development: ...building annotator..."

#echo -ne  '(##                             (10%)\r'

touch $PACKLOG
touch $SSLLOG

## webpack ##

#echo -ne  '(##                             (10%)\r'

npm run-script build-anno-tool &> $PACKLOG &

echo -ne '(######                       (20%)\r'
wait
echo -ne '(######                       (20%)\r'


npm run-script build-anno-photo &> $PACKLOG &

echo -ne '(##########                   (40%)\r'
wait
echo -ne '(##########                   (40%)\r'

npm run-script build-anno-audio &> $PACKLOG &


echo -ne '(##############               (60%)\r'
wait
echo -ne '(##############               (60%)\r'

echo "annotator development: ...packing done!"

echo -ne '(##################           (80%)\r'

echo "annotator development: Configuring openssl..."

echo -ne '(##################           (80%)\r'


npm run-script sslgen $DOMAIN &> $SSLLOG &

wait

if [[ "$OSTYPE" == "darwin"* ]] ; then

  echo -ne '(####################         (90%)\r'

  echo "annotator development: Detected fruit-based operating system- ssl configuration may be sketchy, YMMV"

  echo -ne '(####################         (90%)\r'

else

  echo -ne '(####################         (90%)\r'

  echo "annotator development: Detected penguin-based operating system-
        in the following chrome warning, click:
        'Advanced --> Proceed anyway'"

  echo -ne '(####################         (90%)\r'

fi

echo -e "annotator development: Launching Annotator..."

http-server -S -C ./demos/annotator.pem -K ./demos/annotator_key.pem -o ./demos/annotator_audio.html

wait
