import {BOX_PATH_STYLE, COLORS} from "./defaults";
import {AnnotationInstance} from './annotation_instance';
import {AnnotationSidebar} from './annotation_sidebar';
import {CategorySelection} from './category_selection';
import {ImageInfo} from './image_info';
import {MLAudioInfo} from './macaulay_asset_info';
import "./leaflet_annotation.css";
import {v4 as uuidv4} from 'uuid';
import {log} from './index';
const React = require('react');
const L = require('leaflet');

// @ts-ignore
import $ from 'jquery';

// @ts-ignore
const Draw = import('leaflet-draw');

// @ts-ignore
export {Draw};


/*
 * these imports are used for the in-annotator classify feature.
 * todo: ask merlin people if they'd like to use this feature
 */
import * as audio_loader from "./audio_loading_utils";
import * as audio_model from "./audio_model";

const DEFAULT_MODEL_URL = 'models/audio/model.json';
const DEFAULT_LABELS_URL = 'models/audio/labels.json';

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
const defaultOptions = {

    // Map Config
    map : {
        attributionControl : true,
        zoomControl : true,
        boxZoom : true,
        doubleClickZoom : true,
        keyboard : true,
        scrollWheelZoom : true
    },

    // Use Keymap Config?
    enableEditingImmediately : true,
    enableHotKeysImmediately : true,

    // Classify Config
    enableClassify: true,
    MODEL_URL : DEFAULT_MODEL_URL,
    LABELS_URL : DEFAULT_LABELS_URL,

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
        duplicateY : true // should the y values be duplicated (for annotating a spectrogram)
    },

    // Image Information rendered under the Map
    imageInfoComponent : ImageInfo,

    // Callback for after Leaflet has been rendered
    didMountLeafletCallback : null,
    didFocusOnAnnotationCallback : null
};

export class LeafletAnnotation extends React.Component {

    constructor(props) {
        super(props);

        this.options = $.extend(true, {}, defaultOptions, this.props.options);

        // Add fields to the annotations
        // GVH: Perhaps this should be done by the parent?
        const annotations = this.props.annotations.map(annotation => {
            annotation._modified = false;
            annotation._created = false;
            return annotation;
        });

        this.state = {
            annotations, // Current state of the annotations
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
        };

        // When focusing on an annotation, do we allow the map to zoom?
        this.allowZoomWhenFocusing = true;

        // Initialize the category data structure
        this.categoryMap = {};
        const supercategorySet = new Set();
        for (let i = 0; i < this.props.categories.length; i++) {
            const category = this.props.categories[i];
            this.categoryMap[category.id] = category;

            if (category.supercategory !== 'undefined' && category.supercategory !== null) {
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

        this.handleClassify = this.handleClassify.bind(this);
        this.handleClassifyWaveform = this.handleClassifyWaveform.bind(this);

        this.handleKeyDown = this.handleKeyDown.bind(this);

    }

    /**
     * Runs after the component output has been rendered to the DOM.
     * Initialize the leaflet map and add the annotations.
     */
    componentDidMount = () => {
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
            keyboard : this.options.map.keyboard,
            scrollWheelZoom : this.options.map.scrollWheelZoom,
            zoomSnap: 0
        });

        const leafletMap = this.leafletMap;

        // Determine the resolution that the image will be rendered at
        const pixel_bounds = leafletMap.getPixelBounds();
        const maxWidth = pixel_bounds.max.x - pixel_bounds.min.x;
        const maxHeight = pixel_bounds.max.y - pixel_bounds.min.y;

        const imageWidth = this.props.imageElement.width;
        const imageHeight = this.props.imageElement.height;

        let ratio: number | number[] = [maxWidth / imageWidth, maxHeight / imageHeight ];
        ratio = Math.min(ratio[0], ratio[1]);

        const height = ratio * imageHeight;
        const width = ratio * imageWidth;

        // Save off the resolution of the image, we'll need this
        // for scaling the normalized annotations
        this.imageWidth = width;
        this.imageHeight = height;

        // Restrict the map to the image bounds
        const southWest = leafletMap.unproject([0, height], leafletMap.getMinZoom());
        const northEast = leafletMap.unproject([width, 0], leafletMap.getMinZoom());
        const bounds = new L.LatLngBounds(southWest, northEast);

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
        leafletMap.on('contextmenu', this._handleLeafletDuplicate, this);

        // We'll use this list to mirror the json annotations
        this.annotation_layers = [];

        // Add the annotations
        for(let i=0; i < this.state.annotations.length; i++){
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

        if (this.props.options.didMountLeafletCallback !== null) {
            this.props.options.didMountLeafletCallback(this);
        }

    };

    /**
     * Try to clean up after ourselves.
     */
    componentWillUnmount = () => {
        this.leafletMap.remove();
    };

    componentDidUpdate = () => {
    };

    /****************/
    /** Programmatic Map Move Events **/

    /*
     * Set up the interface for annotating a spectrogram.
     * We want to:
     *      1. Zoom the spectrogram so that it's height is `targetHeight`
     *      2. Add padding around the spectrogram so that it "starts" in the center "finishes" in the center
     *      3. Compute the image-pixel to map-pixel scale conversion so that we can pan appropriately.
     */
    renderForSpectrogram = (targetHeight= 300) => {

        // The size of map
        const view_size = this.leafletMap.getSize();
        const view_width = view_size.x;
        const view_height = view_size.y;

        // The size of the image
        const image_width = this.props.imageElement.width;
        const image_height = this.props.imageElement.height;

        // The size of the scaled image
        const scaled_image_width = this.imageWidth;
        const scaled_image_height = this.imageHeight;

        const ratioMapPixelToImagePixel = Math.min(view_width / image_width, view_height / image_height);

        const factor = (targetHeight / image_height) / ratioMapPixelToImagePixel;
        const zoom = Math.log(factor) / Math.log(2);
        const center = this.leafletMap.unproject([0, image_height / 2], zoom);

        const boundaryWidth = (view_width / 2.0) / factor;
        const southWest = this.leafletMap.unproject([-boundaryWidth, scaled_image_height], 0);
        const northEast = this.leafletMap.unproject([scaled_image_width + boundaryWidth, 0], 0);
        const bounds = new L.LatLngBounds(southWest, northEast);

        this.leafletMap.setMaxBounds(bounds);
        this.leafletMap.setView(center, zoom, {animate : false});

        // A scalar factor that we need to multiply pixel coordinates by in order to get map coordinates.
        // See `panTo`
        this.specFactor = targetHeight / image_height;

    };

    fillMapPrev = () => {

        // NOTE: Make sure to set zoomSnap to 0 in order for the math to work out

        // Assume that the image is longer than it is wide (like a spectrogram)
        // We want to set the current view to contain the whole height

        // The size of map
        const view_size = this.leafletMap.getSize();
        const view_width = view_size.x;
        const view_height = view_size.y;

        // The size of the image
        const image_width = this.props.imageElement.width;
        const image_height = this.props.imageElement.height;

        // The size of the scaled image
        const scaled_image_width = this.imageWidth;
        const scaled_image_height = this.imageHeight;


        // Latitude = y
        // Longitude = x
        // Point(x, y)
        // LatLng

        // The bottom left corner of the map bounds should correspond to the bottom left of the image
        let southWest = this.leafletMap.unproject([0, scaled_image_height], this.leafletMap.getMinZoom());

        // The top right corner of the map bounds should be at:
        // x= ratio of the (height / width) x map view size
        // y=0
        const p = view_width * (image_height / image_width) * (view_width / view_height);
        let northEast = this.leafletMap.unproject([p, 0], this.leafletMap.getMinZoom());

        // Set the view of the map to these bounds
        let bounds = new L.LatLngBounds(southWest, northEast);
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
    };


    turnOffDrag = () => {
        this.leafletMap.dragging.disable();
    };

    turnOffZoom = () => {

        this.leafletMap.touchZoom.disable();
        this.leafletMap.doubleClickZoom.disable();
        this.leafletMap.scrollWheelZoom.disable();

        this.allowZoomWhenFocusing = false;

    };

    panTo = (x) => {
        // x in pixels:
        const image_height = this.props.imageElement.height;
        const zoom = this.leafletMap.getZoom();
        const center = this.leafletMap.unproject([x * this.specFactor, image_height / 2], zoom);

        this.leafletMap.panTo(center, {
            "animate" : false
        });
    };

    /**
     * Allow all annotation layers to be edited.
     */
    enableEditing = () => {
        this.editor.enable();
        // Remove the edit styling for the markers.
        $( ".leaflet-marker-icon" ).removeClass( "leaflet-edit-marker-selected" );
    };

    /**
     * Prevent annotations from being annotated
     */
    disableEditing = () => {
        this.editor.disable();
    };

    enableHotKeys = () => {
        // Register keypresses
        document.addEventListener("keydown", this.handleKeyDown);
    };

    disableHotKeys = () => {
        // Unregister keypresses
        document.removeEventListener("keydown", this.handleKeyDown);
    };

    handleKeyDown = (e) => {

        const ESCAPE_KEY = 27; // Quit / Cancel annotation
        const S_KEY = 83; // Save annotations
        const N_KEY = 78; // New instance
        const V_KEY = 86; // Toggle visibility
        const H_KEY = 72; // Toggle hide all
        const T_KEY = 84; // new instance of duplicate props

        // eslint-disable-next-line default-case
        switch(e.keyCode) {
            case ESCAPE_KEY:
                log('received `esc` keypress');
                if (this.state.annotating) {
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
            case T_KEY:
                log('received `T` keypress');
                this._handleLeafletDuplicate();
        }
    };

    /**
     * Create a path style for a box.
     * See: https://leafletjs.com/reference-1.6.0.html#path
     */
    getBoxPathStyle = (index) => {
        const options = this.options;
        const color = options.boxColors[index % options.boxColors.length];
        const pathStyle = $.extend(true, {}, options.boxPathStyle);
        pathStyle['color'] = color;
        pathStyle['fillColor'] = color;

        return pathStyle;
    };

    createBoxLayer = () => {
    };

    /**
     * Add an annotation to the image. This will render the bbox and keypoint annotations.
     *
     * @param {*} annotation
     * @param {*} annotationIndex
     */
    addAnnotation = (annotation, annotationIndex) => {

        const leafletMap = this.leafletMap;
        const imageWidth = this.imageWidth;
        const imageHeight = this.imageHeight;

        const options = this.options;

        // Store the layers for this annotation, this is the return value
        const layers = {
          'bbox' : null,
          'segmentation' : null,
        };

        if (options.renderBoxes){

            // Add the bounding box
            if(annotation.bbox !== 'undefined' && annotation.bbox !== null){

                const pathStyle = this.getBoxPathStyle(annotationIndex);

                const [x, y, w, h] = annotation.bbox;
                const x1 = x * imageWidth;
                const y1 = y * imageHeight;
                const x2 = (x + w) * imageWidth;
                const y2 = (y + h) * imageHeight;
                const bounds = L.latLngBounds(leafletMap.unproject([x1, y1], 0), leafletMap.unproject([x2, y2], 0));
                const layer = L.rectangle(bounds, pathStyle);

                layer.modified = false;

                this.addLayer(layer);
                layers.bbox = layer;

            }

        }

        return layers;

    };

    /**
     * Add an annotation layer to the leaflet map.
     *
     * @param {*} layer
     */
    addLayer = (layer) => {
        if(layer !== undefined && layer !== null){
            if(!this.annotationFeatures.hasLayer(layer)){
                this.annotationFeatures.addLayer(layer);

                // Remove the edit styling for the markers.
                $( ".leaflet-marker-icon" ).removeClass( "leaflet-edit-marker-selected" );
          }
        }
    };

    /**
     * Remove an annotation layer from the leaflet map.
     *
     * @param {*} layer
     */
    removeLayer = (layer) => {

        if(layer !== undefined && layer !== null){
            if(this.annotationFeatures.hasLayer(layer)){
                this.annotationFeatures.removeLayer(layer);
            }
        }
    };

    /**
     * Translate the point (if needed) so that it lies within the image bounds
     *
     * @param  {[type]} x [description]
     * @param  {[type]} y [description]
     * @return {[type]}   [description]
     */
    restrictPointToImageBounds = (x, y) => {

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

    };

    /**
     * Clip the layer to be inside the image.
     */
    clipRectangleLayerToImageBounds = (layer) => {

        let bounds = layer.getBounds();
        let point1 = this.leafletMap.project(bounds.getNorthWest(), 0);
        let point2 = this.leafletMap.project(bounds.getSouthEast(), 0);

        let x1 = point1.x;
        let y1 = point1.y;
        let x2 = point2.x;
        let y2 = point2.y;

        [x1, y1] = this.restrictPointToImageBounds(x1, y1);
        [x2, y2] = this.restrictPointToImageBounds(x2, y2);

        // Is one of the dimensions 0?

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

    };


    /**
     * Show this annotation.
     *
     * @param {*} annotation_layer
     */
    showAnnotation = (annotation_layer) => {

        // Show the bounding box
        if(annotation_layer['bbox'] !== 'undefined' && annotation_layer['bbox'] !== null){
            const layer = annotation_layer['bbox'];
            this.addLayer(layer);
        }
    };

    /**
     * Classifies a particular.
     *
     * @param waveform : Float32Array
     */
    handleClassifyWaveform = async(waveform : Float32Array) => {
        // returned scores are currently displayed via alert() until someone thinks of slicker solution:
        const merlinAudio = await new audio_model.MerlinAudioModel(this.options.LABELS_URL, this.options.MODEL_URL);

        const result = await merlinAudio.averagePredictV3(waveform, 44100);
        const labels = result[0];
        const scores = result[1];

        return [labels, scores];

    };
    

    /**
     * Classify on a particular instance.
     *
     * @param {number} annotationIndex
     */
     handleClassify = (annotationIndex: number) => {

            const annotation_layer = this.annotation_layers[annotationIndex];

            // lets show the annotations if they are not shown
            this.showAnnotation(annotation_layer);

            if (annotation_layer['bbox'] !== 'undefined' && annotation_layer['bbox'] !== null) {
                const layer = annotation_layer['bbox'];
                const bounds = layer.getBounds();

                if (this.allowZoomWhenFocusing) {
                    this.leafletMap.fitBounds(bounds);
                } else {
                    this.leafletMap.fitBounds(bounds, {maxZoom: this.leafletMap.getZoom()});
                }

                log("Clicked Classify!");

                const targetSampleRate = 44100;
                const stftHopSeconds = 0.005;
                const point1 = this.leafletMap.project(bounds.getNorthWest(), 0);
                const point2 = this.leafletMap.project(bounds.getSouthEast(), 0);
                const x1 = point1.x;
                const x2 = point2.x;
                const pos1 = Math.round(x1);
                const pos2 = Math.round(x2);

                // Need to go from spectrogram position to waveform sample index
                const hopLengthSamples = Math.round(targetSampleRate * stftHopSeconds);

                const samplePos1 = Math.round(pos1 * hopLengthSamples);
                const samplePos2 = Math.round(pos2 * hopLengthSamples);

                console.log("sample position 1: " + samplePos1, "\n sample posititon 2: " + samplePos2);
                console.log("audio: " + this.props.image.audio.toString(), 'annotator_tool.ts');

                audio_loader.loadAudioFromURL(this.props.image.audio)
                    .then((audioBuffer) => audio_loader.resampleAndMakeMono(audioBuffer, targetSampleRate))
                    .then((audioWaveform) => {
                        const sampledWaveform = audioWaveform.slice(samplePos1, samplePos2);
                        this.handleClassifyWaveform(sampledWaveform)
                            .then(([labels, scores]) => {
                            let resultStr = "Scores: \n";
                            for (let i = 0; i < 10; i++) {
                                log(labels[i] + ": " + scores[i]);
                                resultStr += labels[i] + ": " + scores[i] + " \n";
                            }

                            // use an alert to show classifications for now,
                            // until someone thinks of a better way to display scores
                            alert(resultStr);
                            return resultStr;

                        });
                    });

            }

            // Rerender to update "hidden" tags
            this.setState(this.state);

        };

    /**
     * Hide this annotation.
     *
     * @param {*} annotation_layer
     */
    hideAnnotation = (annotation_layer) => {

        // Hide the bounding box for this annotation
        if(annotation_layer['bbox'] !== 'undefined' && annotation_layer['bbox'] !== null){
            const layer = annotation_layer['bbox'];
            this.removeLayer(layer);
        }

    };

    /**
     * Allow the user to draw a bbox.
     */
    annotateBBox = ({
        isNewInstance = false,
        annotationIndex = null
    }={}) => {

        const index = annotationIndex !== null ? annotationIndex : this.state.annotations.length;
        const pathStyle = this.getBoxPathStyle(index);

        const drawer = new L.Draw.Rectangle(this.leafletMap, {
          shapeOptions : pathStyle,
          showArea : false,
          metric : false
        });

        this.drawState = {
            drawer,
            drawSuccessfullyCreated : false,
            type : 'box',
            isNewInstance,
            annotationIndex
        };

        drawer.enable();

        this.setState({
            'annotating' : true,
        });

    };

    /**
     * Update the "crosshairs" when drawing a box.
     */
    bboxCursorUpdate = (e) => {

        try {

            const ch_horizontal = this.drawState.bbox_crosshairs[0];
            const ch_vertical = this.drawState.bbox_crosshairs[1];

            const offset = $(this.leafletHolderEl).offset();

            const x = e.pageX - offset.left;
            const y = e.pageY - offset.top;

            ch_horizontal.style.top = y + "px";
            ch_vertical.style.left = x + "px";
        } catch (err) {
            // console.warn('crosshair error: ' + err + ' \n continuing...');
        }

    };

    cancelAnnotation = () => {

        if (this.drawState.drawer !== null){

            // GVH: important to do this before drawer.disable()

            // This is confusing, but we need to use another state variable
            // to decide if the user "messed up" the annotation:
            // doing a single click for a bounding box, etc.
            this.drawState.drawSuccessfullyCreated = true;

            if(this.drawState.type === 'box'){

                this.drawState.drawer.disable();

            }
            else {
                throw Error("Unknown draw type: " + this.drawState.type);
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
        else {
            this.handleCategorySelectionCancelled();
        }

    };


    // @ts-ignore
    duplicateAnnotationAtIndex({annotationIndex, objectCenter=null, isKey=false}={}){

        const annotation = this.state.annotations[annotationIndex];
        const annotationLayer = this.annotation_layers[annotationIndex];

        const newAnnotation = $.extend(true, {}, annotation);
        delete newAnnotation._id; // Mongodb id... not sure if there is a better way to do this...
        newAnnotation.id = uuidv4();

        const newAnnotationLayer = {
            'bbox' : null
        };
        const newAnnotationIndex = this.state.annotations.length;

        newAnnotation._modified = true;

        // Duplicate the box
        if (annotationLayer.bbox != null){
            const layer = annotationLayer.bbox;
            const newBox = this.extractBBox(layer);

            let [x, y, w, h] = newBox;

            // start the duplicate box at upper left
            if (objectCenter != null) {
                x = objectCenter[0];

                // For spectrograms we want to duplicate the frequency position of the box
                if (this.options.duplicateInstance.duplicateY !== true) {
                    y = objectCenter[1] - h;
                }
            }

            // Shift the box a little bit so that it doesn't completely overlap.
            else {
                x = x + 0.05 * w;

                // For spectrograms (we want to duplicate the frequency position of the box
                if (this.options.duplicateInstance.duplicateY !== true) {
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

            let newLayer: typeof L.rectangle = null;

            if (isKey) {
                newLayer = null;
                this.addLayer(newLayer);
                newAnnotationLayer.bbox = newLayer;
                this.annotateBBox({isNewInstance: false, annotationIndex: newAnnotationIndex});
            }
            else {
                const pathStyle = this.getBoxPathStyle(newAnnotationIndex);
                const x1 = x * this.imageWidth;
                const y1 = y * this.imageHeight;
                const x2 = (x + w) * this.imageWidth;
                const y2 = (y + h) * this.imageHeight;
                const bounds = L.latLngBounds(this.leafletMap.unproject([x1, y1], 0), this.leafletMap.unproject([x2, y2], 0));
                const newLayer = L.rectangle(bounds, pathStyle);
                newLayer.modified = true;
                this.addLayer(newLayer);
                newAnnotationLayer.bbox = newLayer;
            }
        }
        return [newAnnotation, newAnnotationLayer];
    }

    // @ts-ignore
    duplicateAnnotationDrawShortcut = (annotationIndex) => {

        const annotation = this.state.annotations[annotationIndex];

        const newAnnotation = $.extend(true, {}, annotation);
        delete newAnnotation._id;

        newAnnotation.id = uuidv4();
        console.log(newAnnotation);

        const newAnnotationIndex = this.state.annotations.length;

        const newAnnotationLayer = {
            'bbox' : null
        };

        // Duplicate the box
        this.annotateBBox({isNewInstance: true, annotationIndex: newAnnotationIndex});

        return [newAnnotation, newAnnotationLayer];
    };

    /**
     * If the annotations are saved back to the server, then this
     * is a mechanism for the UI to set all the current annotations to unmodified.
     * NOTE: there are most likely corner cases that this does not handle (currently annotating when saving)
     */
    setAnnotationsModified = (modified) => {

        const annotations = this.state.annotations;
        const annotation_layers = this.annotation_layers;

        for (let i =0; i < annotations.length; i++){

            const annotation = annotations[i];
            const annotation_layer = annotation_layers[i];

            annotation._modified = modified;

            for (const layerName in  annotation_layer) {
                if(annotation_layer[layerName] !== null){
                    annotation_layer[layerName].modified = modified;
                }
            }

        }
    };

    /****************/
    /** Map Events **/

    /**
     * A layer has been moved.
     */
    _layerMoved = (e) => {
        e.layer.modified = true;
    };

    /**
     * A layer has been resized.
     */
    _layerResized = (e) => {
        e.layer.modified = true;
    };

    /**
     * We've started drawing a new layer.
     */
    _drawStartEvent = (e) => {
        log("draw start");

        // Add cross hairs for the box annotations.
        if(this.drawState.type === 'box') {

            // If the user clicks on the image (rather than clicking and dragging) then this
            // function will be called again, but we don't want to duplicate the cross hairs.
            if (this.drawState.bbox_crosshairs === null){

                // Setup cross hair stuff
                const ch_horizontal = document.createElement('div');
                const ch_vertical = document.createElement('div');

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
        else {
            throw Error("Unknown draw type: " + this.drawState.type);
        }

    };

    /**
     * Check to see if the user successfully created the annotation.
     */
    _drawStopEvent = () => {

        log("draw stop");

        if(this.drawState.type === 'box') {

            // The user triggered some click, but didn't successfully create the annotation.
            // This can occur (for example) when a user clicks on the image when trying to draw a rectangle.
            // They need to "click and drag".
            if (this.state.annotating && !this.drawState.drawSuccessfullyCreated){
                this.drawState.drawer.enable();
            }

            else {
                try {
                     // Always turn off the mouse move
                    $(this.leafletHolderEl).off('mousemove', this.bboxCursorUpdate);
                    if(this.drawState.bbox_crosshairs !== null){
                        const ch_horizontal = this.drawState.bbox_crosshairs[0];
                        const ch_vertical = this.drawState.bbox_crosshairs[1];
                        $(ch_horizontal).remove();
                        $(ch_vertical).remove();
                        this.drawState.bbox_crosshairs = null;
                    }
                } catch (err) {
                    // console.warn('crosshair error: ' + err);
                }

                this.drawState.type = null;
            }
        }
        else {
            throw Error("Unknown draw type: " + this.drawState.type);
        }

    };

    /**
     * Save off the annotation layer that was just created.
     *
     * @param {*} e
     */
    _drawCreatedEvent = (e) => {

        let layer = e.layer;

        if (this.drawState.type === 'box') {

            // We want to clamp the box to the image bounds.
            layer = this.clipRectangleLayerToImageBounds(layer);
            layer.modified = true;
            this.addLayer(layer);

            // Is this a box for a brand new instance?
            if (this.drawState.isNewInstance){

                // Create the annotation data structure
                const annotation = {
                    id : uuidv4(),
                    image_id: this.props.image.id,
                    _modified : true,
                    _created : true,
                    bbox : null, // we don't need to fill this in just yet, it will be populated in `getAnnotations`
                    category_id: undefined,
                    supercategory: undefined
                };

                // Grab the category that was chosen by the user for the new instance.
                if  (this.options.newInstance.annotateCategory){
                    const category = this.props.categories[this.categorySelectionState.category_index];
                    annotation.category_id = category.id;
                    annotation.supercategory = category.supercategory;
                }
                else if (this.options.newInstance.annotateSupercategory){
                    annotation.supercategory = this.supercategoryList[this.categorySelectionState.category_index];
                }

                // Create a mirror to hold the annotation layers
                const annotation_layer = {
                    'bbox': layer
                };

                this.annotation_layers.push(annotation_layer);

                // Add the annotation to our state
                this.setState((prevState) => {
                    const annotations = prevState.annotations;
                    annotations.push(annotation);
                    return {
                        'annnotations' : annotations
                    };
                });
            }
            // We are adding a box to an existing instance
            else {
                try {
                    const annotation_layer = this.annotation_layers[this.drawState.annotationIndex];
                    annotation_layer['bbox'] = layer;

                } catch (e) {
                    log('L 1172');
                }
            }

            // If this is the first instance, then we need to enable editing.
            if (this.options.enableBoxEdit){
                this.enableEditing();
            }

        }
        else{
            throw Error("Unknown draw type: " + this.drawState.type);
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

    };

    /**
     * Duplicate handler
     */
    _handleLeafletDuplicate = (mouseEvent?) => {

        let centerX: number;
        let centerY: number;
        let isKey = false;

        try {
            // we are dealing with a mouse event
            const centerPoint = this.leafletMap.project(mouseEvent.latlng, 0);
            let x1 = centerPoint.x;
            let y1 = centerPoint.y;
            [x1, y1] = this.restrictPointToImageBounds(x1, y1);
            centerX = x1 / this.imageWidth;
            centerY = y1 / this.imageHeight;
        }
        catch (e) {
            isKey = true;
            // we are dealing with a key event
            centerX = this.imageWidth;
            centerY = this.imageHeight;
        }
        // Do we have a previous annotation?
        if (this.state.annotations.length >= 1) {

            if (this.options.duplicateInstance.enable !== true) {
                return;
            }

            // Find the most recent annotation that is not deleted.
            let prevAnnotationIndex = null;

            for (let i = this.state.annotations.length - 1; i >= 0; i--) {
                const prevAnnotation = this.state.annotations[i];
                if (prevAnnotation.deleted == null || prevAnnotation.deleted === false) {
                    prevAnnotationIndex = i;
                    break;
                }
            }

            let newAnnotation;
            let newAnnotationLayer;

            if (prevAnnotationIndex != null) {
                    if (isKey) {
                        [newAnnotation, newAnnotationLayer] = this.duplicateAnnotationAtIndex({
                            annotationIndex: prevAnnotationIndex,
                            objectCenter: [centerX, centerY],
                            isKey: true});
                    }
                    else {
                        [newAnnotation, newAnnotationLayer] = this.duplicateAnnotationAtIndex({
                            annotationIndex: prevAnnotationIndex,
                            objectCenter: [centerX, centerY],
                            isKey: false});
                    }
                    this.annotation_layers.push(newAnnotationLayer);

                    // Add the annotation to our state
                    this.setState((prevState) => {
                        const annotations = prevState.annotations;
                        annotations.push(newAnnotation);
                        return {
                            'annnotations': annotations
                        };
                    });
            }
        }
    };

    /** End Map Events **/
    /********************/

    /*******************************/
    /** Annotation Sidebar Events **/

    /**
     * Allow the user to annotate a new instance with a bbox.
     */
    handleCreateNewIndividual = () => {

        if(this.state.annotating){
            // ignore, the user needs to finish their annotation.
            // Maybe we can flash a message
            return;
        }

        const config = this.options.newInstance;

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

            if (config.annotationType === 'box'){
                this.annotateBBox({isNewInstance: true});
            }
            else{
                throw Error("Unknown `option.newInstance.annotationType`: " + config.annotationType);
            }

        }
    };

    /**
     * Hide all of the annotations.
     */
    handleHideAllAnnotations = () => {
        for(let i = 0; i < this.state.annotations.length; i++){

            const annotation = this.state.annotations[i];
            if (annotation.deleted !== 'undefined' && annotation.deleted){
                continue;
            }

            const annotation_layer = this.annotation_layers[i];
            this.hideAnnotation(annotation_layer);

        }

        // Rerender
        this.setState(this.state);
    };

    handleShowAllAnnotations = () => {

        for(let i = 0; i < this.state.annotations.length; i++){

            const annotation = this.state.annotations[i];
            if (annotation.deleted !== 'undefined' && annotation.deleted){
              continue;
            }

            const annotation_layer = this.annotation_layers[i];

            this.showAnnotation(annotation_layer);

        }

        // Rerender
        this.setState(this.state);

    };

    /**
     * Delete an annotation, removing the annotation layers from the map.
     *
     * @param annotationIndex
     */
    handleAnnotationDelete = (annotationIndex) => {

        // Are we trying to delete the instance we are currently annotating?
        if (this.state.annotating){
            return;
        }

        const annotation_layer = this.annotation_layers[annotationIndex];

        // Remove the bbox.
        if (annotation_layer.bbox !== undefined && annotation_layer.bbox !== null) {
            const layer = annotation_layer.bbox;
            this.removeLayer(layer);
        }

        // Update the annotations
        this.setState((prevState) => {

            const annotations = prevState.annotations;

            // Mark the annotation as deleted. The server will delete it from the database
            annotations[annotationIndex].deleted = true;
            annotations[annotationIndex]._modified = true;

            return {
              annotations
            };

        });

    };

    /**
     * Focus on a particular instance by zooming in on it.
     *
     * @param {*} annotationIndex
     */
    handleAnnotationFocus = (annotationIndex) => {

        const annotation_layer = this.annotation_layers[annotationIndex];

        // lets show the annotations if they are not shown
        this.showAnnotation(annotation_layer);

        if(annotation_layer['bbox'] !== 'undefined' && annotation_layer['bbox'] !== null){
            const layer = annotation_layer['bbox'];
            const bounds = layer.getBounds();

            if (this.allowZoomWhenFocusing){
                this.leafletMap.fitBounds(bounds);
            }
            else {
                this.leafletMap.fitBounds(bounds, {maxZoom : this.leafletMap.getZoom()});
            }

            // Let any listeners know that we moved the map to a specific location
            // This is currently very specific to handling the panning of spectrograms.
            const zoom = this.leafletMap.getZoom();
            const center = bounds.getCenter();
            const pixel_center = this.leafletMap.project(center, zoom);

            const center_x = pixel_center.x / this.specFactor;


            if (this.props.options.didFocusOnAnnotationCallback !== null) {
                try {
                    this.props.options.didFocusOnAnnotationCallback(center_x);
                }
                catch (err) {
                    // continue
                }
            }

        }

        // Rerender to update "hidden" tags
        this.setState(this.state);

    };

    /**
     * Hide all other annotations.
     *
     * @param {*} annotationIndex
     */
    handleHideOtherAnnotations = (annotationIndex) => {

        for(let i = 0; i < this.state.annotations.length; i++){

            const annotation = this.state.annotations[i];
            if (annotation.deleted !== 'undefined' && annotation.deleted){
                continue;
            }

            const annotation_layer = this.annotation_layers[i];

            if (i === annotationIndex){
                // make sure this annotation is shown
                this.showAnnotation(annotation_layer);
            }
            else{
                // Hide the other annotations
                this.hideAnnotation(annotation_layer);
            }
        }

        // Rerender to update "hidden" tags
        this.setState(this.state);

    };

    /**
     * Show the Category Selection Component to change the category id for this category
     */
    handleAnnotationCategoryChange = (annotationIndex) => {

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

    };

    /**
     * Show the Category Selection Component to change the category id for this category
     */
    handleAnnotationSupercategoryChange = (annotationIndex) => {

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

    };

    handleAnnotationIsCrowdChange = (annotationIndex, isCrowd) => {

        // Update the annotations
        this.setState((prevState) => {

            const annotations = prevState.annotations;

            annotations[annotationIndex].iscrowd = isCrowd;
            annotations[annotationIndex]._modified = true;

            return {
              annotations
            };

        });

    };

    handleAnnotationDrawBox = (annotationIndex) => {
        this.annotateBBox({isNewInstance: false, annotationIndex});
    };

    /** End Annotation Sidebar Events **/
    /***********************************/

    /*******************************/
    /** Category Selection Events **/

    handleCategorySelected = (categoryIndex) => {

        // Are we creating a new instance?
        if (this.state.selectingCategoryForNewInstance){

            this.categorySelectionState.category_index = categoryIndex;

            if (this.options.newInstance.annotationType === 'box'){
                this.annotateBBox({isNewInstance: true});

                this.setState({
                    selectingCategory : false,
                    selectingCategoryForNewInstance : false
                });

            }
            else {
                throw Error("Unknown `option.newInstance.annotationType`!");
            }

        }

        // We are modifying an existing instance
        else {

            const annotationIndex = this.categorySelectionState.annotationIndex;
            let modifyCategoryId;
            let modifyValue;
            if (this.categorySelectionState.type === 'category'){
                modifyCategoryId = true;
                modifyValue = this.props.categories[categoryIndex].id;

                // Has anything actually changed?
                if (this.state.annotations[annotationIndex].category_id === modifyValue){

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
                const annotation = this.state.annotations[annotationIndex];
                if (annotation.supercategory === modifyValue && annotation.category_id === null){

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

            this.setState(function(prevState){

                const annotations = prevState.annotations;
                const annotation = prevState.annotations[annotationIndex];

                // Update the category_id
                if (modifyCategoryId){
                    annotation.category_id = modifyValue;

                    // Make sure to update the supercategory value
                    // @ts-ignore
                    annotation.supercategory = this.categoryMap[modifyValue].supercategory;
                }
                // Update the Supercategory
                else{
                    delete annotation.category_id;
                    annotation.supercategory = modifyValue;
                }

                annotation._modified = true;

                return {
                    annotations,
                    annotating : false,
                    selectingCategory : false,
                    selectingCategoryForNewInstance : false
                };

            });

        }

    };

    /**
     * Remove the category label for this annotation.
     */
    handleCategoryRemoved = () => {


        const annotationIndex = this.categorySelectionState.annotationIndex;
        const removeCategoryId = this.categorySelectionState.type === 'category';

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = null;
        this.categorySelectionState.type = null;

        this.setState((prevState) => {

            const annotations = prevState.annotations;

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
                annotations,
                annotating : false,
                selectingCategory : false,
                selectingCategoryForNewInstance : false
            };

        });

    };

    handleCategorySelectionCancelled = () => {

        this.categorySelectionState.category_index = null;
        this.categorySelectionState.annotationIndex = null;
        this.categorySelectionState.type = null;

        this.setState({
            annotating: false,
            selectingCategory: false,
            selectingCategoryForNewInstance : false
        });

    };

    /** End Category Selection Events **/
    /***********************************/

    /**
     * Extract a bbox annotation from a Rectangle layer
     *
     * @param {*} layer
     */
    extractBBox = (layer) => {

        const bounds = layer.getBounds();
        const point1 = this.leafletMap.project(bounds.getNorthWest(), 0);
        const point2 = this.leafletMap.project(bounds.getSouthEast(), 0);

        let x1 = point1.x;
        let y1 = point1.y;
        let x2 = point2.x;
        let y2 = point2.y;

        [x1, y1] = this.restrictPointToImageBounds(x1, y1);
        [x2, y2] = this.restrictPointToImageBounds(x2, y2);

        const x = x1 / this.imageWidth;
        const y = y1 / this.imageHeight;
        const w = (x2 - x1) / this.imageWidth;
        const h = (y2 - y1) / this.imageHeight;

        return [x, y, w, h];

    };

    /**
     * Return the current state of the annotations
     */
    getAnnotations = ({modifiedOnly = false, excludeDeleted = false} = {}) => {

        const annotations = this.state.annotations;
        const annotation_layers = this.annotation_layers;

        // The return value
        const annotations_to_save = [];

        for (let i =0; i < annotations.length; i++){

            const annotation = annotations[i];
            const annotation_layer = annotation_layers[i];

            // Have any of the layers for this annotation been modified?
            let someLayerHasBeenModified = false;
            for (const layerName in  annotation_layer){
                if(annotation_layer[layerName] !== null){
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

            const new_annotation = $.extend(true, {}, annotation);

            // Remove any properties that we added ourselves for state
            delete new_annotation._modified;
            delete new_annotation._created;

            if(annotation_layer.bbox !== null){
                const layer = annotation_layer['bbox'];
                new_annotation['bbox'] = this.extractBBox(layer);
            }

            annotations_to_save.push(new_annotation);
        }

      return annotations_to_save;

    };

    render(){

        let sidebarEl;

        // Are we currently annotating?
        if (this.state.annotating){

            // Render the "Category Selection" component
            if (this.state.selectingCategory){

                let category_options;
                let categoryType="";
                let removeCategoryIsValid = false;
                let quickAccessCategoryIDs = [];

                if (this.state.selectingCategoryForNewInstance) {
                    if ( this.categorySelectionState.type === 'category' ){
                        category_options = this.props.categories;
                        categoryType = "Category";
                        removeCategoryIsValid = false;

                        // quickAccessCategoryIDs = this.options.quickAccessCategoryIDs;
                        // We will set the Quick Access Categories to include the categories
                        // that have been already annotated.
                        // Need to make sure we remove duplicates in the list.

                        // Grab the categories that have been added to this image
                        const annotated_category_ids = this.state.annotations.map(anno => anno.category_id);
                        const qa_category_ids = this.options.quickAccessCategoryIDs.concat(annotated_category_ids);
                        quickAccessCategoryIDs = qa_category_ids.reduce((a,b) => {
                            if (a.indexOf(b) < 0 ) {a.push(b);}
                            return a;
                        },[]);

                    }
                    else if ( this.categorySelectionState.type === 'supercategory' ) {
                        category_options = this.supercategoryList.map(s => ({name: s}));
                        categoryType = "Supercategory";
                        removeCategoryIsValid = false;
                    }
                    else {
                        throw Error("Unknown category selection type: " + this.categorySelectionState.type);
                    }
                }
                // We are editing an existing annotation
                else {
                    if ( this.categorySelectionState.type === 'category' ){
                        category_options = this.props.categories;
                        categoryType = "Category";
                        removeCategoryIsValid = this.options.allowCategoryRemoval;

                        // quickAccessCategoryIDs = this.options.quickAccessCategoryIDs;
                        // We will set the Quick Access Categories to include the categories
                        // that have been already annotated.
                        // Need to make sure we remove duplicates in the list.

                        // Grab the categories that have been added to this image
                        const annotated_category_ids = this.state.annotations.map(anno => anno.category_id);
                        const qa_category_ids = this.options.quickAccessCategoryIDs.concat(annotated_category_ids);
                        quickAccessCategoryIDs = qa_category_ids.reduce((a,b) => {
                            if (a.indexOf(b) < 0 ) {a.push(b);}
                            return a;
                        },[]);
                    }
                    else if ( this.categorySelectionState.type === 'supercategory' ){
                        category_options = this.supercategoryList.map(s => ({name: s}));
                        categoryType = "Supercategory";
                        removeCategoryIsValid = this.options.allowSupercategoryRemoval;
                    }
                    else{
                        // throw "Unknown category selection type: " + this.categorySelectionState.type;
                    }
                }

                // @ts-ignore
                sidebarEl = <CategorySelection categories={category_options}
                    categoryType={categoryType}
                    allowSelectNone={removeCategoryIsValid}
                    onSelect={this.handleCategorySelected}
                    onSelectNone={this.handleCategoryRemoved}
                    onCancel={this.handleCategorySelectionCancelled}
                    quickAccessCategoryIDs={quickAccessCategoryIDs}
                />;
            }
            // We are currently drawing a box
            else if (this.drawState.type === 'box') {
                sidebarEl = (
                    <div className="alert alert-primary" role="alert">
                        Click and drag a box on the image.
                    </div>
                );
            }
            else {
                //throw "Unknown draw type: " + this.drawState.type;
            }

        }
        // Render the "Annotation Instances"
        else{

            // On the first rendering, we haven't added any annotation layers because the
            // map gets rendered in componentDidMount()
            // So just ignore for now:
            if (this.annotation_layers != null){

                // Build up the annotation instance list
                const annotation_instances = [];

                for (let i=0; i < this.state.annotations.length; i++){

                    const annotation = this.state.annotations[i];

                    // Has this annotation been deleted?
                    if (annotation.deleted !== 'undefined' && annotation.deleted){
                        continue;
                    }

                    // Does this annotation have a box / layers? If so, is it hidden?
                    let hasBox = false;
                    if (this.annotation_layers[i]['bbox'] != null){
                        hasBox = true;
                    }

                    // Get the hidden state for this annotation
                    // Make sure we have actually rendered the map though
                    let isHidden = false;
                    if (this.annotationFeatures != null){
                        isHidden = !this.annotationFeatures.hasLayer(this.annotation_layers[i]['bbox']);
                    }

                    // Get the category for this annotation, if available
                    let category = null;
                    if (annotation.category_id !== 'undefined' && annotation.category_id){
                        category = this.categoryMap[annotation.category_id];
                    }

                    // Get the badge color
                    const badgeColor = this.options.boxColors[i % this.options.boxColors.length];

                    annotation_instances.push((
                        // @ts-ignore
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

                                    allowCategoryEdit={this.options.allowCategoryEdit}
                                    allowSupercategoryEdit={this.options.allowSupercategoryEdit}

                                    handleDelete={ this.handleAnnotationDelete }
                                    handleFocus={ this.handleAnnotationFocus }
                                    handleHideOthers={ this.handleHideOtherAnnotations }

                                    enableClassifyCall={this.options.enableClassify}
                                    handleClassify={ this.handleClassify }
                                    handleClassifyWaveform={ this.handleClassifyWaveform }

                                    handleCategoryChange={this.handleAnnotationCategoryChange}
                                    handleSupercategoryChange={this.handleAnnotationSupercategoryChange}
                                    handleGroupChange={this.handleAnnotationIsCrowdChange}
                                    handleAnnotateBox={this.handleAnnotationDrawBox}
                        />
                    ));

                }

                // @ts-ignore
                sidebarEl = <AnnotationSidebar
                    onCreateNewInstance={this.handleCreateNewIndividual}
                    onShowAllAnnotations={this.handleShowAllAnnotations}
                    onHideAllAnnotations={this.handleHideAllAnnotations}>
                    {annotation_instances}
                    </AnnotationSidebar>;
            }
            else {
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


        );
    }

}

// GVH: this seems like a big hack. Not sure how to get webpack to allow including the file.
// @ts-ignore
document.LeafletAnnotation = LeafletAnnotation;
// And another hack, we are doing this so that we don't have to "compile" a react component in quick sound anno.

// @ts-ignore
document.MLAudioInfo = MLAudioInfo;
