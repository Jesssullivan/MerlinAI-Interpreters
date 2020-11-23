"use strict";
/* eslint-disable */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;
exports.MerlinAudioModel = void 0;
// require('@tensorflow/tfjs-backend-wasm');
var tf = require("@tensorflow/tfjs");
var MerlinAudioModel = /** @class */ (function () {
    function MerlinAudioModel(labelsURL, modelURL) {
        this.sampleRate = 22050;
        //private minDurationSec : number = 1.0;
        //private stftWindowSeconds : number = 0.025;
        //private stftHopSeconds : number = 0.01;
        this.patchWindowSeconds = 0.96;
        this.patchHopSeconds = 0.48;
        this.modelURL = modelURL;
        this.labelsURL = labelsURL;
    }
    MerlinAudioModel.prototype.ensureModelLoaded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.model != null) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ensureLabelsLoaded()];
                    case 1:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, tf.loadGraphModel(this.modelURL)];
                    case 2:
                        _a.model = _b.sent();
                        console.log('Loaded model!.');
                        return [2 /*return*/];
                }
            });
        });
    };
    MerlinAudioModel.prototype.ensureLabelsLoaded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.labels != null) {
                            return [2 /*return*/];
                        }
                        _a = this;
                        return [4 /*yield*/, fetch(this.labelsURL)
                                .then(function (response) { return response.json(); })];
                    case 1:
                        _a.labels = _b.sent();
                        console.log('Loaded ' + this.labels.length + ' labels!.');
                        return [2 /*return*/];
                }
            });
        });
    };
    MerlinAudioModel.prototype.predict = function (waveform) {
        return __awaiter(this, void 0, void 0, function () {
            var patchWindowLengthSamples, patchHopLengthSamples, tf_waveform, waveform_frames, batchResults, windowStart, batches;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    /* Return the highest score for each frame. */
                    return [4 /*yield*/, this.ensureModelLoaded()];
                    case 1:
                        /* Return the highest score for each frame. */
                        _a.sent();
                        patchWindowLengthSamples = this.patchWindowSeconds * this.sampleRate;
                        patchHopLengthSamples = this.patchHopSeconds * this.sampleRate;
                        tf_waveform = tf.tensor1d(waveform);
                        // Make sure we have enough samples to create one spectrogram patch
                        if (tf_waveform.shape[0] < patchWindowLengthSamples) {
                            // console.log("Padding waveform with zeros");
                            tf_waveform = tf_waveform.pad([[0, patchWindowLengthSamples - waveform.length]]);
                        }
                        waveform_frames = tf.signal.frame(tf_waveform, patchWindowLengthSamples, patchHopLengthSamples);
                        batchResults = [];
                        windowStart = this.patchWindowSeconds / 2.0;
                        batches = tf.data.array(waveform_frames.arraySync());
                        return [4 /*yield*/, batches.forEachAsync(function (waveform_batch) {
                                var input_batch = tf.tensor(waveform_batch).expandDims(0);
                                var outputs = _this.model.execute(input_batch);
                                var scores = outputs.dataSync();
                                var maxIndexTensor = outputs.argMax(-1);
                                var maxIndex = maxIndexTensor.dataSync()[0];
                                // @ts-ignore
                                var maxScore = Math.max.apply(Math, __spread(scores));
                                batchResults.push([_this.labels[maxIndex], maxScore, windowStart]);
                                windowStart += _this.patchHopSeconds;
                            })];
                    case 2:
                        _a.sent();
                        tf.dispose([tf_waveform, waveform_frames]);
                        return [2 /*return*/, batchResults];
                }
            });
        });
    };
    MerlinAudioModel.prototype.averagePredictV3 = function (waveform, sampleRate) {
        return __awaiter(this, void 0, void 0, function () {
            var waveformWindowSizeSeconds, waveformWindowHopSeconds, ignorePartialLastWindow, waveformWindowSizeSamples, waveformWindowHopSamples, totalSamples, numWindows, curSampleIndex, batchResults, tf_waveform, input_waveform_batch, input_samplerate_batch, outputs, i, samplePos1, samplePos2, input_waveform_batch_1, input_samplerate_batch_1, tf_averageScores, topk, scores, indices, labels, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    /* Return the average score across all frames. */
                    return [4 /*yield*/, this.ensureModelLoaded()];
                    case 1:
                        /* Return the average score across all frames. */
                        _a.sent();
                        waveformWindowSizeSeconds = 1.0;
                        waveformWindowHopSeconds = 0.5;
                        ignorePartialLastWindow = true;
                        waveformWindowSizeSamples = sampleRate * waveformWindowSizeSeconds;
                        waveformWindowHopSamples = sampleRate * waveformWindowHopSeconds;
                        totalSamples = waveform.length;
                        numWindows = null;
                        if (ignorePartialLastWindow) {
                            numWindows = Math.floor(totalSamples / waveformWindowSizeSamples);
                        }
                        else {
                            numWindows = Math.ceil(totalSamples / waveformWindowSizeSamples);
                        }
                        numWindows = Math.max(1, numWindows);
                        console.log("Extracting " + numWindows + " windows from audio waveform");
                        curSampleIndex = 0;
                        batchResults = [];
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < numWindows)) return [3 /*break*/, 5];
                        samplePos1 = curSampleIndex;
                        samplePos2 = samplePos1 + waveformWindowSizeSamples;
                        tf_waveform = tf.tensor1d(waveform.slice(curSampleIndex, samplePos2));
                        // Pad with zeros to ensure we have enough samples to create the spectrogram.
                        if (tf_waveform.shape[0] < waveformWindowSizeSamples) {
                            console.log("Padding waveform with zeros");
                            tf_waveform = tf_waveform.pad([[0, waveformWindowSizeSamples - tf_waveform.shape[0]]]);
                        }
                        input_waveform_batch_1 = tf_waveform;
                        input_samplerate_batch_1 = tf.tensor1d([sampleRate], 'int32');
                        return [4 /*yield*/, this.model.executeAsync({ 'waveform': input_waveform_batch_1, 'samplerate': input_samplerate_batch_1 })];
                    case 3:
                        outputs = (_a.sent());
                        batchResults.push(outputs.dataSync());
                        curSampleIndex += waveformWindowHopSamples;
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5:
                        tf_averageScores = tf.mean(tf.tensor(batchResults), 0);
                        topk = tf.topk(tf_averageScores, this.labels.length, true);
                        scores = topk['values'].dataSync();
                        indices = topk['indices'].dataSync();
                        labels = [];
                        for (i = 0; i < this.labels.length; i++) {
                            labels.push(this.labels[indices[i]]);
                        }
                        // @ts-ignore
                        tf.dispose([tf_waveform, input_waveform_batch, input_samplerate_batch, outputs, tf_averageScores, topk]);
                        return [2 /*return*/, [labels, scores]];
                }
            });
        });
    };
    return MerlinAudioModel;
}());
exports.MerlinAudioModel = MerlinAudioModel;
