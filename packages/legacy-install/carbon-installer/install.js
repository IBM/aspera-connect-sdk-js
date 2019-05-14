var ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
var check_safari = function(ua,minver) {
    var match = ua.match(/(?:Version)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
var check_edge = function(ua,minver) {
    var match = ua.match(/(?:Edge)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
check_firefox = function(ua,minver) {
    var match = ua.match(/(?:Firefox)[\/](\d+(\.\d+)?)/i);
    var ver = parseInt((match && match.length > 1 && match[1] || '0'));
    return (ver >= minver);
};
var BROWSER = {
    OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
    IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
    CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
    FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && check_firefox(ua, 50),
    FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !check_firefox(ua, 50),
    EDGE_WITH_EXTENSION: /edge/i.test(ua) && check_edge(ua, 14),
    EDGE_LEGACY: /edge/i.test(ua) && !check_edge(ua, 14),
    SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
    SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && check_safari(ua, 10)
};

var EDGE = BROWSER.EDGE_LEGACY || BROWSER.EDGE_WITH_EXTENSION;
var NO_EXTENSION = BROWSER.SAFARI || BROWSER.IE || BROWSER.EDGE_LEGACY || BROWSER.FIREFOX_LEGACY;

var loadCSSFile = function(filename){
  var fileref=document.createElement('link');
  fileref.setAttribute('rel', 'stylesheet');
  fileref.setAttribute('type', 'text/css');
  fileref.setAttribute('href', filename);

  document.getElementsByTagName('head')[0].appendChild(fileref);
};

var parseSearchString = function(key) {
    return unescape(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + escape(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
};

var language = function(){
  return parseSearchString('awlang') || navigator.language ||
  navigator.userLanguage.replace(/(.*-)(.*)/, function(a, b, c) {return b + c.toUpperCase()}) || 'en-US';
};

var longLanguage = language().indexOf('fr') === 0 || language().indexOf('es') === 0;

var localize = function(id, lang) {
  var ret;
  lang = lang || 'en-US';
  if (typeof(AW4.localize) === 'undefined') {
    // There's no localize object at all.
    return id;
  }
  if (typeof(AW4.localize[lang]) === 'undefined') {
    // This language isn't available. Try the two-letter
    // language code. Otherwise, fallback to en-US or the ID.
    try {
      return AW4.localize[lang.substring(0, 2)][id];
    } catch (e) {
      return AW4.localize['en-US'][id] || id;
    }
  }
  ret = AW4.localize[lang][id];
  if (typeof(ret) === 'undefined') {
    // This string ID doesn't exist for this language,
    // try en-US, fallback to return the ID.
    return AW4.localize['en-US'][id] || id;
  }
  return ret;
};

var openTab = function(url) {
  var win = window.open(url, '_blank');
  win.focus();
};

var sendParentMessage = function(message) {
  // Not passing sensitive information. The '*' is acceptable
  parent.postMessage(message, '*');
};

var triggerExtensionCheck = function() {
    var dummyIframe = document.createElement('IFRAME');
    dummyIframe.src = 'fasp://initialize?checkextensions';
    dummyIframe.style.visibility = 'hidden';
    dummyIframe.style.position = 'absolute';
    dummyIframe.style.width = '0px';
    dummyIframe.style.height = '0px';
    dummyIframe.style.border = '0px';
    document.body.appendChild(dummyIframe);
}

var retry = function() {
    if (BROWSER.SAFARI) {
        triggerExtensionCheck();
    }
    sendParentMessage('refresh');
};

var resizeEvent = function () {
    if (document.documentElement.clientWidth < 900) {
        document.body.className = 'small-window';
    } else {
        document.body.className = '';
    }
}

var getLocalStorage = function(key) {
  try {
      if (typeof(localStorage) == 'undefined')
          return '';
      return localStorage.getItem(key);
  } catch(error) {
        // Accessing local storage can be blocked by third party cookie settings
        console.log('Error accessing localStorage: ' + JSON.stringify(error));
        return '';
  }
};

var setLocalStorage = function(key, value) {
  try {
      if (typeof(localStorage) == 'undefined')
          return '';
      return localStorage.setItem(key, value);
  } catch(error) {
        // Accessing local storage can be blocked by third party cookie settings
        console.log('Error accessing localStorage: ' + JSON.stringify(error));
        return;
  }
};

// Keep track of downloads to avoid redundant download requests
var LS_LAST_HREF = 'aspera-last-downloaded';
var LS_DOWNLOAD_TIME = 'aspera-download-time';
var lastDownloadedVersion = function() {
    return getLocalStorage(LS_LAST_HREF);
};
var setLastDownloadedVersion = function(ver) {
    setLocalStorage(LS_LAST_HREF, ver);
    setLocalStorage(LS_DOWNLOAD_TIME, Date.now());
};

var isDownloadRecent = function() {
    var downloadTime = getLocalStorage(LS_DOWNLOAD_TIME);
    if (!downloadTime)
        return false;
    var timeDiff = Date.now() - downloadTime;
    return timeDiff < 30000;
};

var LS_CONNECT_DETECTED = 'aspera-last-detected';

function recordConnectInstall() {
    setLocalStorage(LS_CONNECT_DETECTED, Date.now());
}

var prepareDownloadButton = function(element, href) {
  element.setAttribute('lang', language());
  // HACK: The download button is not always the download button
  element.textContent = localize('download-app', language());
  element.setAttribute('href', href);
};

var prepareInstallButton = function(element, isOutdated, href) {
  element.setAttribute('lang', language());
  if (isOutdated) {
    element.textContent = localize('upgrade-connect', language());
  } else {
    element.textContent = localize('install-connect', language());
  }
};

var prepareRetryButton = function(element, href) {
  element.textContent = localize('retry-button', language());
  element.setAttribute('lang', language());
  element.onclick = function() {
    retry();
    return false;
  };
};

var prepareDownloadRetryButton = function(element, href) {
  element.textContent = localize('download-connect', language());
  element.setAttribute('href', href);
  element.setAttribute('lang', language());
};

var prepareContinueButton = function(element, href) {
  element.textContent = localize('continue-button', language());
};

var prepareRefreshButton = function(element, href) {
  element.textContent = localize('refresh-button', language());
  element.setAttribute('lang', language());
};

var prepareDownloadIndicator = function(element, state) {
  element.style.display = 'inline-block';
  if (state == 'download') {
    element.textContent = localize('please-download', language());
  } else if (state == 'install') {
    element.textContent = localize('run-installer', language());
  }
   element.setAttribute('lang', language());
};

var prepareActiveButton = function(button, inside_button) {
  button.className = 'big-button-active';
  inside_button.className = 'filled-button';
};

var prepareNotActiveButton = function(button, inside_button) {
  button.className = 'big-button-non-active';
  inside_button.className = 'not-filled-button';
};
// NOTE: This code is included from AW4.ConnectInstaller#getExtensionStoreLink
var getExtensionStoreLink = function() {
    if (BROWSER.FIREFOX === true) {
        return 'https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect';
    } else if (BROWSER.EDGE_WITH_EXTENSION === true) {
        return 'ms-windows-store://pdp/?productid=9N6XL57H8BMG';
    } else if (BROWSER.CHROME === true) {
        return 'https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn';
    }
    console.log('This browser does not use the extension store.');
    return '';
};

var prepareDownloadExtensionButton = function(element, href) {
  if (BROWSER.FIREFOX || BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION) {
    element.textContent = localize('install-extension', language());
  } else if (BROWSER.IE || BROWSER.SAFARI) {
    element.textContent = localize('install-ext', language());
  }
  element.setAttribute('lang', language());
  element.setAttribute('href', getExtensionStoreLink());
  element.setAttribute('target', "_blank");
};

var fadeOutDownloadIndicator = function(image) {
  var opacity = 1;
  var timer = setInterval(function(){
    if(opacity <= 0){
      image.style.display = 'none';
      clearInterval(timer);
    }
    image.style.opacity = opacity;
    opacity -=  0.05;
  }, 500);
}

var setButtonToDisabled = function(element) {
  element.removeAttribute('href');
  element.removeAttribute('target');
  element.disabled = true;
  element.onclick = function() {return false;}
}

var hideAllBySelector = function(document, selector) {
  var k = document.getElementsByClassName(selector);
  for (i=0; i < k.length; i++){
    k[i].style.display = 'none';
  }
};

var changeStateToInstall = function(state) {
  document.getElementById('step-one-checkmark').style.visibility = 'visible';
  document.getElementById('step-two-checkmark').style.visibility = 'hidden';
  document.getElementById('step-three-checkmark').style.visibility = 'hidden';
  if (BROWSER.SAFARI || BROWSER.IE) {
    setButtonToDisabled(document.getElementById('step-one-inside-button'));
    setButtonToDisabled(document.getElementById('step-three-inside-button'));
    document.getElementById('step-two-inside-button').setAttribute('href', '');
    document.getElementById('download-installer-text').style.display = 'none';
    document.getElementById('step-two-inside-button').onclick = function(){
      document.getElementById('download-bottom').style.display = 'inline-block';
      prepareDownloadIndicator(document.getElementById('run-installer-text'), state);
      return false;
    }
    prepareInstallButton(document.getElementById('step-two-inside-button'), isOutdated, '');
    prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  } else if (BROWSER.EDGE || BROWSER.FIREFOX || BROWSER.CHROME) {
    setButtonToDisabled(document.getElementById('step-one-inside-button'));
    setButtonToDisabled(document.getElementById('step-two-inside-button'));
    prepareInstallButton(document.getElementById('step-three-inside-button'), isOutdated, '');
    document.getElementById('download-installer-text').style.display = 'none';
    document.getElementById('step-three-inside-button').disabled = false;
    document.getElementById('step-three-inside-button').onclick = function(){
      document.getElementById('download-bottom').style.display = 'inline-block';
      prepareDownloadIndicator(document.getElementById('run-installer-text'), state);
      return false;
    }
    prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  }
  fadeOutDownloadIndicator(document.getElementById('download-bottom'));
};

var setExtensionStore = function(elem) {
  elem.onclick = function() {
    var lnk = getExtensionStoreLink();
    if (lnk != '') {
      window.open(lnk, '_blank');
    }
  }
}

var lastState = '';
var downloadLink = '';
var isOutdated = false;
var downloadClicked = false;
var handleMessage = function(event) {
  if (typeof event.data != 'string')
    return;
  // update message
  var state = event.data;
  if (state === 'launching'
    || state === 'update'
    || state === 'retry'
    || state === 'outdated'
    || state === 'running'
    || state === 'continue'
    || state === 'extension_install'
    || state === 'download'
    || state === 'install'
    || state === 'unsupported_browser')
  {
    if (state === 'download' && isDownloadRecent())
      state = 'install';
    document.getElementsByClassName('connect-status-banner-container')[0].style.display = state == 'launching' || 'running' || 'unsupported_browser' ? 'inline-block' : 'none';
    if (state === 'extension_install' || state === 'download' || state === 'install' || state === 'outdated' || state === 'failed' || state === 'retry'){
      sendParentMessage('100%');
      document.documentElement.style.height = '452px';
      document.getElementsByClassName('connect-status-banner-container')[0].style.display = 'none';
      document.getElementsByClassName('three-step-installer')[0].style.display = 'inline-block';
      document.getElementById("extension-title").textContent = localize("ext-install", language());

      if (state == 'outdated') {
        isOutdated = true;
      }
      if (BROWSER.SAFARI || BROWSER.IE) {
        document.getElementById('step-one-inside-button').textContent = localize('download-app', language());
        if (BROWSER.SAFARI) {
          document.getElementById('text-how').textContent = localize('how', language());
        }
        if (state === 'outdated') {
          document.getElementById('step-two-inside-button').textContent = localize('upgrade-connect', language());
        } else {
          document.getElementById('step-two-inside-button').textContent = localize('install-connect', language());
        }
        document.getElementById('step-three-inside-button').textContent = localize('enable-extension', language());
      } else if (BROWSER.EDGE || BROWSER.FIREFOX || BROWSER.CHROME) {
        document.getElementById('step-three-how').style.display = 'none';
        document.getElementById('step-one-inside-button').textContent = localize('install-extension', language());
        document.getElementById('step-two-inside-button').textContent = localize('download-app', language());
        if (state === 'outdated') {
          document.getElementById('step-three-inside-button').textContent = localize('upgrade-connect', language());
        } else {
          document.getElementById('step-three-inside-button').textContent = localize('install-connect', language());
        }
      }
      if (state === 'extension_install' || state === 'outdated' || state === 'failed' || state === 'retry') {
        if (BROWSER.SAFARI || BROWSER.IE) {
          setButtonToDisabled(document.getElementById('step-one-inside-button'));
          setButtonToDisabled(document.getElementById('step-two-inside-button'));
          //add onclick and How? button with hover over
          document.getElementById('step-three-new').style.display = 'inline';
          document.getElementById('step-three-new').textContent = localize('new', language());
          document.getElementById('step-one-checkmark').style.visibility = 'visible';
          document.getElementById('step-two-checkmark').style.visibility = 'visible';
          document.getElementById('step-three-checkmark').style.visibility = 'hidden';
          prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
          prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
          prepareActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
        } else if (BROWSER.EDGE || BROWSER.FIREFOX || BROWSER.CHROME) {
          setButtonToDisabled(document.getElementById('step-two-inside-button'));
          setButtonToDisabled(document.getElementById('step-three-inside-button'));
          document.getElementById('step-one-inside-button').setAttribute('href', '');
          document.getElementById('step-one-new').style.display = "inline";
          document.getElementById('step-one-checkmark').style.visibility = 'hidden';
          document.getElementById('step-two-checkmark').style.visibility = 'hidden';
          document.getElementById('step-three-checkmark').style.visibility = 'hidden';
          prepareActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
          prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
          prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
        }
      } else if (state === 'download') {
        document.getElementById('step-three-button').style.opacity = '1';
        document.getElementById('run-installer-text').style.display = 'none';
          if (BROWSER.SAFARI || BROWSER.IE) {
            setButtonToDisabled(document.getElementById('step-two-inside-button'));
            setButtonToDisabled(document.getElementById('step-three-inside-button'));
            document.getElementById('step-one-inside-button').setAttribute('href', '');
            document.getElementById('step-one-inside-button').onclick = function(){
              downloadClicked = true;
              document.getElementById('download-bottom').style.display = 'inline-block';
              prepareDownloadIndicator(document.getElementById('download-installer-text'), state);
              sendParentMessage('downloadconnect');
            }
            document.getElementById('step-one-checkmark').style.visibility = 'hidden';
            document.getElementById('step-two-checkmark').style.visibility = 'hidden';
            document.getElementById('step-three-checkmark').style.visibility = 'hidden';
            prepareActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
            prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
            prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
          } else if (BROWSER.FIREFOX || BROWSER.EDGE || BROWSER.CHROME) {
            document.getElementById('step-one-new').style.display = 'none';
            document.getElementById('run-installer-text').style.display = 'none';
            setButtonToDisabled(document.getElementById('step-one-inside-button'));
            setButtonToDisabled(document.getElementById('step-three-inside-button'));
            document.getElementById('step-two-inside-button').setAttribute('href', '');
            document.getElementById('step-two-inside-button').onclick = function(){
              downloadClicked = true;
              document.getElementById('download-bottom').style.display = 'inline-block';
              prepareDownloadIndicator(document.getElementById('download-installer-text'), state);
              sendParentMessage('downloadconnect');
            }
            document.getElementById('step-one-checkmark').style.visibility = 'visible';
            document.getElementById('step-two-checkmark').style.visibility = 'hidden';
            document.getElementById('step-three-checkmark').style.visibility = 'hidden';
            prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
            prepareActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
            prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
          }
          fadeOutDownloadIndicator(document.getElementById('download-bottom'));

        } else if (state == 'install') { //state install
        //wait 10 sec before showing install state if previous state was download and we're waiting for download to be completed.
          if (downloadClicked) {
            setTimeout(changeStateToInstall, 10000);
          } else {
            changeStateToInstall();
          }
        }
      } else {
      sendParentMessage('80px');
      document.documentElement.style.height = '80px';
      document.getElementsByClassName('connect-logo')[0].style.display = 'inline-block';
      document.getElementById('launching-container').style.display = state == 'launching' ? 'inline-block' : 'none';
      document.getElementById('running-container').style.display = state == 'running' ? 'inline-block' : 'none';
      document.getElementsByClassName('three-step-installer')[0].style.display = state == 'extension_install' || state == 'download' || state == 'install' ? 'inline-block' : 'none';
      document.getElementById('unsupported-container').style.display = state == 'unsupported_browser' ? 'inline-block' : 'none';
      if (state == 'launching') {
        document.getElementById('launching-container-text').textContent = localize('launching', language());
      } else if (state == 'running') {
        document.getElementById('running-container-text').textContent = localize('running', language());
      } else if (state == 'unsupported_browser') {
        var unsupported = localize('not-supported', language());
        var unsupported_with_link = unsupported.replace("<a>", "<a href=\"https://test-connect.asperasoft.com\" target=\"_blank\">");
        document.getElementById('unsupported-text').textContent = unsupported_with_link;
      } else if (state == 'running') {
        recordConnectInstall();
      }
    }
  } else if (state.indexOf('downloadlink') === 0) {
    var href = state.substring(state.indexOf('=') + 1);
    downloadLink = href;
    if (BROWSER.CHROME || BROWSER.FIREFOX || BROWSER.EDGE) {
      prepareDownloadExtensionButton(document.getElementById('step-one-inside-button'), href);
      prepareDownloadButton(document.getElementById('step-two-inside-button'), href);
      prepareInstallButton(document.getElementById('step-three-inside-button'), isOutdated, href);
    } else if (BROWSER.IE || BROWSER.SAFARI) {
      prepareDownloadButton(document.getElementById('step-one-inside-button'), href);
      prepareInstallButton(document.getElementById('step-two-inside-button'), isOutdated, href);
      prepareDownloadExtensionButton(document.getElementById('step-three-inside-button'), href);
    }
    prepareDownloadButton(document.getElementById('security-update-container-download-link'), href);
    prepareContinueButton(document.getElementById('security-update-container-continue-link'), href);
  } else if (state.indexOf('insertstylesheet') === 0) {
    //Add custom css files
    var cssHref = state.substring(state.indexOf('=') + 1);
    loadCSSFile(cssHref);
  }
   lastState = state;
};

var handleOnLoad = function(event) {
  try {
        ////////////////////////////////////////////////////////////////////////////
    // Browser helpers
    // https://github.com/ded/bowser
    // MIT License | (c) Dustin Diaz 2014
    ////////////////////////////////////////////////////////////////////////////
    //Compose localized refresh link, and set the localized text for all the UI
    var downloadLocalizedMessage =
      " <a href=\"#\" onclick=\"openTab('https://test-connect.asperasoft.com'); return false;\">" +
      localize('troubleshoot', language()) +
      "</a>";
    if (BROWSER.SAFARI || BROWSER.IE) {
      document.getElementById('step-three-new').textContent = localize('new', language());
      document.getElementById('step-one-inside-button').textContent = localize('download-app', language());
      document.getElementById('step-two-inside-button').textContent = localize('install-connect', language());
      document.getElementById('step-three-inside-button').textContent = localize('enable-extension', language());
    } else if (BROWSER.EDGE || BROWSER.FIREFOX || BROWSER.CHROME) {
      document.getElementById('step-one-new').textContent = localize('new', language());
      document.getElementById('step-one-inside-button').textContent = localize('install-extension', language());
      document.getElementById('step-two-inside-button').textContent = localize('download-app', language());
      document.getElementById('step-three-inside-button').textContent = localize('install-connect', language());
    }
    document.getElementById('step-one-text').textContent = localize('step-1', language());
    document.getElementById('step-two-text').textContent = localize('step-2', language());
    document.getElementById('step-three-text').textContent = localize('step-3', language());
    document.getElementById('already-installed-text').textContent = localize('already-installed', language());
    document.getElementById('troubleshoot-link').textContent = localize('troubleshoot', language());
    document.getElementById('ext-install-welcome').textContent = localize('required', language());
    document.getElementById("extension-title").textContent = localize("ext-install", language());
    document.getElementById('download-bottom-text').textContent = localize('download-bottom', language());
    document.getElementById('launching-container-text').textContent = 'Launching IBM Aspera Connect...';
    document.getElementById('update-container-text').textContent = 'This site requires a newer version of IBM Aspera Connect.';
    document.getElementById('retry-link').textContent = localize('retry-button', language());
    document.getElementById('security-update-container-text').textContent = localize('security-update', language());
    document.getElementById('running-container-text').textContent = 'IBM Aspera Connect is running!';
    document.getElementById('download-troubleshoot').textContent = localize('troubleshoot', language());
    document.getElementById('step-one-inside-button').textContent = localize('install-extension', language());
    document.getElementById('step-two-inside-button').textContent = localize('download-app', language());
    document.getElementById('step-three-inside-button').textContent = localize('install-connect', language());
    document.getElementById('download-top-text').textContent = localize('downloading', language());
    document.getElementById('download-connect-link').textContent = localize('download-connect', language());
    document.getElementById('download-connect-again').textContent = localize('download-connect', language());
    document.getElementById('download-fail').textContent = localize('download-fail', language());
    document.getElementById('install-finished').textContent = localize('install-finished', language());
    document.getElementById('install-refresh').textContent = localize('refresh-button', language());
    var unsupported = localize('not-supported', language());
    var unsupported_with_link = unsupported.replace("<a>", "<a href=\"https://test-connect.asperasoft.com\" target=\"_blank\">");
    document.getElementById('unsupported-text').textContent = unsupported_with_link;
    document.getElementById('step-one-text').textContent = localize('step-1', language());
    document.getElementById('step-two-text').textContent = localize('step-2', language());
    document.getElementById('step-three-text').textContent = localize('step-3', language());
    if (longLanguage) {
      document.getElementById('retry-container-text-troubleshoot').style.fontSize = '11px';
      document.getElementById('retry-container-text-troubleshoot').style.width = language().indexOf('fr') === 0 ? '13%' : '11%';
      document.getElementById('download-connect-link').style.fontSize = '11px';
      document.getElementById('retry-container-text-troubleshoot').style.marginLeft = language().indexOf('es') === 0 ? '10px' : null;
      document.getElementById('update-container-link').style.fontSize = '11px';
    }
  } catch (e) {
    if (parent.postMessage) {
      //An error occured while running this code, just display the standard message
      hideAllBySelector(document, 'connect-status-banner-container');
      hideAllBySelector(document, 'three-step-installer');
    }
  }
};

// Dispatch 'onload' message to parent when iframe loads
if (window.addEventListener) {
  window.addEventListener('load', handleOnLoad, false);
  window.addEventListener('message', handleMessage, false);
} else {
  window.attachEvent('onload', handleOnLoad);
  window.attachEvent('onmessage', handleMessage);
}
