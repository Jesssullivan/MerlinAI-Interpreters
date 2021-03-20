/**
 * `remote_photo.ts` implements the Leaflet.annotation tool
 *  for annotating photos.
 *
 *  view this demo by opening `remote_photo.html` in a browser.
 *
 *  to (re)build this file as a development bundle:
 *  ` npm run-script build-anno-photo `
 *
 *  to (re)build this file as a distributable bundle:
 *  ` npm run-script dist-anno-photo `
 */

/* eslint-disable */

import * as React from "react";

let annotatorRendered = null; // allows us to export annotations
let currentImageIndex = 0; // keep track of which image we are working on.

// Dimensions of the spectrogram
let spectrogram_height = null;
let spectrogram_width = null;
let targetSpectrogramHeight = 211;


function handleKeyDown(e) {
    let T_KEY = 84; // new instance of duplicate props
    switch (e.keyCode) {
        case T_KEY:
            break;
    }
}

function startAnnotating(images_data, categories, annotations, config) {

    if (images_data.length === 0) {
        alert("Error: No images?");
        return;
    }

    // Parse the config dict
    let quickAccessCatIDs = config.quickAccessCategoryIDs || [];
    let annotation_file_prefix = config.annotationFilePrefix || "";


    // Group the annotations by image_id so that we can easily overwrite them with the new annotations
    var image_id_to_annotations = {};
    images_data.forEach(image_info => {
        image_id_to_annotations[image_info['id']] = [];
    })
    annotations.forEach(anno => {
        let image_id = anno['image_id'];
        image_id_to_annotations[image_id].push(anno);
    });

    function annotateImage(imageIndex) {

        let image_info = images_data[imageIndex];
        let existing_annotations = image_id_to_annotations[image_info.id];

        if (annotatorRendered != null) {
            // @ts-ignore
            ReactDOM.unmountComponentAtNode(document.getElementById("annotationHolder"));
            annotatorRendered = null;
        }

        $("#currentImageProgress").text('Image ' + (imageIndex + 1) + ' / ' + images_data.length);

        if (imageIndex === 0) {
            $("#previousImageButton").prop("disabled", true);
        } else {
            $("#previousImageButton").prop("disabled", false);
        }

        if (imageIndex === images_data.length - 1) {
            $("#nextImageButton").prop("disabled", true);
        } else {
            $("#nextImageButton").prop("disabled", false);
        }

        // Create an image element and load in the pixels
        let imageEl = new Image();

        // We need to have access to the pixels before initializing Leaflet
        imageEl.onload = function () {

            // Get the dimensions of the spectrogram
            spectrogram_height = imageEl.height;
            spectrogram_width = imageEl.width;

            // Create the Leaflet.annotation element
            // @ts-ignore
            let annotator = React.createElement(document.LeafletAnnotation, {
                imageElement: imageEl,
                image: image_info,
                annotations: existing_annotations,
                categories: categories,
                options: {
                    enableEditingImmediately: true,
                    enableClassify: false,
                    map: {
                        attributionControl: false,
                        zoomControl: false,
                        boxZoom: false,
                        doubleClickZoom: false,
                        keyboard: false,
                        scrollWheelZoom: false
                    },

                    quickAccessCategoryIDs: quickAccessCatIDs,

                    newInstance: {
                        annotateCategory: true,
                        annotateSupercategory: false,
                        annotationType: 'box'
                    },

                    duplicateInstance: {
                        enable: true,
                        duplicateY: true  // duplicate the frequcy components of the box
                    },

                    showCategory: true,
                    showSupercategory: true,
                    showIsCrowdCheckbox: false,

                    enableBoxEdit: true,
                    renderBoxes: true,

                    enableSegmentationEdit: false,
                    renderSegmentations: false,
                    // @ts-ignore
                    imageInfoComponent: document.MLAudioInfo
                }
            }, null);

            // Render the annotator
            // @ts-ignore
            annotatorRendered = ReactDOM.render(annotator, document.getElementById('annotationHolder'));

        }
        imageEl.addEventListener('error', () => {
            alert("Error loading the pixels for image " + image_info.id + ". Perhaps the resouce has been deleted? Maybe skip?");
        });
        imageEl.src = image_info.url;
    }

    function saveCurrentAnnotations() {

        // It could be the case that the image failed to load, in which case we wouldn't have a `annotatorRendered`
        if (annotatorRendered != null) {
            let annos = annotatorRendered.getAnnotations({
                modifiedOnly: false,
                excludeDeleted: true
            });

            let image_id = images_data[currentImageIndex].id;
            image_id_to_annotations[image_id] = annos;
        }
    }

    $("#nextImageButton").click(function () {

        saveCurrentAnnotations();

        if (currentImageIndex < images_data.length - 1) {
            currentImageIndex += 1;
            annotateImage(currentImageIndex);
        }

        document.getElementById("nextImageButton").blur();

    });

    $("#previousImageButton").click(function () {

        saveCurrentAnnotations();

        if (currentImageIndex > 0) {
            currentImageIndex -= 1;
            annotateImage(currentImageIndex);
        }

        document.getElementById("previousImageButton").blur();


    });

    function goToImage() {
        saveCurrentAnnotations();

        let index = -1;

        try {
            index = parseInt(<string>$("#goToImageInput").val());
            index = index - 1; // account for 0 indexing
        } catch (err) {
            return;
        }

        if (index >= 0 && index < images_data.length) {
            currentImageIndex = index;
            annotateImage(currentImageIndex);
        }
    }

    $("#goToImageButton").click(function () {

        document.getElementById("goToImageButton").blur();

        goToImage();

    });
    document.getElementById("goToImageInput").addEventListener('keyup', ({key}) => {
        if (key === "Enter") {

            document.getElementById("goToImageInput").blur();
            goToImage();
        }
    });

    // Allow the annotations to be downloaded
    $("#exportAnnos").click(function () {

        saveCurrentAnnotations();

        let annos = [];
        images_data.forEach(image_info => {
            annos = annos.concat(image_id_to_annotations[image_info.id]);
        });

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annos));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", annotation_file_prefix + "annotations.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        alert("Exported a total of " + annos.length + " annotations");

        document.getElementById("exportAnnos").blur();

    });

    // HACK: trying to make the spacebar play the audio after modifying an annotation
    // this seems to be working....
    document.addEventListener("mouseup", (e) => {
        if (document.activeElement) {
            // @ts-ignore
            if (!(e.target.tagName.toUpperCase() === 'INPUT')) {
                // @ts-ignore
                document.activeElement.blur();
            }
        }
    });

    // Kick everything off.
    annotateImage(currentImageIndex);

}

// Parse the category ids provided by the user.
function getQuickAccessCategoryIDs() {

    // @ts-ignore
    let rawCatIDs = $.trim(document.getElementById("easyAccessCategories").value);
    var cat_ids = []

    if (rawCatIDs !== "") {
        var str_cat_ids = rawCatIDs.split(/\r?\n/);

        // @ts-ignore
        let usestrIDs = document.getElementById("categoryIDTypeRadioStr").checked;
        if (usestrIDs) {
            cat_ids = str_cat_ids;
        } else {
            cat_ids = str_cat_ids.map(cat_id => {
                return parseInt(cat_id)
            });
        }

    }

    return cat_ids;

}

/**
 * Allows the user to choose a directory.
 */
let i = document.querySelector('#customFile').addEventListener('change', (ev) => {

    ev.preventDefault()

    var local_image_data = [];

    var image_json_promise = null;
    var category_json_promise = null;
    var annotation_json_promise = null;
    var config_json_promise = null;

    // @ts-ignore
    for (let i = 0; i < ev.target.files.length; i++) {

        // @ts-ignore
        let item = ev.target.files[i];

        // Is this an image?
        if (item.type === "image/jpeg" || item.type === "image/png") {

            let image_id = item.name.split('.')[0];

            local_image_data.push({
                id: image_id,
                url: item.webkitRelativePath,
                attribution: "N/A"
            });

        }

        // Is this a json file?
        else if (item.type === "application/json") {


            if (item.name === 'images.json') {
                image_json_promise = item.text().then(text => {
                    return JSON.parse(text)
                });
            } else if (item.name === 'categories.json') {

                category_json_promise = item.text().then(text => {
                    return JSON.parse(text)
                });

            } else if (item.name.includes('annotations.json')) {

                annotation_json_promise = item.text().then(text => {
                    return JSON.parse(text)
                });

            } else if (item.name == 'config.json') {

                config_json_promise = item.text().then(text => {
                    return JSON.parse(text)
                });

            } else {
                console.log("Ignoring " + item.name + " (not sure what to do with it).")
            }

        } else {
            console.log("Ignoring " + item.name + " (not sure what to do with it).")
        }

    }

    // Wait for all the file loading to finish
    Promise.all([image_json_promise, category_json_promise, annotation_json_promise, config_json_promise]).then(
        ([image_data, category_data, annotation_data, config_data]) => {


            if (local_image_data.length > 0 && image_data != null) {
                alert("ERROR: Found image files (jpgs/ pngs) and an images.json file. Not sure which to use! Please remove one or the other.");
                return;
            }

            if (local_image_data.length > 0) {
                image_data = local_image_data;

                // If we loaded in images from the file system, then assume we should sort by filename
                image_data.sort(function (a, b) {
                    var nameA = a.url.toUpperCase(); // ignore upper and lowercase
                    var nameB = b.url.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }

                    // names must be equal
                    return 0;
                });

            }

            if (category_data == null) {
                alert("Didn't find a category.json file. This needs to be created.");
                return;
            }

            // Did we find any existing annotations for the images?
            if (annotation_data == null) {
                annotation_data = [];
            }

            // Did the user specify any quick access category ids?
            let quickAccessCatIDs = getQuickAccessCategoryIDs();

            // Did we get a config file?
            const default_config = {
                "annotationFilePrefix": "",
                "quickAccessCategoryIDs": quickAccessCatIDs,
            }
            if (config_data != null) {

                // Try to merge the quick access category ids
                let mergedCategoryIds = null;
                if ("quickAccessCategoryIDs" in config_data && config_data.quickAccessCategoryIDs.length > 0) {
                    if (default_config.quickAccessCategoryIDs.length > 0) {

                        let a = default_config.quickAccessCategoryIDs;
                        let b = config_data.quickAccessCategoryIDs;
                        mergedCategoryIds = a.concat(b.filter((item) => a.indexOf(item) < 0));

                    }
                }
                config_data = Object.assign({}, default_config, config_data);

                if (mergedCategoryIds != null) {
                    config_data.quickAccessCategoryIDs = mergedCategoryIds;
                }
            } else {
                config_data = default_config;
            }

            // Hide the directory chooser form, and show the annotation task
            document.getElementById("dirChooser").hidden = true;
            document.getElementById("annotationTask").hidden = false;

            startAnnotating(image_data, category_data, annotation_data, config_data);

        });

});
