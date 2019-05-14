
var loadCSSFile = function(filename){
  var fileref=document.createElement("link");
  fileref.setAttribute("rel", "stylesheet");
  fileref.setAttribute("type", "text/css");
  fileref.setAttribute("href", filename);

  document.getElementsByTagName("head")[0].appendChild(fileref);
};

var parseSearchString = function(key) {
  return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
};

var language = function(){
  return parseSearchString('awlang') || navigator.language ||
  navigator.userLanguage.replace(/(.*-)(.*)/, function(a, b, c) {return b + c.toUpperCase()}) || 'en-US';
};

var localize = function(id, lang) {
  var ret;
  lang = lang || "en-US";
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
      return AW4.localize["en-US"][id] || id;
    }
  }
  ret = AW4.localize[lang][id];
  if (typeof(ret) === 'undefined') {
    // This string ID doesn't exist for this language,
    // try en-US, fallback to return the ID.
    return AW4.localize["en-US"][id] || id;
  }
  return ret;
};

var sendParentMessage = function(message) {
  // Not passing sensitive information. The '*' is acceptable
  parent.postMessage(message, '*');
};

var resizeEvent = function () {
    if (document.documentElement.clientWidth < 900)
    {
        document.body.className = "small-window";
    }
    else
    {
        document.body.className = "";
    }
}

// Keep track of downloads to avoid redundant download requests
var DL_KEY = 'aspera-last-downloaded';
var lastDownloadedVersion = function() {
    if (typeof(localStorage) == 'undefined')
        return '';
    return localStorage.getItem(DL_KEY);
};
var setLastDownloadedVersion = function(ver) {
    if (typeof(localStorage) == 'undefined')
        return;
    localStorage.setItem(DL_KEY, ver);
};
var isVersionAlreadyDownloaded = function(ver) {
    return lastDownloadedVersion() == ver;
};

var prepareDownloadButton = function(element, href, optional) {
  element.setAttribute('style', 'display:inline-block;');
  element.setAttribute('lang', language());

  if (optional && isVersionAlreadyDownloaded(href)) {
    element.innerHTML = localize('retry', language());
    element.removeAttribute('download');
    element.onclick = function() {
      sendParentMessage('refresh');
      return false;
    }
  } else {
    element.innerHTML = localize('download-button', language());
    element.setAttribute('href', href);
    element.onclick = function() {
      setLastDownloadedVersion(href);
      sendParentMessage('downloadconnect');
    };
  }
};

var prepareContinueButton = function(element, href) {
  element.innerHTML = localize('continue-button', language());
  element.setAttribute('style', 'display:inline-block;');
};

var handleMessage = function(event) {
  if (typeof event.data != 'string')
    return;
  // update message
  if (event.data === 'launching'
    || event.data === 'download'
    || event.data === 'install'
    || event.data === 'update'
    || event.data === 'running'
    || event.data === 'continue')
  {
    document.getElementById('launching-container').style.display = event.data == 'launching' ? 'inline-block' : 'none';
    document.getElementById('download-container').style.display = event.data == 'download' ? 'inline-block' : 'none';
    document.getElementById('install-container').style.display = event.data == 'install' ? 'inline-block' : 'none';
    document.getElementById('update-container').style.display = event.data == 'update' ? 'inline-block' : 'none';
    document.getElementById('security-update-container').style.display = event.data == 'continue' ? 'inline-block' : 'none';
    document.getElementById('running-container').style.display = event.data == 'running' ? 'inline-block' : 'none';
  } else if (event.data.indexOf('downloadlink') === 0) {
    //Set link of connect button
    var href = event.data.substring(event.data.indexOf('=') + 1);
    prepareDownloadButton(document.getElementById('download-container-link'), href, true);
    prepareDownloadButton(document.getElementById('update-container-link'), href, false);
    prepareDownloadButton(document.getElementById('security-update-container-download-link'), href, false);
    prepareContinueButton(document.getElementById('security-update-container-continue-link'), href);

    if (isVersionAlreadyDownloaded(href)) {
      document.getElementById('download-again-container').style.display = 'inline-block';
      var el = document.getElementById('download-again');
      el.setAttribute('href', href);
      el.innerHTML = localize('download-button', language());
      el.onclick = function() { sendParentMessage('downloadconnect'); };
    }
  } else if (event.data.indexOf('insertstylesheet') === 0) {
    //Add custom css files
    var cssHref = event.data.substring(event.data.indexOf('=') + 1);
    loadCSSFile(cssHref);
  }
};

var handleOnLoad = function(event) {
  try {
        ////////////////////////////////////////////////////////////////////////////
    // Browser helpers
    // https://github.com/ded/bowser
    // MIT License | (c) Dustin Diaz 2014
    ////////////////////////////////////////////////////////////////////////////
    var ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    var SAFARI = /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua);

    //Compose localized refresh link, and set the localized text for all the UI
    var localizedMessage;
    if(SAFARI === true) {
      localizedMessage = localize('install-part-safari', language());
    } else {
      localizedMessage = localize('install', language()).replace("<a>", "<a href=\"#\" onclick=\"sendParentMessage('refresh'); return false;\">");
    }
    var downloadLocalizedMessage =
      " <a href=\"#\" onclick=\"sendParentMessage('troubleshoot'); return false;\">" +
      localize('troubleshoot', language()) +
      "</a>";
    // localize('already-installed', language()) +
    document.getElementById('install-container-text').innerHTML = localizedMessage;
    document.getElementById('launching-container-text').innerHTML = localize('launching', language());
    document.getElementById('download-container-text').innerHTML = localize('download', language());
    document.getElementById('download-again').innerHTML = localize('download-again', language());
    document.getElementById('download-container-text-troubleshoot').innerHTML = downloadLocalizedMessage;
    document.getElementById('update-container-text').innerHTML = localize('update', language());
    document.getElementById('security-update-container-text').innerHTML = localize('security-update', language());
    document.getElementById('running-container-text').innerHTML = localize('running', language());
  } catch (e) {
    if (parent.postMessage) {
      //An error occured while running this code, just display the standard message
      document.getElementById('launching-container').style.display = 'none';
      document.getElementById('download-container').style.display = 'none';
      document.getElementById('install-container').style.display = 'none';
      document.getElementById('update-container').style.display = 'none';
      document.getElementById('security-update-container').style.display = 'none';
      document.getElementById('running-container').style.display = 'none';
      document.getElementById('error-container').style.display = 'inline-block';
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
