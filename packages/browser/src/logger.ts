import { LS_LOG_KEY } from './constants';
import { LogLevels } from './core/types';

const LEVEL: LogLevels = {
  INFO : 0,
  DEBUG : 1,
  TRACE : 2
};

let LogLevel: number = LEVEL.INFO;
if (typeof localStorage !== 'undefined' && Object.prototype.hasOwnProperty.call(localStorage, LS_LOG_KEY)) {
  LogLevel = Number(localStorage.getItem(LS_LOG_KEY));
}

function trace (...args: any[]): void {
  if (LogLevel >= LEVEL.TRACE) {
    print('log', args);
  }
}

function debug (...args: any[]): void {
  if (LogLevel >= LEVEL.DEBUG) {
    print('log', args);
  }
}

/*
 * AW4.Logger.log(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.log.
 */
function log (...args: any[]): void {
  print('log', args);
}

/*
 * AW4.Logger.warn(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.warn.
 */
function warn (...args: any[]): void {
  print('warn', args);
}

/*
 * AW4.Logger.error(message) -> No return value
 * -message (String): A check for if window.console is defined is performed,
 * and if window.console is defined, then message will be sent to
 * console.error.
 */
function error (...args: any[]): void {
  print('error', args);
}

function print (level: 'error' | 'warn' | 'log', message: any[]) {
  if (typeof window.console !== 'undefined') {
    window.console[level](...message);
  }
}

/*
 * Sets the logging level for the Connect SDK.
 *
 * Levels:
 * * `0` - INFO
 * * `1` - DEBUG
 * * `2` - TRACE
 */
function setLevel (level: number): void {
  LogLevel = level;
  localStorage[LS_LOG_KEY] = level;
}

export const Logger = { debug, error, log, setLevel, trace, warn };
