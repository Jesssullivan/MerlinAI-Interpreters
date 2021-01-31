/*
 * `remote_spectrogram.js` implements the Leaflet.annotation tool
 *  for annotating spectrograms.
 *
 *  this demo displays pre-generated spectrogams from ML.
 *
 *  see `otf_spectrogram.ts` for an implementation that generates
 *  high-quality mel spectrograms directly from the audio source
 *  "on the fly" in the browser.
 *
 *  view this demo by opening `remote_index.html` in a browser.
 *
 *  to (re)build the development tool:
 *  ` npm run-script build `
 */

/* eslint-disable */

let annotatorRendered = null; // allows us to export annotations
let currentImageIndex = 0; // keep track of which image we are working on.

// Dimensions of the spectrogram
let spectrogram_height = null;
let spectrogram_width = null;

// This value helps dictate the "window size" for the spectrogram. Assuming the Leaflet Map is 1200px wide:
// A 220 original height spectrogram, scaled up to 300 results in ~3.5 seconds
// A 220 original height spectrogram, scaled down to 211 results in ~5 seconds
let targetSpectrogramHeight = 211; //300; // the height that the spectrogram should be rendered at.

// Audio Controls
// space bar is play and pause
let pixels_per_second = null;
let pixels_per_ms = null;
let pan_interval_ms = 100; // the interval that we should pan the spectrogram at.

let audioElement = null;
let playing_audio = false;
let playing_audio_timing_id = null;
let current_offset = 0; // our current pixel offset in the image

let arrow_key_distance = 250. / 4; // quarter of a second movement (assuming 250 pixels per second...)

function panSpectrogram() {

    let currentTime = audioElement.currentTime;

    // Where is the audio in milliseconds
    //let audio_time_ms = currentTime * 1000;

    // Convert milliseconds to pixel translation
    //let offset = pixels_per_ms * audio_time_ms;

    let offset = pixels_per_second * currentTime;

    annotatorRendered.panTo(offset);

    current_offset = offset;

}

function audioEnded() {
    clearInterval(playing_audio_timing_id);
    playing_audio = false;
}

function startPlaying() {

    if (audioElement != null) {

        audioElement.currentTime = current_offset / pixels_per_second;

        // If the user "focused" on an annotation, then our offset position that is rendered is off.
        // So make sure to "re-pan" the map to the current offset.
        annotatorRendered.panTo(current_offset);

        audioElement.onended = audioEnded;
        audioElement.play();
        playing_audio_timing_id = setInterval(panSpectrogram, pan_interval_ms);
        playing_audio = true;

    }

}

function stopPlaying() {

    if (audioElement != null && !audioElement.paused) {

        audioElement.pause();
        clearInterval(playing_audio_timing_id);

    }
    playing_audio = false;

}

function goForward() {

    if (current_offset >= spectrogram_width) {
        return;
    }

    if (playing_audio) {
        stopPlaying();
    }

    current_offset = Math.min(spectrogram_width, current_offset + arrow_key_distance);
    annotatorRendered.panTo(current_offset);

}

function goBackward() {

    if (current_offset === 0) {
        return;
    }

    if (playing_audio) {
        stopPlaying();
    }

    current_offset = Math.max(0, current_offset - arrow_key_distance);
    annotatorRendered.panTo(current_offset);

}

/* Handle the situation when the map pans to an annotation.
In this case we need to change our audio playback position.
*/
function mapPannedTo(x_loc) {

    if (playing_audio) {
        stopPlaying();
    }

    // Convert the pixel location to time
    // Set the playback position in the audio
    audioElement.currentTime = x_loc / pixels_per_second;
    // Set our current offset
    current_offset = x_loc;

}

function handleKeyDown(e) {

    let PLAY_PAUSE_KEY = 32;
    let RIGHT_ARROW_KEY = 39; // Forward
    let LEFT_ARROW_KEY = 37; // Backward
    let T_KEY = 84; // new instance of duplicate props

    switch (e.keyCode) {
        case PLAY_PAUSE_KEY:
            if (e.target === document.body) {
                if (playing_audio) {
                    stopPlaying();
                } else {
                    startPlaying();
                }
                e.preventDefault(); // prevent the space button from scrolling
            }
            break;
        case RIGHT_ARROW_KEY:
            goForward()
            break;
        case LEFT_ARROW_KEY:
            goBackward()
            break;
        case T_KEY:
            break;
    }

}

function enableAudioKeys() {
    // Register keypresses
    document.addEventListener("keydown", handleKeyDown);
}

function disableAudioKeys() {
    // Unregister keypresses
    document.removeEventListener("keydown", handleKeyDown);
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
            // There was a previous image, make sure to unmount it (and stop audio)

            stopPlaying();
            disableAudioKeys();
            ReactDOM.unmountComponentAtNode(document.getElementById("annotationHolder"));
            annotatorRendered = null;

        }
        $("#currentImageProgress").text('Image ' + (imageIndex + 1) + ' / ' + images_data.length);
        $("#currentAudioDuration").text('Dur: ? sec');
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

            function addAudioFunctions(annotatorRendered) {

                // Setup the view for the audio
                annotatorRendered.renderForSpectrogram(targetSpectrogramHeight);
                annotatorRendered.turnOffZoom();
                annotatorRendered.turnOffDrag();

                // Audio Controls
                // space bar is play and pause
                pixels_per_second = null;
                pixels_per_ms = null;

                audioElement = new Audio();
                playing_audio = false;
                playing_audio_timing_id = null;
                current_offset = 0;

                // Load in the audio for the spectrogram
                audioElement.addEventListener('canplaythrough', () => {
                    let duration = audioElement.duration;
                    // The duration variable now holds the duration (in seconds) of the audio clip

                    // This should be ~250 (because of the SoX command)
                    pixels_per_second = 250.0; //spectrogram_width / duration;

                    pixels_per_ms = pixels_per_second / 1000.0;

                    enableAudioKeys();

                    $("#currentAudioDuration").text('Dur: ' + duration.toFixed(2) + ' sec');

                });
                audioElement.src = image_info.audio;
                audioElement.addEventListener('error', () => {
                    alert("Error loading the audio for image " + image_info.id + ". Perhaps the resouce has been deleted? Maybe skip or try to come back to this asset?");
                });
                audioElement.load();

            }

            function delayAudioPrepTillRender(annotatorRendered) {

                if (!('audio' in image_info)) {
                    console.log("No audio url in image info");
                    return;
                }

                // Annoying, but we need leaflet to render the image before we start
                // doing transformations
                setTimeout(() => addAudioFunctions(annotatorRendered), 100);
            }

            // Create the Leaflet.annotation element
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

                    imageInfoComponent: document.MLAudioInfo,

                    didMountLeafletCallback: delayAudioPrepTillRender,
                    didFocusOnAnnotationCallback: mapPannedTo
                }
            }, null);

            // Render the annotator
            annotatorRendered = ReactDOM.render(annotator, document.getElementById('annotationHolder'));


            // Create the one second intervals lines that will appear over the spectrogram.
            // These are 1px wide lines.
            // NOTE: these values are hard coded for a window width of 1200px with one second being 240px.
            let interval_offset = 120;
            let one_second_interval = 240;
            for (let i = 0; i < 5; i++) {
                $(".leaflet-image-holder").append(
                    $("<span></span>").css({
                        "content": "",
                        "width": "1px",
                        "height": "100%",
                        "display": "block",
                        "z-index": 999,
                        "left": "" + (interval_offset + (i * one_second_interval)) + "px",
                        "position": "absolute",
                        "background-image": "linear-gradient(#495057bf, #495057bf)",
                        "background-size": "1px 100%",
                        "background-repeat": "no-repeat",
                        "background-position": "center center"
                    })
                );
            }


        }
        imageEl.addEventListener('error', () => {
            alert("Error loading the pixels for image " + image_info.id + ". Perhaps the resouce has been deleted? Maybe skip?");
        });
        imageEl.src = image_info.url;

    }

    function saveCurrentAnnotations() {

        // It could be the case that the image or audio failed to load, in which case we wouldn't have a `annotatorRendered`
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
            index = parseInt($("#goToImageInput").val());
            index = index - 1; // acount for 0 indexing
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
            if (!(e.target.tagName.toUpperCase() === 'INPUT')) {
                document.activeElement.blur();
            }
        }
    });

    // Kick everything off.
    annotateImage(currentImageIndex);

}

// Parse the category ids provided by the user.
function getQuickAccessCategoryIDs() {

    let rawCatIDs = $.trim(document.getElementById("easyAccessCategories").value);
    var cat_ids = []

    if (rawCatIDs !== "") {
        var str_cat_ids = rawCatIDs.split(/\r?\n/);

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

/*  Allows the user to choose a directory.
 *
 */
let i = document.querySelector('#customFile').addEventListener('change', (ev) => {

    ev.preventDefault()

    var local_image_data = [];

    var image_json_promise = null;
    var category_json_promise = null;
    var annotation_json_promise = null;
    var config_json_promise = null;

    for (let i = 0; i < ev.target.files.length; i++) {

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

// Try to make sure the user is in Chrome
// See here: https://stackoverflow.com/a/13348618/11337608

// please note,
// that IE11 now returns undefined again for window.chrome
// and new Opera 30 outputs true for window.chrome
// but needs to check if window.opr is not undefined
// and new IE Edge outputs to true now for window.chrome
// and if not iOS Chrome check
// so use the below updated condition
var isChromium = window.chrome;
var winNav = window.navigator;
var vendorName = winNav.vendor;
var isOpera = typeof window.opr !== "undefined";
var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
var isIOSChrome = winNav.userAgent.match("CriOS");

if (isIOSChrome) {
// is Google Chrome on IOS
    alert("This tool is not tested for iOS environments")

} else if (
    isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false
) {
// is Google Chrome
} else {
// not Google Chrome
    alert("This tool needs to be opened with Google Chrome.")
}

/*eslint-enable */
