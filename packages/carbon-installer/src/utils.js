let ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
let check_safari = function(ua,minver) {
    var match = ua.match(/(?:Version)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
let check_edge = function(ua,minver) {
    var match = ua.match(/(?:Edge)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
let check_firefox = function(ua,minver) {
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
    CONTINUE: 'continue',
    DOWNLOAD_CONNECT: 'downloadconnect',
    DOWNLOAD_INDICATOR_VISIBLE: 'download_indicator_visible',
    REFRESH: 'refresh',
    REMOVE_IFRAME: 'removeiframe',
    RESIZE: '100%',
    SAFARI_MITIGATE: 'mitigate_with_tab'
};

var parseSearchString = function(key) {
    return unescape(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + escape(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
};

const Utils = {
  BROWSER: {
      OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
      IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
      CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
      FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && check_firefox(ua, 50),
      FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !check_firefox(ua, 50),
      EDGE_WITH_EXTENSION: /edge/i.test(ua) && check_edge(ua, 14),
      EDGE_LEGACY: /edge/i.test(ua) && !check_edge(ua, 14),
      SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
      SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && check_safari(ua, 10)
  },
  
  currentBrowser () {
    return Object.keys(this.BROWSER).find(key => this.BROWSER[key] === true).toString();
  },
  
  locale () {
    return parseSearchString('awlang') || navigator.language ||
    navigator.userLanguage.replace(/(.*-)(.*)/, function(a, b, c) {return b + c.toUpperCase()}) || 'en-US';
  },
  
  openTab (url) {
    let win = window.open(url, '_blank');
    win.focus();
  },

  previousVersionException () {
    this.sendContinueEvent();
    return false;
  },

  refresh () {
    this.sendParentMessage('refresh');
    return false;
  },
  
  sendCloseEvent () {
    this.sendEvent(EVENT.REMOVE_IFRAME);
  },
  
  sendContinueEvent () {
    this.sendEvent(EVENT.CONTINUE);
  },
  
  sendDownloadEvent () {
    this.sendEvent(EVENT.CLICKED_DOWNLOAD_APP);
    // this.sendEvent(EVENT.DOWNLOAD_CONNECT);
  },
  
  sendDownloadIndicatorEvent () {
    this.sendEvent(EVENT.DOWNLOAD_INDICATOR_VISIBLE);
  },
  
  sendEvent (event) {
    if (event) {
      this.sendParentMessage(event);
    }
  },
  
  sendExtensionEvent () {
    let event;
    
    if (this.BROWSER.CHROME || this.BROWSER.EDGE_WITH_EXTENSION) {
      event = EVENT.CLICKED_INSTALL_EXTENSION;
    } else if (this.BROWSER.FIREFOX) {
      event = EVENT.CLICKED_INSTALL_ADDON;
    } else if (this.BROWSER.IE || this.BROWSER.SAFARI) {
      event = EVENT.CLICKED_ENABLE_EXTENSION;
    }
    
    this.sendEvent(event);
  },
  
  sendInstallAppEvent () {
    this.sendEvent(EVENT.CLICKED_INSTALL_APP);
  },

  sendParentMessage (message) {
    console.log(`Sending message to parent window: ${message}`)
    window.parent.postMessage(message, '*');
  },
  
  sendRefreshEvent () {
    this.sendEvent(EVENT.REFRESH);
  },
  
  sendResizeEvent () {
    this.sendEvent(EVENT.RESIZE);
  },
  
  sendSafariMitigate () {
    this.sendEvent(EVENT.SAFARI_MITIGATE);
  },
  
  sendTroubleshootEvent () {
    this.sendEvent(EVENT.CLICKED_TROUBLESHOOT);
  },

  troubleshoot () {
    this.sendTroubleshootEvent();
    this.openTab('https://test-connect.asperasoft.com');
    return false;
  }
};

// Easily check if browser uses extensions
Utils.NO_EXTENSION = Utils.BROWSER.SAFARI || Utils.BROWSER.IE || Utils.BROWSER.EDGE_LEGACY || Utils.BROWSER.FIREFOX_LEGACY;
Utils.EXTENSION = !Utils.NO_EXTENSION;

export default Utils;
