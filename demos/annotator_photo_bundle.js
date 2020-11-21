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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vZGVtb3MvYW5ub3RhdG9yX3Bob3RvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDbEZBOzs7Ozs7Ozs7O0dBVUc7QUFFSCxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxDQUFDLGtDQUFrQztBQUNoRSxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLCtDQUErQztBQUUxRSxTQUFTLGVBQWUsQ0FBQyxXQUFrQixFQUFFLFVBQWUsRUFBRSxXQUF5QyxFQUFFLE1BRWxFO0lBRW5DLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDM0QsTUFBTSxhQUFhLEdBQVUsRUFBRSxDQUFDO0lBRWhDLHdCQUF3QjtJQUN4QixPQUFPLENBQUMsR0FBRyxD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cUM7QUFFckMsYUFBYTtBQUNiLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNoQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2pDLGFBQWE7QUFDYixNQUFNLE9BQU8sR0FBRyxPQUFPLE1BQU0sQ0FBQyxHQUFHLEtBQUssV0FBVyxDQUFDO0FBQ2xELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRXBELElBQUksV0FBVyxFQUFFO0lBQ2pCLDBCQUEwQjtJQUN0QixLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztDQUV6RDtLQUFNLElBQ1AsVUFBVSxLQUFLLElBQUk7SUFDbkIsT0FBTyxVQUFVLEtBQUssV0FBVztJQUNqQyxVQUFVLEtBQUssYUFBYTtJQUM1QixPQUFPLEtBQUssS0FBSztJQUNqQixRQUFRLEtBQUssS0FBSyxFQUNoQjtJQUNGLG1CQUFtQjtDQUNsQjtLQUFNO0lBQ1Asb0JBQW9CO0lBQ2hCLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO0NBQzdEIiwiZmlsZSI6ImFubm90YXRvcl9waG90b19idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL2RlbW9zL2Fubm90YXRvcl9waG90by50c1wiKTtcbiIsIi8qKlxuICogIGFubm90YXRvcl9waG90by50c1xuICpcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgYW5ub3RhdG9yX3Rvb2xgIGZvciBhbm5vdGF0aW5nIHBob3Rvcy5cbiAqXG4gKiBidWlsZCBvbmx5IHRoaXMgZmlsZTpcbiAqIGAgbnBtIHJ1bi1zY3JpcHQgYnVpbGQtcGhvdG8gYFxuICpcbiAqIGJ1aWxkIGFsbCBmaWxlczpcbiAqIGAgbnBtIHJ1bi1zY3JpcHQgYnVpbGQgYFxuICovXG5cbmxldCBhbm5vdGF0b3JSZW5kZXJlZCA9IG51bGw7IC8vIGFsbG93cyB1cyB0byBleHBvcnQgYW5ub3RhdGlvbnNcbmxldCBjdXJyZW50SW1hZ2VJbmRleCA9IDA7IC8vIGtlZXAgdHJhY2sgb2Ygd2hpY2ggaW1hZ2Ugd2UgYXJlIHdvcmtpbmcgb24uXG5cbmZ1bmN0aW9uIHN0YXJ0QW5ub3RhdGluZyhpbWFnZXNfZGF0YTogYW55W10sIGNhdGVnb3JpZXM6IGFueSwgYW5ub3RhdGlvbnM6IEFycmF5PHsgW3g6IHN0cmluZ106IGFueTsgfT4sIGNvbmZpZzoge1xuICAgICAgICBxdWlja0FjY2Vzc0NhdGVnb3J5SURzOiBhbnlbXTtcbiAgICAgICAgYW5ub3RhdGlvbkZpbGVQcmVmaXg6IHN0cmluZzsgfSkge1xuXG4gICAgY29uc3QgaW1hZ2VfbGlzdF9lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW1hZ2VMaXN0XCIpO1xuICAgIGNvbnN0IGFubm90YXRvck9ianM6IGFueVtdID0gW107XG5cbiAgICAvLyBQYXJzZSB0aGUgY29uZmlnIGRpY3RcbiAgICBjb25zb2xlLmxvZyhjb25maWcpO1xuICAgIGNvbnN0IHF1aWNrQWNjZXNzQ2F0SURzID0gY29uZmlnLnF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHMgfHwgW107XG4gICAgY29uc3QgYW5ub3RhdGlvbl9maWxlX3ByZWZpeCA9IGNvbmZpZy5hbm5vdGF0aW9uRmlsZVByZWZpeCB8fCBcIlwiO1xuXG4gICAgbGV0IGltZ19udW0gPSAxO1xuICAgIGltYWdlc19kYXRhLmZvckVhY2goaW1hZ2VfaW5mbyA9PiB7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBvdXRlciBkaXYgdG8gaG9sZCBldmVyeXRoaW5nXG4gICAgICAgIGNvbnN0IG91dGVyZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGltYWdlX2xpc3RfZWwuYXBwZW5kKG91dGVyZGl2KTtcblxuICAgICAgICAvLyBDcmVhdGUgYSAvIHAgdG8gaG9sZCB0aGUgaW1hZ2UgbnVtXG4gICAgICAgIGNvbnN0IHBhcmEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdQJyk7XG4gICAgICAgIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyArIGltZ19udW0gKyAnIC8gJyArIGltYWdlc19kYXRhLmxlbmd0aCk7XG4gICAgICAgIGltZ19udW0gKz0gMTtcblxuICAgICAgICBwYXJhLmFwcGVuZENoaWxkKHQpO1xuICAgICAgICBvdXRlcmRpdi5hcHBlbmRDaGlsZChwYXJhKTtcblxuICAgICAgICAvLyBDcmVhdGUgYSBkaXYgdG8gaG9sZCB0aGlzIGltYWdlXG4gICAgICAgIGNvbnN0IGFubm90YXRpb25faG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIG91dGVyZGl2LmFwcGVuZENoaWxkKGFubm90YXRpb25faG9sZGVyKTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gaW1hZ2UgZWxlbWVudCBhbmQgbG9hZCBpbiB0aGUgcGl4ZWxzXG4gICAgICAgIGNvbnN0IGltYWdlRWwgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgICAvLyBXZSBuZWVkIHRvIGhhdmUgYWNjZXNzIHRvIHRoZSBwaXhlbHMgYmVmb3JlIGluaXRpYWxpemluZyBMZWFmbGV0XG4gICAgICAgIGltYWdlRWwub25sb2FkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBEbyB3ZSBoYXZlIGFueSBhbm5vdGF0aW9ucyBmb3IgdGhpcyBpbWFnZT9cbiAgICAgICAgICAgIGNvbnN0IGltYWdlX2Fubm90YXRpb25zID0gYW5ub3RhdGlvbnMuZmlsdGVyKGFubm8gPT4gYW5uby5pbWFnZV9pZCA9PT0gaW1hZ2VfaW5mby5pZCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgTGVhZmxldC5hbm5vdGF0aW9uIGVsZW1lbnRcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IGFubm90YXRvciA9IFJlYWN0LmNyZWF0ZUVsZW1lbnQoZG9jdW1lbnQuTGVhZmxldEFubm90YXRpb24sIHtcbiAgICAgICAgICAgICAgICBpbWFnZUVsZW1lbnQgOiBpbWFnZUVsLFxuICAgICAgICAgICAgICAgIGltYWdlIDogaW1hZ2VfaW5mbyxcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9ucyA6IGltYWdlX2Fubm90YXRpb25zLFxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRWRpdGluZ0ltbWVkaWF0ZWx5IDogdHJ1ZSxcblxuICAgICAgICAgICAgICAgICAgICBtYXAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGlvbkNvbnRyb2wgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvb21Db250cm9sIDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBxdWlja0FjY2Vzc0NhdGVnb3J5SURzIDogcXVpY2tBY2Nlc3NDYXRJRHMsXG5cbiAgICAgICAgICAgICAgICAgICAgbmV3SW5zdGFuY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFubm90YXRlQ2F0ZWdvcnk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbm5vdGF0ZVN1cGVyY2F0ZWdvcnk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvblR5cGU6ICdib3gnXG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgc2hvd0NhdGVnb3J5IDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc2hvd1N1cGVyY2F0ZWdvcnk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNob3dJc0Nyb3dkQ2hlY2tib3g6IHRydWUsXG5cbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyQm94ZXMgOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgbnVsbCk7XG5cbiAgICAgICAgICAgIC8vIFJlbmRlciB0aGUgYW5ub3RhdG9yXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBhbm5vdGF0b3JSZW5kZXJlZCA9IFJlYWN0RE9NLnJlbmRlcihhbm5vdGF0b3IsIGFubm90YXRpb25faG9sZGVyKTtcblxuICAgICAgICAgICAgYW5ub3RhdG9yT2Jqcy5wdXNoKGFubm90YXRvclJlbmRlcmVkKTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIGltYWdlRWwuc3JjID0gaW1hZ2VfaW5mby51cmw7XG5cbiAgICB9KTtcblxuICAgIC8vIEFsbG93IHRoZSBhbm5vdGF0aW9ucyB0byBiZSBkb3dubG9hZGVkXG4gICAgJChcIiNleHBvcnRBbm5vc1wiKS5jbGljaygoKSA9PiB7XG5cbiAgICAgICAgbGV0IGFubm9zOiBhbnlbXSA9IFtdO1xuICAgICAgICBhbm5vdGF0b3JPYmpzLmZvckVhY2goYW5ub3RhdG9yID0+IHtcbiAgICAgICAgICAgIGFubm9zID0gYW5ub3MuY29uY2F0KGFubm90YXRvci5nZXRBbm5vdGF0aW9ucyh7XG4gICAgICAgICAgICAgICAgbW9kaWZpZWRPbmx5IDogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXhjbHVkZURlbGV0ZWQgOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXhwb3J0aW5nIFwiICsgYW5ub3MubGVuZ3RoICsgXCIgYW5ub3RhdGlvbnNcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKGFubm9zKTtcblxuICAgICAgICBjb25zdCBkYXRhU3RyID0gXCJkYXRhOnRleHQvanNvbjtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGFubm9zKSk7XG4gICAgICAgIGNvbnN0IGRvd25sb2FkQW5jaG9yTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgZG93bmxvYWRBbmNob3JOb2RlLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgICAgIGRhdGFTdHIpO1xuICAgICAgICBkb3dubG9hZEFuY2hvck5vZGUuc2V0QXR0cmlidXRlKFwiZG93bmxvYWRcIiwgYW5ub3RhdGlvbl9maWxlX3ByZWZpeCArIFwiYW5ub3RhdGlvbnMuanNvblwiKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkb3dubG9hZEFuY2hvck5vZGUpOyAvLyByZXF1aXJlZCBmb3IgZmlyZWZveFxuICAgICAgICBkb3dubG9hZEFuY2hvck5vZGUuY2xpY2soKTtcbiAgICAgICAgZG93bmxvYWRBbmNob3JOb2RlLnJlbW92ZSgpO1xuXG4gICAgICAgIGFsZXJ0KFwiRXhwb3J0ZWQgYSB0b3RhbCBvZiBcIiArIGFubm9zLmxlbmd0aCArIFwiIGFubm90YXRpb25zXCIpO1xuXG4gICAgfSk7XG5cbn1cblxuLy8gUGFyc2UgdGhlIGNhdGVnb3J5IGlkcyBwcm92aWRlZCBieSB0aGUgdXNlci5cbmZ1bmN0aW9uIGdldFF1aWNrQWNjZXNzQ2F0ZWdvcnlJRHMoKXtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCByYXdDYXRJRHMgPSAkLnRyaW0oZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlYXN5QWNjZXNzQ2F0ZWdvcmllc1wiKS52YWx1ZSk7XG5cbiAgICBsZXQgY2F0X2lkczogc3RyaW5nW10gfCBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBzdHJfY2F0X2lkcztcblxuICAgIGlmIChyYXdDYXRJRHMgIT09IFwiXCIpIHtcblxuICAgICAgICBzdHJfY2F0X2lkcyA9IHJhd0NhdElEcy5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdXNlc3RySURzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYXRlZ29yeUlEVHlwZVJhZGlvU3RyXCIpLmNoZWNrZWQ7XG5cbiAgICAgICAgaWYgKHVzZXN0cklEcyl7XG4gICAgICAgICAgICBjYXRfaWRzID0gc3RyX2NhdF9pZHM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpyYWRpeFxuICAgICAgICAgICAgY2F0X2lkcyA9IHN0cl9jYXRfaWRzLm1hcChjYXRfaWQgPT4gcGFyc2VJbnQoY2F0X2lkKSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiBjYXRfaWRzO1xuXG59XG5cbi8qICBBbGxvd3MgdGhlIHVzZXIgdG8gY2hvb3NlIGEgZGlyZWN0b3J5LlxuICpcbiAqL1xubGV0IGkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY3VzdG9tRmlsZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChldikgPT4ge1xuXG4gICAgZXYucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGxvY2FsX2ltYWdlX2RhdGE6IEFycmF5PHsgaWQ6IGFueTsgdXJsOiBhbnk7IGF0dHJpYnV0aW9uOiBzdHJpbmc7IH0+ID0gW107XG5cbiAgICBsZXQgaW1hZ2VfanNvbl9wcm9taXNlID0gbnVsbDtcbiAgICBsZXQgY2F0ZWdvcnlfanNvbl9wcm9taXNlID0gbnVsbDtcbiAgICBsZXQgYW5ub3RhdGlvbl9qc29uX3Byb21pc2UgPSBudWxsO1xuICAgIGxldCBjb25maWdfanNvbl9wcm9taXNlID0gbnVsbDtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgZXYudGFyZ2V0LmZpbGVzLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBpdGVtID0gZXYudGFyZ2V0LmZpbGVzW2ldO1xuXG4gICAgICAgIC8vIElzIHRoaXMgYW4gaW1hZ2U/XG4gICAgICAgIGlmIChpdGVtLnR5cGUgPT09IFwiaW1hZ2UvanBlZ1wiIHx8IGl0ZW0udHlwZSA9PT0gXCJpbWFnZS9wbmdcIil7XG5cbiAgICAgICAgICAgIGNvbnN0IGltYWdlX2lkID0gaXRlbS5uYW1lLnNwbGl0KCcuJylbMF07XG5cbiAgICAgICAgICAgIGxvY2FsX2ltYWdlX2RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQgOiBpbWFnZV9pZCxcbiAgICAgICAgICAgICAgICB1cmw6IGl0ZW0ud2Via2l0UmVsYXRpdmVQYXRoLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0aW9uIDogXCJOL0FcIlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElzIHRoaXMgYSBqc29uIGZpbGU/XG4gICAgICAgIGVsc2UgaWYoaXRlbS50eXBlID09PSBcImFwcGxpY2F0aW9uL2pzb25cIikge1xuXG4gICAgICAgICAgICBpZiAoaXRlbS5uYW1lID09PSAnaW1hZ2VzLmpzb24nKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VfanNvbl9wcm9taXNlID0gaXRlbS50ZXh0KCkudGhlbigodGV4dDogc3RyaW5nKSA9PiBKU09OLnBhcnNlKHRleHQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxzZSBpZiAoaXRlbS5uYW1lID09PSAnY2F0ZWdvcmllcy5qc29uJykge1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5X2pzb25fcHJvbWlzZSA9IGl0ZW0udGV4dCgpLnRoZW4oKHRleHQ6IHN0cmluZykgPT4gSlNPTi5wYXJzZSh0ZXh0KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsc2UgaWYgKGl0ZW0ubmFtZS5pbmNsdWRlcygnYW5ub3RhdGlvbnMuanNvbicpKSB7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9qc29uX3Byb21pc2UgPSBpdGVtLnRleHQoKS50aGVuKCh0ZXh0OiBzdHJpbmcpID0+IEpTT04ucGFyc2UodGV4dCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIGlmIChpdGVtLm5hbWUgPT09ICdjb25maWcuanNvbicpIHtcbiAgICAgICAgICAgICAgICBjb25maWdfanNvbl9wcm9taXNlID0gaXRlbS50ZXh0KCkudGhlbigodGV4dDogc3RyaW5nKSA9PkpTT04ucGFyc2UodGV4dCkgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJZ25vcmluZyBcIiArIGl0ZW0ubmFtZSArIFwiIChub3Qgc3VyZSB3aGF0IHRvIGRvIHdpdGggaXQpLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIklnbm9yaW5nIFwiICsgaXRlbS5uYW1lICsgXCIgKG5vdCBzdXJlIHdoYXQgdG8gZG8gd2l0aCBpdCkuXCIpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciBhbGwgdGhlIGZpbGUgbG9hZGluZyB0byBmaW5pc2hcbiAgICBQcm9taXNlLmFsbChbaW1hZ2VfanNvbl9wcm9taXNlLCBjYXRlZ29yeV9qc29uX3Byb21pc2UsIGFubm90YXRpb25fanNvbl9wcm9taXNlLCBjb25maWdfanNvbl9wcm9taXNlXSkudGhlbihcbiAgICAgICAgKFtpbWFnZV9kYXRhLCBjYXRlZ29yeV9kYXRhLCBhbm5vdGF0aW9uX2RhdGEsIGNvbmZpZ19kYXRhXSkgPT4ge1xuXG4gICAgICAgICAgICBpZiAobG9jYWxfaW1hZ2VfZGF0YS5sZW5ndGggPiAwICYmIGltYWdlX2RhdGEgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJFUlJPUjogRm91bmQgaW1hZ2UgZmlsZXMgKGpwZ3MvIHBuZ3MpIGFuZCBhbiBpbWFnZXMuanNvbiBmaWxlLiBOb3Qgc3VyZSB3aGljaCB0byB1c2UhIFBsZWFzZSByZW1vdmUgb25lIG9yIHRoZSBvdGhlci5cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobG9jYWxfaW1hZ2VfZGF0YS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBpbWFnZV9kYXRhID0gbG9jYWxfaW1hZ2VfZGF0YTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGxvYWRlZCBpbiBpbWFnZXMgZnJvbSB0aGUgZmlsZSBzeXN0ZW0sIHRoZW4gYXNzdW1lIHdlIHNob3VsZCBzb3J0IGJ5IGZpbGVuYW1lXG4gICAgICAgICAgICAgICAgaW1hZ2VfZGF0YS5zb3J0KChhOiB7IHVybDogc3RyaW5nOyB9LCBiOiB7IHVybDogc3RyaW5nOyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5hbWVBID0gYS51cmwudG9VcHBlckNhc2UoKTsgLy8gaWdub3JlIHVwcGVyIGFuZCBsb3dlcmNhc2VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZUIgPSBiLnVybC50b1VwcGVyQ2FzZSgpOyAvLyBpZ25vcmUgdXBwZXIgYW5kIGxvd2VyY2FzZVxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZUEgPCBuYW1lQikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lQSA+IG5hbWVCKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5hbWVzIG11c3QgYmUgZXF1YWxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhdGVnb3J5X2RhdGEgPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgYWxlcnQoXCJEaWRuJ3QgZmluZCBhIGNhdGVnb3J5Lmpzb24gZmlsZS4gVGhpcyBuZWVkcyB0byBiZSBjcmVhdGVkLlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERpZCB3ZSBmaW5kIGFueSBleGlzdGluZyBhbm5vdGF0aW9ucyBmb3IgdGhlIGltYWdlcz9cbiAgICAgICAgICAgIGlmIChhbm5vdGF0aW9uX2RhdGEgPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbl9kYXRhID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERpZCB0aGUgdXNlciBzcGVjaWZ5IGFueSBxdWljayBhY2Nlc3MgY2F0ZWdvcnkgaWRzP1xuICAgICAgICAgICAgY29uc3QgcXVpY2tBY2Nlc3NDYXRJRHMgPSBnZXRRdWlja0FjY2Vzc0NhdGVnb3J5SURzKCk7XG5cbiAgICAgICAgICAgIC8vIERpZCB3ZSBnZXQgYSBjb25maWcgZmlsZT9cbiAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRfY29uZmlnID0ge1xuICAgICAgICAgICAgICAgIFwiYW5ub3RhdGlvbkZpbGVQcmVmaXhcIiA6IFwiXCIsXG4gICAgICAgICAgICAgICAgXCJxdWlja0FjY2Vzc0NhdGVnb3J5SURzXCIgOiBxdWlja0FjY2Vzc0NhdElEcyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoY29uZmlnX2RhdGEgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgY29uZmlnX2RhdGEgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0X2NvbmZpZywgY29uZmlnX2RhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBjb25maWdfZGF0YSA9IGRlZmF1bHRfY29uZmlnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBkaXJlY3RvcnkgY2hvb3NlciBmb3JtLCBhbmQgc2hvdyB0aGUgYW5ub3RhdGlvbiB0YXNrXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpckNob29zZXJcIikuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5ub3RhdGlvblRhc2tcIikuaGlkZGVuID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHN0YXJ0QW5ub3RhdGluZyhpbWFnZV9kYXRhLCBjYXRlZ29yeV9kYXRhLCBhbm5vdGF0aW9uX2RhdGEsIGNvbmZpZ19kYXRhKTtcblxuICAgICAgICB9KTtcblxufSk7XG5cbi8vIFRyeSB0byBtYWtlIHN1cmUgdGhlIHVzZXIgaXMgaW4gQ2hyb21lXG4vLyBTZWUgaGVyZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEzMzQ4NjE4LzExMzM3NjA4XG4vLyBwbGVhc2Ugbm90ZSxcbi8vIHRoYXQgSUUxMSBub3cgcmV0dXJucyB1bmRlZmluZWQgYWdhaW4gZm9yIHdpbmRvdy5jaHJvbWVcbi8vIGFuZCBuZXcgT3BlcmEgMzAgb3V0cHV0cyB0cnVlIGZvciB3aW5kb3cuY2hyb21lXG4vLyBidXQgbmVlZHMgdG8gY2hlY2sgaWYgd2luZG93Lm9wciBpcyBub3QgdW5kZWZpbmVkXG4vLyBhbmQgbmV3IElFIEVkZ2Ugb3V0cHV0cyB0byB0cnVlIG5vdyBmb3Igd2luZG93LmNocm9tZVxuLy8gYW5kIGlmIG5vdCBpT1MgQ2hyb21lIGNoZWNrXG4vLyBzbyB1c2UgdGhlIGJlbG93IHVwZGF0ZWQgY29uZGl0aW9uXG5cbi8vIEB0cy1pZ25vcmVcbmNvbnN0IGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lO1xuY29uc3Qgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcjtcbmNvbnN0IHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yO1xuLy8gQHRzLWlnbm9yZVxuY29uc3QgaXNPcGVyYSA9IHR5cGVvZiB3aW5kb3cub3ByICE9PSBcInVuZGVmaW5lZFwiO1xuY29uc3QgaXNJRWVkZ2UgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoXCJFZGdlXCIpID4gLTE7XG5jb25zdCBpc0lPU0Nocm9tZSA9IHdpbk5hdi51c2VyQWdlbnQubWF0Y2goXCJDcmlPU1wiKTtcblxuaWYgKGlzSU9TQ2hyb21lKSB7XG4vLyBpcyBHb29nbGUgQ2hyb21lIG9uIElPU1xuICAgIGFsZXJ0KFwiVGhpcyB0b29sIGlzIG5vdCB0ZXN0ZWQgZm9yIGlPUyBlbnZpcm9ubWVudHNcIik7XG5cbn0gZWxzZSBpZihcbmlzQ2hyb21pdW0gIT09IG51bGwgJiZcbnR5cGVvZiBpc0Nocm9taXVtICE9PSBcInVuZGVmaW5lZFwiICYmXG52ZW5kb3JOYW1lID09PSBcIkdvb2dsZSBJbmMuXCIgJiZcbmlzT3BlcmEgPT09IGZhbHNlICYmXG5pc0lFZWRnZSA9PT0gZmFsc2Vcbikge1xuLy8gaXMgR29vZ2xlIENocm9tZVxufSBlbHNlIHtcbi8vIG5vdCBHb29nbGUgQ2hyb21lXG4gICAgYWxlcnQoXCJUaGlzIHRvb2wgbmVlZHMgdG8gYmUgb3BlbmVkIHdpdGggR29vZ2xlIENocm9tZS5cIik7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9