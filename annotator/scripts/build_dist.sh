#!/bin/bash


# `npm run-script dist`
#  builds, timestamps, hashes production `leaflet.annotation.js` bundle.
#  applies Terser tree shaking, css minification
#  prepends POSIX `date` to bundle.
#  prepends the bundle's license file with POSIX date & md5 checksum matching bundle.
#  @author Jess

PUBDIR="./demos/"
DIST="./dist/"
NAME="leaflet.annotation.js"
LICENSE="leaflet.annotation.js.LICENSE.txt"
README="README.md"
FDIST=${DIST}${NAME}
FLICENSE=${DIST}${LICENSE}
DATE=$(date)

trap "kill 0" EXIT

echo -e "Distribute: \n...(re)packing leaflet annotator tool..."

rm -rf ${DIST}"*"

echo -e "\n ...transpiling typed audio depends... "

tsc src/audio_model.ts --downlevelIteration

tsc src/audio_loading_utils.ts

echo -e "\n ...transpiling default style depends... "

tsc src/defaults.ts

echo -e "\n ...packing tool..."

webpack --config webpack/webpack.annotator_dist.ts

echo -e "\n ...packing done, hashing & stamping output..."

# write date to both packed bundle and license file:
PRESERVEJS="/* @ (c) the super cool mlearning-leaflet team. */"
PACKDATE="/* Packed: ${DATE} ${FDIST} */"
PACKSIZE="/* Size: $(ls -l --block-size=k dist/leaflet.annotation.js | tail -c  47 | head -c 7) */"

# write to bundle:
echo "${PRESERVEJS} $(cat ${FDIST})" > ${FDIST}
echo "${PACKDATE} $(cat ${FDIST})" > ${FDIST}

# hash bundle:
FDISTHASH="$(md5sum ${FDIST})"
MATCHHASH="/* Matches: ${FDISTHASH} */"

# write md5 to license so folks can quickly compare versions:
echo "${PRESERVEJS} $(cat ${FLICENSE})" > ${FLICENSE}
echo "${MATCHHASH} $(cat ${FLICENSE})" > ${FLICENSE}
echo "${PACKDATE} $(cat ${FLICENSE})" > ${FLICENSE}

wait

echo -e "\n ...copying output to ${PUBDIR}..."
cp -rf ./dist/*  ${PUBDIR}

echo -e "\n...Distribute complete :)"

exit 0
