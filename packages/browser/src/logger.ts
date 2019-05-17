/**
 * @desc Contains logging wrapper functions for the developer.
 *
 * @module Logger
 */

 import { LS_LOG_KEY } from './shared/constants';
/**
 * section: API
 * class AW4.Logger
 *
 * The [[AW4.Logger]] class contains logging wrapper functions for the developer.
 */

const LEVEL = {
  INFO : 0,
  DEBUG : 1,
  TRACE : 2
};

let LogLevel: any = LEVEL.INFO;
if (typeof localStorage !== 'undefined' && localStorage.hasOwnProperty(LS_LOG_KEY)) {
  LogLevel = localStorage.getItem(LS_LOG_KEY);
}

export function trace (message: string) {
  if (LogLevel >= LEVEL.TRACE && typeof window.console !== 'undefined') {
    console.log(message);
  }
}

export function debug (message: string) {
  if (LogLevel >= LEVEL.DEBUG && typeof window.console !== 'undefined') {
    console.log(message);
  }
}

/**
 * AW4.Logger.log(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.log.
 *
 * TODO: Support multiple arguments
 */
export function log (message: string) {
  if (typeof window.console !== 'undefined') {
    console.log(message);
  }
}

/**
 * AW4.Logger.warn(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.warn.
 *
 * TODO: Support multiple arguments
 */
export function warn (message: string) {
  if (typeof window.console !== 'undefined') {
    console.warn(message);
  }
}

/**
 * AW4.Logger.error(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.error.
 *
 *  TODO: Support multiple arguments
 */
export function error (message: string) {
  if (typeof window.console !== 'undefined') {
    console.error(message);
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
