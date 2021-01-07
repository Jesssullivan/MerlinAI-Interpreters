/*
 *  annotator_photo.ts
 *
 * implementations of `annotator_tool` for annotating photos.
 *
 * build only this file:
 * ` npm run-script build-photo `
 *
 * build all files:
 * ` npm run-script build `
 */

const annotatorRendered = null; // allows us to export annotations
const currentImageIndex = 0; // keep track of which image we are working on.

const startAnnotating = (images_data: any[], categories: any, annotations: Array<{ [x: string]: any }>, config: {
        quickAccessCategoryIDs: any[];
        annotationFilePrefix: string; }) => {

    const image_list_el = document.getElementById("imageList");
    const annotatorObjs: any[] = [];

    // Parse the config dict
    console.log(config);
    const quickAccessCatIDs = config.quickAccessCategoryIDs || [];
    const annotation_file_prefix = config.annotationFilePrefix || "";

    let img_num = 1;
    images_data.forEach(image_info => {

        // Create the outer div to hold everything
        const outerdiv = document.createElement('div');
        image_list_el.append(outerdiv);

        // Create a / p to hold the image num
        const para = document.createElement('P');
        const t = document.createTextNode('' + img_num + ' / ' + images_data.length);
        img_num += 1;

        para.appendChild(t);
        outerdiv.appendChild(para);

        // Create a div to hold this image
        const annotation_holder = document.createElement('div');
        outerdiv.appendChild(annotation_holder);

        // Create an image element and load in the pixels
        const imageEl = new Image();

        // We need to have access to the pixels before initializing Leaflet
        imageEl.onload = () => {

            // Do we have any annotations for this image?
            const image_annotations = annotations.filter(anno => anno.image_id === image_info.id);

            // Create the Leaflet.annotation element
            // @ts-ignore
            const annotator = React.createElement(document.LeafletAnnotation, {
                imageElement : imageEl,
                image : image_info,
                annotations : image_annotations,
                categories,
                options : {
                    enableEditingImmediately : true,

                    map : {
                        attributionControl : false,
                        zoomControl : false
                    },

                    quickAccessCategoryIDs : quickAccessCatIDs,

                    newInstance: {
                        annotateCategory: true,
                        annotateSupercategory: false,
                        annotationType: 'box'
                    },

                    showCategory : true,
                    showSupercategory: true,
                    showIsCrowdCheckbox: true,

                    renderBoxes : true
                }
            }, null);

            // Render the annotator
            // @ts-ignore
            const annotatorRendered = ReactDOM.render(annotator, annotation_holder);

            annotatorObjs.push(annotatorRendered);

        };

        imageEl.src = image_info.url;

    });

    // Allow the annotations to be downloaded
    $("#exportAnnos").click(() => {

        let annos: any[] = [];
        annotatorObjs.forEach(annotator => {
            annos = annos.concat(annotator.getAnnotations({
                modifiedOnly : false,
                excludeDeleted : true
            }));
        });

        console.log("Exporting " + annos.length + " annotations");
        console.log(annos);

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annos));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", annotation_file_prefix + "annotations.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        alert("Exported a total of " + annos.length + " annotations");

    });

};

// Parse the category ids provided by the user.
const getQuickAccessCategoryIDs = () => {

    // @ts-ignore
    const rawCatIDs = $.trim(document.getElementById("easyAccessCategories").value);

    let cat_ids: string[] | number[] = [];
    let str_cat_ids;

    if (rawCatIDs !== "") {

        str_cat_ids = rawCatIDs.split(/\r?\n/);

        // @ts-ignore
        const usestrIDs = document.getElementById("categoryIDTypeRadioStr").checked;

        if (usestrIDs){
            cat_ids = str_cat_ids;
        }
        else{
            // tslint:disable-next-line:radix
            cat_ids = str_cat_ids.map(cat_id => parseInt(cat_id));
        }

    }

    return cat_ids;

};

/*  Allows the user to choose a directory.
 *
 */
const i = document.querySelector('#customFile').addEventListener('change', (ev) => {

    ev.preventDefault();

    const local_image_data: Array<{ id: any; url: any; attribution: string }> = [];

    let image_json_promise = null;
    let category_json_promise = null;
    let annotation_json_promise = null;
    let config_json_promise = null;

    // @ts-ignore
    for(let i = 0; i < ev.target.files.length; i++) {

        // @ts-ignore
        const item = ev.target.files[i];

        // Is this an image?
        if (item.type === "image/jpeg" || item.type === "image/png"){

            const image_id = item.name.split('.')[0];

            local_image_data.push({
                id : image_id,
                url: item.webkitRelativePath,
                attribution : "N/A"
            });

        }

        // Is this a json file?
        else if(item.type === "application/json") {

            if (item.name === 'images.json') {
                image_json_promise = item.text().then((text: string) => JSON.parse(text));
            }

            else if (item.name === 'categories.json') {
                category_json_promise = item.text().then((text: string) => JSON.parse(text));
            }

            else if (item.name.includes('annotations.json')) {
                annotation_json_promise = item.text().then((text: string) => JSON.parse(text));
            }

            else if (item.name === 'config.json') {
                config_json_promise = item.text().then((text: string) =>JSON.parse(text) );
            }

            else {
                console.log("Ignoring " + item.name + " (not sure what to do with it).");
            }

        }

        else {
            console.log("Ignoring " + item.name + " (not sure what to do with it).");
        }

    }

    // Wait for all the file loading to finish
    Promise.all([image_json_promise, category_json_promise, annotation_json_promise, config_json_promise]).then(
        ([image_data, category_data, annotation_data, config_data]) => {

            if (local_image_data.length > 0 && image_data != null){
                alert("ERROR: Found image files (jpgs/ pngs) and an images.json file. Not sure which to use! Please remove one or the other.");
                return;
            }

            if (local_image_data.length > 0){
                image_data = local_image_data;

                // If we loaded in images from the file system, then assume we should sort by filename
                image_data.sort((a: { url: string }, b: { url: string }) => {
                    const nameA = a.url.toUpperCase(); // ignore upper and lowercase
                    const nameB = b.url.toUpperCase(); // ignore upper and lowercase
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

            if (category_data == null){
                alert("Didn't find a category.json file. This needs to be created.");
                return;
            }

            // Did we find any existing annotations for the images?
            if (annotation_data == null){
                annotation_data = [];
            }

            // Did the user specify any quick access category ids?
            const quickAccessCatIDs = getQuickAccessCategoryIDs();

            // Did we get a config file?
            const default_config = {
                "annotationFilePrefix" : "",
                "quickAccessCategoryIDs" : quickAccessCatIDs,
            };
            if (config_data != null){
                config_data = Object.assign({}, default_config, config_data);
            }
            else{
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

// @ts-ignore
const isChromium = window.chrome;
const winNav = window.navigator;
const vendorName = winNav.vendor;
// @ts-ignore
const isOpera = typeof window.opr !== "undefined";
const isIEedge = winNav.userAgent.indexOf("Edge") > -1;
const isIOSChrome = winNav.userAgent.match("CriOS");

if (isIOSChrome) {
// is Google Chrome on IOS
    alert("This tool is not tested for iOS environments");

} else if(
isChromium !== null &&
typeof isChromium !== "undefined" &&
vendorName === "Google Inc." &&
isOpera === false &&
isIEedge === false
) {
// is Google Chrome
} else {
// not Google Chrome
    alert("This tool needs to be opened with Google Chrome.");
}
