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

// TODO: Consolidate duplicate class
AW4.Logger = (function() {
    var LS_LOG_KEY = 'aspera-log-level';
    var LEVEL = {
        INFO : 0,
        DEBUG : 1,
        TRACE : 2
    };
    AW4.LogLevel = LEVEL.INFO;
    try {
        if (typeof(localStorage) == 'undefined')
            return;
        AW4.LogLevel = localStorage.getItem(LS_LOG_KEY);
    } catch(error) { }

    function trace(message) {
        if(AW4.LogLevel >= LEVEL.TRACE && typeof window.console !== 'undefined') {
            console.log(message);
        }
    }

    function debug(message) {
        if(AW4.LogLevel >= LEVEL.DEBUG && typeof window.console !== 'undefined') {
            console.log(message);
        }
    }

    function log(message) {
        if(typeof window.console !== 'undefined') {
            console.log(message);
        }
    }

    function warn(message) {
        if(typeof window.console !== 'undefined') {
            console.warn(message);
        }
    }

    function error(message) {
        if(typeof window.console !== 'undefined') {
            console.error(message);
        }
    }

    function setLevel(level) {
        AW4.LogLevel = level;
        setLocalStorage(LS_LOG_KEY,level);
    }

    return {
        LEVEL: LEVEL,
        log: log,
        debug: debug,
        trace: trace,
        warn: warn,
        error: error,
        setLevel: setLevel
    };
})();

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
    return false;
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

var prepareRetryButton = function(element) {
  element.textContent = localize('retry-button', language());
  element.setAttribute('lang', language());
  element.onclick = function() {
    sendParentMessage('mitigate_with_tab');
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

var prepareRefreshLink = function(element, href) {
  if (element) {
    element.textContent = localize('refresh-button', language());
    element.setAttribute('lang', language());
    element.onclick = function() {
      sendParentMessage('refresh');
      return false;
    };
  }
};

var prepareDownloadIndicator = function(element, state) {
  element.style.display = 'inline-block';
  if (state == 'install') {
    element.textContent = localize('run-installer', language());
  } else {
    element.textContent = localize('please-download', language());
  }
  element.setAttribute('lang', language());
  sendParentMessage('download_indicator_visible');
  element.onclick = function() {
    sendParentMessage('clicked_download_indicator');
  };
  scaleDownloadIndicatorText(element);
};

var prepareActiveButton = function(button, inside_button) {
  button.className = 'big-button-active';
  button.style.opacity = '1';
  inside_button.className = 'filled-button';
};

var prepareNotActiveButton = function(button, inside_button) {
  button.className = 'big-button-non-active';
  button.style.opacity = '0.5';
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
    AW4.Logger.debug('This browser does not use the extension store.');
    return '';
};

var prepareDownloadExtensionButton = function(element) {
  element.setAttribute('lang', language());
  event = '';
  if (BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION) {
    event = 'clicked_install_extension';
    element.textContent = localize('install-extension', language());
  } else if (BROWSER.FIREFOX) {
    event = 'clicked_install_addon';
    element.textContent = localize('install-addon', language());
  } else if (BROWSER.IE || BROWSER.SAFARI) {
    event = 'clicked_enable_extension';
    element.textContent = localize('enable-extension', language());
  }

  if (BROWSER.SAFARI) {
    element.onclick = function() {
      sendParentMessage(event);
      triggerExtensionCheck();
    }
  } else if (BROWSER.IE) {
    element.onclick = function() {
      sendParentMessage('clicked_enable_extension');
      sendParentMessage('refresh');
    }
  } else {
    if (!element.getAttribute('href') || element.getAttribute('href') == '') {
      element.setAttribute('href', getExtensionStoreLink());
      element.setAttribute('target', "_blank");
    }

    element.onclick = function() {
      sendParentMessage(event);
    }
  }
};

var downloadIndicatorTimer;
var fadeOutDownloadIndicator = function(image) {
  clearInterval(downloadIndicatorTimer);
  opacity = 1;
  downloadIndicatorTimer = setInterval(function(){
    if(opacity <= 0){
      image.style.display = 'none';
      clearInterval(downloadIndicatorTimer);
    }
    image.style.opacity = opacity;
    opacity -=  0.05;
  }, 500);
};

var resetAnimation = function(el) {
  if (el) {
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null;
  }
};

var timeoutDownloadIndicator = function(image) {
  clearInterval(downloadIndicatorTimer);
  downloadIndicatorTimer = setTimeout(function() {
      image.style.display = 'none';
  }, 8000);
};

var setButtonToDisabled = function(element) {
  element.removeAttribute('href');
  element.removeAttribute('target');
  element.disabled = true;
  element.onclick = function() {return false;}
};

var hideAllBySelector = function(document, selector) {
  var k = document.getElementsByClassName(selector);
  for (i=0; i < k.length; i++){
    k[i].style.display = 'none';
  }
};

// Dynamically scale indicator text based
var scaleDownloadIndicatorText = function(el) {
  svgId = el.id.indexOf('bottom') === -1 ? 'download-svg-upper' : 'download-svg-bottom';
  var svg = document.getElementById(svgId);
  if (svg && el) {
    var textBBox = svg.getBBox();
    // Keep width the same
    var widthScale = 1;
    var overflowHeight = el.clientHeight;
    var heightScale = overflowHeight / (textBBox.height - 6);
    // Check if text height is greater than svg height, which means there is overflow
    if (heightScale >= 1) {
      var scale = 1 / heightScale;
      // If text is barely too long, then scale a little more so text isn't right up against the edge
      if (scale >= 0.97) {
        scale = scale - 0.04;
      }
      // Set new font size based on scaled factor
      el.style.fontSize = scale + 'em';
    }
  }
}

var changeStateToExtensionInstall = function() {
  if (BROWSER.SAFARI || BROWSER.IE) {
    document.getElementById('step-two-button').style.opacity = '0.5';
    document.getElementById('step-three-inside-button').disabled = false;
    document.getElementById('step-one-checkmark').style.visibility = 'visible';
    document.getElementById('step-two-checkmark').style.visibility = 'visible';
    document.getElementById('step-three-checkmark').style.visibility = 'hidden';
    prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  } else if (BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX || BROWSER.CHROME) {
    document.getElementById('step-three-button').style.opacity = '0.5';
    document.getElementById('step-one-checkmark').style.visibility = 'hidden';
    document.getElementById('step-two-checkmark').style.visibility = 'hidden';
    document.getElementById('step-three-checkmark').style.visibility = 'hidden';
    prepareActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  }
};

var clickedInstallEvent = function () {
  installClicked = true;
  sendParentMessage('clicked_install_app');
  if (BROWSER.SAFARI) {
    document.getElementById('download-upper').style.display = 'inline-block';
    document.getElementById('indicator-upper-text').style.display = 'inline-block';
    prepareDownloadIndicator(document.getElementById('indicator-upper-text'), 'install');
    timeoutDownloadIndicator(document.getElementById('download-upper'));
  } else {
    document.getElementById('download-bottom').style.display = 'inline-block';
    document.getElementById('indicator-bottom-text').style.display = 'inline-block';
    prepareDownloadIndicator(document.getElementById('indicator-bottom-text'), 'install');
    timeoutDownloadIndicator(document.getElementById('download-bottom'));
  }
  return false;
}

var changeStateToInstall = function() {
  document.getElementById('step-one-checkmark').style.visibility = 'visible';
  document.getElementById('step-two-checkmark').style.visibility = 'hidden';
  document.getElementById('step-three-checkmark').style.visibility = 'hidden';
  if (BROWSER.SAFARI)
    document.getElementById("extension-title").textContent = localize('install-on-safari', language());
  if (BROWSER.SAFARI || BROWSER.IE) {
    document.getElementById('step-two-button').style.opacity = '1';
    document.getElementById('step-two-inside-button').onclick = clickedInstallEvent;
    prepareInstallButton(document.getElementById('step-two-inside-button'), isOutdated, '');
    prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  } else if (BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX || BROWSER.CHROME) {
    prepareInstallButton(document.getElementById('step-three-inside-button'), isOutdated, '');
    document.getElementById('step-two-checkmark').style.visibility = 'visible';
    document.getElementById('step-three-inside-button').disabled = false;
    document.getElementById('step-three-button').style.opacity = '1';
    document.getElementById('step-three-inside-button').onclick = function(){
      sendParentMessage('clicked_install_app');
      if (BROWSER.FIREFOX) {
        document.getElementById('download-upper').style.display = 'inline-block';
        prepareDownloadIndicator(document.getElementById('indicator-upper-text'), 'install');
        timeoutDownloadIndicator(document.getElementById('download-upper'));
      } else {
        document.getElementById('download-bottom').style.display = 'inline-block';
        prepareDownloadIndicator(document.getElementById('indicator-bottom-text'), 'install');
        timeoutDownloadIndicator(document.getElementById('download-bottom'));
      }
      return false;
    }
    prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
    prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
    prepareActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
  }
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
var connectVisible = false;
var isDownloadRecent = false;
var installClicked = false;
var extensionInstallReached = false;
var handleMessage = function(event) {
  if (typeof event.data != 'string')
    return;
  // update message
  var state = event.data;
  if (lastState == 'unsupported_browser' && state != 'running')
    return; // Unsupport browser is a terminal state

  // Show the last banner state
  if (state === 'previous') {
    if (lastState) {
      state = lastState;
    } else { // If there is no lastState for some reason, reset installation experience
      if (BROWSER.SAFARI || BROWSER.IE) {
        state = 'download';
      } else {
        state = 'extension_install';
      }
    }
  }

  // Remap old states
  if (state === 'retry')
    state = 'download';

  if (state === 'launching'
    || state === 'update'
    || state === 'outdated'
    || state === 'running'
    || state === 'continue'
    || state === 'extension_install'
    || state === 'download'
    || state === 'install'
    || state === 'unsupported_browser'
    || state === 'safari_mitigate')
  {
    // Avoid redundant download prompts
    if (state === 'download' && isDownloadRecent) {
      if (BROWSER.SAFARI || BROWSER.IE) {
        state = 'extension_install';
      }
    }
    document.getElementsByClassName('connect-status-banner-container')[0].style.display = state == 'launching' || state == 'running' || state == 'unsupported_browser' || state === 'safari_mitigate' ? 'inline-block' : 'none';
    document.getElementsByClassName('three-step-installer')[0].style.display = state == 'launching' || state == 'running' || state == 'unsupported_browser' || state === 'safari_mitigate' ? 'none' : 'inline-block';

    // If we go to running state from install state, then running banner should show the 3 green checkmarks.
    //   Otherwise, show the smaller running banner like usual.
    if (state === 'running' && lastState === 'install') {
     document.getElementsByClassName('connect-status-banner-container')[0].style.display = 'none';
     document.getElementsByClassName('three-step-installer')[0].style.display = 'inline-block';

     // Display all three green checkmarks before banner is dismissed
     document.getElementById('step-one-checkmark').style.visibility = 'visible';
     document.getElementById('step-two-checkmark').style.visibility = 'visible';
     document.getElementById('step-three-checkmark').style.visibility = 'visible';
   }
    if (state === 'extension_install' || state === 'download' || state === 'install' || state === 'outdated' || state === 'failed' || state === 'update' || (state === 'running' && lastState === 'install')){
      sendParentMessage('100%');
      document.height = '452px';
      if (!connectVisible) {
        connectVisible = true;
        sendParentMessage('connect_bar_visible');
      }
      document.getElementsByClassName('connect-status-banner-container')[0].style.display = 'none';
      document.getElementById("ext-install-welcome").textContent = localize("required", language());
      document.getElementById('troubleshoot-link').onclick = function() {
        sendParentMessage('clicked_troubleshoot');
        openTab('https://test-connect.asperasoft.com');
        return false;
      }
      prepareRefreshLink(document.getElementById('refresh-link'));
      if (BROWSER.SAFARI || BROWSER.IE) {
        document.getElementById('step-one-download-box').style.display = 'inline';
        document.getElementById('step-two-openbox').style.display = 'inline';
        document.getElementById('step-three-puzzle').style.display = 'inline';
        document.getElementById('step-one-download-box-img').style.display = 'inline-block';
        document.getElementById('step-two-openbox-img').style.display = 'inline-block';
        document.getElementById('step-three-puzzle-img').style.display = 'inline-block';
        document.getElementById('step-one-inside-button').textContent = localize('download-app', language());
        document.getElementById('step-two-button').style.marginLeft = '37px';
        document.getElementById('step-three-button').style.marginLeft = '35px';
        document.getElementById('step-two-openbox-img').style.marginLeft = '12.5px';
        document.getElementById('step-three-puzzle-img').style.marginLeft = '14px';
        if (BROWSER.SAFARI) {
          document.getElementById('step-three-new').style.visibility = 'visible';
        }
        document.getElementById('step-one-text').style.lineHeight = '32px';
        document.getElementById('step-three-text').style.lineHeight = '1';
        document.getElementById('install-step-three').style.marginTop = '27px';
        document.getElementById('step-three-inside-button').style.cursor = 'pointer';
        prepareDownloadExtensionButton(document.getElementById('step-three-inside-button'));
        document.getElementById('step-three-new').textContent = localize('new', language());
        document.getElementById('install-step-three').classList.add('install-extension-step');
        document.getElementById('step-one-inside-button').setAttribute('download', '');
        document.getElementById('step-one-inside-button').onclick = function(){
          downloadClicked = true;
          sendParentMessage('clicked_download_app');
          if (BROWSER.SAFARI) {
            document.getElementById('download-upper').style.display = 'inline-block';
            prepareDownloadIndicator(document.getElementById('indicator-upper-text'), state);
            timeoutDownloadIndicator(document.getElementById('download-upper'));
          } else {
            document.getElementById('download-bottom').style.display = 'inline-block';
            prepareDownloadIndicator(document.getElementById('indicator-bottom-text'), state);
            timeoutDownloadIndicator(document.getElementById('download-bottom'));
          }
          sendParentMessage('downloadconnect');
        }
        document.getElementById('text-how').textContent = localize('how', language());
        document.getElementById('extension-enable-how').src = BROWSER.SAFARI === true ? 'tooltip_safari.gif': 'tooltip_ie.gif';
        document.getElementById('text-how').onclick = function() {
          sendParentMessage('clicked_how_link');
        }
        if (state === 'outdated' || state == 'update') {
          document.getElementById('step-two-inside-button').textContent = localize('upgrade-connect', language());
        } else {
          if (!isOutdated) {
            document.getElementById('step-two-inside-button').textContent = localize('install-connect', language());
          }

          if (state === 'extension_install') {
            document.getElementById('step-two-inside-button').onclick = clickedInstallEvent;
          }
        }
        document.getElementById('step-three-inside-button').textContent = localize('enable-extension', language());
      } else if (BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX || BROWSER.CHROME) {
        document.getElementById('step-two-button').style.marginLeft = '35px';
        document.getElementById('step-three-button').style.marginLeft = '37px';
        document.getElementById('step-two-download-box-img').style.marginLeft = '14px';
        document.getElementById('step-three-openbox-img').style.marginLeft = '12.5px';
        document.getElementById('step-one-puzzle').style.display = 'inline';
        document.getElementById('step-two-download-box').style.display = 'inline';
        document.getElementById('step-three-openbox').style.display = 'inline';
        document.getElementById('step-one-puzzle-img').style.display = 'inline-block';
        document.getElementById('step-two-download-box-img').style.display = 'inline-block';
        document.getElementById('step-three-openbox-img').style.display = 'inline-block';
        document.getElementById('step-three-how').style.display = 'none';
        document.getElementById('step-one-new').style.visibility = 'visible';
        document.getElementById('step-three-text').style.lineHeight = '32px';
        document.getElementById('step-one-text').style.lineHeight = '1';
        document.getElementById('step-three-inside-button').style.cursor = 'pointer';
        document.getElementById('step-one-new').textContent = localize('new', language());
        document.getElementById('install-step-one').classList.add('install-extension-step');
        if (BROWSER.FIREFOX) {
          document.getElementById('step-one-inside-button').textContent = localize('install-addon', language());
        } else {
          document.getElementById('step-one-inside-button').textContent = localize('install-extension', language());
        }
        document.getElementById('step-two-inside-button').textContent = localize('download-app', language());
        document.getElementById('step-two-inside-button').setAttribute('download', '');
        prepareDownloadExtensionButton(document.getElementById('step-one-inside-button'));
        document.getElementById('step-two-inside-button').onclick = function(){
          downloadClicked = true;
          sendParentMessage('clicked_download_app');
          if (BROWSER.FIREFOX) {
            document.getElementById('download-upper').style.display = 'inline-block';
            prepareDownloadIndicator(document.getElementById('indicator-upper-text'), state);
            timeoutDownloadIndicator(document.getElementById('download-upper'));
          } else {
            document.getElementById('download-bottom').style.display = 'inline-block';
            prepareDownloadIndicator(document.getElementById('indicator-bottom-text'), state);
            timeoutDownloadIndicator(document.getElementById('download-bottom'));
          }
          // If we are still in step one, then we do not want to change to the install state
          if (state === 'extension_install') {
            return;
          }
          sendParentMessage('downloadconnect');
        }
        if (state === 'outdated' || state == 'update') {
          document.getElementById('step-three-inside-button').textContent = localize('upgrade-connect', language());
        } else {
          // Check if outdated otherwise after download app is clicked, the button text will be incorrect
          if (!isOutdated) {
            document.getElementById('step-three-inside-button').textContent = localize('install-connect', language());
          }
        }
      }
      if (state == 'outdated' || state == 'update' || state == 'failed') {
        if (state === 'outdated' || state === 'update') {
          isOutdated = true;
          var refreshLinkEl = document.getElementById('refresh-link');
          var orSeparatorEl = document.getElementById('or');
          if (refreshLinkEl) {
            refreshLinkEl.parentNode.removeChild(refreshLinkEl);  
          }
          if (orSeparatorEl) {
            orSeparatorEl.parentNode.removeChild(orSeparatorEl);  
          }
        }
        state = 'download';
        /*
        if (BROWSER.SAFARI || BROWSER.IE)
          state = 'download'
        else if (BROWSER.FIREFOX || BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION) {
          if (!isExtensionInstalled(1000))
            state = 'extension_install'
          else
            state = 'download'
        } */
      }
      if (state === 'extension_install') {
        extensionInstallReached = true;
        //  wait 10 sec before showing install state if previous state was download and we're waiting for download to be completed.
        if (installClicked && (BROWSER.SAFARI || BROWSER.IE)) {
          setTimeout(function () {
            if (BROWSER.SAFARI) {
              document.getElementById('download-upper').style.display = 'none';
            } else {
              document.getElementById('download-bottom').style.display = 'none';
            }
            changeStateToExtensionInstall();
          }, 4000);
        } else {
          changeStateToExtensionInstall();
        }
      } else if (state === 'download') {
        if (isOutdated) {
          if (BROWSER.SAFARI || BROWSER.IE) {
            document.getElementById('step-two-button').style.opacity = '1';
          } else if (BROWSER.FIREFOX || BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION) {
            document.getElementById('step-three-button').style.opacity = '1';
          }
        }
          if (BROWSER.SAFARI || BROWSER.IE) {
            document.getElementById('step-one-checkmark').style.visibility = 'hidden';
            document.getElementById('step-two-checkmark').style.visibility = 'hidden';
            document.getElementById('step-three-checkmark').style.visibility = 'hidden';
            prepareActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
            prepareNotActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
            prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
            document.getElementById('step-two-inside-button').removeAttribute('href');
          } else if (BROWSER.FIREFOX || BROWSER.EDGE_WITH_EXTENSION || BROWSER.CHROME) {
            document.getElementById('step-one-checkmark').style.visibility = 'visible';
            document.getElementById('step-two-checkmark').style.visibility = 'hidden';
            document.getElementById('step-three-checkmark').style.visibility = 'hidden';
            prepareNotActiveButton(document.getElementById('step-one-button'), document.getElementById('step-one-inside-button'));
            prepareActiveButton(document.getElementById('step-two-button'), document.getElementById('step-two-inside-button'));
            prepareNotActiveButton(document.getElementById('step-three-button'), document.getElementById('step-three-inside-button'));
          }
        } else if (state == 'install') {
          // IF user clicks download again in the extension install state on IE/Safari - don't trigger switch to install state
          if (BROWSER.SAFARI || BROWSER.IE) {
            if (extensionInstallReached) {
              return;
            }
          }
          // Wait 10 sec before showing install state if previous state was download and we're waiting for download to be completed.
          if (downloadClicked) {
            setTimeout(function(){changeStateToInstall();}, 10000);
          } else {
            changeStateToInstall();
          }
        }
      } else {
      sendParentMessage('80px');
      document.height = '80px';
      document.getElementsByClassName('connect-logo')[0].style.display = 'inline-block';
      document.getElementById('launching-container').style.display = state == 'launching' ? 'inline-block' : 'none';
      document.getElementById('running-container').style.display = state == 'running' ? 'inline-block' : 'none';
      document.getElementsByClassName('three-step-installer')[0].style.display = state == 'extension_install' || state == 'download' || state == 'install' || state == 'outdated' || state == 'failed' || state == 'update' ? 'inline-block' : 'none';
      document.getElementById('unsupported-container').style.display = state == 'unsupported_browser' ? 'inline-block' : 'none';
      document.getElementById('safari-mitigate-container').style.display = state == 'safari_mitigate' ? 'inline-block' : 'none';
      if (state == 'launching') {
        document.getElementById('launching-container-text').textContent = localize('launching', language());
      } else if (state == 'running') {
        document.getElementById('running-container-text').textContent = localize('running', language());
      } else if (state == 'unsupported_browser') {
        var unsupported = localize('not-supported', language());
        var unsupported_with_link = unsupported.replace("<a>", "<a href=\"https://test-connect.asperasoft.com\" target=\"_blank\">");
        document.getElementById('unsupported-text').innerHTML = unsupported_with_link;
      } else if (state == 'running') {
        recordConnectInstall();
      } else if (state === 'safari_mitigate') {
        document.getElementById('safari-mitigate-text').setAttribute('lang', language());
        document.getElementById('safari-mitigate-text').textContent = localize('retry', language());
        prepareRetryButton(document.getElementById('safari-retry-link'));
        document.getElementById('safari-troubleshoot-link').onclick = function() {
          sendParentMessage('clicked_troubleshoot');
          openTab('https://test-connect.asperasoft.com');
          return false;
        }
      }
    }
    resetAnimation(document.getElementsByClassName('connect-status-banner')[0]);
  } else if (state.indexOf('downloadlink') === 0) {
    var href = state.substring(state.indexOf('=') + 1);
    downloadLink = href;
    if (BROWSER.CHROME || BROWSER.FIREFOX || BROWSER.EDGE_WITH_EXTENSION) {
      prepareDownloadExtensionButton(document.getElementById('step-one-inside-button'));
      prepareDownloadButton(document.getElementById('step-two-inside-button'), href);
      prepareInstallButton(document.getElementById('step-three-inside-button'), isOutdated, href);
    } else if (BROWSER.IE || BROWSER.SAFARI) {
      prepareDownloadButton(document.getElementById('step-one-inside-button'), href);
      prepareInstallButton(document.getElementById('step-two-inside-button'), isOutdated, href);
    }
  } else if (state.indexOf('downloadVersion') === 0) {
    var title = localize("ext-install", language());
    var ver = state.substring(state.indexOf('=') + 1);
    ver = ver.replace(/\.\d+$/, ''); // Drop build number from version
    title = title.replace(/{.*}/, ver);
    document.getElementById("extension-title").textContent = title;
  } else if (state.indexOf('downloadTimestamp') === 0) {
    // Detect if last download timestamp was within 5 minutes
    var lastDownloadTimestamp = state.substring(state.indexOf('=') + 1);
    if ((Date.now() - lastDownloadTimestamp) < 300000) {
      isDownloadRecent = true;
      if (BROWSER.IE) {
        // On refresh after going through install sequence, make sure we display the IE tooltip
        document.getElementById('step-three-how').style.display = 'inline-block';
      }
    }
  } else if (state.indexOf('insertstylesheet') === 0) {
    //Add custom css files
    var cssHref = state.substring(state.indexOf('=') + 1);
    loadCSSFile(cssHref);
  }
   lastState = state;
};

var closeClicked = function() {
  connectVisible = false;
  sendParentMessage('removeiframe');
  sendParentMessage('connect_bar_removed');
  return false;
};

var previousVersionException = function() {
  sendParentMessage('continue');
  return false;
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
    // var iframe = window.parent.document.getElementById('aspera-iframe-container');
    // var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
    document.getElementById('close-button').onclick = closeClicked;
    document.getElementById('three-step-container').setAttribute('lang', language());
    if (BROWSER.SAFARI) {
      // TODO: If Connect was previously installed, show the restart as a suggestion
      document.getElementById('restart-browser').textContent = localize('try-restarting', language());
    }
    if (BROWSER.SAFARI || BROWSER.IE) {
      document.getElementById('step-three-new').textContent = localize('new', language());
      document.getElementById('step-one-inside-button').textContent = localize('download-app', language());
      document.getElementById('step-two-inside-button').textContent = localize('install-connect', language());
      document.getElementById('step-three-inside-button').textContent = localize('enable-extension', language());
      document.getElementById('download-bottom').classList.add('download-indicator-ms');
      if (BROWSER.IE) {
        // Hide the tooltip initially on IE
        document.getElementById('step-three-how').style.display = 'none';
      }
    } else if (BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX || BROWSER.CHROME) {
      if (BROWSER.EDGE_WITH_EXTENSION) {
        document.getElementById('download-bottom').classList.add('download-indicator-ms');
      }
      document.getElementById('step-one-new').textContent = localize('new', language());
      if (BROWSER.FIREFOX) {
        document.getElementById('step-one-inside-button').textContent = localize('install-addon', language());
      } else {
        document.getElementById('step-one-inside-button').textContent = localize('install-extension', language());
      }
      document.getElementById('step-two-inside-button').textContent = localize('download-app', language());
      document.getElementById('step-three-inside-button').textContent = localize('install-connect', language());
    }
      document.getElementById('step-one-text').textContent = localize('step-1', language());
      document.getElementById('step-two-text').textContent = localize('step-2', language());
      document.getElementById('step-three-text').textContent = localize('step-3', language());
      document.getElementById('already-installed-text').textContent = localize('already-installed', language());
      document.getElementById('previous-version-link').textContent = localize('previous-version', language());
      document.getElementById('previous-version-link').onclick = previousVersionException;
      document.getElementById('troubleshoot-link').textContent = localize('troubleshoot', language());
      document.getElementById('safari-troubleshoot-link').textContent = localize('troubleshoot', language());
      document.getElementById('ext-install-welcome').textContent = localize('required', language());
      document.getElementById("extension-title").textContent = localize("ext-install", language());
      document.getElementById('indicator-bottom-text').textContent = localize('please-download', language());
      document.getElementById('launching-container-text').textContent = localize('launching', language());
      document.getElementById('running-container-text').textContent = localize('running', language());
      var unsupported = localize('not-supported', language());
      var unsupported_with_link = unsupported.replace("<a>", "<a href=\"https://test-connect.asperasoft.com\" target=\"_blank\">");
      document.getElementById('unsupported-text').textContent = unsupported_with_link;
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
