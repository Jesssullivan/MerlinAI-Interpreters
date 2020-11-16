
# Demos with the Merlin Sound ID Project.

- ***[*Visit the web demos here*](https://tmpui.herokuapp.com/)***
- ***[*readme @ github.io*](https://jesssullivan.github.io/tmpUI/)***



## **Hack upon these demos:**

```
# Clone:
git clone --branch=master --depth=2 https://github.com/Jesssullivan/tmpUI && cd tmpUI

# Node:
npm install

# Venv:
python3 -m venv merlinai_venv
source merlinai_venv/bin/activate

# Python:
pip3 install -r requirements.txt

# Launch:
npm run-script develop-web-demos
```


- - -


### Web:


<table>
  <thead>
    <tr>
      <th>
        <a href="https://tmpui.herokuapp.com/"><img src="./icons/tmpUI.MerlinAI-favicon-dark/android-chrome-192x192.png" alt="demos"></a> <br/> <em>MerlinAI Web Demos</em>
      </th>
      <th>
        <a href="https://tmpui.herokuapp.com/"><img src="./etc/merlinaiscript.gif" alt="tests"></a>
      </th>
    </tr>
  </thead>
</table>

  

#### *Configure Flask accordingly in `config.py`:*

```
# config.py

# `True` serves demos @ 127.0.0.1:5000 via node proxy (set `False` for production @ 0.0.0.0:80)
devel = True

# rebuild header + demo + footer html renders before serving anything (set `False` for production):
prerender = True

```

#### *pack up the web demos & start serving:*

```
# see more script stuff in package.json & in `./scripts/`
npm run-script develop-web-demos
```


#### *misc:*

- `/` runs `webgl_init`, which figures out if the browser can or cannot make classifications and routes the client accordingly.
    - *classification options:*
    - if browser cannot do classification (i.e. safari on mobile, webgl mediump not supported) recording is beamed up to `/uploader_standard` for processing
    - both POST destinations `/uploader_select` & `/uploader_standard` can also be operated from within browser as a multipart form


***requirements.txt:***      
- tf-nightly causes Heroku slug size to be too big:
  - use cpu-only tensorflow for deployment
  - (dependabot may get upset)
- on Heroku, `numpy~=1.18.**` is still a reverse depend of cpu-only tensorflow 2.3.*
  -  otherwise, stick with whatever `tf-nightly` calls for, e.g.`numpy>=1.19.2`


- - -


### Leaflet.annotation @ tmpUI:  


<table>
  <thead>
    <tr>
      <th>
        <a href="https://tmpui.herokuapp.com/"><img src="./icons/Leaflet.annotation-favicon-dark/android-chrome-192x192.png" alt="demos"></a>
        <br/> <em>Leaflet.annotation: Visit @ the web demo</em>
      </th> 
      <th>
        <a href="https://youtu.be/JkIgp_F_u64"><img src="https://img.youtube.com/vi/JkIgp_F_u64/default.jpg" alt="tests"></a>
         <br/><em>Watch a 32 second demo here</em>
      </th>
    </tr>
  </thead>
</table>



- *(Jess is still typifying Annotator source, hang tight)*

*Hack on Annotator:*
```
#### develop-anno-demos:

# packs annotator demos
# generates unique openssl cert & key
# serves annotator demos on node http-server

npm run-script develop-anno-demos

```

```
# pack only tool definitions @ `./src/annotator_tool.js:
npm run-script build-anno-tool
```

```
# pack only implementations of audio annotator @ `./demos/annotator_audio.ts:
npm run-script build-anno-audio
```

```
# pack only implementations of photo annotator @ `./demos/annotator_photo.ts:
npm run-script build-anno-photo
```


- - -


### Swift Native:

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


### React Native:


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


### Interpreter Operations:

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

- - -

### Scripts:

```
# See ./package.json & ./scripts/ for additional scripts
```

*main scripts links:*
- [**develop-web-demos**](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_web_demos.sh)
- [develop-anno-demos](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_anno_demos.sh)
- [develop-swift-demos](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_swift_demos.sh)


#### *removing stuff:*    

```
# clean up with:
npm run-script clean all
# ...and follow the instruction prompt
```

```
# ...demo bundles:
npm run-script clean-web-bundles

# ...or:
find demos/ -name "*_bundle.js" -print -delete
```

```
# ...demo renders:
npm run-script clean-web-renders

# ...or:
find demos/ -name "*_render.html" -print -delete
```


#### *github environments:*

```
## tokens @ https://github.com/settings/tokens

# install jq:
sudo apt install jq

# ...or:
brew install jq

# update ./scripts/remove_env.sh:
sudo chmod +x scripts/remove_env.sh && ./scripts/remove_env.sh
```

#### *local ssl:*
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


- - -


#### *misc. notes & additional bits:*


***ios things:***

- Jess is fiddling away with capturing live spectrogram + audio directly via `AVCaptureSession`
  - ...Wading through Apple's functional SwiftUI framework
  - ...Sounds like Dan is forging ahead with great stride, looking forward to syncing up our ios directions
  - ...Removing ambiguity in syncing audio & spectrogram by treating spectrogram as video file internally, this way can be cropped as a single unit
- [Apple's example spectrogram logic implemented here](https://github.com/Jesssullivan/tmpUI/blob/master/swift/swift-pkgs-tmpui/swift-pkgs-tmpui/AudioSpectrogram.swift#L184) is working well, straightforward enough to modify for ideal mel output
  - Wrapped the [example entry](https://developer.apple.com/documentation/accelerate/visualizing_sound_as_an_audio_spectrogram) to be compliant with SwiftUI, see [`SpectrogramView()`](https://github.com/Jesssullivan/tmpUI/blob/master/swift/swift-pkgs-tmpui/swift-pkgs-tmpui/UIViewUtils.swift)
  - Experimenting with approaches to capturing the live `AVCaptureSession` stream using the [camera](https://github.com/Jesssullivan/tmpUI/blob/master/swift/swift-pkgs-tmpui/swift-pkgs-tmpui/CamLivePassThrough.swift#L37) solely because that already works xD e.g. `videoDeviceInput`

- Read existing PCM / .wav file to `AVAudioFile` [works well](https://github.com/Jesssullivan/tmpUI/blob/master/swift/swift-pkgs-tmpui/swift-pkgs-tmpui/ContentView.swift#L82)
- etc, etc:
    - ...using vDSP `Accelerate` builtins
    - ...*pack up as reusable, speedy quick drawing chunk for ios*
    - ...to expand the web annotator tool as a song ID game --> app?
    - ...on external camera / mic hardware?
    - ...toward / hybrid Record --> Classify --> Annotate --> generate TFRecord demo


- `tmpui-testing` dyno used sporadically for debugging, keeping it @ maintenance mode atm
- Use `heroku buildpacks:add --index 1 heroku-community/apt -a tmpui` for librosa vorbis depend


- - -


### *Macaulay Annotation:*

- Since Macaulay recording are already pretty well labeled by species, what if we make human annotations into a learning game of sorts?  i.e. In order for the user to guess, they must crop in on the song they are guessing on- free annotation lunch?
    - We already know what the target species is, so even if they get it wrong while they learn a new song, we still get a labeled annotation

- Get humans annotating asap, ideally with a fun / educational twist
   - it would be so cool to be able to hook up a bunch of ornithology professors and students up and down New England with a song study / game tool of sorts
   - Would be fun to add this annotation-centered song learning rgame feature to the hybrid app, may be more helpful in the near term than field annotation

- Another similar thread to the same end is automating the annotation / boxing of Macaulay recordings-
    - Could get pretty far with the existing species labels + vetting with time / date + a highpass filter, though this has less to do with UX and more with getting a jump on adding data for a more accurate model
    - Similarly, since the only real task here is to isolate vocalizations (not id vocalizations)- detecting “Clearly a bird sound vs. not a bird sound”- for each recording, for each species- could be automated to operate without human assistance.

---

### *Field Annotation:*

* User records a song; song spectrogram is cropped, annotated as either an already ID'd species or unknown song
   * this way, every song encountered is added to the data pool, corroborating or reshaping future models
   * Merlin's model returns user its best deduction for "unknown song"- user should be able to audit each possible species (via allaboutbirds or something) and verify the correct species

* The chain of song annotation tools and transformations will ideally represent an open source entryway to merlin audio id contribution
   * Aiming to make project contribution simple; easy to add to as many audio-enabled devices and projects as possible
   * sorting out these annotation tools (documentation, sensible api, Github presence, etc) seems to be the first and most important step
   * ingress data organization and whatnot would be next, not a big concern while we are experimenting

* How will this become part of new and exciting features (instead of a data cleaning task / tedium?)
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

- - -

## *Notes:*

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
  - @Grant- modify spectrogram to better box all songs-
    - thinking a user definable highpass filter will do the job?
    - or more like 4 or 5 parametric bands?


*Other stuff:*

- add export function?  could fit [everything in ID3?](https://en.wikipedia.org/wiki/ID3) Bundle spectrogram as "album artwork", cropped / uncropped audio as "tracks", json attributes as album info?
- musing on ways to allow a publicly encouraged project such as this access the "big merlin models" down the line, e.g. user experiments with / contributes to / learns from
- still want to eventually figure out TensorFlow with web assembly instead of webgl for mobile, perhaps later?  thoughts on this?

- - -
