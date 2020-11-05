let ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
let check_safari = function(ua: string, minver: number) {
    var match = ua.match(/(?:Version)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
let check_edge = function(ua: string, minver: number) {
    var match = ua.match(/(?:Edge)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
let check_firefox = function(ua: string, minver: number) {
    var match = ua.match(/(?:Firefox)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};

const EVENT = {
    CLICKED_DOWNLOAD_APP: 'clicked_download_app',
    CLICKED_ENABLE_EXTENSION: 'clicked_enable_extension',
    CLICKED_INSTALL_ADDON: 'clicked_install_addon',
    CLICKED_INSTALL_APP: 'clicked_install_app',
    CLICKED_INSTALL_EXTENSION: 'clicked_install_extension',
    CLICKED_TROUBLESHOOT: 'clicked_troubleshoot',
    CONNECT_BAR_VISIBLE: 'connect_bar_visible',
    CONTINUE: 'continue',
    DOWNLOAD_CONNECT: 'downloadconnect',
    DOWNLOAD_INDICATOR_VISIBLE: 'download_indicator_visible',
    REFRESH: 'refresh',
    REMOVE_IFRAME: 'removeiframe',
    RESIZE: '100%',
    SAFARI_MITIGATE: 'mitigate_with_tab'
};

export const BROWSER = {
    OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
    IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
    CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
    FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && check_firefox(ua, 50),
    FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !check_firefox(ua, 50),
    EDGE_CHROMIUM: /edg/i.test(ua) && !/edge/i.test(ua),
    EDGE_WITH_EXTENSION: /edge/i.test(ua) && check_edge(ua, 14),
    EDGE_LEGACY: /edge/i.test(ua) && !check_edge(ua, 14),
    SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
    SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && check_safari(ua, 10)
};

// Easily check if browser uses extensions
export const NO_EXTENSION = BROWSER.SAFARI || BROWSER.IE || BROWSER.EDGE_LEGACY || BROWSER.FIREFOX_LEGACY;
export const EXTENSION = !NO_EXTENSION;

interface QueryParameters {
  [key: string]: string;
}
let queryParams: QueryParameters = {};

function getQueryString () {
  let querystring = '';
  if (window && window.btoa) {
    Object.keys(queryParams).map(function(key, index) {
      // if (!querystring) {
      //   querystring = '';
      // }

      let value = queryParams[key];
      let separator = index === 0 ? '?' : '&';
      querystring += separator + key + '=' + window.btoa(value);
      console.log('getQueryString(): ', querystring);
    });
  }

  return querystring;
};

// Returns os platform. Modified from ConnectInstaller.
function getOs () {
  let os;
  if (/Win/.test(navigator.platform)) {
    os = 'windows'
  } else if (/Mac OS X 10[._]6/.test(navigator.userAgent)) {
    os = 'macos';
  } else if (/Mac/.test(navigator.platform)) {
    os = 'macos';
  } else if (/Linux x86_64/.test(navigator.platform)) {
    os = 'linux';
  } else if (/Linux/.test(navigator.platform)) {
    os = 'linux';
  }

  return os;
};

export function isLinux() {
  return getOs() === 'linux';
}

export function isMac() {
  return getOs() === 'macos';
}

export function isWindows() {
  return getOs() === 'windows';
}

export function getLocalStorage (key: string) {
  try {
    if (typeof localStorage === 'undefined') {
      return '';
    }

    return localStorage.getItem(key);
  } catch (error) {
    // Accessing local storage can be blocked by third party cookie settings or incognito mode
    console.log('Access to localStorage is blocked. Check third party cookie settings.');
    console.log(JSON.stringify(error));
    return '';
  }
}

export function getTroubleshootUrl () {
  let url = 'https://test-connect.asperasoft.com';
  let querystring = getQueryString();
  if (querystring) {
    url += querystring;
  }

  return url;
};

export function openTab (url: string) {
  let win = window.open(url, '_blank');
  if (win) {
    win.focus();
  }
};

// function previousVersionException () {
//   sendContinueEvent();
//   return false;
// };

// function refresh () {
//   sendParentMessage('refresh');
//   return false;
// };

export function sendCloseEvent () {
  sendEvent(EVENT.REMOVE_IFRAME);
};

export function sendConnectBarVisible() {
  sendEvent(EVENT.CONNECT_BAR_VISIBLE);
};

// function sendContinueEvent () {
//   sendEvent(EVENT.CONTINUE);
// };

export function sendDownloadEvent () {
  sendEvent(EVENT.CLICKED_DOWNLOAD_APP);
  // this.sendEvent(EVENT.DOWNLOAD_CONNECT);
};

export function sendDownloadIndicatorEvent () {
  sendEvent(EVENT.DOWNLOAD_INDICATOR_VISIBLE);
};

function sendEvent (event?: string) {
  if (event) {
    sendParentMessage(event);
  }
};

export function sendExtensionEvent () {
  let event;

  if (BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION) {
    event = EVENT.CLICKED_INSTALL_EXTENSION;
  } else if (BROWSER.FIREFOX) {
    event = EVENT.CLICKED_INSTALL_ADDON;
  } else if (BROWSER.IE || BROWSER.SAFARI) {
    event = EVENT.CLICKED_ENABLE_EXTENSION;
  }

  sendEvent(event);
};

export function sendInstallAppEvent () {
  sendEvent(EVENT.CLICKED_INSTALL_APP);
};

function sendParentMessage (message: string) {
  console.log(`Sending message to parent window: ${message}`)
  window.parent.postMessage(message, '*');
};

export function sendRefreshEvent () {
  sendEvent(EVENT.REFRESH);
};

export function sendResizeEvent () {
  sendEvent(EVENT.RESIZE);
};

export function sendSafariMitigate () {
  sendEvent(EVENT.SAFARI_MITIGATE);
};

function sendTroubleshootEvent () {
  sendEvent(EVENT.CLICKED_TROUBLESHOOT);
};

export function setCorrelationId (id: string) {
  queryParams.id = id;
};

export function setSdkVersion (version: string) {
  queryParams.ver = version;
};

export function troubleshoot () {
  sendTroubleshootEvent();
  let url = getTroubleshootUrl();
  openTab(url);
  return false;
}
