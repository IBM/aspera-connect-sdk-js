/**
 * @desc Contains helper functions for the developer.
 *
 * @module Utils
 * @property {Object} BROWSER Contains the type of browser that we are currently
 *   on (based on user agent).
 *
 *   Format:
 *   ```
 *   {
 *     "OPERA": false,
 *     "IE": false,
 *     "CHROME": true,
 *     "FIREFOX": false,
 *     "FIREFOX_LEGACY": false,
 *     "EDGE_WITH_EXTENSION": false,
 *     "EDGE_LEGACY": false,
 *     "SAFARI": false,
 *     "SAFARI_NO_NPAPI": false
 *   }
 *   ```
 */

import * as Logger from './logger';
import BROWSER from './helpers/browser';
import { LS_CONNECT_DETECTED, LS_CONTINUED_KEY } from './constants';
import { ConnectGlobals } from './helpers/globals';
import * as types from './core/types';

ConnectGlobals.sessionId = generateUuid();
ConnectGlobals.sessionKey = generateRandomStr(32);
let nextObjId = 0;

/**
 * Returns fasp initialize protocol
 */
export function getInitUrl (): string {
  return 'fasp://initialize';
}

export function getXMLHttpRequest (): XMLHttpRequest {
  if (typeof XMLHttpRequest === 'undefined') {
  // @ts-ignore
    XMLHttpRequest = function () { // eslint-disable-line
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
      } catch (e) {}
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
      } catch (e) {}
      try {
        return new ActiveXObject('Microsoft.XMLHTTP');
      } catch (e) {}
      // This browser does not support XMLHttpRequest
      return;
    };
  }

  return new XMLHttpRequest();
}

/**
 * Returns standardized error object
 */
export function createError (errorCode: any, message: any): types.ConnectError {
  let internalMessage = '';
  if (errorCode === -1) {
    internalMessage = 'Invalid request';
  }

  return { error: { code: errorCode, internal_message: internalMessage, user_message: message } };
}

/**
 * - str
 */
export function parseJson <T> (str: any): T | types.ConnectError {
  let obj;
  if (typeof str === 'string' && (str.length === 0 || str.replace(/\s/g, '') === '{}')) {
     // return {};
  }

  try {
    obj = JSON.parse(str);
  } catch (e) {
    obj = createError(-1, e);
  }
  return obj;
}

export function copyObject (obj: any): any {
  const localObj: any = {};
  if (!isNullOrUndefinedOrEmpty(obj)) {
    for (const property in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
        localObj[property] = obj[property];
      }
    }
  }

  return localObj;
}
/**
 * Checks if variable is null or undefined or empty.
 */
export function isNullOrUndefinedOrEmpty (x: any): x is undefined | null | '' {
  return x === '' || x === null || typeof x === 'undefined';
}

/**
 * AW4.Utils.versionLessThan(version1, version2) -> bool
 *  - version1 (Number):  a version Integer
 *  - version2 (Number):  a version Integer
 *
 * Compares two version strings.
 * Returns true if version string 'a' is less than version string 'b'
 *     '1.2.1' < '1.11.3'
 *     '1.1'   < '2.1'
 *     '1'     = '1'
 *     '1.2'   < '2'
 * Note the following behavior:
 *     '1'     = '1.2'
 *     '1.2'   = '1'
 *  This helps with upgrade checks.  If at least version '4' is required, and
 *   '4.4.2' is installed, versionLessThan('4.4.2','4') will return false.
 *
 * If the version number contains a character that is not a numeral it ignores
 * it
 */
export function versionLessThan (a: string, b: string): boolean {
  const versionToArray = function (version: string) {
    const splits = version.split('.');
    const versionArray = [];
    for (let i = 0; i < splits.length; i++) {
      const versionPart = parseInt(splits[i], 10);
      if (!isNaN(versionPart)) {
        versionArray.push(versionPart);
      }
    }

    return versionArray;
  };

  const aArr = versionToArray(a);
  const bArr = versionToArray(b);
  let i;
  for (i = 0; i < Math.min(aArr.length, bArr.length); i++) {
    // if i=2, a=[0,0,1,0] and b=[0,0,2,0]
    if (aArr[i] < bArr[i]) {
      return true;
    }
    // if i=2, a=[0,0,2,0] and b=[0,0,1,0]
    if (aArr[i] > bArr[i]) {
      return false;
    }
    // a[i] and b[i] exist and are equal:
    // move on to the next version number
  }
  // all numbers equal (or all are equal and we reached the end of a or b)
  return false;
}

/**
 * Checks if user has previously chosen to continue with current version.
 */
export function checkVersionException (): boolean {
  if (typeof(localStorage) === 'undefined') {
    return false;
  }
  const prevContinuedSeconds = localStorage.getItem(LS_CONTINUED_KEY);
  if (prevContinuedSeconds !== undefined && prevContinuedSeconds !== null) {
    const currentTimeSeconds = Math.round(new Date().getTime() / 1000);
    if ((currentTimeSeconds - Number(prevContinuedSeconds)) < 60 * 24) {
      Logger.debug('User opted out of update');
      return true;
    }
  }
  return false;
}

export function addVersionException (): void {
  if (typeof(localStorage) === 'undefined') {
    return;
  }
  localStorage.setItem(LS_CONTINUED_KEY, String(Math.round(new Date().getTime() / 1000)));
}

/**
 * Helper function to generate deferred promise
 */
export function generatePromiseData<T> (): { promise: Promise<T>; resolver: any; rejecter: any } {
  let resolver;
  let rejecter;

  const promise = new Promise<T>((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });

  return {
    promise,
    resolver,
    rejecter
  };
}

export function generateUuid (): string {
  const date = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r: any;
    // @ts-ignore
    r = ((date + 16) * Math.random()).toFixed() % 16;
    if (c !== 'x') {
      /* jslint bitwise: true */
      r = r & 0x3 | 0x8;
      /* jslint bitwise: false */
    }
    return r.toString(16);
  });
}

export function generateRandomStr (size: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

/**
 * Attempt to launch Connect. It will handle different browser
 * implementations to not end in an error page or launch multiple
 * times.
 *
 * @function
 * @static
 * @name launchConnect
 * @param {Callbacks} callbacks `success` and `error` functions to receive results.
 *
 * Result returned to success callback:
 * * `true` - If Connect is installed.
 * * `false` - If Connect is either not installed or we could not detect it.
 * @return {null}
 */
export function launchConnect (userCallback?: (t: boolean) => any): void {
  let isRegistered = false;
  const callback = (installed: boolean) => {
    if (typeof userCallback === 'function') {
      userCallback(installed);
    }
  };

  const launchUri = getInitUrl();
  Logger.debug('Starting Connect session: ' + launchUri);
  if (BROWSER.CHROME || BROWSER.OPERA) {
    document.body.focus();
    document.body.onblur = function () {
      isRegistered = true;
    };
    // will trigger onblur
    document.location.href = launchUri;
    // Note: timeout could lety as per the browser version, have a higher value
    setTimeout(function () {
      // tslint:disable-next-line
      document.body.onblur = null;
      callback(isRegistered);
    }, 500);
  } else if (BROWSER.EDGE_LEGACY || BROWSER.EDGE_WITH_EXTENSION) {
    document.location.href = launchUri;
  } else if (BROWSER.FIREFOX_LEGACY || BROWSER.FIREFOX || BROWSER.SAFARI_NO_NPAPI) {
    const dummyIframe = document.createElement('IFRAME') as HTMLIFrameElement;
    dummyIframe.src = launchUri;
    // Don't show the iframe and don't allow it to take up space
    dummyIframe.style.visibility = 'hidden';
    dummyIframe.style.position = 'absolute';
    dummyIframe.style.width = '0px';
    dummyIframe.style.height = '0px';
    dummyIframe.style.border = '0px';
    document.body.appendChild(dummyIframe);
  }
  // ELSE is handled by the NPAPI plugin
  return;
}

/**
 * Returns full URL from relative URL
 *
 * @function
 * @static
 * @name getFullURI
 *
 * @param {String} relativeURL The relative URL that we want the full path to. It
 *   must be relative to the current page being rendered. If a full URL is
 *   provided, it will return the same.
 * @return {String}
 * @example
 * // If current rendered page is https://example.com/my/page
 * let relativeURL = 'foo.txt'
 * AW4.Utils.getFullURI(relativeURL) // returns "https://example.com/my/page/foo.txt"
 */
export function getFullURI (relativeURL: string | undefined): string | void {
  if (typeof relativeURL !== 'string') {
    return;
  }

  const url = relativeURL;
  const a = document.createElement('a');
  a.href = url;
  let fullURL = a.href;
  if (fullURL.indexOf('/', fullURL.length - 1) !== -1) {
    fullURL = fullURL.slice(0,-1);
  }

  return fullURL;
}

/**
 * Output base64 string from utf8 or unicode string
 *
 * @function
 * @static
 * @name utoa
 *
 * @param {String} inputString utf8 or unicode string input.
 * @return {String}
 *
 * @example
 * let inputString = 'foo'
 * AW4.Utils.atou(inputString) // returns "Zm9v"
 */
export function utoa (inputString: string): string {
  if (window.btoa) {
    return window.btoa(unescape(encodeURIComponent(inputString)));
  } else {
    return inputString;
  }
}

/**
 * Output unicode string from base64 string
 *
 * @function
 * @static
 * @name atou
 *
 * @param {String} inputString base64 string input.
 * @return {String}
 *
 * @example
 * let inputString = 'Zm9v'
 * AW4.Utils.atou(inputString) // returns "foo"
 */
export function atou (inputString: string): string {
  if (window.atob) {
    return decodeURIComponent(escape(window.atob(inputString)));
  } else {
    return inputString;
  }
}

export function nextObjectId (): number {
  // Return an incrementing id even if file was reloaded
  nextObjId++;
  return nextObjId;
}

/** Returns true if status code is 2xx */
export function isSuccessCode (code: number): boolean {
  return code >= 200 && code < 300;
}

export function getLocalStorage (key: string): string | null {
  try {
    if (typeof(localStorage) !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (error) {
    // Accessing local storage can be blocked by third party cookie settings
    Logger.error('Error accessing localStorage: ', JSON.stringify(error));
  }

  return '';
}

export function recordConnectDetected (): void {
  window.localStorage.setItem(LS_CONNECT_DETECTED, Date.now().toString());
}

export function setLocalStorage (key: string, value: string): void {
  try {
    if (typeof(localStorage) !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    // Accessing local storage can be blocked by third party cookie settings
    Logger.error('Error accessing localStorage: ', JSON.stringify(error));
  }
}

export function entropyOk (id: string): boolean {
  let entropy = 0;
  const len = id.length;
  const charFreq = Object.create({});
  id.split('').forEach(function (s) {
    if (charFreq[s]) {
      charFreq[s] += 1;
    } else {
      charFreq[s] = 1;
    }
  });
  for (const s in charFreq) {
    const percent = charFreq[s] / len;
    entropy -= percent * (Math.log(percent) / Math.log(2));
  }
  return entropy > 3.80;
}

export function isError (x: any): x is types.ConnectError {
  return (x && x.error !== undefined);
}

export function isMobile (): boolean {
  return (BROWSER.IOS || BROWSER.ANDROID);
}

export {
  BROWSER
};
