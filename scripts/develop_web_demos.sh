#!/bin/bash

# A cringy build script for web demos
#
# Includes launchers for both Debian & Mac OSX


# stdout to some log files here instead of to the console:
LOGDIR="./.built_logs/"

# demo server logs:
FLASKFILE=flask_log.txt
FLASKLOG=$LOGDIR$FLASKFILE

# demos logs:
DEMOFILE=demos_log.txt
DEMOLOG=$LOGDIR$DEMOFILE

# general webpack logs:
ANNOTOOLFILE=anno_tool_log.txt
TOOLLOG=$LOGDIR$ANNOTOOLFILE

ANNOPHOTOFILE=anno_photo_log.txt
PHOTOLOG=$LOGDIR$ANNOPHOTOFILE

ANNOAUDIOFILE=anno_audio_log.txt
AUDIOLOG=$LOGDIR$ANNOAUDIOFILE

#  bash --> browser:
DEBBROWSER=chromium
MACBROWSER=open
INCOGNITO=TRUE

# check python path:
VENVPATH=$(which python3)


## prechecks ##


#  check log stuff:

if [[ ! -d "$LOGDIR" ]]; then

  mkdir $LOGDIR

fi

# initialize log files if they aren't already there:
touch $FLASKLOG
touch $DEMOLOG
touch $TOOLLOG
touch $PHOTOLOG
touch $AUDIOLOG

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

echo "development: ...entering & packing demos, this could take a while..."

# copy web assets if they aren't already there:
# cp -rf ./icons/tmpUI.MerlinAI-favicon-light/* ./demos/ &> $FLASKLOG &
cp -rf ./icons/tmpUI.MerlinAI-favicon-dark/* ./demos/ &> $FLASKLOG &
# cp -rf ./icons/Leaflet.annotation-favicon-dark/* ./demos/ &> $FLASKLOG &


## webpack ##

echo -ne '(##                            (10%)\r'

# run primary webpack within its own process, it really does take a while
webpack --config webpack/es6.demo.config.ts &> $DEMOLOG &

echo -ne '(##                            (10%)\r'

# relax, and watch this chintzy loading graphic load while webpack runs
sleep 2
echo -ne '(##                            (10%)\r'
sleep 2
echo -ne '(####                         (15%)\r'
sleep 2
echo -ne '(#####                        (20%)\r'
sleep 2
echo -ne '(######                       (25%)\r'
sleep 2
echo -ne '(#######                      (30%)\r'
sleep 2
echo -ne '(########                     (35%)\r'
sleep 2
echo -ne '(#########                    (40%)\r'
sleep 2
echo -ne '(##########                   (45%)\r'
sleep 2
echo -ne '(###########                  (50%)\r'

# wait for initial webpack to finish:

wait

echo -ne '(###########                  (50%)\r'

echo -e "development: ...entering & packing annotators..."

echo -ne '(############                 (55%)\r'

echo "development: ...packing leaflet annotator tool..."

npm run-script  build-anno-tool &> $TOOLLOG &

echo -ne '(############                 (55%)\r'

wait

echo -ne '(#############                (60%)\r'

echo "development: ...packing photo annotator..."

echo -ne '(##############                (65%)\r'


npm run-script  build-anno-photo &> $PHOTOLOG &

wait

echo -ne '(##############                (65%)\r'

echo -ne '(###############              (70%)\r'

echo "development: ...packing audio annotator..."

echo -ne '(################             (75%)\r'

npm run-script  build-anno-audio &> $AUDIOLOG &

wait

echo -ne '(################             (75%)\r'


## Flask ##


echo -ne '(#################            (80%)\r'

echo "development: ...packing done!"

echo -ne '(##################           (80%)\r'

echo "development: ...(re)rendering html pages..."

echo -ne '(##################           (80%)\r'

find '.' -name "*_render.html" -delete &> $DEMOLOG &

echo -ne '(###################          (85%)\r'

wait

echo -ne '(###################          (85%)\r'

echo "development: setting up flask..."

echo -ne '(###################          (85%)\r'

rm -rf __pycache__/ &> $FLASKLOG &


## launch ##


echo -ne '(#####################        (90%)\r'

flask run &> $FLASKLOG &

echo -ne '(##########################   (90%)\r'

echo 'development: Launching...'

echo -ne '(##########################   (90%)\r'

if [[ "$OSTYPE" == "darwin"* ]] ; then

  echo -ne '(########################## (100%)\r'

  echo "

  development: Detected fruit-based operating system, using browser cli $MACBROWSER
  "

  echo -ne '(########################## (100%)\r'

  BROWSER=$MACBROWSER

else

  echo -ne '(########################## (100%)\r'

  echo "

  development: Detected  penguin-based operating system, using browser cli  $DEBBROWSER
  "

  echo -ne '(########################## (100%)\r'

  BROWSER=$DEBBROWSER

fi

# just to make sure disk catches up to us:
sleep 2

## launch

# best to use incognito to avoid cross domain CORS shenanigans ~/.config and ~/.cache

if [[ $INCOGNITO == TRUE ]] ; then

    $BROWSER http://127.0.0.1:5000/ -incognito &> $FLASKLOG &

else

   $BROWSER http://127.0.0.1:5000/  &> $FLASKLOG &

fi

# check status like this:
# ps aux | grep flask
# echo -e "\nExiting Merlin AI Web Demos..."

wait
