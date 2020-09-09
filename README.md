
## *Demos w/ the Merlin Sound ID Project*
#### [Visit the demos & renders here](https://tmpui.herokuapp.com/)

    
***Hack upon these demos:***
    
```console
# clone:
git clone https://github.com/Jesssullivan/tmpUI
cd tmpUI
```

#### *Install Node dependencies:*   
    
```
# node depends:
npm install  
```

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
    
```console
# see more script struff package.json & in `./scripts/`
npm run-script develop-web
```

   
#### *Install Cocoa depends to get cracking on the ios demos:*   
    
```
# ios depends:
cd ios
pod install  
cd ..
```

#### *Prepare a `./production` directory --> deploy web demos like this:*
```console
# make sure all bundles and renders are bundled and rendered:
# npm run-script develop

# build to a production directory:
npm run-script production
# (you'll want reconfigure config.py accordingly too)
```


### *Whirring toward Annotation as a feature:*

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

