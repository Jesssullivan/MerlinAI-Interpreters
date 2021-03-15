/**
 * reference structures.
 *
 * print structures with:
 * ` npx ts-node etc/json_refs.ts `
 *
 */

console.log('\nStructures reference:');

const annotations_json = {
    "id": "ipv4",
    "image_id": "ML asset id, e.g. `53870221`",
    "bbox": "[x, y, w, h]",
    "category_id": "species_code",
    "supercategory": "type"
};

console.log('\nannotations.json structure:');
console.log(JSON.stringify(annotations_json, null, 2));

const config_json = {
    "annotationFilePrefix": "species_code_",
    "quickAccessCategoryIDs": '["species1", "species2"]'
};

console.log('\nspecies_config.json structure:');
console.log(JSON.stringify(config_json, null, 2));

const categories_json = {
    "id": "species_code",
    "name": "Species Name",
    "supercategory": "type"
};

console.log('\ncategories.json structure:');
console.log(JSON.stringify(categories_json, null, 2));

const images_json = {
    "id": "ML asset id, e.g. `53870221`",
    "url": "absolute spectrogram url, e.g. `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/53870221/spectrogram_small`",
    "src": "ML asset url, e.g. `https://macaulaylibrary.org/asset/53870221`",
    "attribution": "ML asset creator name",
    "audio":  "absolute audio url, e.g. `https://cdn.download.ams.birds.cornell.edu/api/v1/asset/53870221`",
};

console.log('\nimages.json structure:');
console.log(JSON.stringify(images_json, null, 2));

const id_event = {
    "id": "ipv4",
    "ML_id": "ML asset id, e.g. `53870221`. Can be blank if media source is not in ML",
    "username": "annotator's handle",
    "media_source": "absolute url to media being annotated",
    "bbox": "[x, y, w, h]",
    "category": "species code",
    "supercategory": "type",
    "last_modified": "last modified date"
};

console.log('\nproposed first class id_event structure:');
console.log(JSON.stringify(id_event,null, 2));
