/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./demos/annotator_photo.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./demos/annotator_photo.ts":
/*!**********************************!*\
  !*** ./demos/annotator_photo.ts ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
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
let annotatorRendered = null; // allows us to export annotations
let currentImageIndex = 0; // keep track of which image we are working on.
function startAnnotating(images_data, categories, annotations, config) {
    const image_list_el = document.getElementById("imageList");
    const annotatorObjs = [];
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
                imageElement: imageEl,
                image: image_info,
                annotations: image_annotations,
                categories,
                options: {
                    enableEditingImmediately: true,
                    map: {
                        attributionControl: false,
                        zoomControl: false
                    },
                    quickAccessCategoryIDs: quickAccessCatIDs,
                    newInstance: {
                        annotateCategory: true,
                        annotateSupercategory: false,
                        annotationType: 'box'
                    },
                    showCategory: true,
                    showSupercategory: true,
                    showIsCrowdCheckbox: true,
                    renderBoxes: true
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
        let annos = [];
        annotatorObjs.forEach(annotator => {
            annos = annos.concat(annotator.getAnnotations({
                modifiedOnly: false,
                excludeDeleted: true
            }));
        });
        console.log("Exporting " + annos.length + " annotations");
        console.log(annos);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annos));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", annotation_file_prefix + "annotations.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert("Exported a total of " + annos.length + " annotations");
    });
}
// Parse the category ids provided by the user.
function getQuickAccessCategoryIDs() {
    // @ts-ignore
    const rawCatIDs = $.trim(document.getElementById("easyAccessCategories").value);
    let cat_ids = [];
    let str_cat_ids;
    if (rawCatIDs !== "") {
        str_cat_ids = rawCatIDs.split(/\r?\n/);
        // @ts-ignore
        const usestrIDs = document.getElementById("categoryIDTypeRadioStr").checked;
        if (usestrIDs) {
            cat_ids = str_cat_ids;
        }
        else {
            // tslint:disable-next-line:radix
            cat_ids = str_cat_ids.map(cat_id => parseInt(cat_id));
        }
    }
    return cat_ids;
}
/*  Allows the user to choose a directory.
 *
 */
let i = document.querySelector('#customFile').addEventListener('change', (ev) => {
    ev.preventDefault();
    const local_image_data = [];
    let image_json_promise = null;
    let category_json_promise = null;
    let annotation_json_promise = null;
    let config_json_promise = null;
    // @ts-ignore
    for (let i = 0; i < ev.target.files.length; i++) {
        // @ts-ignore
        const item = ev.target.files[i];
        // Is this an image?
        if (item.type === "image/jpeg" || item.type === "image/png") {
            const image_id = item.name.split('.')[0];
            local_image_data.push({
                id: image_id,
                url: item.webkitRelativePath,
                attribution: "N/A"
            });
        }
        // Is this a json file?
        else if (item.type === "application/json") {
            if (item.name === 'images.json') {
                image_json_promise = item.text().then((text) => JSON.parse(text));
            }
            else if (item.name === 'categories.json') {
                category_json_promise = item.text().then((text) => JSON.parse(text));
            }
            else if (item.name.includes('annotations.json')) {
                annotation_json_promise = item.text().then((text) => JSON.parse(text));
            }
            else if (item.name === 'config.json') {
                config_json_promise = item.text().then((text) => JSON.parse(text));
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
    Promise.all([image_json_promise, category_json_promise, annotation_json_promise, config_json_promise]).then(([image_data, category_data, annotation_data, config_data]) => {
        if (local_image_data.length > 0 && image_data != null) {
            alert("ERROR: Found image files (jpgs/ pngs) and an images.json file. Not sure which to use! Please remove one or the other.");
            return;
        }
        if (local_image_data.length > 0) {
            image_data = local_image_data;
            // If we loaded in images from the file system, then assume we should sort by filename
            image_data.sort((a, b) => {
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
        if (category_data == null) {
            alert("Didn't find a category.json file. This needs to be created.");
            return;
        }
        // Did we find any existing annotations for the images?
        if (annotation_data == null) {
            annotation_data = [];
        }
        // Did the user specify any quick access category ids?
        const quickAccessCatIDs = getQuickAccessCategoryIDs();
        // Did we get a config file?
        const default_config = {
            "annotationFilePrefix": "",
            "quickAccessCategoryIDs": quickAccessCatIDs,
        };
        if (config_data != null) {
            config_data = Object.assign({}, default_config, config_data);
        }
        else {
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
}
else if (isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false) {
    // is Google Chrome
}
else {
    // not Google Chrome
    alert("This tool needs to be opened with Google Chrome.");
}


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vZGVtb3MvYW5ub3RhdG9yX3Bob3RvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDbEZBOzs7Ozs7Ozs7O0dBVUc7QUFFSCxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxDQUFDLGtDQUFrQztBQUNoRSxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLCtDQUErQztBQUUxRSxTQUFTLGVBQWUsQ0FBQyxXQUFrQixFQUFFLFVBQWUsRUFBRSxXQUF5QyxFQUFFLE1BRWxFO0lBRW5DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDM0QsTUFBTSxhQUFhLEdBQVUsRUFBRSxDQUFDO0lBRWhDLHdCQUF3QjtJQUN4QixPQUFPLENBQUMsR0FBRyxD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cUM7QUFFckMsYUFBYTtBQUNiLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNoQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2pDLGFBQWE7QUFDYixNQUFNLE9BQU8sR0FBRyxPQUFPLE1BQU0sQ0FBQyxHQUFHLEtBQUssV0FBVyxDQUFDO0FBQ2xELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRXBELElBQUksV0FBVyxFQUFFO0lBQ2pCLDBCQUEwQjtJQUN0QixLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztDQUV6RDtLQUFNLElBQ1AsVUFBVSxLQUFLLElBQUk7SUFDbkIsT0FBTyxVQUFVLEtBQUssV0FBVztJQUNqQyxVQUFVLEtBQUssYUFBYTtJQUM1QixPQUFPLEtBQUssS0FBSztJQUNqQixRQUFRLEtBQUssS0FBSyxFQUNoQjtJQUNGLG1CQUFtQjtDQUNsQjtLQUFNO0lBQ1Asb0JBQW9CO0lBQ2hCLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0NBQzdEIiwiZmlsZSI6ImFubm90YXRvcl9hdWRpb19waG90by5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vZGVtb3MvYW5ub3RhdG9yX3Bob3RvLnRzXCIpO1xuIiwiLyoqXG4gKiAgYW5ub3RhdG9yX3Bob3RvLnRzXG4gKlxuICogaW1wbGVtZW50YXRpb25zIG9mIGBhbm5vdGF0b3JfdG9vbGAgZm9yIGFubm90YXRpbmcgcGhvdG9zLlxuICpcbiAqIGJ1aWxkIG9ubHkgdGhpcyBmaWxlOlxuICogYCBucG0gcnVuLXNjcmlwdCBidWlsZC1waG90byBgXG4gKlxuICogYnVpbGQgYWxsIGZpbGVzOlxuICogYCBucG0gcnVuLXNjcmlwdCBidWlsZCBgXG4gKi9cblxubGV0IGFubm90YXRvclJlbmRlcmVkID0gbnVsbDsgLy8gYWxsb3dzIHVzIHRvIGV4cG9ydCBhbm5vdGF0aW9uc1xubGV0IGN1cnJlbnRJbWFnZUluZGV4ID0gMDsgLy8ga2VlcCB0cmFjayBvZiB3aGljaCBpbWFnZSB3ZSBhcmUgd29ya2luZyBvbi5cblxuZnVuY3Rpb24gc3RhcnRBbm5vdGF0aW5nKGltYWdlc19kYXRhOiBhbnlbXSwgY2F0ZWdvcmllczogYW55LCBhbm5vdGF0aW9uczogQXJyYXk8eyBbeDogc3RyaW5nXTogYW55OyB9PiwgY29uZmlnOiB7XG4gICAgICAgIHF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHM6IGFueVtdO1xuICAgICAgICBhbm5vdGF0aW9uRmlsZVByZWZpeDogc3RyaW5nOyB9KSB7XG5cbiAgICBjb25zdCBpbWFnZV9saXN0X2VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbWFnZUxpc3RcIik7XG4gICAgY29uc3QgYW5ub3RhdG9yT2JqczogYW55W10gPSBbXTtcblxuICAgIC8vIFBhcnNlIHRoZSBjb25maWcgZGljdFxuICAgIGNvbnNvbGUubG9nKGNvbmZpZyk7XG4gICAgY29uc3QgcXVpY2tBY2Nlc3NDYXRJRHMgPSBjb25maWcucXVpY2tBY2Nlc3NDYXRlZ29yeUlEcyB8fCBbXTtcbiAgICBjb25zdCBhbm5vdGF0aW9uX2ZpbGVfcHJlZml4ID0gY29uZmlnLmFubm90YXRpb25GaWxlUHJlZml4IHx8IFwiXCI7XG5cbiAgICBsZXQgaW1nX251bSA9IDE7XG4gICAgaW1hZ2VzX2RhdGEuZm9yRWFjaChpbWFnZV9pbmZvID0+IHtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIG91dGVyIGRpdiB0byBob2xkIGV2ZXJ5dGhpbmdcbiAgICAgICAgY29uc3Qgb3V0ZXJkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgaW1hZ2VfbGlzdF9lbC5hcHBlbmQob3V0ZXJkaXYpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIC8gcCB0byBob2xkIHRoZSBpbWFnZSBudW1cbiAgICAgICAgY29uc3QgcGFyYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1AnKTtcbiAgICAgICAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnICsgaW1nX251bSArICcgLyAnICsgaW1hZ2VzX2RhdGEubGVuZ3RoKTtcbiAgICAgICAgaW1nX251bSArPSAxO1xuXG4gICAgICAgIHBhcmEuYXBwZW5kQ2hpbGQodCk7XG4gICAgICAgIG91dGVyZGl2LmFwcGVuZENoaWxkKHBhcmEpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIGRpdiB0byBob2xkIHRoaXMgaW1hZ2VcbiAgICAgICAgY29uc3QgYW5ub3RhdGlvbl9ob2xkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgb3V0ZXJkaXYuYXBwZW5kQ2hpbGQoYW5ub3RhdGlvbl9ob2xkZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBpbWFnZSBlbGVtZW50IGFuZCBsb2FkIGluIHRoZSBwaXhlbHNcbiAgICAgICAgY29uc3QgaW1hZ2VFbCA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gaGF2ZSBhY2Nlc3MgdG8gdGhlIHBpeGVscyBiZWZvcmUgaW5pdGlhbGl6aW5nIExlYWZsZXRcbiAgICAgICAgaW1hZ2VFbC5vbmxvYWQgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIERvIHdlIGhhdmUgYW55IGFubm90YXRpb25zIGZvciB0aGlzIGltYWdlP1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VfYW5ub3RhdGlvbnMgPSBhbm5vdGF0aW9ucy5maWx0ZXIoYW5ubyA9PiBhbm5vLmltYWdlX2lkID09PSBpbWFnZV9pbmZvLmlkKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBMZWFmbGV0LmFubm90YXRpb24gZWxlbWVudFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgYW5ub3RhdG9yID0gUmVhY3QuY3JlYXRlRWxlbWVudChkb2N1bWVudC5MZWFmbGV0QW5ub3RhdGlvbiwge1xuICAgICAgICAgICAgICAgIGltYWdlRWxlbWVudCA6IGltYWdlRWwsXG4gICAgICAgICAgICAgICAgaW1hZ2UgOiBpbWFnZV9pbmZvLFxuICAgICAgICAgICAgICAgIGFubm90YXRpb25zIDogaW1hZ2VfYW5ub3RhdGlvbnMsXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllcyxcbiAgICAgICAgICAgICAgICBvcHRpb25zIDoge1xuICAgICAgICAgICAgICAgICAgICBlbmFibGVFZGl0aW5nSW1tZWRpYXRlbHkgOiB0cnVlLFxuXG4gICAgICAgICAgICAgICAgICAgIG1hcCA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uQ29udHJvbCA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbUNvbnRyb2wgOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIHF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHMgOiBxdWlja0FjY2Vzc0NhdElEcyxcblxuICAgICAgICAgICAgICAgICAgICBuZXdJbnN0YW5jZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGVDYXRlZ29yeTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFubm90YXRlU3VwZXJjYXRlZ29yeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uVHlwZTogJ2JveCdcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBzaG93Q2F0ZWdvcnkgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93U3VwZXJjYXRlZ29yeTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc2hvd0lzQ3Jvd2RDaGVja2JveDogdHJ1ZSxcblxuICAgICAgICAgICAgICAgICAgICByZW5kZXJCb3hlcyA6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBudWxsKTtcblxuICAgICAgICAgICAgLy8gUmVuZGVyIHRoZSBhbm5vdGF0b3JcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IGFubm90YXRvclJlbmRlcmVkID0gUmVhY3RET00ucmVuZGVyKGFubm90YXRvciwgYW5ub3RhdGlvbl9ob2xkZXIpO1xuXG4gICAgICAgICAgICBhbm5vdGF0b3JPYmpzLnB1c2goYW5ub3RhdG9yUmVuZGVyZWQpO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgaW1hZ2VFbC5zcmMgPSBpbWFnZV9pbmZvLnVybDtcblxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgdGhlIGFubm90YXRpb25zIHRvIGJlIGRvd25sb2FkZWRcbiAgICAkKFwiI2V4cG9ydEFubm9zXCIpLmNsaWNrKCgpID0+IHtcblxuICAgICAgICBsZXQgYW5ub3M6IGFueVtdID0gW107XG4gICAgICAgIGFubm90YXRvck9ianMuZm9yRWFjaChhbm5vdGF0b3IgPT4ge1xuICAgICAgICAgICAgYW5ub3MgPSBhbm5vcy5jb25jYXQoYW5ub3RhdG9yLmdldEFubm90YXRpb25zKHtcbiAgICAgICAgICAgICAgICBtb2RpZmllZE9ubHkgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBleGNsdWRlRGVsZXRlZCA6IHRydWVcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJFeHBvcnRpbmcgXCIgKyBhbm5vcy5sZW5ndGggKyBcIiBhbm5vdGF0aW9uc1wiKTtcbiAgICAgICAgY29uc29sZS5sb2coYW5ub3MpO1xuXG4gICAgICAgIGNvbnN0IGRhdGFTdHIgPSBcImRhdGE6dGV4dC9qc29uO2NoYXJzZXQ9dXRmLTgsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoYW5ub3MpKTtcbiAgICAgICAgY29uc3QgZG93bmxvYWRBbmNob3JOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBkb3dubG9hZEFuY2hvck5vZGUuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCAgICAgZGF0YVN0cik7XG4gICAgICAgIGRvd25sb2FkQW5jaG9yTm9kZS5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBhbm5vdGF0aW9uX2ZpbGVfcHJlZml4ICsgXCJhbm5vdGF0aW9ucy5qc29uXCIpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRvd25sb2FkQW5jaG9yTm9kZSk7IC8vIHJlcXVpcmVkIGZvciBmaXJlZm94XG4gICAgICAgIGRvd25sb2FkQW5jaG9yTm9kZS5jbGljaygpO1xuICAgICAgICBkb3dubG9hZEFuY2hvck5vZGUucmVtb3ZlKCk7XG5cbiAgICAgICAgYWxlcnQoXCJFeHBvcnRlZCBhIHRvdGFsIG9mIFwiICsgYW5ub3MubGVuZ3RoICsgXCIgYW5ub3RhdGlvbnNcIik7XG5cbiAgICB9KTtcblxufVxuXG4vLyBQYXJzZSB0aGUgY2F0ZWdvcnkgaWRzIHByb3ZpZGVkIGJ5IHRoZSB1c2VyLlxuZnVuY3Rpb24gZ2V0UXVpY2tBY2Nlc3NDYXRlZ29yeUlEcygpe1xuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IHJhd0NhdElEcyA9ICQudHJpbShkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVhc3lBY2Nlc3NDYXRlZ29yaWVzXCIpLnZhbHVlKTtcblxuICAgIGxldCBjYXRfaWRzOiBzdHJpbmdbXSB8IG51bWJlcltdID0gW107XG4gICAgbGV0IHN0cl9jYXRfaWRzO1xuXG4gICAgaWYgKHJhd0NhdElEcyAhPT0gXCJcIikge1xuXG4gICAgICAgIHN0cl9jYXRfaWRzID0gcmF3Q2F0SURzLnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB1c2VzdHJJRHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhdGVnb3J5SURUeXBlUmFkaW9TdHJcIikuY2hlY2tlZDtcblxuICAgICAgICBpZiAodXNlc3RySURzKXtcbiAgICAgICAgICAgIGNhdF9pZHMgPSBzdHJfY2F0X2lkcztcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnJhZGl4XG4gICAgICAgICAgICBjYXRfaWRzID0gc3RyX2NhdF9pZHMubWFwKGNhdF9pZCA9PiBwYXJzZUludChjYXRfaWQpKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGNhdF9pZHM7XG5cbn1cblxuLyogIEFsbG93cyB0aGUgdXNlciB0byBjaG9vc2UgYSBkaXJlY3RvcnkuXG4gKlxuICovXG5sZXQgaSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjdXN0b21GaWxlJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGV2KSA9PiB7XG5cbiAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgbG9jYWxfaW1hZ2VfZGF0YTogQXJyYXk8eyBpZDogYW55OyB1cmw6IGFueTsgYXR0cmlidXRpb246IHN0cmluZzsgfT4gPSBbXTtcblxuICAgIGxldCBpbWFnZV9qc29uX3Byb21pc2UgPSBudWxsO1xuICAgIGxldCBjYXRlZ29yeV9qc29uX3Byb21pc2UgPSBudWxsO1xuICAgIGxldCBhbm5vdGF0aW9uX2pzb25fcHJvbWlzZSA9IG51bGw7XG4gICAgbGV0IGNvbmZpZ19qc29uX3Byb21pc2UgPSBudWxsO1xuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvcihsZXQgaSA9IDA7IGkgPCBldi50YXJnZXQuZmlsZXMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IGl0ZW0gPSBldi50YXJnZXQuZmlsZXNbaV07XG5cbiAgICAgICAgLy8gSXMgdGhpcyBhbiBpbWFnZT9cbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gXCJpbWFnZS9qcGVnXCIgfHwgaXRlbS50eXBlID09PSBcImltYWdlL3BuZ1wiKXtcblxuICAgICAgICAgICAgY29uc3QgaW1hZ2VfaWQgPSBpdGVtLm5hbWUuc3BsaXQoJy4nKVswXTtcblxuICAgICAgICAgICAgbG9jYWxfaW1hZ2VfZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICBpZCA6IGltYWdlX2lkLFxuICAgICAgICAgICAgICAgIHVybDogaXRlbS53ZWJraXRSZWxhdGl2ZVBhdGgsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRpb24gOiBcIk4vQVwiXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXMgdGhpcyBhIGpzb24gZmlsZT9cbiAgICAgICAgZWxzZSBpZihpdGVtLnR5cGUgPT09IFwiYXBwbGljYXRpb24vanNvblwiKSB7XG5cbiAgICAgICAgICAgIGlmIChpdGVtLm5hbWUgPT09ICdpbWFnZXMuanNvbicpIHtcbiAgICAgICAgICAgICAgICBpbWFnZV9qc29uX3Byb21pc2UgPSBpdGVtLnRleHQoKS50aGVuKCh0ZXh0OiBzdHJpbmcpID0+IEpTT04ucGFyc2UodGV4dCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIGlmIChpdGVtLm5hbWUgPT09ICdjYXRlZ29yaWVzLmpzb24nKSB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlfanNvbl9wcm9taXNlID0gaXRlbS50ZXh0KCkudGhlbigodGV4dDogc3RyaW5nKSA9PiBKU09OLnBhcnNlKHRleHQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxzZSBpZiAoaXRlbS5uYW1lLmluY2x1ZGVzKCdhbm5vdGF0aW9ucy5qc29uJykpIHtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2pzb25fcHJvbWlzZSA9IGl0ZW0udGV4dCgpLnRoZW4oKHRleHQ6IHN0cmluZykgPT4gSlNPTi5wYXJzZSh0ZXh0KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW0ubmFtZSA9PT0gJ2NvbmZpZy5qc29uJykge1xuICAgICAgICAgICAgICAgIGNvbmZpZ19qc29uX3Byb21pc2UgPSBpdGVtLnRleHQoKS50aGVuKCh0ZXh0OiBzdHJpbmcpID0+SlNPTi5wYXJzZSh0ZXh0KSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIklnbm9yaW5nIFwiICsgaXRlbS5uYW1lICsgXCIgKG5vdCBzdXJlIHdoYXQgdG8gZG8gd2l0aCBpdCkuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSWdub3JpbmcgXCIgKyBpdGVtLm5hbWUgKyBcIiAobm90IHN1cmUgd2hhdCB0byBkbyB3aXRoIGl0KS5cIik7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIGFsbCB0aGUgZmlsZSBsb2FkaW5nIHRvIGZpbmlzaFxuICAgIFByb21pc2UuYWxsKFtpbWFnZV9qc29uX3Byb21pc2UsIGNhdGVnb3J5X2pzb25fcHJvbWlzZSwgYW5ub3RhdGlvbl9qc29uX3Byb21pc2UsIGNvbmZpZ19qc29uX3Byb21pc2VdKS50aGVuKFxuICAgICAgICAoW2ltYWdlX2RhdGEsIGNhdGVnb3J5X2RhdGEsIGFubm90YXRpb25fZGF0YSwgY29uZmlnX2RhdGFdKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChsb2NhbF9pbWFnZV9kYXRhLmxlbmd0aCA+IDAgJiYgaW1hZ2VfZGF0YSAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBhbGVydChcIkVSUk9SOiBGb3VuZCBpbWFnZSBmaWxlcyAoanBncy8gcG5ncykgYW5kIGFuIGltYWdlcy5qc29uIGZpbGUuIE5vdCBzdXJlIHdoaWNoIHRvIHVzZSEgUGxlYXNlIHJlbW92ZSBvbmUgb3IgdGhlIG90aGVyLlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsb2NhbF9pbWFnZV9kYXRhLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIGltYWdlX2RhdGEgPSBsb2NhbF9pbWFnZV9kYXRhO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgbG9hZGVkIGluIGltYWdlcyBmcm9tIHRoZSBmaWxlIHN5c3RlbSwgdGhlbiBhc3N1bWUgd2Ugc2hvdWxkIHNvcnQgYnkgZmlsZW5hbWVcbiAgICAgICAgICAgICAgICBpbWFnZV9kYXRhLnNvcnQoKGE6IHsgdXJsOiBzdHJpbmc7IH0sIGI6IHsgdXJsOiBzdHJpbmc7IH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZUEgPSBhLnVybC50b1VwcGVyQ2FzZSgpOyAvLyBpZ25vcmUgdXBwZXIgYW5kIGxvd2VyY2FzZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lQiA9IGIudXJsLnRvVXBwZXJDYXNlKCk7IC8vIGlnbm9yZSB1cHBlciBhbmQgbG93ZXJjYXNlXG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lQSA8IG5hbWVCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVBID4gbmFtZUIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gbmFtZXMgbXVzdCBiZSBlcXVhbFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlfZGF0YSA9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBhbGVydChcIkRpZG4ndCBmaW5kIGEgY2F0ZWdvcnkuanNvbiBmaWxlLiBUaGlzIG5lZWRzIHRvIGJlIGNyZWF0ZWQuXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGlkIHdlIGZpbmQgYW55IGV4aXN0aW5nIGFubm90YXRpb25zIGZvciB0aGUgaW1hZ2VzP1xuICAgICAgICAgICAgaWYgKGFubm90YXRpb25fZGF0YSA9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uX2RhdGEgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGlkIHRoZSB1c2VyIHNwZWNpZnkgYW55IHF1aWNrIGFjY2VzcyBjYXRlZ29yeSBpZHM/XG4gICAgICAgICAgICBjb25zdCBxdWlja0FjY2Vzc0NhdElEcyA9IGdldFF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHMoKTtcblxuICAgICAgICAgICAgLy8gRGlkIHdlIGdldCBhIGNvbmZpZyBmaWxlP1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdF9jb25maWcgPSB7XG4gICAgICAgICAgICAgICAgXCJhbm5vdGF0aW9uRmlsZVByZWZpeFwiIDogXCJcIixcbiAgICAgICAgICAgICAgICBcInF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHNcIiA6IHF1aWNrQWNjZXNzQ2F0SURzLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChjb25maWdfZGF0YSAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBjb25maWdfZGF0YSA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRfY29uZmlnLCBjb25maWdfZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGNvbmZpZ19kYXRhID0gZGVmYXVsdF9jb25maWc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGRpcmVjdG9yeSBjaG9vc2VyIGZvcm0sIGFuZCBzaG93IHRoZSBhbm5vdGF0aW9uIHRhc2tcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGlyQ2hvb3NlclwiKS5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbm5vdGF0aW9uVGFza1wiKS5oaWRkZW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgc3RhcnRBbm5vdGF0aW5nKGltYWdlX2RhdGEsIGNhdGVnb3J5X2RhdGEsIGFubm90YXRpb25fZGF0YSwgY29uZmlnX2RhdGEpO1xuXG4gICAgICAgIH0pO1xuXG59KTtcblxuLy8gVHJ5IHRvIG1ha2Ugc3VyZSB0aGUgdXNlciBpcyBpbiBDaHJvbWVcbi8vIFNlZSBoZXJlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTMzNDg2MTgvMTEzMzc2MDhcbi8vIHBsZWFzZSBub3RlLFxuLy8gdGhhdCBJRTExIG5vdyByZXR1cm5zIHVuZGVmaW5lZCBhZ2FpbiBmb3Igd2luZG93LmNocm9tZVxuLy8gYW5kIG5ldyBPcGVyYSAzMCBvdXRwdXRzIHRydWUgZm9yIHdpbmRvdy5jaHJvbWVcbi8vIGJ1dCBuZWVkcyB0byBjaGVjayBpZiB3aW5kb3cub3ByIGlzIG5vdCB1bmRlZmluZWRcbi8vIGFuZCBuZXcgSUUgRWRnZSBvdXRwdXRzIHRvIHRydWUgbm93IGZvciB3aW5kb3cuY2hyb21lXG4vLyBhbmQgaWYgbm90IGlPUyBDaHJvbWUgY2hlY2tcbi8vIHNvIHVzZSB0aGUgYmVsb3cgdXBkYXRlZCBjb25kaXRpb25cblxuLy8gQHRzLWlnbm9yZVxuY29uc3QgaXNDaHJvbWl1bSA9IHdpbmRvdy5jaHJvbWU7XG5jb25zdCB3aW5OYXYgPSB3aW5kb3cubmF2aWdhdG9yO1xuY29uc3QgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3I7XG4vLyBAdHMtaWdub3JlXG5jb25zdCBpc09wZXJhID0gdHlwZW9mIHdpbmRvdy5vcHIgIT09IFwidW5kZWZpbmVkXCI7XG5jb25zdCBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZihcIkVkZ2VcIikgPiAtMTtcbmNvbnN0IGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaChcIkNyaU9TXCIpO1xuXG5pZiAoaXNJT1NDaHJvbWUpIHtcbi8vIGlzIEdvb2dsZSBDaHJvbWUgb24gSU9TXG4gICAgYWxlcnQoXCJUaGlzIHRvb2wgaXMgbm90IHRlc3RlZCBmb3IgaU9TIGVudmlyb25tZW50c1wiKTtcblxufSBlbHNlIGlmKFxuaXNDaHJvbWl1bSAhPT0gbnVsbCAmJlxudHlwZW9mIGlzQ2hyb21pdW0gIT09IFwidW5kZWZpbmVkXCIgJiZcbnZlbmRvck5hbWUgPT09IFwiR29vZ2xlIEluYy5cIiAmJlxuaXNPcGVyYSA9PT0gZmFsc2UgJiZcbmlzSUVlZGdlID09PSBmYWxzZVxuKSB7XG4vLyBpcyBHb29nbGUgQ2hyb21lXG59IGVsc2Uge1xuLy8gbm90IEdvb2dsZSBDaHJvbWVcbiAgICBhbGVydChcIlRoaXMgdG9vbCBuZWVkcyB0byBiZSBvcGVuZWQgd2l0aCBHb29nbGUgQ2hyb21lLlwiKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=