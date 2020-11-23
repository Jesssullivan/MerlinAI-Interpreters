"use strict";
/**
 * Utilities for loading audio either from a url or from a file.
 * It is important to remember that Webkit can only create an OfflineAudioContext with
 * a sample rate of 44100. This means that if you want to use Safari and resample audio
 * to something other than 44100, the operation will probably be slow.
 */
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
exports.__esModule = true;
exports.resampleAndMakeMono = exports.getMonoAudio = exports.loadAudioFromFile = exports.loadAudioFromURL = void 0;
var ndarray = require("ndarray");
var resample = require("ndarray-resample");
// Safari Webkit only supports 44.1kHz audio.
var WEBKIT_SAMPLE_RATE = 44100;
var SAMPLE_RATE = 44100;
// tslint:disable-next-line:no-any
var appeaseTsLintWindow = window;
var isSafari = appeaseTsLintWindow.webkitOfflineAudioContext;
// tslint:disable-next-line:variable-name
var offlineCtx = isSafari ?
    new appeaseTsLintWindow.webkitOfflineAudioContext(1, WEBKIT_SAMPLE_RATE, WEBKIT_SAMPLE_RATE) :
    new appeaseTsLintWindow.OfflineAudioContext(1, SAMPLE_RATE, SAMPLE_RATE);
/* Safari doesn't support the Promised format of `offlineCtx.decodeAudioData`
So we'll wrap the callbacks in a Promise.
*/
function decodeAudioData(arrayBuffer) {
    if (isSafari) {
        return new Promise(function (resolve) {
            offlineCtx.decodeAudioData(arrayBuffer, function (buffer) {
                resolve(buffer);
            });
        });
    }
    else {
        return offlineCtx.decodeAudioData(arrayBuffer);
    }
}
/*
Loads audio from a url.
*/
function loadAudioFromURL(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch(url)
                    .then(function (body) { return body.arrayBuffer(); })
                    .then(function (buffer) { return decodeAudioData(buffer); })];
        });
    });
}
exports.loadAudioFromURL = loadAudioFromURL;
/*
Loads audio from a file.
*/
function loadAudioFromFile(blob) {
    return __awaiter(this, void 0, void 0, function () {
        var fileReader, loadFile;
        return __generator(this, function (_a) {
            fileReader = new FileReader();
            loadFile = new Promise(function (resolve, reject) {
                fileReader.onerror = function () {
                    fileReader.abort();
                    reject(new DOMException('Something went wrong reading that file.'));
                };
                fileReader.onload = function () {
                    resolve(fileReader.result);
                };
                fileReader.readAsArrayBuffer(blob);
            });
            return [2 /*return*/, loadFile.then(function (arrayBuffer) { return decodeAudioData(arrayBuffer); })];
        });
    });
}
exports.loadAudioFromFile = loadAudioFromFile;
/* Returns a Float32Array
*/
function getMonoAudio(audioBuffer) {
    if (audioBuffer.numberOfChannels === 1) {
        return audioBuffer.getChannelData(0);
    }
    if (audioBuffer.numberOfChannels !== 2) {
        throw Error(audioBuffer.numberOfChannels + " channel audio is not supported.");
    }
    var ch0 = audioBuffer.getChannelData(0);
    var ch1 = audioBuffer.getChannelData(1);
    var mono = new Float32Array(audioBuffer.length);
    for (var i = 0; i < audioBuffer.length; ++i) {
        mono[i] = (ch0[i] + ch1[i]) / 2;
    }
    return mono;
}
exports.getMonoAudio = getMonoAudio;
/* Returns a promised Float32Array
*/
function resampleAndMakeMono(audioBuffer, targetSr) {
    if (targetSr === void 0) { targetSr = SAMPLE_RATE; }
    return __awaiter(this, void 0, void 0, function () {
        var sourceSr, lengthRes, sourceSr_1, lengthRes_1, offlineCtx_1, bufferSource, originalAudio, resampledAudio;
        return __generator(this, function (_a) {
            if (audioBuffer.sampleRate === targetSr) {
                return [2 /*return*/, getMonoAudio(audioBuffer)];
            }
            sourceSr = audioBuffer.sampleRate;
            lengthRes = audioBuffer.length * targetSr / sourceSr;
            if (!isSafari) {
                sourceSr_1 = audioBuffer.sampleRate;
                lengthRes_1 = audioBuffer.length * targetSr / sourceSr_1;
                offlineCtx_1 = new OfflineAudioContext(1, lengthRes_1, targetSr);
                bufferSource = offlineCtx_1.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(offlineCtx_1.destination);
                bufferSource.start();
                return [2 /*return*/, offlineCtx_1.startRendering().then(function (buffer) { return buffer.getChannelData(0); })];
            }
            else {
                originalAudio = getMonoAudio(audioBuffer);
                resampledAudio = new Float32Array(lengthRes);
                resample(
                //@ts-ignore
                ndarray(resampledAudio, [lengthRes]), 
                //@ts-ignore
                ndarray(originalAudio, [originalAudio.length]));
                return [2 /*return*/, resampledAudio];
            }
            return [2 /*return*/];
        });
    });
}
exports.resampleAndMakeMono = resampleAndMakeMono;
