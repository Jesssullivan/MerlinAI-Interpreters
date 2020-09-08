/**
 * ***reference json***
 * 
 * ...<species>_annotations.json looks like this:
 * {"id":"33c5af9b-4b19-4889-bf68-71f312379d3b",
 * "image_id":60165461,
 * "bbox":[0.3579166603088379,0.6810511363636365,0.1125,0.2255284090909091],
 * "category_id":"cangoo",
 * "supercategory":"Bird"}
 * 
 * ...catagories.json looks like this:
 * {"id": "cangoo", 
 * "name": "Canada Goose", 
 * "supercategory": "Bird"}
 * 
 * ...config.json like this:
 * {"annotationFilePrefix": "cangoo_", 
 * "quickAccessCategoryIDs": ["cangoo"]}
 * 
 * ...images.json looks like this:
 * {"id": 53870221, 
 * "url": "https://cdn.download.ams.birds.cornell.edu/api/v1/asset/53870221/spectrogram_small", 
 * "src": "https://macaulaylibrary.org/asset/53870221", 
 * "attribution": "George Chiu", 
 * "audio": "https://cdn.download.ams.birds.cornell.edu/api/v1/asset/53870221"}
 */
