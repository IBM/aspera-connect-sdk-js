import * as Logger from './logger';
import BROWSER from './shared/browser'
import {
  FASP_API, //export directly
  CURRENT_API,
  LS_CONTINUED_KEY,
  LS_CONNECT_APP_ID, //export directly
  SS_SESSION_LASTKNOWN_ID,
} from './shared/constants'
import { SESSION_ID, SESSION_KEY } from './shared/sharedInternals';
import * as aesjs from 'aes-js';
const crypt = { aesjs: aesjs };

/** section: API
 * class AW4.Utils
 *
 * The [[AW4.Utils]] class contains helper functions for the developer.
 **/
SESSION_ID.set(generateUuid());
SESSION_KEY.set(generateRandomStr(32))

let SDK_LOCATION: string = '';

var nextObjId = 0;

var initUrlWampParams = '';

export function getInitUrl() {
  return CURRENT_API + '://initialize/?key=' + SESSION_KEY.value() + '&id=' + SESSION_ID.value() + initUrlWampParams;
};

////////////////////////////////////////////////////////////////////////////
// Compatibility functions
////////////////////////////////////////////////////////////////////////////

// (function() {
//     /*  Add TIMEOUT arguments support to IE < 9
//       *  https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers.setTimeout
//       */
//         if(document.all&&!window.setTimeout.isPolyfill){var __nativeST__=window.setTimeout;window.setTimeout=function(e,t){var n=Array.prototype.slice.call(arguments,2);return __nativeST__(e instanceof Function?function(){e.apply(null,n)}:e,t)},window.setTimeout.isPolyfill=!0}if(document.all&&!window.setInterval.isPolyfill){var __nativeSI__=window.setInterval;window.setInterval=function(e,t){var n=Array.prototype.slice.call(arguments,2);return __nativeSI__(e instanceoFunction?function(){e.apply(null,n)}:e,t)},window.setInterval.isPolyfill=!0}
// }());
    
export function createError (errorCode: any, message: any) {
  var internalMessage = '';
  if (errorCode == -1) {
    internalMessage = 'Invalid request';
  }
  return {error: {code: errorCode, internal_message: internalMessage, user_message: message}};
};


/*
 * - str
 * @returns {Object}
 */
export function parseJson (str: any) {
  var obj;
  if ( typeof str === 'string' && (str.length === 0 || str.replace(/\s/g, '') === '{}')) {
    return {};
  }
  try {
    obj = JSON.parse(str);
  } catch (e) {
    obj = createError(-1, e);
  }
  return obj;
};

////////////////////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////////////////////

/*
  * x - variable we want to check
  * @returns {Boolean} - true if the value is null, empty or undefined
  */
export function isNullOrUndefinedOrEmpty (x: any) {
  return x === '' || x === null || typeof x === 'undefined';
};
    
// function getSessionId() {
//   var id = SESSION_ID.value();
//
//   if (typeof sessionStorage != 'undefined') {
//     var idfss: any = sessionStorage.getItem(SS_SESSION_LASTKNOWN_ID);
//     if (!isNullOrUndefinedOrEmpty(idfss))
//       id = idfss;
//     }
//     return id;
// }

// function getAppWampLaunchAttempted() {
//     var yes = false;
//
//     if (typeof sessionStorage != 'undefined') {
//         var val = sessionStorage.getItem(SS_APPSIDE_WAMPSESSN_LAUNCH_ATTEMPTED);
//
//         if (!isNullOrUndefinedOrEmpty(val) && (val === 'yes'))
//             yes = true;
//     }
//
//     return yes;
// }
//
// function setAppWampLaunchAttempted(yes) {
//     var ok = false;
//
//     if ((typeof sessionStorage != 'undefined') && (typeof yes === 'boolean')) {
//         sessionStorage.setItem(SS_APPSIDE_WAMPSESSN_LAUNCH_ATTEMPTED,
//             (yes ? 'yes' : 'no'));
//         ok = true;
//     }
//
//     return ok;
// }

/*
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
  var versionToArray = function( version: string ) {
    var splits = version.split('.');
    var versionArray = new Array();
    for (var i = 0; i < splits.length; i++) {
      var versionPart = parseInt(splits[i], 10);
      if (!isNaN(versionPart)) {
        versionArray.push(versionPart);
      }
    }
    return versionArray;
  };
  var a_arr = versionToArray(a);
  var b_arr = versionToArray(b);
  var i;
  for ( i = 0; i < Math.min(a_arr.length, b_arr.length); i++ ) {
    // if i=2, a=[0,0,1,0] and b=[0,0,2,0]
    if( a_arr[i] < b_arr[i] ) {
      return true;
    }
    // if i=2, a=[0,0,2,0] and b=[0,0,1,0]
    if( a_arr[i] > b_arr[i] ) {
      return false;
    }
    // a[i] and b[i] exist and are equal:
    // move on to the next version number
  }
  // all numbers equal (or all are equal and we reached the end of a or b)
  return false;
};
    
export function checkVersionException (): boolean {
  if (typeof(localStorage) == 'undefined')
    return false;
  var prevContinuedSeconds = Number(localStorage.getItem(LS_CONTINUED_KEY));
  if (prevContinuedSeconds !== undefined && prevContinuedSeconds !== null) {
    var currentTimeSeconds = Math.round(new Date().getTime()/1000);
    if ((currentTimeSeconds - prevContinuedSeconds) < 60*24){
      Logger.debug('User opted out of update');
      return true;
    }
  }
  return false;
};

export function addVersionException (): void {
  if (typeof(localStorage) == 'undefined')
    return;
  localStorage.setItem(LS_CONTINUED_KEY, String(Math.round(new Date().getTime() / 1000)));
};

/**
 * Generate a random uuid string.
 */
export function generateUuid (): string {
  var date = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
};

export function generateRandomStr (size: number): string {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < size; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  
  return text;
};

export function encrypt (data: any) {
  var dataBytes = crypt.aesjs.utils.utf8.toBytes(data);
  var key = crypt.aesjs.utils.utf8.toBytes(SESSION_KEY.value());
  var iv = crypt.aesjs.utils.utf8.toBytes(generateRandomStr(16));
  // The counter is optional, and if omitted will begin at 1
  var aesOfb = new crypt.aesjs.ModeOfOperation.ofb(key, iv);
  var encryptedBytesString = aesOfb.encrypt(dataBytes);

  // To print or store the binary data, you may convert it to hex
  var encryptedHex = crypt.aesjs.utils.hex.fromBytes(iv)+'.'+crypt.aesjs.utils.hex.fromBytes(encryptedBytesString);
  return encryptedHex;
};

export function decrypt (data: any) {
  let arr = data.split('.');
  if(arr.length != 2){
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
};

// var setBasicWampSettings = function(settings) {
//     WAMP_ROUTER = settings.wampRouter;
//     WAMP_REALM = settings.wampRealm;
//     WEBSOCKET_PORT = settings.websocketPort;
//     IS_WEBSOCKET_SECURE = settings.isWebsocketSecure;
// }

//| returns true when
//|  *) the already set settings match exactly the ones in the passed-in argument.
// var checkBasicWampSettings = function(settings) {
//     return ((WAMP_ROUTER === settings.wampRouter) && (WAMP_REALM === settings.wampRealm) &&
//         (WEBSOCKET_PORT === settings.websocketPort) &&
//         (IS_WEBSOCKET_SECURE === settings.isWebsocketSecure));
// }
//

// interface Callback {
//   success: any;
//   error: any;
// }
/**
  * AW4.Utils.launchConnect(callback) -> null
  * - callback (function):  It will be called once we have determined if
  *  connect is installed in the system [CHROME/OPERA]
  *
  * Attempt to launch connect. It will handle different browser
  * implementations to not end in an error page or launch multiple
  * times.
  *
  * [CHROME/OPERA] will return true if Connect is installed
  *
  * ##### Object returned to success callback as parameter
  *
  * 1. `true` : if Aspera Connect is installed
  * 2. `false` : if Aspera Connect is either not installed or we couldn't
  * detect it.
  **/
export function launchConnect (userCallback?: (t: boolean) => any) {
  let isRegistered = false;
  let callback = (installed: boolean) => {
      if (typeof userCallback === 'function') {
          userCallback(installed);
      }
  }

  let launchUri = getInitUrl();
  Logger.log('Starting Connect session: ' + launchUri);
  if (BROWSER.CHROME || BROWSER.OPERA) {
    document.body.focus();
    document.body.onblur = function() {
        isRegistered = true;
    };
    //will trigger onblur
    document.location.href = launchUri;
    //Note: timeout could vary as per the browser version, have a higher value
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
};

/**
  * AW4.Utils.getFullURI(relativeURL) -> String
  *  - relativeURL (String):  The relative URL that we want the full path to,
  *  it must be relative to the current page being rendered. If a full URL is
  *  provided, it will return the same.
  *
  *  @returns {String} - the full URL or null
  **/
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
  * AW4.Utils.utoa(inputString) -> String
  * - inputString: The inputString can be utf8 or unicode. The output string is
  * a base64 string.
  **/
export function utoa (inputString: string) {
  if (window.btoa) {
    return window.btoa(unescape(encodeURIComponent(inputString)));
  } else {
    return inputString;
  }
}

/**
  * AW4.Utils.atou(inputString) -> String
  * - inputString: The input string is a base64 string. The output is a unicode
  * string.
  **/
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

export function getLocalStorage(key: string) {
	     try {
	         if (typeof(localStorage) == 'undefined')
	             return '';
	         return localStorage.getItem(key);
	     } catch(error) {
	         // Accessing local storage can be blocked by third party cookie settings
	         console.log('Error accessing localStorage: ' + JSON.stringify(error));
	         return '';
	     }
	 }
	
export function setLocalStorage(key: string, value: string) {
	     try {
	         if (typeof(localStorage) == 'undefined')
	             return '';
	         return localStorage.setItem(key, value);
	     } catch(error) {
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
   }
