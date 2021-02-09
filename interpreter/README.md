*Experiments, interpreter implementations, demos, data ingress tangents and lots of notes for birdsong ID*


- [**Web Interpreters & UI Experiments:**](https://jesssullivan.github.io/tmpUI/)
  - [**@ Interpreter Demo**](https://ai.columbari.us/classify/server)   <br/>
  - [**Web: Setup**](#web-experiments-setup) <br>
    - [**...With npm**](#npm) <br>
    - [**Flask Structure**](#interp-structure) <br>
    - [**Scripts**](#additional-scripts) <br>
- [**Web Annotators & Leaflet UI**](#leaflet)  <br/>
  - [**@ Annotator Feature Demos**](https://ai.columbari.us/annotator/audio)   <br/>
  - [**Annotator: Setup**](#annotator-setup) <br>
    - [**...Dev Bundles**](#build-development-bundles) <br>
    - [**...Production Bundles**](#build-production-bundles) <br>
    - [**Test: With Flask**](#test-with-flask) <br>
    - [**Test: Without Flask**](#test-without-flask) <br>
    - [**Production: POSIX Timestamps & Checksums**](#checksum) <br>
    - [**Flask Structure**](#anno-structure) <br>
    - [**LeafletSync Utility**](#chindogu) <br>
- [**Native Interpreter Experiments**](#native)  <br/>
  - [**Swift UI**](#swift) <br>
  - [**React-Native**](#reactnative) <br>
- [**Notes!**](#notes) <br>



- - -




#### *Web Interpreter Setup:*



<h4 id="npm"> </h4>     



#### *node:*

```
npm install

# venv:
python3 -m venv merlinai_venv
source merlinai_venv/bin/activate
pip3 install -r requirements.txt

# build specific things:
npm run-script build-spec-web
npm run-script build-webgl-web

# serve:
npm run-script setup-app  # interactive config.cfg setup
npm run-script serve-app  # serve with default Flask WSGI
```



- - -



<h4 id="interp-structure"> </h4>     



#### *Interpreter Flask Structure:*


```
├── app
  ├── main
    ├── annotator
      └── /annotator/ blueprint routes
    ├── auth
      └── token authentication methods, a wip
    ├── classify
      └── config
        └── TensorFlow configuration, POST upload methods, classify blueprint globals
      └── models
        └── classifier class, methods for both Select Ops & standard Ops on server
      └── routes
        └── /classify/ blueprint routes
      └── trashd
        └── garbage collection daemon
    ├── config
      └── use the setup script to populate a new config.cfg file
    ├── eventdb
      └── wip blueprint for ID event database, see notes on this
    ├── tfmodels
      └── Tensorflow model class, routes & whatnot
    ├── tools
      └── utilities for date/time, expression matching, the like
    └── userdb
      └── wip database for user token authentication
├── scripts
  └── scripts run by package.json
├── demos
  └── client side pages, demos built w/ webpack
├── src
  └── source directory for client side demos
├── db
  └── mongodb directory and logs are built here
...

```


<br/>

<h4 id="additional-scripts> </h4>     
  
  

#### *additional scripts:*


*build some production binaries:*
```
npm run-script dist-all
npm run-script dist-webgl-web
npm run-script dist-spec-web
```

*serve more things:*
```
npm run-script setup-app   # interactive Flask setup
npm run-script serve-app   # serve w/ flask
npm run-script serve-node  # serve w/ local http-server + openssl
```

*--watch:*
```
# Webpack with --watch running:
npm run-script watch-spec-web
```

*clean things:*
```
npm run-script clean-bundles
npm run-script clean-renders
npm run-script clean-all
```


*check on waitress config:*
```
# @Procfile:
# Production WSGI sever is waitress;
# check local config with:
waitress-serve --call app:create_app
```

*local ssl:*
```
# Generates local ssl certs for testing w/ node http-server:
npm run-script sslgen

# you can also provide a $DOMAIN argument like so:
npm run-script sslgen hiyori
# ...returns key `hiyori_key.pem` & cert `hiyori.pem`

# ...or:
sudo chmod +x scripts/sslgen.sh && ./scripts/sslgen.sh
# osx is a bit more finicky
```

*tone generator:*
```
### available from here:
cp etc/tone.py .

### generate some .wav files for testing fft things:
python3 tone.py

### ...you can also specify duration in seconds & frequency in Hz like so:
python3 tone.py 5 440

### ...or just duration:
python3 tone.py 2
```


```
# print reference json strucures:
npx ts-node etc/json_refs.ts
```



- - -


<h4 id="leaflet"> </h4>     


#### *Leaflet Annotator:*  

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


<h4 id="annotator-setup"> </h4>     


#### *Setup:*

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


<h4 id="build-development-bundles"> </h4>     


#### *Build development bundles:*



*includes source trees, dev tools*
```
# build tool:
npm run-script build

# build both on-the-fly browser spectrogram & remote spectrogram demos:
npm run-script test

# build all:
npm run-script build-all
```


<h4 id="test-with-flask"> </h4>     


#### *Test with Flask:*

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


<h4 id="test-with-flask"> </h4>     


#### *Test without Flask:*

```
# generates high quality spectrograms on the fly in browser:
google-chrome ./demos/otf_index.html --allow-insecure-localhost --auto-open-devtools-for-tabs
open ./demos/otf_index.html  # use mimetype on Mac

# displays pre-generated spectrograms from ML:
google-chrome ./demos/remote_index.html --allow-insecure-localhost --auto-open-devtools-for-tabs
# open ./demos/remote_index.html # use mimetype on Mac
```


<h4 id="build-production-bundles"> </h4>     


#### *Build production bundles:*

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

<h4 id="checksum"> </h4>     


#### *Verify versions & checksums:*


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

<h4 id="anno-structure"> </h4>     


#### *Directory Tree:*

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



<table>
  <thead>
    <tr>
      <th>
        <a href="https://merlinai.herokuapp.com/annotator/audio"><img src="./interpreter/demos/icons/tmpUI.MerlinAI-favicon-light/android-chrome-192x192.png" alt="demos"></a>
        <br/><em> On-The-Fly Spectrogram Annotator demo </em>
      </th>
        <th>
        <a href="https://merlinai.herokuapp.com/annotator/audio_ml"><img src="./interpreter/demos/icons/Leaflet.annotation-favicon-dark/android-chrome-192x192.png" alt="demos"></a>
        <br/><em> Remote Spectrogram Annotator demo</em>
      </th>
    </tr>
  </thead>
</table>



- - -


<h4 id="chindogu"> </h4>     


#### *LeafletSync:*

*A ridiculous* [*Chindōgu*](https://en.wikipedia.org/wiki/Chind%C5%8Dgu) *utility prompt & CLI for* [*fetching private releases & files from GitHub & BitBucket*](https://github.com/Jesssullivan/LeafletSync)


```
curl https://raw.githubusercontent.com/Jesssullivan/LeafletSync/main/LeafletSync --output LeafletSync && chmod +x LeafletSync && ./LeafletSync
```

- Fetch, unpack, extract specific releases & files or a complete master branch from a private GitHub repo with an api access token
- Fetch and extract specific files or complete branches from a private BitBucket account with user's git authentication
- Prefill default prompt values with a variety of console flags
- Save & load default prompt values with a file of environment variables, see templates [`FetchReleasegSampleEnv_GitHub`](https://github.com/Jesssullivan/LeafletSync/blob/main/FetchReleaseSampleEnv_GitHub), [`FetchFilegSampleEnv_BitBucket`](https://github.com/Jesssullivan/LeafletSync/blob/main/FetchFileSampleEnv_BitBucket),  [`FetchEverythingSampleEnv_BitBucket`](https://github.com/Jesssullivan/LeafletSync/blob/main/FetchEverythingSampleEnv_BitBucket), [`FetchEverythingSampleEnv_GitHub`](https://github.com/Jesssullivan/LeafletSync/blob/main/FetchEverythingSampleEnv_GitHub); pass as an argument with the ` -e ` flag, (`./LeafletSync -e YourEnvFile`) or provide one on launch.

```
./LeafletSync

LeafletSync: Do you want to load values from a file?

If so, enter one now...:[Nope!]:  

 _                 __ _      _     _____                    
| |               / _| |    | |   /  ___|                   
| |     ___  __ _| |_| | ___| |_  \ `--. _   _ _ __   ___  
| |    / _ \/ _` |  _| |/ _ \ __|  `--. \ | | | '_ \ / __|
| |___|  __/ (_| | | | |  __/ |_  /\__/ / |_| | | | | (__   
\_____/\___|\__,_|_| |_|\___|\__| \____/ \__, |_| |_|\___|  
 \                      _____________________/ |             
  \ Fetch from Github: /        α wιρ Σ ♥ |_@__Jess          
  /───────────────────/
  \ Your API Token    | -t |  --token | Required | = <personal-api-token>
   | Your Handle      | -u |  --user  | Required | = <You>
   | Source Repo      | -r |  --repo  \ Required  \ = <RepoName>
   | Repository Owner | -a |  --author \ Required  \ = <TheOwner>
   | Release Version  | -v |  --version | Optional | = Fetch Everything
  / Output Directory  | -o |  --out    / Optional  / = ./dist/
 /─────────────────────────/
 \ Fetch from BitBucket:  /                                     
  \──────────────────────/                                   
   \  Your Handle       / -bu  /  --b-user  / ~Required | = <You>
    \ Your Passhrase   / -bp  / --b-pass   / ~Required / = <personal-api-token>
     \ Source Branch  / -bb  / --b-branch / ~Optional / = master
      \ Source File  / -bf  / --b-file   / ~Optional / = <Fetch Everything>
       \────────────/

Your Handle [<You>]:

Source Repo [<RepoName>]:

Repo Owner [<TheOwner>]:

Host: GitHub | BitBucket [GitHub]:

Your Token [<personal-api-token>]:

Release to fetch: [<v0.0.1>]:

Output to fetch (e.g. /dist/*): [<dist/>]:

...

```



- - -


<h4 id="swift"> </h4>     


### *Swift Native:*


```
# Hack on Swift stuff:
npm run-script develop-swift-demos
```

-  *focusing on codepaths for:*
    - tflite interpreter
    - ~~generating mel spectrograms~~

- make sure `info.plist` has permissions for microphone access
- **The entrypoint for Swift tests is `./swift/swift-pkgs-tmpui/swift-pkgs-tmpui/swift_pkgs_tmpuiApp.swift`**
- *Toggle various interpreter experiments from entrypoint*

#### Other Linker Libraries:

*Project:*

```
$(inherited)
-force_load Pods/TensorFlowLiteSelectTfOps/Frameworks/TensorFlowLiteSelectTfOps.framework/TensorFlowLiteSelectTfOps
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteC.framework/TensorFlowLiteC
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteCCoreML.framework/TensorFlowLiteCCoreML
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteCMetal.framework/TensorFlowLiteCMetal
-ObjC
-l"c++"
```


*Target:*

```
-force_load Pods/TensorFlowLiteSelectTfOps/Frameworks/TensorFlowLiteSelectTfOps.framework/TensorFlowLiteSelectTfOps
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteC.framework/TensorFlowLiteC
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteCCoreML.framework/TensorFlowLiteCCoreML
-force_load Pods/TensorFlowLiteC/Frameworks/TensorFlowLiteCMetal.framework/TensorFlowLiteCMetal
-ObjC
-l"c++"

```

```
# niftily switch between xcode versions:
sudo xcode-select --switch ~/Downloads/Xcode-beta.app
```

#### Interpreter Operations:

*Hack on fft functions:*
*[*./etc/tone.py:*](https://github.com/Jesssullivan/tmpUI/blob/master/etc/tone.py)*

```
### copy from here:
cp etc/tone.py .

### generate some .wav files for testing fft things:
python3 tone.py

### ...you can also specify duration in seconds & frequency in Hz like so:
python3 tone.py 5 440

### ...or just duration:
python3 tone.py 2
```

*some fft-related links*
  - simplest (beware some typos)
    - https://stackoverflow.com/questions/32891012/spectrogram-from-avaudiopcmbuffer-using-accelerate-framework-in-swift
    - https://gist.github.com/jeremycochoy/45346cbfe507ee9cb96a08c049dfd34f

  - *"krafter" has a nice clear working sketch:*
    - https://stackoverflow.com/questions/11686625/get-hz-frequency-from-audio-stream-on-iphone/19966776#19966776

  - accelerate & apple docs:
    - https://developer.apple.com/documentation/accelerate/equalizing_audio_with_vdsp
    - https://developer.apple.com/documentation/accelerate/vdsp/fast_fourier_transforms
    - https://medium.com/better-programming/audio-visualization-in-swift-using-metal-accelerate-part-1-390965c095d7


- - -



<h4 id="reactnative"> </h4>     


### *React Native:*


#### *Install & link Cocoa depends to get cracking on the ios demos:*

```
# link ios depends:
cd ios && pod install && cd ..
```

- **The entrypoint for react-native tests is `./index.js`, fiddle @ `./native/`.**


#### *Build & deploy to Xcode Simulator:*

```
# link ios depends:
npm run-script ios-native
```


- - -



<h4 id="notes"> </h4>     



## Notes:    


***Rolling notes and whatnot are appended to bottom of readme***




- `tmpui-testing` dyno used sporadically for debugging, keeping it @ maintenance mode atm
- Use `heroku buildpacks:add --index 1 heroku-community/apt -a tmpui` for librosa vorbis depend


*Macaulay Annotation:*

- Since Macaulay recording are already pretty well labeled by species, what if we make human annotations into a learning game of sorts?  i.e. In order for the user to guess, they must crop in on the song they are guessing on- free annotation lunch?
   - We already know what the target species is, so even if they get it wrong while they learn a new song, we still get a labeled annotation

- Get humans annotating asap, ideally with a fun / educational twist
  - it would be so cool to be able to hook up a bunch of ornithology professors and students up and down New England with a song study / game tool of sorts
  - Would be fun to add this annotation-centered song learning rgame feature to the hybrid app, may be more helpful in the near term than field annotation

- Another similar thread to the same end is automating the annotation / boxing of Macaulay recordings-
   - Could get pretty far with the existing species labels + vetting with time / date + a highpass filter, though this has less to do with UX and more with getting a jump on adding data for a more accurate model
   - Similarly, since the only real task here is to isolate vocalizations (not id vocalizations)- detecting “Clearly a bird sound vs. not a bird sound”- for each recording, for each species- could be automated to operate without human assistance.


*Field Annotation:*

* User records a song; song spectrogram is cropped, annotated as either an already ID'd species or unknown song
  * this way, every song encountered is added to the data pool, corroborating or reshaping future models
  * Merlin's model returns user its best deduction for "unknown song"- user should be able to audit each possible species (via allaboutbirds or something) and verify the correct species
  * Aiming to make project contribution simple; easy to add to as many audio-enabled devices and projects as possible

* How will annotation become part of new and exciting features (instead of a data cleaning task / tedium?)
  * ...what if audio is recorded during an eBird checklist, such that a user can tick a box when a bird is ID'd by ear, adding the species & timestamp?
  * ...could be "gamified" as part of the undergraduate Ornithology curriculum?
  * ...what if audio collection & annotation could be easily implemented on a Raspberry Pi, or incorporated into STEM curriculums?
  * ...part of some kind of feederwatch kiosk, allow easy guest annotations?

* Investigate adding non-audio data to both model and vetting process-
  * date & coordinates would narrow options considerably, an account of general surrounding habitat would result in just a handful of possible species at most
  * Recent or historical ebird check ins at same date / location would also improve accuracy and narrow possibilities
  * how could attributes like these remain “optional but really preferable” in a generic set of annotation tools / pipeline before generating TFRecords?
  * How might this inform and provide feedback to a compiled model as well?

* how to most effectively bundle waveform/spectrogram/annotations?
 * could annotations be bundled as an "album/song" metadata?

*Script stuff:*

- begin experimenting with auto detecting bird songs on the fly
 - ...could be used in conjunction with the web tools & interface in browser / local web app, "kiosk style":
   - computer / Raspberry Pi / bird feeder stream on youtube / etc constantly processing audio stream, try to classify any sounds that might be a bird, etc
   - web app served locally from cloned notebook, encourage fiddling
   - make interface to pit Merlin's guesses against user's annotation of clip, etc
 - ...could also be used for "minimal human assistance" bulk collection of annotations via Macaulay, video stream, bird cams, etc


*Web stuff:*

- modify web annotator to generate spectrogram in the browser instead of fetching a pre generated one
- add some audio --> spectrogram controls to web annotator for better annotations:
 - add playback of  cropped / modified spectrogram audio as well!
 - modify spectrogram to better box all songs

*Other stuff:*

- add export TFRecord function?  could fit [everything in ID3?](https://en.wikipedia.org/wiki/ID3) Bundle spectrogram as "album artwork", cropped / uncropped audio as "tracks", json attributes as album info?
- still want to eventually figure out TensorFlow with web assembly instead of webgl for mobile, perhaps later?  thoughts on this?



*demos, annotators ***Π*** competitiveness*

a ***single annotation*** as first class entry in database:

<br/>

|id|category_id|supercategory|media_source|attribution|bbox|user_id|
|---|---|---|---|---|---|---|
| unique annotation identifier |species, etc  | family, genus, etc | url to media being annotated; for browser spectrogram demo, this is the `audio` field; otherwise linked via `image_id` needn't be Macaulay specific |attribution to media source; author; link to media's license| bounding array of annotation box |registered individual who made the annotation|

<br/>

- database of annotations may hold many entries describing the same media, by different users

- unregistered users may annotate and play with tools as much as they want, cannot save / contribute their annotations

- untrusted (new) registered users may save / contribute their annotations with a confidence level of 1

- trusted registered users with more than 5 or more trust points may save / contribute their annotations with a confidence level of 1 or 2 (e.g. duplicate their annotation) (or 0 / just don't save that annotation)

- a user may become trusted if 3 of their annotations contribute to completed annotations

- to complete an annotation, entries of **X** media must be replicated **Y** times- e.g. identical `catagory`, `supercatagory`, `bbox` centroid is within **T** threshold of each other (`bbox` values can be averaged to single annotation)

- users cannot modify existing annotations, that's cheating

- [just began enumerating features here on Figma](https://www.figma.com/file/CgscKZmdW3WKN3JGkjQsU7/WebAnnotatorFeatureNotes12.03.20?node-id=7%3A5536)


- what if a user is really untrustworthy?
- send, share wireframe figma to slack people asap
- bring all the cool new audio features added to Leaflet.annotation into record --> crop --> classify demo:
    - playback spectrogram with audio
    - scrubbing via keyboard / buttons


- - -

 *todo:*
 - Get queue working somewhere online;
   - It'd be great to be able to use the current Cornell annotator infrastructure (eBird authentication, "to be annotated" list from ML, etc)
 - create an interface to let users visualize the model (tsne)
     - create an interface to let users make a queue, e.g. "wood warbler songs" or "high-confidence false IDs" or "new world sparrows"



<h4 id="footnotes"> </h4>     


*^ Rolling notes and whatnot are appended above ^*
