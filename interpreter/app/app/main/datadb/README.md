
# Merlin data pipeline & api


<br/>



Internal machine learning workflow 


- - -


## Ingest:


#### Asset is keyed by id- must contain:
   - asset[url] spectrogram url, e.g.
    - `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/<id>/spectrogram_small`
   - asset[audio] ml mp3, e.g.
    - `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/<id>`
   - asset[src] ml asset url, e.g.
    - `https://macaulaylibrary.org/asset/<id>`
   - asset[attribution] ml asset attribution




#### *cron job:*


*diff:*
  - takes last day of solr dump, expands do local data directory
  - walks all local data directories
  - adds all new key entries to db

*store:*
- copy source asset files to some good place like `/data/src/` in the network drive shared by the Merlin machines, maybe w/ filename as key-
- *generate & store artifacts by type, perhaps like:*
  - `/data/src/`
  - `/data/mp3/`
  - `/data/wav/`
  - `/data/jpg/`


*metadata: for each new key, attempt to add:*
- add audio length, time, frequency metadata from ebird
- add inat, abba 6 char and 4 char species codes
- annotation status
-  etc, etc


*export:*
- build & expose images.json for each species, perhaps sumth like:
  - dynamic endpoints `/exports/json/current/` & `/exports/json/previous/` point to static uri:
  - `/exports/json/<date>/`


- build & expose dataframe of computed stats & useful data exports:
  - *precomputed stats:*
    - ``/exports/stats/csv/`<date>`/``
    - ``/exports/stats/json/`<date>`/``
    - ``/exports/stats/png/`<date>`/``
  - *data & document dumps:*
    - ``/exports/df/csv/`<date>`/``
    - ``/exports/df/npz/`<date>`/``
    - ``/exports/df/hd5/`<date>`/``


 - build & expose models:
    - dynamic endpoints `/models/<type>/current/<archive>` & `/models/<type>/previous/<archive>` compress from directory at:
      - `/models/<type>/<date>/`

    - *e.g.*   
      - `/models/tflite/current/zip`
      - `/models/saved/previous/tar`
