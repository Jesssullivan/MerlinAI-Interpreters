import React from 'react';
import $ from 'jquery';
import L from 'leaflet';

import {PaintPolygon} from './annotator/paint_polygon/PaintPolygon.js';
import {COLORS,BOX_PATH_STYLE} from "./annotator/defaults.js";
import {uuidv4} from "./annotator/utils.js";

import {AnnotationInstance} from "./annotator/annotation_instance.jsx";
import {AnnotationSidebar} from "./annotator/annotation_sidebar.jsx";
import {CategorySelection} from "./annotator/category_selection.jsx";
import {ImageInfo} from "./annotator/image_info.jsx";
import {MLAudioInfo} from "./annotator/macaulay_asset_info.jsx";

import "./annotator/Leaflet.annotation.css";


// TODO: @Jess: fix coercion warning (== --> ===)


// This is need to add call the init hooks to bring in the edit functionality
// E.g. see https://github.com/Leaflet/Leaflet.draw/blob/develop/src/edit/handler/Edit.Rectangle.js#L117
import Draw from 'leaflet-draw';

// Similar to Draw, this is needed to call the init hooks.
// This is the segmentation tool.

/**
 * Required Properties:
 * image : Object
 * imageElement : Image()
 * annotations : [Object]
 * categories : [Object]
 *
 * Not Required Properties:
 * options: {}
*/
let defaultOptions = {
    enableEditingImmediately : false,
    enableHotKeysImmediately : false,

    // Map Config
    map : {
        attributionControl : true,
        zoomControl : true,
        boxZoom : true,
        doubleClickZoom : true,
        keyboard : true,
        scrollWheelZoom : true
    },

    // Category Config
    showCategory : true, // Show the category in the AnnotationSidebar
    showSupercategory: true, // Show the supercategory in the AnnotationSidebar
    showIsCrowdCheckbox: true, // Show the a check box to mark an annotation as a crowd

    allowCategoryEdit : true, // Can the category label be edited?
    allowCategoryRemoval : true, // Can the category label be removed? (Leaving on the supercategory)

    allowSupercategoryEdit : true, // Can the supercategory be edited? (This removes the category_id)
    allowSupercategoryRemoval : false, // Can the supercategory be removed? (Leaving neither category_id nor supercategory)

    quickAccessCategoryIDs : [], // The category ids that should show up immediately when adding a new category. Note that this is not supercategories.

    // New Instance Config
    newInstance: {
        annotateCategory: true, // when creating a new instance, should the user first choose a category and then box? This takes priority over `annotateSupercategory`
        annotateSupercategory: false, // when creating a new instance, should the user first choose a supercategory and then box?
        annotationType: 'box' // the type of annotation to perform
    },

    // Box Config
    enableBoxEdit : true,
    renderBoxes : true,
    boxColors : COLORS,
    boxPathStyle: BOX_PATH_STYLE,

    // Instance Duplication on Right Click
    duplicateInstance : {
        enable : true,
        duplicateY : false // should the y values be duplicated (for annotating a spectrogram)
    },

    // Segmentation Config
    enableSegmentationEdit : true,
    renderSegmentations : true,

    // Image Information rendered under the Map
    imageInfoComponent : ImageInfo,

    // Callback for after Leaflet has been rendered
    didMountLeafletCallback : null,
    didFocusOnAnnotationCallback : null
}

export class Annotator_tool extends React.Component {

    constructor(props) {
        super(props);

        this.options = $.extend(true, {}, defaultOptions, this.props.options);

        // Add fields to the annotations
        // GVH: Perhaps this should be done by the parent?
        var annotations = this.props.annotations.map(annotation => {
            annotation._modified = false;
            annotation._created = false;
            return annotation;
        });

        this.state = {
            annotations : annotations, // Current state of the annotations
            annotating : false, // Are we currently anntating something?
            selectingCategory : false, // Should we show the category selection component?
            selectingCategoryForNewInstance : false // Is the category we are selecting for a new instance or an existing one?
        };



        /*
        ************************************************
        * Properties that will be set on ourself
        */

        this.leafletMap = null; // a pointer to the leaflet map object
        this.imageWidth = null; // the width in pixels that the image is rendered at
        this.imageHeight = null; // the hight in pixels that the image is rendered at
        this.annotationFeatures = null; // A L.FeatureGroup() that will hold the annotation layers
        this.editor = null; // A L.EditToolbar.Edit() Handler that will allow us enable and disable editing
        // This will hold the leaflet layers that correspond to the annotations stored in `this.state.annotations`
        // It is a mirror of this.state.annotations
        this.annotation_layers = null;

        // State maintained when drawing
        this.drawState = {
            drawer : null,
            drawSuccessfullyCreated : null,
            type : null,
            bbox_crosshairs : null,
            isNewInstance : null, // Are we drawing a box for a brand new instance? Or an existing instance?
            annotationIndex: null // The index of the annotation we are currently annotating (if not a new instance)
        };

        // State maintained when doing category selection
        this.categorySelectionState = {
            category_index : null, // the index of the category that was selected
            annotationIndex : null, // the index of the annotation that we are modifying,
            type: null // either 'category' or 'supercategory'
        }

        // When focusing on an annotation, do we allow the map to zoom?
        this.allowZoomWhenFocusing = true;

        /*
        ************************************************
        */


        // Initialize the category data structure
        this.categoryMap = {};
        var supercategorySet = new Set();
        for(var i = 0; i < this.props.categories.length; i++){
            var category = this.props.categories[i]
            this.categoryMap[category.id] = category;

            if (category.supercategory != 'undefined' && category.supercategory != null){
                supercategorySet.add(category.supercategory);
            }
        }
        this.supercategoryList = Array.from(supercategorySet);

        // Callback Bindings
        this.handleCreateNewIndividual = this.handleCreateNewIndividual.bind(this);
        this.handleShowAllAnnotations = this.handleShowAllAnnotations.bind(this);
        this.handleHideAllAnnotations = this.handleHideAllAnnotations.bind(this);

        this.bboxCursorUpdate = this.bboxCursorUpdate.bind(this);

        this.handleCategorySelected = this.handleCategorySelected.bind(this);
        this.handleCategoryRemoved = this.handleCategoryRemoved.bind(this);
        this.handleCategorySelectionCancelled = this.handleCategorySelectionCancelled.bind(this);

        this.handleAnnotationDelete = this.handleAnnotationDelete.bind(this);
        this.handleAnnotationFocus = this.handleAnnotationFocus.bind(this);
        this.handleHideOtherAnnotations = this.handleHideOtherAnnotations.bind(this);
        this.handleAnnotationCategoryChange = this.handleAnnotationCategoryChange.bind(this);
        this.handleAnnotationSupercategoryChange = this.handleAnnotationSupercategoryChange.bind(this);
        this.handleAnnotationIsCrowdChange = this.handleAnnotationIsCrowdChange.bind(this);
        this.handleAnnotationDrawBox = this.handleAnnotationDrawBox.bind(this);

        this.handleAnnotationDoSegmentation = this.handleAnnotationDoSegmentation.bind(this);
        this.handleAnnotationDeleteSegmentation = this.handleAnnotationDeleteSegmentation.bind(this);
        this.handleSegmentationFinished = this.handleSegmentationFinished.bind(this);

        this.handleKeyDown = this.handleKeyDown.bind(this);

    }

    /**
     * Runs after the component output has been rendered to the DOM.
     * Initialize the leaflet map and add the annotations.
    */
    componentDidMount(){
        // Create the leaflet map
        this.leafletMap = L.map(this.leafletHolderEl, {
            center : [0, 0],
            zoom : 0,
            crs: L.CRS.Simple,
            maxBoundsViscosity : 0.5,
            drawControlTooltips : false,
            attributionControl : this.options.map.attributionControl,
            zoomControl : this.options.map.zoomControl,
            boxZoom : this.options.map.boxZoom,
            doubleClickZoom : this.options.map.doubleClickZoom,
            keyboard : this.options.map.keyboard | false,
            scrollWheelZoom : this.options.map.scrollWheelZoom,
            zoomSnap: 0
        });

        const leafletMap = this.leafletMap;

        // Determine the resolution that the image will be rendered at
        let pixel_bounds = leafletMap.getPixelBounds();
        let maxWidth = pixel_bounds.max.x - pixel_bounds.min.x;
        let maxHeight = pixel_bounds.max.y - pixel_bounds.min.y;

        let imageWidth = this.props.imageElement.width;
        let imageHeight = this.props.imageElement.height;

        let ratio = [maxWidth / imageWidth, maxHeight / imageHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

        let height = ratio * imageHeight;
        let width = ratio * imageWidth;

        // Save off the resolution of the image, we'll need this
        // for scaling the normalized annotations
        this.imageWidth = width;
        this.imageHeight = height;

        // Restrict the map to the image bounds
        let southWest = leafletMap.unproject([0, height], leafletMap.getMinZoom());
        let northEast = leafletMap.unproject([width, 0], leafletMap.getMinZoom());
        let bounds = new L.LatLngBounds(southWest, northEast);

        // The order of these calls matter!
        leafletMap.fitBounds(bounds, {
            animate: false,
            duration: 0
        });
        leafletMap.setMaxBounds(bounds);

        // Render the image on the map
        L.imageOverlay(this.props.imageElement.src, bounds).addTo(leafletMap);

        // Add the feature group that will hold the annotations
        // All layers added to this feature group will be editable
        this.annotationFeatures = new L.FeatureGroup().addTo(leafletMap);

        // Initialize the editor
        this.editor = new L.EditToolbar.Edit(leafletMap, {featureGroup : this.annotationFeatures});

        // set up the event listeners
        // Drawing / Editing Events
        leafletMap.on('draw:drawstart', this._drawStartEvent, this);
        leafletMap.on('draw:drawstop', this._drawStopEvent, this);
        leafletMap.on('draw:created', this._drawCreatedEvent, this);
        leafletMap.on('draw:editmove', this._layerMoved, this);
        leafletMap.on('draw:editresize', this._layerResized, this);

        // Click events
        leafletMap.on('contextmenu', this._handleLeaftletContextMenu, this);

        // We'll use this list to mirror the json annotations
        this.annotation_layers = [];
        // Add the annotations
        for(var i=0; i < this.state.annotations.length; i++){
            this.annotation_layers.push(this.addAnnotation(this.state.annotations[i], i));
        }

        if (this.options.enableEditingImmediately){
            this.enableEditing();
        }
        if (this.options.enableHotKeysImmediately){
            this.enableHotKeys();
        }

        // Rerender
        this.setState(this.state);

        if(this.props.options.didMountLeafletCallback != null){
            this.props.options.didMountLeafletCallback(this);
        }

    }

    /**
     * Try to clean up after ourselves.
    */
    componentWillUnmount(){
        this.leafletMap.remove();
    }

    componentDidUpdate(prevProps, prevState, snapshot){

    }

    /****************/
    /** Progammatic Map Move Events **/

    /**
     * Set up the interface for annotating a spectrogram.
     * We want to:
     *      1. Zoom the spectrogram so that it's height is `targetHeight`
     *      2. Add padding around the spectrogram so that it "starts" in the center "finishes" in the center
     *      3. Compute the image-pixel to map-pixel scale conversion so that we can pan appropriately.
     */
    renderForSpectrogram(targetHeight=400){

        // NOTE: Make sure to set `zoomSnap : 0` in the Leaflet Map constructor in order to allow for arbitrary zooming.

        // The size of map
        let view_size = this.leafletMap.getSize();
        let view_width = view_size.x;
        let view_height = view_size.y;

        // The size of the image
        let image_width = this.props.imageElement.width;
        let image_height = this.props.imageElement.height;

        // The size of the scaled image
        let scaled_image_width = this.imageWidth;
        let scaled_image_height = this.imageHeight;

        let ratioMapPixelToImagePixel = Math.min(view_width / image_width, view_height / image_height);

        let factor = (targetHeight / image_height) / ratioMapPixelToImagePixel;
        let zoom = Math.log(factor) / Math.log(2);
        let center = this.leafletMap.unproject([0, image_height / 2], zoom);

        let boundaryWidth = (view_width / 2.0) / factor;
        let southWest = this.leafletMap.unproject([-boundaryWidth, scaled_image_height], 0);
        let northEast = this.leafletMap.unproject([scaled_image_width + boundaryWidth, 0], 0);
        let bounds = new L.LatLngBounds(southWest, northEast);

        this.leafletMap.setMaxBounds(bounds);
        this.leafletMap.setView(center, zoom, {animate : false});

        // A scalar factor that we need to multiply pixel coordinates by in order to get map coordinates.
        // See `panTo`
        this.specFactor = targetHeight / image_height;

    }

    fillMapPrev(){

        // NOTE: Make sure to set zoomSnap to 0 in order for the math to work out

        // Assume that the image is longer than it is wide (like a spectrogram)
        // We want to set the current view to contain the whole height

        // The size of map
        let view_size = this.leafletMap.getSize();
        let view_width = view_size.x;
        let view_height = view_size.y;

        // The size of the image
        let image_width = this.props.imageElement.width;
        let image_height = this.props.imageElement.height;

        // The size of the scaled image
        let scaled_image_width = this.imageWidth;
        let scaled_image_height = this.imageHeight;


        // Latitude = y
        // Longitude = x
        // Point(x, y)
        // LatLng

        // The bottom left corner of the map bounds should correspond to the bottom left of the image:
        // x=0
        // y=scaled_image_height
        var southWest = this.leafletMap.unproject([0, scaled_image_height], this.leafletMap.getMinZoom());

        // The top right corner of the map bounds should be at:
        // x= ratio of the (height / width) x map view size
        // y=0
        let p = view_width * (image_height / image_width) * (view_width / view_height);
        var northEast = this.leafletMap.unproject([p, 0], this.leafletMap.getMinZoom());

        // Set the view of the map to these bounds
        var bounds = new L.LatLngBounds(southWest, northEast);
        this.leafletMap.fitBounds(bounds);

        // In addition we want to allow the image to scoll all the way to the left.
        // So we need to update the max bounds of the map to allow for this
        // the bottom left bound point is still the same:
        southWest = this.leafletMap.unproject([-1, scaled_image_height], this.leafletMap.getMinZoom());

        // the upper right bound point needs to be extended so that we can scroll the image to the left edge
        northEast = this.leafletMap.unproject([scaled_image_width + p, 0], this.leafletMap.getMinZoom());
        bounds = new L.LatLngBounds(southWest, northEast);
        this.leafletMap.setMaxBounds(bounds);


        // Store what a "pixel" means in terms of translating one image pixel
        this.ratioMapPixelToImagePixel = view_height / image_height;
        //this.specZoom = zoom;
    }


    turnOffDrag(){

        this.leafletMap.dragging.disable();

    }

    turnOffZoom(){

        this.leafletMap.touchZoom.disable();
        this.leafletMap.doubleClickZoom.disable();
        this.leafletMap.scrollWheelZoom.disable();

        this.allowZoomWhenFocusing = false;

    }

    // panBy(image_offset){

    //     // We want to pan by a pixel in the image space.
    //     // So we need to convert to the number of map pixels.
    //     var map_offset = image_offset / this.ratioMapPixelToImagePixel;

    //     this.leafletMap.panBy([map_offset, 0],
    //         {
    //             "animate" : false
    //         }
    //     );

    // }

    panTo(x){
        /* x is in pixels.
        */

        //let mapX = x * this.ratioMapPixelToImagePixel;
        let image_height = this.props.imageElement.height;
        let zoom = this.leafletMap.getZoom();
        let center = this.leafletMap.unproject([x * this.specFactor, image_height / 2], zoom);
        //let center = this.leafletMap.unproject([x * 2, image_height / 2], zoom);
        // this.leafletMap.setView(center, zoom, {
        //     "animate" : false
        // });
        this.leafletMap.panTo(center, {
            "animate" : false
        });

    }


    // addVerticalLine(x_loc){

    //     var latlngs = [
    //         this.leafletMap.unproject([x_loc, this.imageHeight], this.leafletMap.getMinZoom()),
    //         this.leafletMap.unproject([x_loc, 0], this.leafletMap.getMinZoom()),
    //     ];
    //     var veritcal_line = L.polyline(latlngs, {color: 'red'}).addTo(this.leafletMap);

    // }



    /**
     * Allow all annotation layers to be edited.
     */
    enableEditing(){
        this.editor.enable();
        // Remove the edit styling for the markers.
        $( ".leaflet-marker-icon" ).removeClass( "leaflet-edit-marker-selected" );
    }

    /**
     * Prevent annotations from being annotated
     */
    disableEditing(){
        this.editor.disable();
    }

    enableHotKeys(){
        // Register keypresses
        document.addEventListener("keydown", this.handleKeyDown);
    }

    disableHotKeys(){
        // Unregister keypresses
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    handleKeyDown(e){

        let ESCAPE_KEY = 27; // Quit / Cancel annotation
        let S_KEY = 83; // Save annotations
        let N_KEY = 78; // New instance
        let V_KEY = 86; // Toggle visibility
        let H_KEY = 72; // Toggle hide all

        //console.log("key down " + e.keyCode);

        switch(e.keyCode){
            case ESCAPE_KEY:
                if(this.state.annotating){
                    this.cancelAnnotation();
                }
                break;
            case S_KEY:
                break;
            case N_KEY:
                break;
            case V_KEY:
                break;
            case H_KEY:
                break;
        }

    }


    /**
     * Create a path style for a box.
     * See: https://leafletjs.com/reference-1.6.0.html#path
     */
    getBoxPathStyle(index){
        let options = this.options;
        let color = options.boxColors[index % options.boxColors.length];
        let pathStyle = $.extend(true, {}, options.boxPathStyle);
        pathStyle['color'] = color;
        pathStyle['fillColor'] = color;

        return pathStyle;
    }

    createBoxLayer(box, pathStyle){

    }

    /**
     * Add an annotation to the image. This will render the bbox and keypoint annotations.
     * @param {*} annotation
     * @param {*} annotationIndex
     */
    addAnnotation(annotation, annotationIndex) {

        let leafletMap = this.leafletMap;
        let imageWidth = this.imageWidth;
        let imageHeight = this.imageHeight;

        let options = this.options;

        // Store the layers for this annotation, this is the return value
        // This will eventually store keypoints, segmentations, etc.
        var layers = {
          'bbox' : null,
          'segmentation' : null,
        };

        if (options.renderBoxes){

            // Add the bounding box
            if(annotation.bbox != 'undefined' && annotation.bbox != null){

                let pathStyle = this.getBoxPathStyle(annotationIndex);

                var [x, y, w, h] = annotation.bbox;
                let x1 = x * imageWidth;
                let y1 = y * imageHeight;
                let x2 = (x + w) * imageWidth;
                let y2 = (y + h) * imageHeight;
                let bounds = L.latLngBounds(leafletMap.unproject([x1, y1], 0), leafletMap.unproject([x2, y2], 0));
                let layer = L.rectangle(bounds, pathStyle);

                layer.modified = false;

                this.addLayer(layer);
                layers.bbox = layer;

            }

        }

        if (options.renderSegmentations){
            if(annotation.segmentation != undefined && annotation.segmentation != null){

                // A bit hacky... is there some transform class we can use?

                let normalized_polygons = annotation.segmentation;

                // Convert the polygon to unnormalized polygons in map space
                var unnormalized_polygons = [];
                normalized_polygons.forEach(normed_polygon_coords => {

                    // Each polygon is a list of rings.
                    var unnormed_ring_coords = [];
                    normed_polygon_coords.forEach(normed_ring_coords => {

                        // Get the normed coordinates of each ring.
                        let unnormed_coords = [];
                        normed_ring_coords.forEach(x_y_coord => {

                            // Scale by the image dimensions
                            let x = x_y_coord[0] * imageWidth;
                            let y = x_y_coord[1] * imageHeight;

                            let latlng = leafletMap.unproject([x, y], 0);

                            unnormed_coords.push([latlng.lng, latlng.lat]);
                        });
                        unnormed_ring_coords.push(unnormed_coords);
                    });
                    unnormalized_polygons.push(unnormed_ring_coords);
                });

                let feature = {
                    type: "Feature",
                    geometry: {
                        type : "MultiPolygon",
                        coordinates : unnormalized_polygons
                    }
                };

                let layer = L.geoJSON(feature, {}).addTo(leafletMap);
                layer.modified = false;

                layers.segmentation = layer;

            }
        }

        return layers;

    }

    /**
     * Add an annotation layer to the leaflet map.
     * @param {*} layer
     */
    addLayer(layer){
        if(layer != undefined && layer != null){
            if(!this.annotationFeatures.hasLayer(layer)){
                this.annotationFeatures.addLayer(layer);

                // Remove the edit styling for the markers.
                $( ".leaflet-marker-icon" ).removeClass( "leaflet-edit-marker-selected" );
          }
        }
    }

    /**
     * Remove an annotation layer from the leaflet map.
     * @param {*} layer
     */
    removeLayer(layer){

        if(layer != undefined && layer != null){
            if(this.annotationFeatures.hasLayer(layer)){
                this.annotationFeatures.removeLayer(layer);
            }
        }

    }

    /**
     * Add segmentation layers directly to the map instead of annotationFeatures.
     * We do this because editing segmentations requires the painting interface,
     * as opposed to the Leaflet.Draw interface.
     */
    addSegmentationLayer(layer){
        if(layer != undefined && layer != null){
            if(!this.leafletMap.hasLayer(layer)){
                this.leafletMap.addLayer(layer);
            }
        }
    }

    /**
     * Segmentation layers are not currently part of this.annotationFeatures,
     * they are added directly to the map.
     */
    removeSegmentationLayer(layer){
        if(layer != undefined && layer != null){
            if(this.leafletMap.hasLayer(layer)){
                this.leafletMap.removeLayer(layer);
            }
        }
    }

    /**
     * Translate the point (if needed) so that it lies within the image bounds
     * @param  {[type]} x [description]
     * @param  {[type]} y [description]
     * @return {[type]}   [description]
     */
    restrictPointToImageBounds(x, y){

        if(x > this.imageWidth){
            x = this.imageWidth;
        }
        else if(x < 0){
            x = 0;
        }
        if (y > this.imageHeight){
            y = this.imageHeight;
        }
        else if(y < 0){
            y = 0;
        }

        return [x, y];

    }

    /**
     * Clip the layer to be inside the image.
     */
    clipRectangleLayerToImageBounds(layer){

        var bounds = layer.getBounds();
        var point1 = this.leafletMap.project(bounds.getNorthWest(), 0);
        var point2 = this.leafletMap.project(bounds.getSouthEast(), 0);

        var x1 = point1.x;
        var y1 = point1.y;
        var x2 = point2.x;
        var y2 = point2.y;

        [x1, y1] = this.restrictPointToImageBounds(x1, y1);
        [x2, y2] = this.restrictPointToImageBounds(x2, y2);

        // Is one of the dimensions 0?
        var valid=true;
        if(x2 - x1 <= 0){
            return null;
        }
        else if(y2 - y1 <= 0){
            return null;
        }

        point1 = L.point(x1, y1);
        point1 = this.leafletMap.unproject(point1, 0);
        point2 = L.point(x2, y2);
        point2 = this.leafletMap.unproject(point2, 0);

        bounds = [point1, point2];
        return L.rectangle(bounds, layer.options);

    }

    /**
     * Restrict a segmentation layer to be inside the image bounds.
     */
    clipSegmentationLayerToImageBounds(layer){

    }


    /**
     * Show this annotation.
     * @param {*} annotation
     * @param {*} annotation_layer
     */
    showAnnotation(annotation, annotation_layer){

        // Show the bounding box
        if(annotation_layer['bbox'] != 'undefined' && annotation_layer['bbox'] != null){
            let layer = annotation_layer['bbox'];
            this.addLayer(layer);
        }

        // Show the segmentation
        if(annotation_layer.segmentation != undefined && annotation_layer.segmentation != null){
            let layer = annotation_layer.segmentation;
            this.addSegmentationLayer(layer);
        }

    }

    /**
     * Hide this annotation.
     * @param {*} annotation
     * @param {*} annotation_layer
     */
    hideAnnotation(annotation, annotation_layer){

        // Hide the bounding box for this annotation
        if(annotation_layer['bbox'] != 'undefined' && annotation_layer['bbox'] != null){
            let layer = annotation_layer['bbox'];
            this.removeLayer(layer);
        }

        // Hide the segmentation
        if(annotation_layer.segmentation != undefined && annotation_layer.segmentation != null){
            let layer = annotation_layer.segmentation;
            this.removeSegmentationLayer(layer);
        }

    }

    /**
     * Allow the user to draw a bbox.
     */
    annotateBBox({
        isNewInstance = false,
        annotationIndex = null
    }={}){

        let index = annotationIndex != null ? annotationIndex : this.state.annotations.length;
        let pathStyle = this.getBoxPathStyle(index);

        let drawer = new L.Draw.Rectangle(this.leafletMap, {
          shapeOptions : pathStyle,
          showArea : false,
          metric : false
        });

        this.drawState = {
            drawer : drawer,
            drawSuccessfullyCreated : false,
            type : 'box',
            isNewInstance: isNewInstance,
            annotationIndex: annotationIndex
        }

        drawer.enable();

        this.setState({
            'annotating' : true,
        });

    }

    /**
     * Update the "crosshairs" when drawing a box.
    */
    bboxCursorUpdate(e){
        let ch_horizontal = this.drawState.bbox_crosshairs[0];
        let ch_vertical = this.drawState.bbox_crosshairs[1];

        let offset = $(this.leafletHolderEl).offset();

        let x = e.pageX - offset.left;
        let y = e.pageY - offset.top;

        ch_horizontal.style.top = y + "px";
        ch_vertical.style.left = x + "px";
    }

    cancelAnnotation(){

        if (this.drawState.drawer != null){
            // GVH: important to do this before drawer.disable()
            this.drawState.drawSuccessfullyCreated = true;  // This is confusing, but we need to use another state variable
                                                            // to decide if the user "messed up" the annotation:
                                                            //		doing a single click for a bounding box, etc.

            if(this.drawState.type == 'box'){

                this.drawState.drawer.disable();

            }
            else{
                throw "Unknown draw type: " + this.drawState.type;
            }

            // Unset the type
            this.drawState.type = null;

            // Destroy the drawer
            this.drawState.drawer = null;

            this.drawState.isNewInstance = null;
            this.drawState.annotationIndex = null;

            // Unset the category selection stuff
            this.categorySelectionState.category_index = null;
            this.categorySelectionState.annotationIndex = null;
            this.categorySelectionState.type = null;

            this.setState({
                annotating : false,
                selectingCategory : false,
                selectingCategoryForNewInstance : false
            });
        }
        else{
            this.handleCategorySelectionCancelled()
        }

    }

    duplicateAnnotationAtIndex({
        annotationIndex,
        objectCenter=null
    }={}){

        let annotation = this.state.annotations[annotationIndex];
        let annotationLayer = this.annotation_layers[annotationIndex];

        let newAnnotation = $.extend(true, {}, annotation);
        delete newAnnotation._id; // Mongodb id... not sure if there is a better way to do this...
        newAnnotation.id = uuidv4();

        let newAnnotationLayer = {
            'bbox' : null
        };
        let newAnnotationIndex = this.state.annotations.length;

        newAnnotation._modified = true;

        let imageWidth = this.imageWidth;
        let imageHeight = this.imageHeight;

        // Duplicate the box
        if (annotationLayer.bbox != null){
            let layer = annotationLayer.bbox;
            var newBox = this.extractBBox(layer);

            var [x, y, w, h] = newBox;

            // Center the duplicate box at `objectCenter`
            if (objectCenter != null){
                x = objectCenter[0] - ( w / 2.0 );

                // For spectrograms (we want to duplicate the frequency position of the box
                if (this.options.duplicateInstance.duplicateY == true){
                    y = y
                }
                else{
                    y = objectCenter[1] - ( h / 2.0 );
                }
            }

            // Shift the box a little bit so that it doesn't completely overlap.
            else{
                x = x + 0.05 * w;

                // For spectrograms (we want to duplicate the frequency position of the box
                if (this.options.duplicateInstance.duplicateY == true){
                    y = y
                }
                else{
                    y = y + 0.05 * h;
                }
            }

            // Do some sanity checking
            x = x < 0 ? 0 : x;
            y = y < 0 ? 0 : y;

            if ( (x + w) > 1 ){

                if (x >= 1){
                    x = 0.95;
                }
                w = 1 - x;

            }

            if ( (y + h) > 1){
                if (y >= 1){
                    y = 0.95;
                }
                h = 1 - y;
            }

            let pathStyle = this.getBoxPathStyle(newAnnotationIndex);

            let x1 = x * imageWidth;
            let y1 = y * imageHeight;
            let x2 = (x + w) * imageWidth;
            let y2 = (y + h) * imageHeight;
            let bounds = L.latLngBounds(this.leafletMap.unproject([x1, y1], 0), this.leafletMap.unproject([x2, y2], 0));
            let newLayer = L.rectangle(bounds, pathStyle);

            newLayer.modified = true;

            this.addLayer(newLayer);
            newAnnotationLayer.bbox = newLayer;

        }

        return [newAnnotation, newAnnotationLayer]

    }

    /**
     * If the annotations are saved back to the server, then this
     * is a mechanism for the UI to set all the current annotations to unmodified.
     * NOTE: there are mostlikely corner cases that this does not handle (currently annotating when saving)
     */
    setAnnotationsModified(modified){

        let annotations = this.state.annotations;
        let annotation_layers = this.annotation_layers;

        for (var i =0; i < annotations.length; i++){

            let annotation = annotations[i];
            let annotation_layer = annotation_layers[i];

            annotation._modified = modified;

            for (var layerName in  annotation_layer){
                if(annotation_layer[layerName] != null){
                    annotation_layer[layerName].modified = modified;
                }
            }

        }
    }

    /****************/
    /** Map Events **/

    /**
     * A layer has been moved.
     */
    _layerMoved(e){
        e.layer.modified = true;
    }

    /**
     * A layer has been resized.
     */
    _layerResized(e){
        e.layer.modified = true;
    }

    /**
     * We've started drawing a new layer.
     */
    _drawStartEvent(e){
        console.log("draw start");

        // Add cross hairs for the box annotations.
        if(this.drawState.type == 'box'){

            // If the user clicks on the image (rather than clicking and dragging) then this
            // function will be called again, but we don't want to duplicate the cross hairs.
            if (this.drawState.bbox_crosshairs == null){

                // Setup cross hair stuff
                let ch_horizontal = document.createElement('div');
                let ch_vertical = document.createElement('div');

                ch_horizontal.className = "full-crosshair full-crosshair-horizontal";
                ch_vertical.className = "full-crosshair full-crosshair-vertical";

                ch_horizontal.style.top = "" + e.offsetY + "px";
                ch_vertical.style.left = "" + e.offsetX + "px";

                this.drawState.bbox_crosshairs = [ch_horizontal, ch_vertical];

                $(this.leafletHolderEl).append(ch_horizontal);
                $(this.leafletHolderEl).append(ch_vertical);
                $(this.leafletHolderEl).on('mousemove', this.bboxCursorUpdate);

            }
        }
        else{
            throw "Unknown draw type: " + this.drawState.type;
        }

    }

    /**
     * Check to see if the user successfully created the annotation.
     * @param {*} e
     */
    _drawStopEvent(e) {
        console.log("draw stop");

        if(this.drawState.type == 'box'){

            // The user triggered some click, but didn't successfully create the annotation.
            // This can occur (for example) when a user clicks on the image when trying to draw a rectangle.
            // They need to "click and drag".
            if(this.state.annotating && !this.drawState.drawSuccessfullyCreated){
                this.drawState.drawer.enable();
            }
            else{
                // Always turn off the mouse move
                $(this.leafletHolderEl).off('mousemove', this.bboxCursorUpdate);
                if(this.drawState.bbox_crosshairs != null){
                    let ch_horizontal = this.drawState.bbox_crosshairs[0];
                    let ch_vertical = this.drawState.bbox_crosshairs[1];
                    $(ch_horizontal).remove();
                    $(ch_vertical).remove();
                    this.drawState.bbox_crosshairs = null;
                }

                this.drawState.type = null;
            }
        }
        else{
            throw "Unknown draw type: " + this.drawState.type;
        }

    }

    /**
     * Save off the annotation layer that was just created.
     * @param {*} e
     */
    _drawCreatedEvent(e) {

        var layer = e.layer;

        if(this.drawState.type='box'){

            // We want to clamp the box to the image bounds.
            layer = this.clipRectangleLayerToImageBounds(layer);
            layer.modified = true;
            this.addLayer(layer);

            // Is this a box for a brand new instance?
            if (this.drawState.isNewInstance){

                // Create the annotation data structure
                var annotation = {
                    id : uuidv4(),
                    image_id: this.props.image.id,
                    _modified : true,
                    _created : true,
                    bbox : null // we don't need to fill this in just yet, it will be populated in `getAnnotations`
                };

                // Grab the category that was chosen by the user for the new instance.
                if  (this.options.newInstance.annotateCategory){
                    let category = this.props.categories[this.categorySelectionState.category_index]
                    annotation.category_id = category.id
                    annotation.supercategory = category.supercategory
                }
                else if (this.options.newInstance.annotateSupercategory){
                    annotation.supercategory = this.supercategoryList[this.categorySelectionState.category_index]
                }

                // Create a mirror to hold the annotation layers
                var annotation_layer = {
                    'bbox': layer
                };
                this.annotation_layers.push(annotation_layer);

                // Add the annotation to our state
                this.setState(function(prevState, props){
                    var annotations = prevState.annotations;
                    annotations.push(annotation);
                    return {
                        'annnotations' : annotations
                    };
                });
            }
            // We are adding a box to an existing instance
            else{

                var annotation_layer = this.annotation_layers[this.drawState.annotationIndex];
                annotation_layer['bbox'] = layer;

            }

            // If this is the first instance, then we need to enable editing.
            if (this.options.enableBoxEdit){
                this.enableEditing();
            }

        }
        else{
            throw "Unknown draw type: " + this.drawState.type;
        }

        // Destroy the drawer
        this.drawState.drawer = null;
        this.drawState.drawSuccessfullyCreated = true;  // This is confusing, but we need to use another state variable
                                                        // to decide if the user "messed up" the annotation:
                                                        //		doing a single click for a bounding box, etc.
        this.drawState.isNewInstance = null;
        this.drawState.annotationIndex = null;

        // Unset the category selection stuff
        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = null;
        this.categorySelectionState.type = null;

        this.setState({
            annotating : false,
            selectingCategory : false,
            selectingCategoryForNewInstance : false
        });



    }

    /**
     * Duplicate the previous annotation, centered at the mouse location.
     */
    _handleLeaftletContextMenu(mouseEvent){

        let centerPoint = this.leafletMap.project(mouseEvent.latlng, 0);
        var x1 = centerPoint.x;
        var y1 = centerPoint.y;

        [x1, y1] = this.restrictPointToImageBounds(x1, y1);

        let centerX = x1 / this.imageWidth;
        let centerY = y1 / this.imageHeight;

        // Do we have a previous annotation?
        if(this.state.annotations.length >= 1){

            if (this.options.duplicateInstance.enable != true){
                return;
            }

            // Find the most recent annotation that is not deleted.
            var prevAnnotationIndex = null;
            for (var i = this.state.annotations.length - 1; i >= 0; i--){
                let prevAnnotation = this.state.annotations[i];
                if (prevAnnotation.deleted == null || prevAnnotation.deleted == false){
                    prevAnnotationIndex = i;
                    break;
                }
            }

            if (prevAnnotationIndex != null){

                let prevAnnotation = this.state.annotations[prevAnnotationIndex];

                var [newAnnotation, newAnnotationLayer]  = this.duplicateAnnotationAtIndex({
                    annotationIndex : prevAnnotationIndex,
                    objectCenter : [centerX, centerY]
                });

                this.annotation_layers.push(newAnnotationLayer);

                // Add the annotation to our state
                this.setState(function(prevState, props){
                    var annotations = prevState.annotations;
                    annotations.push(newAnnotation);
                    return {
                        'annnotations' : annotations
                    };
                });

            }

        }

    }

    /** End Map Events **/
    /********************/

    /*******************************/
    /** Annotation Sidebar Events **/

    /**
     * Allow the user to annotate a new instance with a bbox.
     */
    handleCreateNewIndividual(event){

        if(this.state.annotating){
            // ignore, the user needs to finish their annotation.
            // Maybe we can flash a message
            return;
        }

        let config = this.options.newInstance;

        this.categorySelectionState.category_index = null;

        // The user needs to choose a category
        if  (config.annotateCategory){

            this.categorySelectionState.type = 'category';

            this.setState({
                annotating : true,
                selectingCategory : true,
                selectingCategoryForNewInstance : true
            });

        }

        // The user needs to choose a supercategory
        else if (config.annotateSupercategory){

            this.categorySelectionState.type = 'supercategory';

            this.setState({
                annotating : true,
                selectingCategory : true,
                selectingCategoryForNewInstance : true
            });

        }

        // Just perform the pixel annotation.
        else{

            if (config.annotationType == 'box'){
                this.annotateBBox({isNewInstance: true});
            }
            else{
                throw "Unknown `option.newInstance.annotationType`: " + config.annotationType;
            }

        }
    }

    /**
     * Hide all of the annotations.
     */
    handleHideAllAnnotations(event){
        for(var i = 0; i < this.state.annotations.length; i++){

            let annotation = this.state.annotations[i];
            if (annotation.deleted != 'undefined' && annotation.deleted){
                continue;
            }

            let annotation_layer = this.annotation_layers[i];
            this.hideAnnotation(annotation, annotation_layer);

        }

        // Rerender
        this.setState(this.state);
    }

    handleShowAllAnnotations(event){

        for(var i = 0; i < this.state.annotations.length; i++){

            let annotation = this.state.annotations[i];
            if (annotation.deleted != 'undefined' && annotation.deleted){
              continue;
            }

            let annotation_layer = this.annotation_layers[i];

            this.showAnnotation(annotation, annotation_layer);

        }

        // Rerender
        this.setState(this.state);

    }

    /**
     * Delete an annotation, removing the annotation layers from the map.
     * @param {*} annotation_id
     */
    handleAnnotationDelete(annotationIndex){

        // Are we trying to delete the instance we are currently annotating?
        if (this.state.annotating){
            return;
        }

        let annotation = this.state.annotations[annotationIndex];
        let annotation_layer = this.annotation_layers[annotationIndex];

        // Remove the bbox.
        if(annotation_layer.bbox != undefined && annotation_layer.bbox != null){
            let layer = annotation_layer.bbox;
            this.removeLayer(layer);
        }

        if(annotation_layer.segmentation != undefined && annotation_layer.segmentation != null){
            let layer = annotation_layer.segmentation;
            this.removeSegmentationLayer(layer);
        }

        // Update the annotations
        this.setState(function(prevState, props){

            let annotations = prevState.annotations;

            // Mark the annotation as deleted. The server will delete it from the database
            annotations[annotationIndex].deleted = true;
            annotations[annotationIndex]._modified = true;

            return {
              'annotations' : annotations
            };

        });
    }

    /**
     * Focus on a particular instance by zooming in on it.
     * @param {*} annotationIndex
     */
    handleAnnotationFocus(annotationIndex){

        let annotation = this.state.annotations[annotationIndex];
        let annotation_layer = this.annotation_layers[annotationIndex];

        // lets show the annotations if they are not shown
        this.showAnnotation(annotation, annotation_layer);

        if(annotation_layer['bbox'] != 'undefined' && annotation_layer['bbox'] != null){
            let layer = annotation_layer['bbox'];
            let bounds = layer.getBounds();

            if (this.allowZoomWhenFocusing){
                this.leafletMap.fitBounds(bounds);
            }
            else{
                this.leafletMap.fitBounds(bounds, {maxZoom : this.leafletMap.getZoom()});
            }

            // Let any listeners know that we moved the map to a specific location
            // This is currently very specific to handling the panning of spectrograms.
            let zoom = this.leafletMap.getZoom();
            let center = bounds.getCenter();
            let pixel_center = this.leafletMap.project(center, zoom);

            let center_x = pixel_center.x / this.specFactor;

            if (this.props.options.didFocusOnAnnotationCallback != null){
                this.props.options.didFocusOnAnnotationCallback(center_x);
            }


        }

        // Rerender to update "hidden" tags
        this.setState(this.state);
    }

    /**
     * Hide all other annotations.
     * @param {*} annotationIndex
     */
    handleHideOtherAnnotations(annotationIndex){

        for(var i = 0; i < this.state.annotations.length; i++){

            let annotation = this.state.annotations[i];
            if (annotation.deleted != 'undefined' && annotation.deleted){
                continue;
            }

            let annotation_layer = this.annotation_layers[i];

            if (i == annotationIndex){
                // make sure this annotation is shown
                this.showAnnotation(annotation, annotation_layer);
            }
            else{
                // Hide the other annotations
                this.hideAnnotation(annotation, annotation_layer);
            }
        }

        // Rerender to update "hidden" tags
        this.setState(this.state);

    }

    /**
     * Show the Category Selection Component to change the category id for this category
     */
    handleAnnotationCategoryChange(annotationIndex){

        if (this.state.annotating){
            return;
        }

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = annotationIndex;
        this.categorySelectionState.type = 'category';

        this.setState({
            annotating : true,
            selectingCategory : true,
            selectingCategoryForNewInstance : false
        });

    }

    /**
     * Show the Category Selection Component to change the category id for this category
     */
    handleAnnotationSupercategoryChange(annotationIndex){

        if (this.state.annotating){
            return;
        }

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = annotationIndex;
        this.categorySelectionState.type = 'supercategory';

        this.setState({
            annotating : true,
            selectingCategory : true,
            selectingCategoryForNewInstance : false
        });

    }

    handleAnnotationIsCrowdChange(annotationIndex, isCrowd){

        // Update the annotations
        this.setState(function(prevState, props){

            let annotations = prevState.annotations;

            annotations[annotationIndex].iscrowd = isCrowd;
            annotations[annotationIndex]._modified = true;

            return {
              'annotations' : annotations
            };

        });

    }

    handleAnnotationDrawBox(annotationIndex){

        this.annotateBBox({isNewInstance: false, annotationIndex: annotationIndex});

    }

    // Go into segmentation mode
    handleAnnotationDoSegmentation(annotationIndex){

        if (this.state.annotating){
            return;
        }
        this.disableEditing();

        let annotation = this.state.annotations[annotationIndex];
        let annotation_layer = this.annotation_layers[annotationIndex];

        // Make sure this annotation is visible
        this.showAnnotation(annotation, annotation_layer)

        let segmentationControl = L.control.paintPolygon({
            position: 'topleft',     // position of the control
            radius: 10,               // radius on start (pixel)
            minRadius: 3,            // min radius (pixel)
            maxRadius: 40,            // max radius (pixel)
            layerOptions: {},         // path style of drawed layer (see: https://leafletjs.com/reference-1.3.0.html#path-option)
            drawOptions: {            // path style on draw (see: https://leafletjs.com/reference-1.3.0.html#path-option)
                weight: 1
            },
            eraseOptions: {           // path style on erase (see: https://leafletjs.com/reference-1.3.0.html#path-option)
                color: '#ff324a',
                weight: 1
            },
            menu: {                   // Customize menu, set to false to prevent adding control UI on map, you need to build your own UI (on map or not)
                drawErase: true,
                size: true,
                eraseAll: false,
                onFinish: this.handleSegmentationFinished
            }
        }).addTo(this.leafletMap);

        // Does this annotation have an existing segmentation?

        if (annotation_layer.segmentation != null && annotation_layer.segmentation != undefined){

            let seg_layer = annotation_layer.segmentation;

            let features = seg_layer.toGeoJSON();
            if (features.type == "FeatureCollection"){
                features = features.features[0];
            }

            this.removeSegmentationLayer(seg_layer);

            segmentationControl.setData(features);
        }

        this.drawState.drawer = segmentationControl;
        this.drawState.annotationIndex = annotationIndex;
        this.drawState.type = "segmentation";
        this.drawState.isNewInstance = false;

        this.setState({
            annotating : true
        });

    }

    handleAnnotationDeleteSegmentation(annotationIndex){

        let annotation = this.state.annotations[annotationIndex];
        let annotation_layer = this.annotation_layers[annotationIndex];

        if (annotation_layer.segmentation != undefined && annotation_layer.segmentation != null){
            let layer = annotation_layer.segmentation;

            this.removeSegmentationLayer(layer);
            delete annotation_layer.segmentation;

            // Remove the segmentation data from the annotation model
            this.setState(function(prevState, props){

                var annotations = prevState.annotations;
                var annotation = prevState.annotations[annotationIndex];

                delete annotation.segmentation;

                annotation._modified = true;

                return {
                    'annotations' : annotations
                };

            });

        }

    }

    /** End Annotation Sidebar Events **/
    /***********************************/

    /*******************************/
    /** Category Selection Events **/

    handleCategorySelected(categoryIndex){

        // Are we creating a new instance?
        if (this.state.selectingCategoryForNewInstance){

            this.categorySelectionState.category_index = categoryIndex;

            if (this.options.newInstance.annotationType == 'box'){
                this.annotateBBox({isNewInstance: true});

                this.setState({
                    selectingCategory : false,
                    selectingCategoryForNewInstance : false
                });

            }
            else{
                throw "Unknown `option.newInstance.annotationType`: " + config.annotationType;
            }

        }

        // We are modifying an existing instance
        else{

            let annotationIndex = this.categorySelectionState.annotationIndex;
            var modifyCategoryId;
            var modifyValue;
            if (this.categorySelectionState.type == 'category'){
                modifyCategoryId = true;
                modifyValue = this.props.categories[categoryIndex].id;

                // Has anything actually changed?
                if (this.state.annotations[annotationIndex].category_id == modifyValue){

                    this.categorySelectionState.category_index = null;
                    this.categorySelectionState.annotationIndex = null;
                    this.categorySelectionState.type = null;

                    this.setState({
                        annotating : false,
                        selectingCategory : false,
                        selectingCategoryForNewInstance : false
                    });

                    return;

                }

            }
            else{
                modifyCategoryId = false;
                modifyValue = this.supercategoryList[categoryIndex];

                // Has anything actually changed?
                let annotation = this.state.annotations[annotationIndex];
                if (annotation.supercategory == modifyValue && annotation.category_id == null){

                    this.categorySelectionState.category_index = null;
                    this.categorySelectionState.annotationIndex = null;
                    this.categorySelectionState.type = null;

                    this.setState({
                        annotating : false,
                        selectingCategory : false,
                        selectingCategoryForNewInstance : false
                    });

                    return;
                }
            }


            this.categorySelectionState.category_index = null;
            this.categorySelectionState.annotationIndex = null;
            this.categorySelectionState.type = null;

            this.setState(function(prevState, props){

                var annotations = prevState.annotations;
                var annotation = prevState.annotations[annotationIndex];

                // Update the category_id
                if (modifyCategoryId){
                    annotation.category_id = modifyValue;

                    // Make sure to update the supercategory value
                    annotation.supercategory = this.categoryMap[modifyValue].supercategory
                }
                // Update the Supercategory
                else{
                    delete annotation.category_id;
                    annotation.supercategory = modifyValue;
                }

                annotation._modified = true;

                return {
                    'annotations' : annotations,
                    annotating : false,
                    selectingCategory : false,
                    selectingCategoryForNewInstance : false
                };

            });


        }

    }

    /**
     * Remove the category label for this annotation.
     */
    handleCategoryRemoved(){


        let annotationIndex = this.categorySelectionState.annotationIndex;
        let removeCategoryId = this.categorySelectionState.type == 'category';

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = null;
        this.categorySelectionState.type = null;

        this.setState(function(prevState, props){

            let annotations = prevState.annotations;

            // Remove the category_id
            if (removeCategoryId){
                delete annotations[annotationIndex].category_id;
            }
            // Remove the category_id and the supercategory
            else{
                delete annotations[annotationIndex].category_id;
                delete annotations[annotationIndex].supercategory;
            }
            return {
                'annotations' : annotations,
                annotating : false,
                selectingCategory : false,
                selectingCategoryForNewInstance : false
            };

        });

    }

    handleCategorySelectionCancelled(){

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = null;
        this.categorySelectionState.type = null;

        this.setState({
            annotating: false,
            selectingCategory: false,
            selectingCategoryForNewInstance : false
        });

    }

    /** End Category Selection Events **/
    /***********************************/

    /***********************************/
    /** Segmentation Events **/

    handleSegmentationFinished(){

        console.log("Done with segmentation.");

        // Get the polygons for the segmentation
        let segmentationLayer = this.drawState.drawer.getLayer();
        if(segmentationLayer != null && segmentationLayer != undefined){

            segmentationLayer.modified = true;

            var annotation_layer = this.annotation_layers[this.drawState.annotationIndex];
            annotation_layer.segmentation = segmentationLayer;

            // Clean up the feature? Clip it to the bounding box?
            // Add it as a fixed layer to the canvas?
            // Save it to the annotation

            segmentationLayer.remove();
            this.addSegmentationLayer(segmentationLayer);

        }

        // Remove the segmentation drawer
        this.drawState.drawer.stop();
        this.drawState.drawer.remove();

        // Unset the state
        this.drawState.drawer = null;
        this.drawState.annotationIndex = null;
        this.drawState.type = null;
        this.drawState.isNewInstance = null;

        this.setState({
            annotating : false,
        });

        this.enableEditing();

    }

    /** End Segmentation Events **/
    /***********************************/

    /**
     * Extract a bbox annotation from a Rectangle layer
     * @param {*} layer
     */
    extractBBox(layer){

        let bounds = layer.getBounds();
        let point1 = this.leafletMap.project(bounds.getNorthWest(), 0);
        let point2 = this.leafletMap.project(bounds.getSouthEast(), 0);

        var x1 = point1.x;
        var y1 = point1.y;
        var x2 = point2.x;
        var y2 = point2.y;

        [x1, y1] = this.restrictPointToImageBounds(x1, y1);
        [x2, y2] = this.restrictPointToImageBounds(x2, y2);

        let x = x1 / this.imageWidth;
        let y = y1 / this.imageHeight;
        let w = (x2 - x1) / this.imageWidth;
        let h = (y2 - y1) / this.imageHeight;

        return [x, y, w, h];

    }


    extractSegmentation(layer){

        let features = layer.toGeoJSON();
        if (features.type == "FeatureCollection"){
            features = features.features[0];
        }

        let geometry = features.geometry;

        // make sure coords is a multipolygon
        var multipolygon_coords;
        if(geometry.type == 'Polygon'){
            multipolygon_coords = [geometry.coordinates];
        }
        else{
            multipolygon_coords = geometry.coordinates;
        }

        let leafletMap = this.leafletMap;
        let imageWidth = this.imageWidth;
        let imageHeight = this.imageHeight;

        // Convert the polygon to normalized polygons in image space
        var normalized_polygons = [];
        multipolygon_coords.forEach(polygon_coords => {

            // Each polygon is a list of rings.
            var normed_ring_coords = [];
            polygon_coords.forEach(ring_coords => {

                // Get the normed coordinates of each ring.
                let normed_coords = [];
                ring_coords.forEach(lon_lat_coord => {

                    // Project to image space
                    let latlng = L.latLng({lon: lon_lat_coord[0], lat: lon_lat_coord[1]});
                    let proj_point = leafletMap.project(latlng, 0);

                    // Normalize by the image dimensions
                    let norm_x = proj_point.x / imageWidth;
                    let norm_y = proj_point.y / imageHeight;

                    normed_coords.push([norm_x, norm_y]);
                });
                normed_ring_coords.push(normed_coords);
            });
            normalized_polygons.push(normed_ring_coords);
        });

        return normalized_polygons;

    }


    /**
     * Return the current state of the annotations
     */
    getAnnotations({modifiedOnly = false, excludeDeleted = false} = {}){

        let annotations = this.state.annotations;
        let annotation_layers = this.annotation_layers;

        // The return value
        var annotations_to_save = [];

        for (var i =0; i < annotations.length; i++){

            let annotation = annotations[i];
            let annotation_layer = annotation_layers[i];

            // Have any of the layers for this annotation been modified?
            let someLayerHasBeenModified = false;
            for (var layerName in  annotation_layer){
                if(annotation_layer[layerName] != null){
                    someLayerHasBeenModified = someLayerHasBeenModified || annotation_layer[layerName].modified;
                }
            }

            // Has this annotation been modified?
            if (modifiedOnly && !(annotation._modified || someLayerHasBeenModified)) {
                continue;
            }

            // Was this annotation created and then deleted?
            if(annotation._created && annotation.deleted) {
                continue;
            }

            if(annotation.deleted && excludeDeleted){
                continue;
            }

            var new_annotation = $.extend(true, {}, annotation);

            // Remove any properties that we added ourselves for state
            delete new_annotation._modified;
            delete new_annotation._created;

            if(annotation_layer.bbox != null){
                let layer = annotation_layer['bbox'];
                let new_bbox = this.extractBBox(layer);
                new_annotation['bbox'] = new_bbox;
            }

            if(annotation_layer.segmentation != null){
                let layer = annotation_layer['segmentation'];

                let segmentation = this.extractSegmentation(layer);
                new_annotation['segmentation'] = segmentation;

            }

            annotations_to_save.push(new_annotation);
        }

      return annotations_to_save;

    }

    render(){

        var sidebarEl;

        // Are we currently annotating?
        if (this.state.annotating){

            // Render the "Category Selection" component
            if (this.state.selectingCategory){

                var category_options;
                var categoryType="";
                var removeCategoryIsValid = false;
                var quickAccessCategoryIDs = [];
                if (this.state.selectingCategoryForNewInstance){
                    if ( this.categorySelectionState.type == 'category' ){
                        category_options = this.props.categories;
                        categoryType = "Category"
                        removeCategoryIsValid = false;

                        // quickAccessCategoryIDs = this.options.quickAccessCategoryIDs;
                        // We will set the Quick Access Categories to include the categories
                        // that have been already annotated.
                        // Need to make sure we remove duplicates in the list.

                        // Grab the categories that have been added to this image
                        let annotated_category_ids = this.state.annotations.map(anno => {return anno.category_id});
                        let qa_category_ids = this.options.quickAccessCategoryIDs.concat(annotated_category_ids);
                        quickAccessCategoryIDs = qa_category_ids.reduce(function(a,b){
                            if (a.indexOf(b) < 0 ) a.push(b);
                            return a;
                        },[]);

                    }
                    else if ( this.categorySelectionState.type == 'supercategory' ){
                        category_options = this.supercategoryList.map(s => {return {name: s}});
                        categoryType = "Supercategory"
                        removeCategoryIsValid = false;
                    }
                    else{
                        throw "Unknown category selection type: " + this.categorySelectionState.type;
                    }
                }
                // We are editing an existing annotation
                else{
                    if ( this.categorySelectionState.type == 'category' ){
                        category_options = this.props.categories;
                        categoryType = "Category"
                        removeCategoryIsValid = this.options.allowCategoryRemoval;

                        // quickAccessCategoryIDs = this.options.quickAccessCategoryIDs;
                        // We will set the Quick Access Categories to include the categories
                        // that have been already annotated.
                        // Need to make sure we remove duplicates in the list.

                        // Grab the categories that have been added to this image
                        let annotated_category_ids = this.state.annotations.map(anno => {return anno.category_id});
                        let qa_category_ids = this.options.quickAccessCategoryIDs.concat(annotated_category_ids);
                        quickAccessCategoryIDs = qa_category_ids.reduce(function(a,b){
                            if (a.indexOf(b) < 0 ) a.push(b);
                            return a;
                        },[]);
                    }
                    else if ( this.categorySelectionState.type == 'supercategory' ){
                        category_options = this.supercategoryList.map(s => {return {name: s}});
                        categoryType = "Supercategory"
                        removeCategoryIsValid = this.options.allowSupercategoryRemoval;
                    }
                    else{
                        throw "Unknown category selection type: " + this.categorySelectionState.type;
                    }
                }

                sidebarEl = <CategorySelection categories={category_options}
                    categoryType={categoryType}
                    allowSelectNone={removeCategoryIsValid}
                    onSelect={this.handleCategorySelected}
                    onSelectNone={this.handleCategoryRemoved}
                    onCancel={this.handleCategorySelectionCancelled}
                    quickAccessCategoryIDs={quickAccessCategoryIDs}
                />
            }
            // We are currently drawing a box
            else if (this.drawState.type == 'box'){
                sidebarEl = (
                    <div className="alert alert-primary" role="alert">
                        Click and drag a box on the image.
                    </div>
                );
            }
            else if (this.drawState.type == 'segmentation'){
                sidebarEl = (
                    <div>
                        <div className="row">
                            <div className="col">
                                <div className="alert alert-primary" role="alert">
                                    Use the paintbrush and eraser tool to segment out the instance. Click the button below when done.
                                </div>
                            </div>
                        </div>
                        <div className="row justify-content-md-center">
                            <div className="col col-md-6">
                                <button type="button" className="btn btn-outline-success btn-lg" onClick={this.handleSegmentationFinished}>Save Segmentation</button>
                            </div>
                        </div>
                    </div>
                );
            }
            else{
                throw "Unknown draw type: " + this.drawState.type;
            }

        }
        // Render the "Annotation Instances"
        else{

            // On the first rendering, we haven't added any annotation layers because the
            // map gets rendered in componentDidMount()
            // So just ignore for now:
            if (this.annotation_layers != null){

                // Build up the annotation instance list
                var annotation_instances = [];

                for (var i=0; i < this.state.annotations.length; i++){

                    let annotation = this.state.annotations[i];

                    // Has this annotation been deleted?
                    if (annotation.deleted != 'undefined' && annotation.deleted){
                        continue;
                    }

                    // Does this annotation have a box / layers? If so, is it hidden?
                    var hasBox = false;
                    if (this.annotation_layers[i]['bbox'] != null){
                        hasBox = true;
                    }

                    // Get the hidden state for this annotation
                    // Make sure we have actually rendered the map though
                    var isHidden = false;
                    if (this.annotationFeatures != null){
                        isHidden = !this.annotationFeatures.hasLayer(this.annotation_layers[i]['bbox']);
                    }

                    // Get the category for this annotation, if available
                    var category = null;
                    if (annotation.category_id != 'undefined' && annotation.category_id){
                        category = this.categoryMap[annotation.category_id];
                    }

                    // Get the badge color
                    let badgeColor = this.options.boxColors[i % this.options.boxColors.length];

                    annotation_instances.push((
                        <AnnotationInstance key={annotation_instances.length}
                                    index={i}
                                    list_pos={annotation_instances.length + 1}

                                    annotation={annotation}
                                    category={category}

                                    hasBox={hasBox}
                                    badgeColor={badgeColor}
                                    hidden={isHidden}
                                    showCategory={this.options.showCategory}
                                    showSupercategory={this.options.showSupercategory}
                                    showGroupOption={this.options.showIsCrowdCheckbox}
                                    showSegmentationOption={this.options.enableSegmentationEdit}

                                    allowCategoryEdit={this.options.allowCategoryEdit}
                                    allowSupercategoryEdit={this.options.allowSupercategoryEdit}

                                    handleDelete={ this.handleAnnotationDelete }
                                    handleFocus={ this.handleAnnotationFocus }
                                    handleHideOthers={ this.handleHideOtherAnnotations }
                                    handleCategoryChange={this.handleAnnotationCategoryChange}
                                    handleSupercategoryChange={this.handleAnnotationSupercategoryChange}
                                    handleGroupChange={this.handleAnnotationIsCrowdChange}
                                    handleAnnotateBox={this.handleAnnotationDrawBox}
                                    handleEditSegment={this.handleAnnotationDoSegmentation}
                                    handleDeleteSegment={this.handleAnnotationDeleteSegmentation}
                                    />
                    ));

                }


                sidebarEl = <AnnotationSidebar
                    onCreateNewInstance={this.handleCreateNewIndividual}
                    onShowAllAnnotations={this.handleShowAllAnnotations}
                    onHideAllAnnotations={this.handleHideAllAnnotations}>
                    {annotation_instances}
                    </AnnotationSidebar>
            }
            else{
                sidebarEl = "";
            }
        }



        return (
            <div className='leaflet-annotation-container'>
                <div className="row justify-content-around no-gutters">
                    <div className="col-auto">
                        {/* Map holder */}
                        <div className="row">
                            <div className="col">
                                <div ref={ e => { this.leafletHolderEl = e; }} className='leaflet-image-holder'></div>
                            </div>
                        </div>
                        {/* Image Info holder */}
                        <this.options.imageInfoComponent image={this.props.image}/>
                    </div>
                    <div className="col-4">
                        {/* Annotation Sidebar */}
                        {sidebarEl}
                    </div>
                </div>
            </div>


        )
    }

}

// GVH: this seems like a big hack. Not sure how to get webpack to allow including the file.
document.LeafletAnnotation = Annotator_tool;
// And another hack, we are doing this so that we don't have to "compile" a react component in quick sound anno.
document.MLAudioInfo = MLAudioInfo
