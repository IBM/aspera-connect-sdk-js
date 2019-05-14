
var connectInstaller = (function() {
  var 
    installOptions = {},
    listeners = [];

  var loadFile = function(filename, filetype){
    if (filetype.toLowerCase() === "js"){ //if filename is a external JavaScript file
      var fileref=document.createElement('script');
      fileref.setAttribute("type","text/javascript");
      fileref.setAttribute("src", filename);
    } else if (filetype.toLowerCase() === "css"){ //if filename is an external CSS file
      var fileref=document.createElement("link");
      fileref.setAttribute("rel", "stylesheet");
      fileref.setAttribute("type", "text/css");
      fileref.setAttribute("href", filename);
    }
    if (typeof fileref!="undefined")
      document.getElementsByTagName("head")[0].appendChild(fileref);
  };

  var randomString = function(textLength) {
    var text, possible;
    text = '';
    if (textLength > 200) {
      textLength = 200;
    }
    textLength = textLength || 5;
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < textLength; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  var notifyListeners = function(event) {
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  };

  var addEventListener = function(listener) {
    if (typeof listener !== 'function') {
      console.log("You must provide a callback");
      return null;
    }
    listeners.push(listener);
  };
    
  var showInstallationIframe = function(options) {
    // Start the iframe install.
    var iframeWrapper
    , iframeWidth
    , iframeHeight
    , divTitle
    , modalOverlay
    , iframe
    , parent;
    
    installOptions = options || {};

    if (document.getElementById('aspera-iframe-container')) {
      // Aviod inserting the iframe twice.
      return;
    }
    
    if (installOptions.installDismiss) {
      if (typeof installOptions.installDismiss !== 'function') {
        throw new Error('showInstallationIframe: The "installDismiss" option must be a function.');
      }
    }
    if (installOptions.installClose) {
      if (typeof installOptions.installClose !== 'function') {
        throw new Error('showInstallationIframe: The "installClose" option must be a function.');
      }
    }
    if (installOptions.prompt === 'false') {
      // Also accept a boolean in the form of a string.
      installOptions.prompt = false;
    }

    // Inserting a stylesheet into the DOM for more manageable styles.
    loadFile(installOptions.sdkLocation + '/install/auto-iframe/parent.css', 'css');
    
    // Build and insert the iframe.
    iframeWrapper = document.createElement('div');
    iframeWrapper.id = 'aspera-iframe-container';
    iframeWrapper.className = iframeWrapper.id;

    iframeHeight = 220;
    iframeWidth = iframeHeight * 1.61;

    iframe = document.createElement('iframe');
    iframe.id = 'aspera-connect-installer';
    iframe.name = iframe.id;
    iframe.className = iframe.id;
    iframe.src = installOptions.sdkLocation + '/install/auto-iframe/index.html';
    iframe.scrolling = 'no';
    iframe.frameBorder = '0';
    iframeWrapper.appendChild(iframe);
    if (installOptions.parentId) {
      // Insert the iframe with a button into the provided element.
      parent = document.getElementById(installOptions.parentId);
      parent.appendChild(iframe);
      parent.style.height = iframeHeight + 'px';
      parent.style.width = iframeWidth + 'px';
      parent.style.visibility = 'visible';
      parent.style.display = 'block';
    } else {
      // Modal overlay doesn't get styles from a stylesheet.
      // Apply all styles with JS.
      parent = document.body;
      // Display the iframe as a modal dialog if no parentId is supplied.
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'aspera-modal-overlay'; 
      modalOverlay.className = modalOverlay.id;
      modalOverlay.innerHTML = '&nbsp;';
      // Background image set dynamically because of image path.
      modalOverlay.style.backgroundImage = 'url('+ installOptions.sdkLocation + '/install/auto-iframe/images/bg_white_75pct.png)';
      // The iframe is set to 100% height and width of its container.

      iframeWrapper.style.height = iframeHeight + 'px';
      iframeWrapper.style.width = iframeWidth + 'px';
      // Center the iframe container.
      iframeWrapper.style.marginTop = (iframeHeight / 2) * -1 + 'px';
      iframeWrapper.style.marginLeft = (iframeWidth / 2) * -1 + 'px';
      parent.appendChild(modalOverlay);
      parent.appendChild(iframeWrapper);
    }

    function handleMessage(event) {
      // iFrame installation: Handling of messages by the parent window.
      var iframe = event.source;
      if (window.location.hash.indexOf('embeddedinstall') === -1 && event.data === 'embeddedinstall') {
        // The hash does not already contain 'embeddedinstall'.
        window.location.hash += event.data;
      }
      if (event.data === 'iframeloaded') {
        if (installOptions.stylesheet) {
          iframe.postMessage('insertstylesheet=' + installOptions.stylesheet + '?' + randomString(), event.origin);
        }
        notifyListeners(event.data);
      }
      if (event.data === 'downloadconnect') {
        notifyListeners(event.data);
      }
      if (event.data === 'launchconnect') {
        notifyListeners(event.data);
      }
      if (event.data === 'removeiframe') {
        removeIframe();
      }
    };
    
    // Set listener for messages from the iframe installer.
    if (window.addEventListener){
      window.addEventListener("message", handleMessage, false);
    } else {
      window.attachEvent("onmessage", handleMessage);
    }
  };

  var removeIframe = function() {
    var id;
    // Takes a string or an array of id's.
    // Remove all elements related to the iframe from the parent.
    if (installOptions && installOptions.parentId) {
      id = installOptions;
    } else {
      id = ['aspera-modal-overlay', 'aspera-iframe-container'];
    }
    var container, parent;
    function removeEl(id) {
      container = document.getElementById(id);
      if (typeof container !== 'undefined' && container !== null) {
        parent = container.parentNode;
        if (typeof parent !== 'undefined' && container !== null) {
          parent.removeChild(container);
        }
      }
    }
    if (typeof id === 'string') {
      removeEl(id);
    } else if (id instanceof Array) {
      for (var i = 0, l = id.length; i < l; i += 1) {
        try {
          removeEl(id[i]);
        } catch (e) {
          
        }
      }
    }
  };

  // The symbols to export.
  return {
    //FUNCTIONS
    addEventListener: addEventListener,
    showInstallationIframe: showInstallationIframe,
    removeIframe: removeIframe
  };

  }());
