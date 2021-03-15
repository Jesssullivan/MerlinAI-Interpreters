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
