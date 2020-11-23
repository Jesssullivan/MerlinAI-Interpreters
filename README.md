# Deploy:

Demos, interpreter implementations & data ingress tools for annotating, interpreting, and deploying trained models.

- - -

## Web:

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


*Hack on web demos:*
```
# Clone:
git clone --branch=master --depth=1 https://github.com/Jesssullivan/merlin_ai && cd merlin_ai/deploy/

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


| Demo | Description |
|-----------|-------------|
| [deploy/demos/spec_record_crop_dl](demos/spec_record_crop_dl.ts) <br/>  [deploy/demos/spec_record_crop_post](demos/spec_record_crop_post.ts) <br/>   | Experiments with record --> crop --> classify --> download; both client-side & server-side classifications methods |
| [deploy/demos/load_audio](demos/load_audio.ts) <br/> [deploy/demos/spec_display](demos/spec_display.ts) <br/>   | Experiment with Macaulay audio sources --> spectrogram |
| [deploy/demos/spec_record_crop_v3](demos/spec_record_crop_v3.ts) <br/> [deploy/demos/spec_record_v2](demos/spec_record_v2.ts) <br/> [deploy/demos/spec_record_v2](demos/spec_record_v2.ts) <br/> | Single page feature experiments |
| [deploy/demos/webgl_init](demos/webgl_init.ts) <br/> [deploy/demos/deploy/demos/webgl_float_test](demos/webgl_float_test.ts) <br/> [deploy/demos/spec_record_v2](demos/spec_record_v2.ts) <br/> | Evaluate web client's capability for classification |


#### Notes:

*Configure Flask in `config.py`:*

```
# config.py

# `True` serves demos @ 127.0.0.1:5000 via node proxy (set `False` for production @ 0.0.0.0:80)
devel = True

# rebuild header + demo + footer html renders before serving anything (set `False` for production):
prerender = True

```
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


### Leaflet.annotation:  


<table>
  <thead>
    <tr>
      <th>
        <a href="https://tmpui.herokuapp.com/leaflet_audio"><img src="./icons/Leaflet.annotation-favicon-dark/android-chrome-192x192.png" alt="demos"></a>
        <br/> <em> Visit Leaflet.annotation demo </em>
      </th>
      <th>
        <a href="https://youtu.be/JkIgp_F_u64"><img src="https://img.youtube.com/vi/JkIgp_F_u64/default.jpg" alt="tests"></a>
         <br/><em> Watch a 32 second demo here </em>
      </th>
    </tr>
  </thead>
</table>

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

# pack only implementations of audio annotator @ `./demos/annotator_audio.ts:
npm run-script build-anno-audio

# pack only implementations of photo annotator @ `./demos/annotator_photo.ts:
npm run-script build-anno-photo
```

| Demo | Description |
|-----------|-------------|
|  [deploy/demos/annotator_audio](demos/annotator_audio.ts) | Leaflet.annotator tool implementations for generating, labeling, exporting mel spectrogams as annotation data |
|  [deploy/demos/annotator_photo](demos/annotator_photo.ts) | Leaflet.annotator tool implementations for labeling &  exporting photo annotations |

### *Swift Notes:*
```
# Hack on Swift Interpreter:
npm run-script develop-swift-demos
```

- make sure `info.plist` has permissions for microphone access
- *The entrypoint for Swift tests is `./swift/swift-pkgs-tmpui/swift-pkgs-tmpui/swift_pkgs_tmpuiApp.swift`*
- *Toggle various interpreter experiments from entrypoint*

#### *Set Other Linker Libraries:*

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
# switch between xcode versions:
sudo xcode-select --switch ~/Downloads/Xcode-beta.app
```


## Scripts:

```
# See ./package.json & ./scripts/ for additional scripts
```

*main scripts links:*
- [***develop-web-demos***](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_web_demos.sh)
- [***develop-anno-demos***](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_anno_demos.sh)
- [***develop-swift-demos***](https://github.com/Jesssullivan/tmpUI/blob/master/scripts/develop_swift_demos.sh)


#### *removing stuff:*    

```
# clean up with:
npm run-script clean all
# ...and follow the instruction prompt

# ...demo bundles:
npm run-script clean-web-bundles

# ...demo renders:
npm run-script clean-web-renders
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

#### *tone generator:*

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
