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
import BROWSER from './shared/browser';
import {
  FASP_API,
  CURRENT_API,
  LS_CONTINUED_KEY,
  LS_CONNECT_APP_ID,
  SS_SESSION_LASTKNOWN_ID
} from './shared/constants';
import { SESSION_ID, SESSION_KEY, SDK_LOCATION } from './shared/sharedInternals';
import * as aesjs from 'aes-js';
const crypt = { aesjs: aesjs };

SESSION_ID.set(generateUuid());
SESSION_KEY.set(generateRandomStr(32));

let nextObjId = 0;
let initUrlWampParams = '';

export function getInitUrl () {
  return CURRENT_API + '://initialize/?key=' + SESSION_KEY.value() + '&id=' + SESSION_ID.value() + initUrlWampParams;
}

////////////////////////////////////////////////////////////////////////////
// Compatibility functions
////////////////////////////////////////////////////////////////////////////

export function createError (errorCode: any, message: any) {
  let internalMessage = '';
  if (errorCode === -1) {
    internalMessage = 'Invalid request';
  }
  return { error: { code: errorCode, internal_message: internalMessage, user_message: message } };
}

/**
 * - str
 */
export function parseJson (str: any) {
  let obj;
  if (typeof str === 'string' && (str.length === 0 || str.replace(/\s/g, '') === '{}')) {
    return {};
  }
  try {
    obj = JSON.parse(str);
  } catch (e) {
    obj = createError(-1, e);
  }
  return obj;
}

////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////

/**
 * x - letiable we want to check
 */
export function isNullOrUndefinedOrEmpty (x: any) {
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
export function versionLessThan (a: string, b: string) {
  let versionToArray = function (version: string) {
    let splits = version.split('.');
    let versionArray = new Array();
    for (let i = 0; i < splits.length; i++) {
      let versionPart = parseInt(splits[i], 10);
      if (!isNaN(versionPart)) {
        versionArray.push(versionPart);
      }
    }
    return versionArray;
  };
  let aArr = versionToArray(a);
  let bArr = versionToArray(b);
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

export function checkVersionException (): boolean {
  if (typeof(localStorage) === 'undefined') {
    return false;
  }
  let prevContinuedSeconds = Number(localStorage.getItem(LS_CONTINUED_KEY));
  if (prevContinuedSeconds !== undefined && prevContinuedSeconds !== null) {
    let currentTimeSeconds = Math.round(new Date().getTime() / 1000);
    if ((currentTimeSeconds - prevContinuedSeconds) < 60 * 24) {
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

export function generateUuid (): string {
  let date = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r: any;
    // @ts-ignore
    r = ((date + 16) * Math.random()).toFixed() % 16;
    if (c !== 'x') {
      /*jslint bitwise: true */
      r = r & 0x3 | 0x8;
      /*jslint bitwise: false */
    }
    return r.toString(16);
  });
}

export function generateRandomStr (size: number): string {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export function encrypt (data: any) {
  let dataBytes = crypt.aesjs.utils.utf8.toBytes(data);
  let key = crypt.aesjs.utils.utf8.toBytes(SESSION_KEY.value());
  let iv = crypt.aesjs.utils.utf8.toBytes(generateRandomStr(16));
  // The counter is optional, and if omitted will begin at 1
  let aesOfb = new crypt.aesjs.ModeOfOperation.ofb(key, iv);
  let encryptedBytesString = aesOfb.encrypt(dataBytes);

  // To print or store the binary data, you may convert it to hex
  let encryptedHex = crypt.aesjs.utils.hex.fromBytes(iv) + '.' + crypt.aesjs.utils.hex.fromBytes(encryptedBytesString);
  return encryptedHex;
}

export function decrypt (data: any) {
  let arr = data.split('.');
  if (arr.length !== 2) {
    return data;
  }

  let iv = crypt.aesjs.utils.hex.toBytes(arr[0]);
  // When ready to decrypt the hex string, convert it back to bytes
  let encryptedBytes = crypt.aesjs.utils.hex.toBytes(arr[1]);
  let key = crypt.aesjs.utils.utf8.toBytes(SESSION_KEY.value());

  // The counter mode of operation maintains internal state, so to
  // decrypt a new instance must be instantiated.
  let aesOfb = new crypt.aesjs.ModeOfOperation.ofb(key, iv);
  let decryptedBytes = aesOfb.decrypt(encryptedBytes);

  // Convert our bytes back into text
  // let decryptedText = crypt.aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedBytes;
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
export function launchConnect (userCallback?: (t: boolean) => any) {
  let isRegistered = false;
  let callback = (installed: boolean) => {
    if (typeof userCallback === 'function') {
      userCallback(installed);
    }
  };

  let launchUri = getInitUrl();
  Logger.log('Starting Connect session: ' + launchUri);
  if (BROWSER.CHROME || BROWSER.OPERA) {
    document.body.focus();
    document.body.onblur = function () {
      isRegistered = true;
    };
    // will trigger onblur
    document.location.href = launchUri;
    // Note: timeout could lety as per the browser version, have a higher value
    setTimeout(function () {
      document.body.onblur = null;
      callback(isRegistered);
    }, 500);
  } else if (BROWSER.EDGE_LEGACY) {
    document.location.href = launchUri;
  } else if (BROWSER.FIREFOX_LEGACY || BROWSER.FIREFOX || BROWSER.SAFARI_NO_NPAPI) {
    let dummyIframe = document.createElement('IFRAME') as HTMLIFrameElement;
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
  return null;
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
export function getFullURI (relativeURL: string | undefined): string | null {
  if (typeof relativeURL !== 'string') {
    return null;
  }
  let url = relativeURL;
  let a = document.createElement('a');
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
export function utoa (inputString: string) {
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
export function atou (inputString: string) {
  if (window.atob) {
    return decodeURIComponent(escape(window.atob(inputString)));
  } else {
    return inputString;
  }
}

export function nextObjectId () {
  // Return an incrementing id even if file was reloaded
  // if (typeof(AW4.nextObjId) == 'undefined')
  //     AW4.nextObjId = 0;
  return nextObjId++;
}

export function getLocalStorage (key: string) {
  try {
    if (typeof(localStorage) === 'undefined') {
      return '';
    }
	  return localStorage.getItem(key);
  } catch (error) {
    // Accessing local storage can be blocked by third party cookie settings
	  console.log('Error accessing localStorage: ' + JSON.stringify(error));
	  return '';
  }
}

export function setLocalStorage (key: string, value: string) {
  try {
    if (typeof(localStorage) === 'undefined') {
      return '';
    }
	  return localStorage.setItem(key, value);
  } catch (error) {
	  // Accessing local storage can be blocked by third party cookie settings
	  console.log('Error accessing localStorage: ' + JSON.stringify(error));
	  return;
  }
}

export {
  BROWSER,
  CURRENT_API,
  FASP_API,
  LS_CONNECT_APP_ID,
  SDK_LOCATION,
  SESSION_ID,
  SESSION_KEY,
  SS_SESSION_LASTKNOWN_ID
};
