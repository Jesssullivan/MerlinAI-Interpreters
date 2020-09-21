
# Demos w/ the Merlin Sound ID Project

- ***[*Visit the web demos here*](https://tmpui.herokuapp.com/)***  
- ***[*readme @ github.io*](https://jesssullivan.github.io/tmpUI/)***



## **Hack upon these demos:**

```
# clone:
git clone https://github.com/Jesssullivan/tmpUI
cd tmpUI
```

#### *Install Node dependencies:*   

```
# node depends:
npm install  
```

## Web:


#### *Set up a local Python environment for Flask if that's your thing:*
```
# set up a local venv:
python3 -m venv tmpui_venv
source tmpui_venv/bin/activate
```

#### *Install depends for Flask demos:*

```
# Flask depends:
pip3 install -r requirements.txt
# Flask & gunicorn will automatically go fetch...
# Werkzeug, itsdangerous, MarkupSafe, Jinja2, click
# ...as well
```

#### *Configure Flask accordingly in `config.py`:*    

```Python
# config.py

# `True` serves demos @ 127.0.0.1:5000 via node proxy (set `False` for production @ 0.0.0.0:80)
devel = True

# rebuild header + demo + footer html renders before serving anything (set `False` for production):
prerender = True
```

#### *pack up the web demos & start serving:*

```
# see more script stuff in package.json & in `./scripts/`
npm run-script develop-web
```

#### *Prepare a `./production` directory --> deploy web demos like this:*
```
# make sure all bundles and renders are bundled and rendered:
# build to a production directory:
npm run-script production-web
# (you'll want reconfigure config.py accordingly too)
```

### React Native:


#### *Install & link Cocoa depends to get cracking on the ios demos:*   

```
# link ios depends:
cd ios && pod install && cd ..
```

- The entrypoint for native tests is `./index.js`- fiddle with react-native from `./native/`.


#### *Build & deploy to Xcode Simulator:*   

```
# link ios depends:
npm run-script ios-native
```

### Swift Native:

- ***Still glueing together some .xcconfig schemes, hang tight***    


- - -

### Scripts:

```
### Removing stuff:

# ...demo bundles:
npm run-script clean-web-bundles
# ...or `find demos/ -name "*_bundle.js" -print -delete`

# ...demo renders:
npm run-script clean-web-renders
# ...or `find demos/ -name "*_render.html" -print -delete`

# all web files and directories:
npm run-script clean-web-all
# ...or `chmod u+x scripts/clean.sh && ./scripts/clean.sh`

# ...fruit debris:
find '.' -name ".DS_Store" -print -delete

### github environments:
## obtain token @ https://github.com/settings/tokens

# install jq:
sudo apt install jq
# ...or `brew install jq`

# update ./scripts/remove_env.sh:
sudo chmod +x scripts/remove_env.sh && ./scripts/remove_env.sh

# See ./package.json & ./scripts/ for additional scripts
```


- - -


### *Macaulay Annotation features:*        

- Since Macaulay recording are already pretty well labeled by species, what if we make human annotations into a learning game of sorts?  i.e. In order for the user to guess, they must crop in on the song they are guessing on- free annotation lunch?  
    - We already know what the target species is, so even if they get it wrong while they learn a new song, we still get a labeled annotation

- Get humans annotating asap, ideally with a fun / educational twist
   - it would be so cool to be able to hook up a bunch of ornithology professors and students up and down New England with a song study / game tool of sorts
   - Would be fun to add this annotation-centered song learning rgame feature to the hybrid app, may be more helpful in the near term than field annotation

- Another similar thread to the same end is automating the annotation / boxing of Macaulay recordings-
    - Could get pretty far with the existing species labels + vetting with time / date + a highpass filter, though this has less to do with UX and more with getting a jump on adding data for a more accurate model
    - Similarly, since the only real task here is to isolate vocalizations (not id vocalizations)- detecting “Clearly a bird sound vs. not a bird sound”- for each recording, for each species- could be automated to operate without human assistance.  

---    

### *Field Annotation features:*

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


### *Additional bits:*    

- Looking for any existing eBird / Merlin logic or an api we can employ right off the bat for ruling out species based on location & date? (even just eBird's "rare" label?)        
- Angling toward / hybrid Record --> Classify --> Annotate --> generate TFRecord demo
- Lots of hopes to expand the nifty web annotator tool on the Cornell server
- I understand bringing in more human annotators via existing Macaulay recordings is currently the highest priority
