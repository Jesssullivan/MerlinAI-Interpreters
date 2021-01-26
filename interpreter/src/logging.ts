/*
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// todo: kinda more trouble than its worth, removes full stack trace & line number in exchange for colors
//  - will probably rewrite logger w/ Chalk or something if we're into colory stuff

/**
 * The different verbosity levels.
 */
export enum Level {
  NONE = 0,   // No messages will be logged.
  WARN = 5,   // WARN messages will be logged.
  INFO = 10,  // INFO and WARN messages will be logged.
  DEBUG = 20  // DEBUG, INFO, and WARN messages will be logged.
}

/**
 * The global verbosity level for Magenta.js.
 */
export const verbosity: Level = Level.INFO;

/**
 * Logs a message at the given verbosity level.
 *
 * If `level` is below the global `verbosity` level, the message is ignored.
 *
 * @param msg The message to log.
 * @param prefix The prefix of the message, should specify the model or library
 * that is doing the logging.
 * @param level The verbosity level of the message. The message will not be
 * logged if this level is greater than the `verbosity` setting.
 */
const log = (msg: string, prefix = 'Merlin', level = Level.INFO) => {
  if (level === Level.NONE) {
    throw Error('Logging level cannot be NONE.');
  }
  if (verbosity >= level) {
    const logMethod = (level === Level.WARN) ? console.warn : console.log;
    logMethod(`%c Merlin `, 'background:green; color:white', msg);
    // logMethod(`%c ${prefix} `, 'background:green; color:white', msg);
  }
};

/**
 * Logs a message at the given verbosity level, with the duration.
 *
 * If `level` is below the global `verbosity` level, the message is ignored.
 *
 * @param msg The message to log.
 * @param startTime The start time to use for duration calculation, in ms.
 * @param prefix The prefix of the message, should specify the model or library
 * that is doing the logging.
 * @param level The verbosity level of the message. The message will not be
 * logged if this level is greater than the `verbosity` setting.
 */
const logWithDuration = (
     msg: string, startTime: number, prefix = 'Magenta.js', level = Level.INFO) => {
   const durationSeconds = (performance.now() - startTime) / 1000;
   log(`${msg} in ${durationSeconds.toPrecision(3)}s`, prefix, level);
};

export {log, logWithDuration};
