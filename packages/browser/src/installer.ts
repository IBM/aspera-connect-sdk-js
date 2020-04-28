import * as Utils from './utils';
import * as Logger from './logger';
import { NativeHostStrategy, SafariAppStrategy } from './request/strategy/extension';
import { INSTALL_EVENT as EVENT, ACTIVITY_EVENT, EVENT_TYPE } from './constants';
import { __VERSION__ } from './version';
import * as types from './core/types';

/**
 * @classdesc Contains methods to support Connect installation
 *
 * @name ConnectInstaller
 * @class
 * @memberof AW4
 *
 * @property {Object} EVENT Event types
 *
 *   Types:
 *   * `EVENT.DOWNLOAD_CONNECT` - "downloadconnect"
 *   * `EVENT.REFERESH_PAGE` - "refresh"
 *   * `EVENT.IFRAME_REMOVED` - "removeiframe"
 *   * `EVENT.IFRAME_LOADED` - "iframeloaded"
 *   * `EVENT.TROUBLESHOOT` - "troubleshoot"
 *   * `EVENT.CONTINUE` - "continue"
 * @property {Boolean} supportsInstallingExtensions=false To enable Connect extensions,
 *   this property must be set to `true`.
 *
 *   If you have a custom Connect install experience that can handle the EXTENSION_INSTALL state, set this value to 'true'
 *   This value is used by {@link AW4.Connect} to determine if the EXTENSION_INSTALL event should be used.
 *
 * @param {String} [iframeClass="aspera-iframe-container"] Class to be added to
 *   the iframe that is going to be inserted in the DOM, for easier use with a custom stylesheet.
 * @param {String} [iframeId="aspera-iframe-container"] Id of the iframe that is
 *   going to be inserted in the DOM.
 * @param {String} [sdkLocation="//d3gcli72yxqn2z.cloudfront.net/connect/v4"] URL
 *   to the SDK location to serve Connect installers from. Needs to be served in
 *   the same level of security as the web page (HTTP/HTTPS). This option is often used
 *   if you are hosting your own instance of the Connect SDK.
 *
 *   Format:
 *   `//domain/path/to/connect/sdk`
 * @param {"carbon"} [style="carbon"] Style of the Connect bar design.
 * @param {String} [stylesheetLocation] URL to a stylesheet. Needs to be served
 *   in the same level of security as the web page (HTTP/HTTPS).
 *
 *   Format:
 *   `//domain/path/to/css/file.css`
 * @param {Boolean} [oneClick=true] Default installer type to offer users when
 *   visiting the web page.
 * @param {Boolean} [useFips=false] Serve FIPS-compatible Connect installers on Windows.
 *
 * @example
 * let options = {
 *   style: 'carbon'
 * }
 * let asperaInstaller = new AW4.ConnectInstaller(options)
 */
const ConnectInstaller = function ConnectInstaller (this: any, options?: types.InstallerOptions) {
  if (!new.target) {
    throw new Error('ConnectInstaller() must be called with new');
  }
  ////////////////////////////////////////////////////////////////////////////
  // Private constants
  ////////////////////////////////////////////////////////////////////////////
  const DEFAULT_SDK_LOCATION = '//d3gcli72yxqn2z.cloudfront.net/connect/v4';
  const CONNECT_VERSIONS_JSON = '/connect_references.min.json';

  ////////////////////////////////////////////////////////////////////////////
  // Private variables
  ////////////////////////////////////////////////////////////////////////////
  let connectOptions: any = {};
  let connectRefs: any;
  let listeners: any = [];
  let connectJSONreferences: any | undefined;
  let showInstallTimerID = 0;
  let iframeLoadedFlag = false;
  let connectInstallerListeners: any = [];
  // @ts-ignore :disable:no-unused-variable
  let retryCount = 0;

  if (Utils.isNullOrUndefinedOrEmpty(options)) {
    options = {};
  }

  if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage('aspera-install-attempted'))) {
    Utils.setLocalStorage('aspera-install-attempted', 'true');
  }
  if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage('aspera-last-detected'))) {
    Utils.setLocalStorage('aspera-last-detected', '');
  }

  connectOptions.iframeId = options.iframeId || 'aspera-iframe-container';
  connectOptions.oneClick = options.oneClick === false ? false : true;
  connectOptions.useFips = options.useFips === true ? true : false;
  connectOptions.sdkLocation = (Utils.isNullOrUndefinedOrEmpty(options.sdkLocation)) ? DEFAULT_SDK_LOCATION : Utils.getFullURI(options.sdkLocation) ;
  connectOptions.stylesheetLocation = Utils.getFullURI(options.stylesheetLocation);
  connectOptions.correlationId = options.correlationId;
  connectOptions.style = 'carbon';

  if (typeof(Storage) !== 'undefined') {
    let overrideStyle = Utils.getLocalStorage('aspera-connect-install-style');
    if (overrideStyle) {
      connectOptions.style = overrideStyle;
    }
  }

  if (connectOptions.style === 'carbon') {
    ConnectInstaller.supportsInstallingExtensions = true;
  }

  ////////////////////////////////////////////////////////////////////////////
  // Helper Functions
  ////////////////////////////////////////////////////////////////////////////

  /*
   * loadFiles(files, type, callback) -> null
   * - files (Array): Set of files to load
   * - type (String): type of the files to load: `js` or `css`
   * - callback (function): to be called when all scripts provided have been loaded,
   *
   *     `true` : if files loaded correctly
   *
   *     `false` : if files failed to load
   *
   */
  let loadFiles = function (files: string[], type: string, callback: any) {
    if (files === null || typeof files === 'undefined' || !(files instanceof Array)) {
      return;
    } else if (type === null || typeof type !== 'string') {
      return;
    }
    let numberOfFiles = 0;
    let head = document.getElementsByTagName('head')[0] || document.documentElement;

    /* Loads the file given, and sets a callback, when the file is the last one and a callback is
     * provided, it will call it
     * Loading mechanism based on https://jquery.org (MIT license)
     */
    let loadFilesHelper = function (file: string) {
      // IE9+ supports both script.onload AND script.onreadystatechange thus the done check
      let done = false;
      let fileref: HTMLScriptElement | HTMLLinkElement;

      if (type.toLowerCase() === 'js') {
        fileref = document.createElement('script');
        fileref.setAttribute('type','text/javascript');
        fileref.setAttribute('src', file);
      } else if (type.toLowerCase() === 'css') {
        fileref = document.createElement('link');
        fileref.setAttribute('rel', 'stylesheet');
        fileref.setAttribute('type', 'text/css');
        fileref.setAttribute('href', file);
      } else if (type.toLowerCase() === 'json') {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
          if (this.readyState === 4 && this.status === 200) {
            let resp = this.responseText;
            let jsonVersions = JSON.parse(resp);
            // setConnectRefs(jsonVersions);
            connectRefs = jsonVersions;

            if (typeof callback === 'function') {
              callback(true);
            }
          }
        };
        xhttp.open('GET', file, true);
        xhttp.send();
        return;
      } else {
        return;
      }

      if (typeof callback === 'function') {
        /** Attach handlers for all browsers */
        fileref.onload = (fileref as any).onreadystatechange = function () {
          if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
            done = false;
            /** Handle memory leak in IE */
            // tslint:disable-next-line
            fileref.onload = (fileref as any).onreadystatechange = null;
            if (head && fileref.parentNode) {
              head.removeChild(fileref);
            }
            if (--numberOfFiles <= 0 && typeof callback === 'function') {
              callback(true);
            }
          }
        };
        fileref.onerror = function () {
          callback(false);
        };
      }
      // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
      head.insertBefore(fileref, head.firstChild);
    };
    numberOfFiles = files.length;
    for (let i = 0; i < numberOfFiles; i++) {
      if (typeof files[i] === 'string') {
        loadFilesHelper(files[i]);
      }
    }
  };

  let osPlatform = function () {
    let os = 'Not supported';
    if (/Win/.test(navigator.platform)) {
      if (navigator.userAgent.indexOf('WOW64') !== -1 || navigator.userAgent.indexOf('Win64') !== -1) {
        os = 'Win64';
      } else {
        os = 'Win32';
      }
    } else if (/Mac OS X 10[._]6/.test(navigator.userAgent)) {
      os = 'MacIntel-10.6-legacy';
    } else if (/Mac/.test(navigator.platform)) {
      os = 'MacIntel';
    } else if (/Linux x86_64/.test(navigator.platform)) {
      os = 'Linux x86_64';
    } else if (/Linux/.test(navigator.platform)) {
      os = 'Linux i686';
    }

    return os;
  };

  let osVersion = function () {
    let match: any = '';
    if (/Win/.test(navigator.platform)) {
      match = navigator.userAgent.match(/Windows NT (\d+)[._](\d+)/);
    } else if (/Mac/.test(navigator.platform)) {
      match = navigator.userAgent.match(/OS X (\d+)[._](\d+)/);
    }

    if (Utils.isNullOrUndefinedOrEmpty(match)) {
      return;
    }

    let osVersion = {
      highWord: parseFloat(match[1]),
      loWord: parseFloat(match[2])
    };
    return osVersion;
  };

  let platformVersion = function (arg0: any) {
    if (!Utils.isNullOrUndefinedOrEmpty(arg0)) {
      let match = arg0.match(/(\d+)[.](\d+)/);
      if (Utils.isNullOrUndefinedOrEmpty(match)) {
        return;
      }
      let platformVersion = {
        highWord: parseFloat(match[1]),
        loWord: parseFloat(match[2])
      };

      return platformVersion;
    }

    return arg0;
  };

  let notifyListeners = function (event: any) {
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  };

  let notifyActivityListeners = function (status: any) {
    for (let i = 0; i < connectInstallerListeners.length; i++) {
      connectInstallerListeners[i](status);
    }
  };

  let addStyleString = function (str: string) {
    let node = document.createElement('style');
    node.setAttribute('type', 'text/css');
        // Fix for <= IE9
        // @ts-ignore
    if (node.styleSheet) {
            // @ts-ignore
      node.styleSheet.cssText = str;
    } else {
      node.innerHTML = str;
    }

    document.body.appendChild(node);
  };

  let supportsExtensions = function () {
    return (
      (Utils.BROWSER.CHROME || Utils.BROWSER.EDGE_WITH_EXTENSION || Utils.BROWSER.FIREFOX) ||
      Utils.BROWSER.SAFARI_NO_NPAPI
    );
  };

    ////////////////////////////////////////////////////////////////////////////
    // API Functions
    ////////////////////////////////////////////////////////////////////////////

  this.addEventListener = function (listener: any) {
    if (typeof listener !== 'function') {
      return;
    }

    listeners.push(listener);
    return;
  };

  this.addActivityListener = function (type: 'connect_bar_event', listener: any) {
    if (typeof listener !== 'function') {
      return;
    }

    if (type === EVENT_TYPE.CONNECT_BAR_EVENT) {
      connectInstallerListeners.push(listener);
    }

    return;
  };

    /**
     * Queries the Connect SDK for the current system's information, returning the full spec of all the
     * documentation and binaries available for it.
     *
     * @function
     * @name AW4.ConnectInstaller#installationJSON
     * @param {Function} callbacks Function that will be called when the result is
     *   retrieved.
     *
     *   Object returned to callback function:
     *   ```
     *   {
     *     "title": "Aspera Connect for Windows",
     *     "platform": {
     *         "os": "win32"
     *    },
     *     "navigator": {
     *         "platform": "Win32"
     *     },
     *     "version": "3.6.0.105660",
     *     "id": "urn:uuid:589F9EE5-0489-4F73-9982-A612FAC70C4E",
     *     "updated": "2012-10-30T10:16:00+07:00",
     *     "links": [
     *         {
     *             "title": "Windows Installer",
     *             "type": "application/octet-stream",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/bin/AsperaConnect-ML-3.6.0.105660.msi",
     *             "hreflang": "en",
     *             "rel": "enclosure"
     *         },
     *         {
     *             "title": "Aspera Connect PDF Documentation for Windows",
     *             "type": "application/pdf",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/zh-cn/pdf/Connect_3.6.0_Windows_User_Guide_SimplifiedChinese.pdf",
     *             "hreflang": "zh-cn",
     *             "rel": "documentation"
     *         },
     *         {
     *             "title": "Aspera Connect PDF Documentation for Windows",
     *             "type": "application/pdf",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/ja-jp/pdf/Connect_3.6.0_Windows_User_Guide_Japanese.pdf",
     *             "hreflang": "ja-jp",
     *             "rel": "documentation"
     *         },
     *         {
     *             "title": "Aspera Connect PDF Documentation for Windows",
     *             "type": "application/pdf",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/en/pdf/Connect_3.6.0_Windows_User_Guide_English.pdf",
     *             "hreflang": "en",
     *             "rel": "documentation"
     *         },
     *         {
     *             "title": "Aspera Connect PDF Documentation for Windows",
     *             "type": "application/pdf",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/es/pdf/Connect_3.6.0_Windows_User_Guide_Spanish.pdf",
     *             "hreflang": "es",
     *             "rel": "documentation"
     *         },
     *         {
     *             "title": "Aspera Connect PDF Documentation for Windows",
     *             "type": "application/pdf",
     *             "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/fr/pdf/Connect_3.6.0_Windows_User_Guide_French.pdf",
     *             "hreflang": "fr",
     *             "rel": "documentation"
     *         },
     *         {
     *             "title": "Aspera Connect Release Notes for Windows",
     *             "type": "text/html",
     *             "href": "http://www.asperasoft.com/en/release_notes/default_1/release_notes_55",
     *             "hreflang": "en",
     *             "rel": "release-notes"
     *         }
     *       ]
     *   }
     *   ```
     * @return {null}
     */
  this.installationJSON = function (callback: any) {
    if (typeof callback !== 'function') {
      return;
    }
    if (connectJSONreferences !== undefined) {
      callback(connectJSONreferences);
      return;
    }
    let updatesURL = connectOptions.sdkLocation;
    let replaceJSONWithFullHref = function (connectversionsSdkLocation: string, entryJSON: any) {
      for (let i = 0; i < entryJSON.links.length; i++) {
        let hrefLink = entryJSON.links[i].href;
        if (!/^https?:\/\//i.test(hrefLink) && !/^\/\//.test(hrefLink)) {
          entryJSON.links[i].hrefAbsolute = connectversionsSdkLocation + '/' + hrefLink;
        }
      }
    };
    // load references from file and parse to load in the iframe
    const parseIstallJSON = (connectversionsSdkLocation: string) => {
      let parsedInstallJSON = connectRefs;
      let installEntries = parsedInstallJSON.entries;
      let procesJSONentry = function (entryJSON: any) {
        replaceJSONWithFullHref(connectversionsSdkLocation, entryJSON);
        connectJSONreferences = entryJSON;
        callback(entryJSON);
      };
      let userOS = osPlatform();
      for (let i = 0; i < installEntries.length; i++) {
        let entry = installEntries[i];
        if (entry.navigator.platform === userOS) {
          let userOSVersion = osVersion();
          let currentPlatform = platformVersion(entry.platform.version);
          if (!Utils.isNullOrUndefinedOrEmpty(currentPlatform) && !Utils.isNullOrUndefinedOrEmpty(userOSVersion)) {
            if ((userOSVersion.highWord > currentPlatform.highWord) ||
                  (userOSVersion.highWord >= currentPlatform.highWord &&
                      userOSVersion.loWord >= currentPlatform.loWord)) {
              procesJSONentry(entry);
              return;
            }
          } else {
            procesJSONentry(entry);
            return;
          }
        }
      }
      this.showUnsupportedBrowser();
    };
    let scriptLoaded = function (success: boolean) {
      let fallbackURL = DEFAULT_SDK_LOCATION;// connectOptions.sdkLocation;
      if (success && connectRefs !== undefined) {
        parseIstallJSON(updatesURL);
      } else if (updatesURL !== fallbackURL) {
        updatesURL = fallbackURL;
      }
    };
    loadFiles([updatesURL + CONNECT_VERSIONS_JSON], 'json', scriptLoaded);
    return;
  };

    /**
     * @ignore
     *
     * Determines if user has already installed the Connect extensions.
     *
     * *This method is asynchronous.*
     *
     * @function
     * @name AW4.ConnectInstaller#isExtensionInstalled
     * @param {Number} timeout Timeout (in milliseconds) to wait before the extension
     *   is considered not to be installed.
     * @param {Callbacks} callbacks `success` and `error` functions to receive
     *   results.
     * @return {null}
     */
  this.isExtensionInstalled = function (timeout: number) {
    // Prereq: asperaweb-4 needs to be loaded first
    // @ts-ignore
    let extReqImpl: types.RequestStrategy = Utils.BROWSER.SAFARI_NO_NPAPI ? new SafariAppStrategy() : new NativeHostStrategy();
    if (!supportsExtensions()) {
      Logger.log('This browser does not use extensions.');
      return;
    }

    return extReqImpl.detectExtension!(timeout);
  };

    /**
     * Determine if current browser requires web store to install extensions.
     *
     * @function
     * @name AW4.ConnectInstaller#doesBrowserNeedExtensionStore
     * @return {Boolean}
     */
  this.doesBrowserNeedExtensionStore = function () {
    if (Utils.BROWSER.CHROME === true ||
            Utils.BROWSER.FIREFOX === true ||
            Utils.BROWSER.EDGE_WITH_EXTENSION === true) {
      return true;
    }
        // IE = ActiveX
        // Safari = bundled app extension
    return false;
  };

  /**
   * For supported browsers, returns a url for extension installation.
   *
   * @function
   * @name AW4.ConnectInstaller#getExtensionStoreLink
   * @return {String}
   *
   * @example
   * // On a Chrome browser
   * asperaInstaller.getExtensionStoreLink()
   * // returns "https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn"
   */
  this.getExtensionStoreLink = function () {
    if (Utils.BROWSER.FIREFOX === true) {
      return 'https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect';
    } else if (Utils.BROWSER.EDGE_WITH_EXTENSION === true) {
      return 'ms-windows-store://pdp/?productid=9N6XL57H8BMG';
    } else if (Utils.BROWSER.EDGE_CHROMIUM === true) {
      return 'https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn';
    } else if (Utils.BROWSER.CHROME === true) {
      return 'https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn';
    }

    Logger.log('This browser does not use extensions.');
    return '';
  };

  /**
   * AW4.ConnectInstaller#startExtensionInstall() -> null
   *
   * In supported browsers, starts the extension installation experience.
   * To avoid issues with popup blockers, considering using anchor tag with `AW4.ConnectInstaller#getExtensionStoreLink`
   *
   */
  this.startExtensionInstall = function () {
    let lnk = this.getExtensionStoreLink();
    if (lnk !== '') {
      window.open(lnk, '_blank');
    }
  };

  let getRefreshWindow = function () {
    // Fix for refreshing only window in which we are contained, if we are an iframe just refresh the iframe (Sharepoint bug)
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }
    let refreshWindow = window;
        // NOTE: contentWindow used in thsi way will always be undefined according to its HTML specification
    if (inIframe) {
      let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;
      if (iframe.contentWindow) {
        refreshWindow = iframe.contentWindow;
      }
    }
    return refreshWindow;
  };

  // Get top window href and open in new tab
  let openNewTab = function () {
    let url = window.top.location.href;
    window.open(url, '_blank');
  };

  let isActivityEvent = function (e: any) {
    for (let key in ACTIVITY_EVENT) {
      if (ACTIVITY_EVENT[key] === e) {
        return true;
      }
    }
    return false;
  };

  /*
   * AW4.ConnectInstaller#show(eventType) -> null
   * - eventType (String): the event type
   *
   * ##### Event types
   *
   * 1. `connecting` (`String`).
   * 2. `unable-to-launch` (`String`).
   * 3. `refresh` (`String`).
   * 4. `outdated` (`String`).
   * 5. `running` (`String`).
   *
   */
  let show = (eventType: string) => {
    // We always need to check if launching was going to be popped up, if so delete it
    if (showInstallTimerID !== 0) {
      clearTimeout(showInstallTimerID);
    }
    let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;

    // To support old browser that don't have it
    if (typeof(String.prototype.endsWith) === 'undefined') {
      String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };
    }
    // IE will complain that in strict mode functions cannot be nested inside a statement, so we have to define it here
    const handleMessage = (event: any) => {
      // iFrame installation: Handling of messages by the parent window.
      if (isActivityEvent(event.data)) {
        Logger.debug('Connect bar activity: ', event.data);
        notifyActivityListeners(event.data);

        if (event.data === ACTIVITY_EVENT.CLICKED_DOWNLOAD_APP) {
          // Track if the user downloaded the app
          Utils.setLocalStorage('aspera-connect-app-download', Date.now().toString());
        } else if (event.data === ACTIVITY_EVENT.CLICKED_INSTALL_APP) {
          if (Utils.BROWSER.SAFARI || Utils.BROWSER.IE) {
            // Transition to extension_installs state if user clicks install app
            //   on Safari or IE.
            this.showExtensionInstall();
          }
        } else if (event.data === ACTIVITY_EVENT.CLICKED_RETRY) {
          openNewTab();
        }
      }

      if (event.data === EVENT.DOWNLOAD_CONNECT) {
        notifyListeners(event.data);
        this.showInstall();
      } else if (event.data === EVENT.DOWNLOAD_EXTENSION) {
        notifyListeners(event.data);
        this.showDownload();
      } else if (event.data === EVENT.REFRESH_PAGE) {
        notifyListeners(event.data);
        let refreshWindow = getRefreshWindow();
        // tslint:disable-next-line
        refreshWindow.location.reload(true);
      } else if (event.data === EVENT.IFRAME_REMOVED) {
        notifyListeners(event.data);
        this.dismiss();
      } else if (event.data === EVENT.TROUBLESHOOT) {
        notifyListeners(event.data);
        let refreshWindow = getRefreshWindow();
        refreshWindow.location.href = 'https://test-connect.asperasoft.com';
      } else if (event.data === EVENT.CONTINUE) {
        Utils.addVersionException();
        notifyListeners(event.data);
        if ((Utils.BROWSER.SAFARI && !Utils.BROWSER.SAFARI_NO_NPAPI) || Utils.BROWSER.IE) {
          let refreshWindow = getRefreshWindow();
          // tslint:disable-next-line
          refreshWindow.location.reload(true);
        } else {
          this.showLaunching();
        }
      } else if (event.data === EVENT.RETRY) {
        notifyListeners(event.data);
        this.showLaunching();
      } else if (event.data === '100%') {
        iframe.setAttribute('style', 'height:100%;width:100%;max-width: 100%;margin: 0 auto;background-color:rgba(223, 227, 230, 0.75);');
      } else if (typeof event.data === 'string' && event.data.endsWith(EVENT.RESIZE)) {
        iframe.style.height = event.data;
        iframe.style.maxWidth = '600px';
      } else if (event.data === EVENT.EXTENSION_INSTALL) {
        notifyListeners(event.data);
        this.startExtensionInstall();
      }
    }
    // IE will complain that in strict mode functions cannot be nested inside a statement, so we have to define it here
    const iframeLoaded = () => {
      iframeLoadedFlag = true;
      notifyListeners(EVENT.IFRAME_LOADED);

      let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;

      if (Utils.BROWSER.SAFARI || Utils.BROWSER.IE) {
        let downloadTimestamp = Utils.getLocalStorage('aspera-connect-app-download');
        if (!Utils.isNullOrUndefinedOrEmpty(downloadTimestamp)) {
          iframe.contentWindow!.postMessage('downloadTimestamp=' + downloadTimestamp, '*');
        }
      }

      // populate the iframe with the information pulled from connectversions.js
      let populateIframe = function (referencesJSON: any) {
        if (referencesJSON) {
          for (let i = 0; i < referencesJSON.links.length; i++) {
            let link = referencesJSON.links[i];
            // Defaults to setting one click installer unless ConnectInstaller was
            //   passed oneClick = false.
            let rel = connectOptions.oneClick ? 'enclosure-one-click' : 'enclosure';
            // Serve FIPS installers if opted in
            if (connectOptions.useFips && /Win/.test(navigator.platform)) {
              rel = rel + '-fips';
            }

            if (link.rel === rel) {
              if (typeof iframe !== 'undefined' && iframe !== null) {
                iframe.contentWindow!.postMessage('downloadlink=' + link.hrefAbsolute, '*');
                iframe.contentWindow!.postMessage('downloadVersion=' + referencesJSON.version, '*');
              }
            }
          }
        } else {
          Logger.error('Could not load Connect installation json!');
        }

        // Set dialog type
        iframe.contentWindow!.postMessage(eventType, '*');
      };

      this.installationJSON(populateIframe);
      // load an stylesheet if provided
      if (connectOptions.stylesheetLocation) {
        // Inserting a stylesheet into the DOM for more manageable styles.
        if (typeof iframe !== 'undefined' && iframe !== null) {
          iframe.contentWindow!.postMessage('insertstylesheet=' + connectOptions.stylesheetLocation, '*');
        }
      }

      if (connectOptions.correlationId) {
        iframe.contentWindow!.postMessage('correlationId=' + connectOptions.correlationId, '*');
      }

      if (__VERSION__) {
        iframe.contentWindow!.postMessage('sdkVersion=' + __VERSION__, '*');
      }

      notifyListeners(EVENT.IFRAME_LOADED);
    };

    if (!iframe) {
            // Set iframe styling
      if (connectOptions.style === 'carbon') {
        addStyleString('.' + connectOptions.iframeId + '{width: 100%;max-width: 600px;height: 80px;margin: 0 auto;position: fixed;top: 0;right: 0;left: 0;z-index: 9999;box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1)}');
      } else if (connectOptions.style === 'blue') {
        addStyleString('.' + connectOptions.iframeId + '{position: absolute;width: 100%;height: 80px;margin: 0px;padding: 0px;border: none;outline: none;overflow: hidden;top: 0px;left: 0px;z-index: 999999999}');
      }
            // Build and insert the iframe.
      iframe = document.createElement('iframe');
      iframe.id = connectOptions.iframeId;
      iframe.className = connectOptions.iframeId;
      // tslint:disable-next-line
      iframe.frameBorder = '0';

      if (connectOptions.style === 'carbon') {
        iframe.src = connectOptions.sdkLocation + '/install/carbon-installer/index.html';
      } else if (connectOptions.style === 'blue') {
        iframe.src = connectOptions.sdkLocation + '/install/auto-topbar/index.html';
      }

      document.body.appendChild(iframe);
            // Check for tight security policies
      if (!iframe.contentWindow!.postMessage) {
        return;
      }

            // Set listener for messages from the iframe installer.
      if (window.attachEvent) {
        window.attachEvent('onmessage', handleMessage);
      } else {
        window.addEventListener('message', handleMessage, false);
      }
    }
    // if the iframe is hidden due to dismiss, reset the display style
    iframe.style.display = "";

    if (iframeLoadedFlag) {
      iframe.contentWindow!.postMessage(eventType, '*');
    } else {
            // Give time to the iFrame to be loaded #31040
            // @ts-ignore
      if (iframe.attachEvent) {
                // @ts-ignore
        iframe.attachEvent('onload', iframeLoaded);
      } else {
        iframe.onload = iframeLoaded;
      }
    }
  };

    // Direct communication from Connect
  window.addEventListener('message', (event) => {
    if (event.data === 'show_extension_install') {
      this.showExtensionInstall();
    } else if (event.data === 'show_safari_mitigate') {
      show('safari_mitigate');
    }
  }, false);

    /**
     * Displays a banner at the top of the screen explaining to the user that Connect
     * is trying to be launched.
     *
     * @function
     * @name AW4.ConnectInstaller#showLaunching
     * @param {Number} [timeout=3500] Timeout to show the banner in milliseconds. If at any point
     *   during this timeout {@link AW4.ConnectInstaller#connected} or {@link AW4.ConnectInstaller#dismiss}
     *   are called, the banner will not appear.
     * @return {null}
     */
  this.showLaunching = function (timeout: number = 3500) {
    if (showInstallTimerID !== 0) {
      clearTimeout(showInstallTimerID);
    }

    let showLaunchingHelperFunction = function () {
      show('launching');
    };
    showInstallTimerID = setTimeout(showLaunchingHelperFunction, timeout);
  };

    /**
     * Displays a banner at the top of the screen notifying the user to download Connect.
     *
     * @function
     * @name AW4.ConnectInstaller#showDownload
     * @return {null}
     */
  this.showDownload = function () {
    show('download');
  };

    /**
     * Displays a banner at the top of the screen explaining to the user what to do once
     * Connect has been downloaded.
     *
     * @function
     * @name AW4.ConnectInstaller#showInstall
     * @return {null}
     */
  this.showInstall = function () {
    show('install');
    Utils.setLocalStorage('aspera-install-attempted', 'true');
  };

    /**
     * Displays a banner at the top of the screen notifying the user to update Connect
     * to the latest version.
     *
     * @function
     * @name AW4.ConnectInstaller#showUpdate
     * @return {null}
     */
  this.showUpdate = function () {
    show('update');
  };

    /**
     * Displays a banner with the option to retry launching Connect.
     *
     * @function
     * @name AW4.ConnectInstaller#showRetry
     * @return {null}
     */
  this.showRetry = function () {
    show('retry');
    retryCount++;
  };

    /**
     * Displays a page with instructions to install the browser extension.
     *
     * @function
     * @name AW4.ConnectInstaller#showExtensionInstall
     * @return {null}
     */
  this.showExtensionInstall = function () {
    show('extension_install');

    if (!Utils.BROWSER.IE) {
      // Create a DOM element to help the extension return to the right page
      let extHelper = document.createElement('div');
      extHelper.className = 'aspera-connect-ext-locator'; // TODO: Document
      extHelper.style.display = 'none';
      document.body.appendChild(extHelper);
    }
  };

  /**
   * Displays the last page that was shown.
   *
   * @function
   * @name AW4.ConnectInstaller#showPrevious
   * @return {null}
   */
  this.showPrevious = function () {
    show('previous');
  };

    /**
     * Displays a banner explaining that the browser is not supported by Connect.
     *
     * @function
     * @name AW4.ConnectInstaller#showUnsupportedBrowser
     * @return {null}
     */
  this.showUnsupportedBrowser = function () {
    show('unsupported_browser');
  };

    /**
     * Displays a temporary message that Connect has been found, and after `timeout` dismisses the
     * banner
     *
     * @function
     * @name AW4.ConnectInstaller#connected
     *
     * @param {Number} [timeout=2000] Timeout (in milliseconds) until the banner
     *   is dismissed..
     * @return {null}
     */
  this.connected = function (timeout: number = 2000) {
    clearTimeout(showInstallTimerID);
    let iframe = document.getElementById(connectOptions.iframeId);
    if (typeof iframe !== 'undefined' && iframe !== null) {
      show('running');
      setTimeout(this.dismiss, timeout);
      Utils.setLocalStorage('aspera-last-detected', String(Date.now().toString()));
    }

    return;
  };

    /**
     * Dismisses the banner.
     *
     * @function
     * @name AW4.ConnectInstaller#dismiss
     * @return {null}
     */
  this.dismiss = function () {
    if (showInstallTimerID !== 0) {
      clearTimeout(showInstallTimerID);
    }

    let iframe = document.getElementById(connectOptions.iframeId);
    if (typeof iframe !== 'undefined' && iframe !== null) {
      iframe.style.display = 'none';
    }

    return;
  };
};

ConnectInstaller.EVENT = EVENT;
ConnectInstaller.ACTIVITY_EVENT = ACTIVITY_EVENT;
ConnectInstaller.EVENT_TYPE = EVENT_TYPE;
ConnectInstaller.supportsInstallingExtensions = false;

export { ConnectInstaller };
