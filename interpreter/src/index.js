"use strict";
exports.__esModule = true;
exports.log = exports.AudioRecorder = void 0;
/*
 * `index.ts`:
 * Declares named exports.
 */
var verbose = true;
//@ts-ignore
var audio_recorder_polyfill_1 = require("audio-recorder-polyfill");
exports.AudioRecorder = audio_recorder_polyfill_1["default"];
var log = function (msg, prefix) {
    if (prefix === void 0) { prefix = 'Merlin:'; }
    if (verbose) {
        var logMethod = console.log;
        logMethod("%c " + prefix + " ", 'background:green; color:white', msg);
    }
};
exports.log = log;
