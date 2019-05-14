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

export function trace (message: any) {
  if (LogLevel >= LEVEL.TRACE && typeof window.console !== 'undefined') {
    console.log(message);
  }
}

export function debug (message: any) {
  if (LogLevel >= LEVEL.DEBUG && typeof window.console !== 'undefined') {
    console.log(message);
  }
}

/*
 * AW4.Logger.log(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.log.
 *
 * TODO: Support multiple arguments
 */
export function log (message: any) {
  if (typeof window.console !== 'undefined') {
    console.log(message);
  }
}

/*
 * AW4.Logger.warn(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.warn.
 *
 * TODO: Support multiple arguments
 */
export function warn (message: any) {
  if (typeof window.console !== 'undefined') {
    console.warn(message);
  }
}

/*
 * AW4.Logger.error(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.error.
 *
 *  TODO: Support multiple arguments
 */
export function error (message: any) {
  if (typeof window.console !== 'undefined') {
    console.error(message);
  }
}

/*
 * AW4.Logger.setLevel(level) -> No return value
 * - level (Number): 0 for INFO, 1 for DEBUG, 2 for TRACE
 *
 * Sets the logging level for Connect SDK
 *
 * Default: `0`
 */
export function setLevel (level: number) {
  LogLevel = level;
  localStorage[LS_LOG_KEY] = level;
}
