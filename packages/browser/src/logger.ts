/**
 * @desc Contains logging wrapper functions for the developer.
 *
 * @module Logger
 */

import { LS_LOG_KEY } from './constants';
import { LogLevels } from './core/types';

const LEVEL: LogLevels = {
  INFO : 0,
  DEBUG : 1,
  TRACE : 2
};

let LogLevel: number = LEVEL.INFO;
if (typeof localStorage !== 'undefined' && localStorage.hasOwnProperty(LS_LOG_KEY)) {
  LogLevel = Number(localStorage.getItem(LS_LOG_KEY));
}

export function trace (...args: any[]) {
  if (LogLevel >= LEVEL.TRACE) {
    print('log', args);
  }
}

export function debug (...args: any[]) {
  if (LogLevel >= LEVEL.DEBUG) {
    print('log', args);
  }
}

/**
 * AW4.Logger.log(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.log.
 */
export function log (...args: any[]) {
  print('log', args);
}

/**
 * AW4.Logger.warn(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.warn.
 */
export function warn (...args: any[]) {
  print('warn', args);
}

/**
 * AW4.Logger.error(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.error.
 */
export function error (...args: any[]) {
  print('error', args);
}

function print (level: 'error' | 'warn' | 'log', message: any[]) {
  if (typeof window.console !== 'undefined') {
    (console)[level].apply(console, message);
  }
}

/**
 * Sets the logging level for the Connect SDK.
 *
 * @function
 * @static
 * @name setLevel
 * @param {Number} level=0
 * Levels:
 * * `0` - INFO
 * * `1` - DEBUG
 * * `2` - TRACE
 * @return {null}
 */
export function setLevel (level: number) {
  LogLevel = level;
  localStorage[LS_LOG_KEY] = level;
}
