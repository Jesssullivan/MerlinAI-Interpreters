

### *Setup:*

```
# node:
npm install
```
```
# If you're building on a Mac,
# you'll need to manually install
# GNU sed and md5sum utilities.
# you could `brew` install them like this:
brew install gsed md5sha1sum
```



## *Build development bundles:*



*includes source trees, dev tools*
```
# build tool:
npm run-script build

# build both on-the-fly browser spectrogram & remote spectrogram demos:
npm run-script test

# build all:
npm run-script build-all
```


## *Test with Flask:*

```
# venv:
python3 -m venv merlinai_venv
source merlinai_venv/bin/activate
pip3 install -r requirements.txt
```

```
# interactive config.cfg setup:
npm run-script setup-app  

# serve with dev WSGI:
npm run-script serve-app  

# serve with waitress WSGI:
npm run-script eval-app  
```


## *Test without Flask:*

```
# generates high quality spectrograms on the fly in browser:
google-chrome ./demos/otf_index.html --allow-insecure-localhost --auto-open-devtools-for-tabs
open ./demos/otf_index.html  # use mimetype on Mac

# displays pre-generated spectrograms from ML:
google-chrome ./demos/remote_index.html --allow-insecure-localhost --auto-open-devtools-for-tabs
# open ./demos/remote_index.html # use mimetype on Mac
```


## *Build production bundles:*

```
# build production tool:
npm run-script dist  

# you can also build a stripped down version of the browser spectrogram demo:
npm run-script dist-otf

```

```
# cleanup:
npm run-script clean
```


## *Verify versions & checksums:*


Each `leaflet.annotation.js` production bundle is accompanied by a `leaflet.annotation.js.LICENSE.txt` file.

Both these files are prepended with identical dates; one can evaluate when a bundle was built like this:

```
# bundle:
head -c 42 ./demos/leaflet.annotation.js && echo " */"
#> /* Packed: Tue 19 Jan 2021 09:26:24 PM EST */
```
```
# license:
head -c 42 ./demos/leaflet.annotation.js.LICENSE.txt && echo " */"
#> /* Packed: Tue 19 Jan 2021 09:26:24 PM EST */
```

Furthermore, `leaflet.annotation.js.LICENSE.txt` is stamped with the md5 checksum of its `leaflet.annotation.js` twin; one might verify a bundles's checksum like this:
```
md5sum ./demos/leaflet.annotation.js
#> 8fa701125c2b77cfb4c97b4dbaaae694
```
```
head -c 120 ./demos/leaflet.annotation.js.LICENSE.txt | tail -c 42 && echo
#> '8fa701125c2b77cfb4c97b4dbaaae694
```

## *Directory Tree:*

```
├── app
  ├── main
    ├── client
      └── blueprint routes for packed web demos;
          `tfjs` blueprint class & subroutes are
          registered here too
    ├── config
      └── setup-app script populates a new config.cfg file for Flask.
    ├── tfmodels
      └── `tfjs` model class & blueprint routes are in here
    ├── tools
      └── misc. functions for dates, expression matching, etc
├── demos
  ├── audio_example_task
    └── example annotation task.
  └── client side demos implementing leaflet.annotation.js.
├── scripts
  └── scripts run by package.json.
├── src
  └── annotator class is declared in `annotation_tool.tsx`;
      named exports for client side spectrogram, tfjs, audio
      methods & bundle's logger are declared in `index.ts`
└── webpack
  └── `*_dev.ts` modules exports bundles with dev tools, source map, etc
      `*_dist.ts` builds production bundles- preforms Terser tree shaking, css minification, etc

```


- - - 


*To update the `leaflet.annotation.js` bundle from BitBucket:*

- you must have access to the ml-mlearning-leaflet repo
- follow the prompts; provide a git username / passphrase with access to *ml-mlearning-leaflet*
- Env file is already appended, hit enter to skip first prompt to load new default values
```
# update:
cd dist && curl https://raw.githubusercontent.com/Jesssullivan/LeafletSync/main/LeafletSync --output ./LeafletSync && chmod +x ./LeafletSync && ./LeafletSync -e UpdateBundleLeafletEnv 
# cleanup:
rm LeafletSync && cd .. 
```

*To fetch the latest typed leaflet audio annotator source from BitBucket:*

```
curl https://raw.githubusercontent.com/Jesssullivan/LeafletSync/main/LeafletSync --output ./LeafletSync && chmod +x ./LeafletSync && ./LeafletSync -e UpdateSourceLeafletEnv 
# cleanup:
rm LeafletSync
```


- - -
