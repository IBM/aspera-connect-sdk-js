import * as Utils from './utils';
import { Logger } from './logger';
import { NativeHostStrategy, SafariAppStrategy } from './request/strategy/extension';
import { INSTALL_EVENT as EVENT, ACTIVITY_EVENT, EVENT_TYPE } from './constants';
import * as types from './core/types';
import { connectInstallerBanner } from './constants/banner';

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
 * @param {String} [sdkLocation="//d3gcli72yxqn2z.cloudfront.net/downloads/connect/latest"] URL
 *   to the SDK location to serve Connect installers from. Needs to be served in
 *   the same level of security as the web page (HTTP/HTTPS). This option is often used
 *   if you are hosting your own instance of the Connect SDK.
 *
 *   Format:
 *   `//domain/path/to/connect/sdk`
 * @param {"carbon"|"none"} [style="carbon"] Style of the Connect bar design. Specify "none" if you have
 *   a custom Connect install experience. Default: "carbon"
 * @param {String} [stylesheetLocation] URL to a stylesheet. Needs to be served
 *   in the same level of security as the web page (HTTP/HTTPS).
 *
 *   Format:
 *   `//domain/path/to/css/file.css`
 * @param {String} [version="latest"] Connect installer version to offer for downloads. This option is ignored
 * if `sdkLocation` is specified. Only supports versions `4.x.x` and up.
 *
 *   For example, to offer 4.1.2 Connect Installers, specify `4.1.2`.
 *
 * @example
 * let options = {
 *   style: 'carbon'
 * }
 * let asperaInstaller = new AW4.ConnectInstaller(options)
 */
const ConnectInstaller = function ConnectInstaller (this: any, options?: types.InstallerOptions): void {
  if (!new.target) {
    throw new Error('ConnectInstaller() must be called with new');
  }

  const DEFAULT_SDK_LOCATION = '//d3gcli72yxqn2z.cloudfront.net/downloads/connect';
  const CONNECT_VERSIONS_JS = '/versions.js';

  const connectOptions: any = {};
  const listeners: any = [];
  let connectJSONreferences: any | undefined;
  let showInstallTimerID = 0;
  let iframeLoadedFlag = false;
  const connectInstallerListeners: any = [];
  const isSupportedBrowser = !Utils.BROWSER.IE;

  if (Utils.isNullOrUndefinedOrEmpty(options)) {
    options = {};
  }

  if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage('aspera-install-attempted'))) {
    Utils.setLocalStorage('aspera-install-attempted', 'true');
  }
  if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage('aspera-last-detected'))) {
    Utils.setLocalStorage('aspera-last-detected', '');
  }

  connectOptions.version = options.version || 'latest';
  connectOptions.iframeId = options.iframeId || 'aspera-iframe-container';
  connectOptions.sdkLocation = (Utils.isNullOrUndefinedOrEmpty(options.sdkLocation)) ? `${DEFAULT_SDK_LOCATION}/${connectOptions.version}` : Utils.getFullURI(options.sdkLocation);
  connectOptions.stylesheetLocation = Utils.getFullURI(options.stylesheetLocation);
  connectOptions.correlationId = options.correlationId;
  connectOptions.style = options.style || 'carbon';

  if (typeof (Storage) !== 'undefined') {
    const overrideStyle = Utils.getLocalStorage('aspera-connect-install-style');
    if (overrideStyle) {
      connectOptions.style = overrideStyle;
    }
  }

  if (connectOptions.style === 'carbon') {
    // @ts-ignore
    ConnectInstaller.supportsInstallingExtensions = true;
  }

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
  const loadFiles = function (files: string[], type: string, callback: any) {
    if (files === null || typeof files === 'undefined' || !(files instanceof Array)) {
      return;
    } else if (type === null || typeof type !== 'string') {
      return;
    }
    let numberOfFiles = 0;
    const head = document.getElementsByTagName('head')[0] || document.documentElement;

    /* Loads the file given, and sets a callback, when the file is the last one and a callback is
     * provided, it will call it
     * Loading mechanism based on https://jquery.org (MIT license)
     */
    const loadFilesHelper = function (file: string) {
      // IE9+ supports both script.onload AND script.onreadystatechange thus the done check
      let done = false;
      let fileref: HTMLScriptElement | HTMLLinkElement;

      if (type.toLowerCase() === 'js') {
        fileref = document.createElement('script');
        fileref.setAttribute('type', 'text/javascript');
        fileref.setAttribute('src', file);
      } else if (type.toLowerCase() === 'css') {
        fileref = document.createElement('link');
        fileref.setAttribute('rel', 'stylesheet');
        fileref.setAttribute('type', 'text/css');
        fileref.setAttribute('href', file);
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

  const osPlatform = function () {
    let os: 'win64' | 'macOS' | 'linux' | 'unsupported' = 'unsupported';
    if (/Win/.test(navigator.platform)) {
      os = 'win64';
    } else if (/CrOS/.test(navigator.userAgent)) {
      // Chrome OS not supported
      return os;
    } else if (/Mac/.test(navigator.platform)) {
      os = 'macOS';
    } else if (/Linux/.test(navigator.platform)) {
      os = 'linux';
    }

    return os;
  };

  const notifyListeners = function (event: any) {
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  };

  const notifyActivityListeners = function (status: any) {
    for (let i = 0; i < connectInstallerListeners.length; i++) {
      connectInstallerListeners[i](status);
    }
  };

  const supportsExtensions = function () {
    return (
      (Utils.BROWSER.CHROME || Utils.BROWSER.EDGE_WITH_EXTENSION || Utils.BROWSER.FIREFOX) ||
      Utils.BROWSER.SAFARI_NO_NPAPI
    );
  };

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
   *         "os": "win64"
   *    },
   *     "version": "4.1.1.73",
   *     "updated": "2021-12-08T22:07:40.390Z",
   *     "links": [
   *         {
   *             "title": "Windows 64-bit Installer",
   *             "type": "application/octet-stream",
   *             "href": "bin/ibm-aspera-connect_4.1.1.73_win64.exe",
   *             "hreflang": "en",
   *             "rel": "enclosure"
   *         },
   *         {
   *             "title": "Aspera Connect Release Notes for Windows",
   *             "type": "text/html",
   *             "href": "https://www.ibm.com/docs/en/aspera-connect/4.1?topic=notes-release-aspera-connect-411",
   *             "hreflang": "en",
   *             "rel": "release-notes"
   *         }
   *      ]
   *   }
   *   ...
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
    const replaceJSONWithFullHref = function (connectversionsSdkLocation: string, entryJSON: any) {
      for (let i = 0; i < entryJSON.links.length; i++) {
        const hrefLink = entryJSON.links[i].href;
        if (!/^https?:\/\//i.test(hrefLink) && !/^\/\//.test(hrefLink)) {
          entryJSON.links[i].hrefAbsolute = connectversionsSdkLocation + '/' + hrefLink;
        }
      }
    };

    // Load references from file and parse to load in the iframe
    const parseInstallJSON = (connectversionsSdkLocation: string) => {
      const parsedInstallJSON = (window as any).connectVersions;
      const installEntries = parsedInstallJSON.entries;

      // Prefix the installer filename with `sdkLocation` to generate the full URL to the installer
      const procesJSONentry = function (entryJSON: any) {
        replaceJSONWithFullHref(connectversionsSdkLocation, entryJSON);
        connectJSONreferences = entryJSON;
        callback(entryJSON);
      };

      // Find the installer for the user's current OS
      const userOS = osPlatform();
      for (let i = 0; i < installEntries.length; i++) {
        const entry = installEntries[i];
        if (userOS === entry.platform.os) {
          procesJSONentry(entry);
          return;
        }
      }

      Logger.error(`Unable to find installer info for current platform: ${userOS}`);
      this.showUnsupportedBrowser();
    };

    const scriptLoaded = function (success: boolean) {
      const fallbackURL = `${DEFAULT_SDK_LOCATION}/${connectOptions.version}`;
      if (success && (window as any).connectVersions !== undefined) {
        parseInstallJSON(updatesURL);
      } else if (updatesURL !== fallbackURL) {
        updatesURL = fallbackURL;
      }
    };

    loadFiles([updatesURL + CONNECT_VERSIONS_JS], 'js', scriptLoaded);
    return;
  };

  /**
   * Determines if user has already installed the Connect extensions.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @ignore
   * @name AW4.ConnectInstaller#isExtensionInstalled
   * @param {Number} timeout Timeout (in milliseconds) to wait before the extension
   *   is considered not to be installed.
   * @param {Callbacks} callbacks `success` and `timedout` functions to receive
   *   results.
   * @return {null}
   */
  this.isExtensionInstalled = function (timeout: number, callbacks?: types.DetectionCallbacks) {
    // Prereq: connect-sdk needs to be loaded first
    // @ts-ignore
    const extReqImpl: types.RequestStrategy = Utils.BROWSER.SAFARI_NO_NPAPI ? new SafariAppStrategy() : new NativeHostStrategy();
    if (!supportsExtensions()) {
      Logger.debug('This browser does not use extensions.');
      return;
    }

    if (callbacks) {
      extReqImpl.detectExtension?.(timeout).then(
        (success: boolean) => {
          if (success && typeof callbacks.success === 'function') {
            callbacks.success();
          }

          if (!success && typeof callbacks.timedout === 'function') {
            callbacks.timedout();
          }
        }
      ).catch(
        (err: any) => {
          Logger.debug('Error trying to detect extension:', err);
          if (typeof callbacks.timedout === 'function') {
            callbacks.timedout();
          }
        }
      );
    } else {
      return extReqImpl.detectExtension?.(timeout);
    }
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
      return 'https://microsoftedge.microsoft.com/addons/detail/ibm-aspera-connect/kbffkbiljjejklcpnfmoiaehplhcifki';
    } else if (Utils.BROWSER.CHROME === true) {
      return 'https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn';
    }

    Logger.debug('This browser does not use extensions.');
    return '';
  };

  /*
   * AW4.ConnectInstaller#startExtensionInstall() -> null
   *
   * In supported browsers, starts the extension installation experience.
   * To avoid issues with popup blockers, considering using anchor tag with `AW4.ConnectInstaller#getExtensionStoreLink`
   *
   */
  this.startExtensionInstall = function () {
    const lnk = this.getExtensionStoreLink();
    if (lnk !== '') {
      window.open(lnk, '_blank');
    }
  };

  const getRefreshWindow = function () {
    // Fix for refreshing only window in which we are contained, if we are an iframe just refresh the iframe (Sharepoint bug)
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch (e) {
      inIframe = true;
    }

    if (inIframe) {
      const iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;
      if (iframe.contentWindow) {
        return iframe.contentWindow;
      }
    }

    return window;
  };

  // Get top window href and open in new tab
  const openNewTab = function () {
    // @ts-ignore
    const url = window.top.location.href;
    window.open(url, '_blank');
  };

  const isActivityEvent = function (e: any) {
    for (const key in ACTIVITY_EVENT) {
      if (ACTIVITY_EVENT[key] === e) {
        return true;
      }
    }
    return false;
  };

  // Apply the carbon installer inline styles
  const setCarbonBannerStyle = function (iframe: HTMLIFrameElement, small: boolean) {
    iframe.style.position = 'fixed';
    iframe.style.border = 'none';
    iframe.style.outline = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.top = '0';
    iframe.style.right = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '9999';
    iframe.style.boxShadow = '0 12px 24px 0 rgba(0, 0, 0, 0.1)';

    if (small) {
      iframe.style.height = '80px';
      iframe.style.width = '100%';
      iframe.style.margin = '0 auto';
      iframe.style.maxWidth = '600px';
    } else {
      iframe.style.height = '100%';
      iframe.style.width = '100%';
      iframe.style.margin = '0';
      iframe.style.maxWidth = '100%';
      iframe.style.backgroundColor = 'rgba(223, 227, 230, 0.75)';
    }
  };

  const setHideClass = function (hide: boolean) {
    const iframe = document.getElementById(connectOptions.iframeId);
    if (iframe) {
      iframe.style.display = hide ? 'none' : '';
      // TODO: remove redundant visibility style (required by Faspex GA)
      iframe.style.visibility = hide ? 'hidden' : '';
    }
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
  const show = (eventType: string) => {
    // We always need to check if launching was going to be popped up, if so delete it
    if (showInstallTimerID !== 0) {
      clearTimeout(showInstallTimerID);
    }
    let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;

    // To support old browser that don't have it
    if (typeof (String.prototype.endsWith) === 'undefined') {
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
        const refreshWindow = getRefreshWindow();
        // @ts-ignore
        refreshWindow.location.reload(true);
      } else if (event.data === EVENT.IFRAME_REMOVED) {
        notifyListeners(event.data);
        this.dismiss();
      } else if (event.data === EVENT.TROUBLESHOOT) {
        notifyListeners(event.data);
        const refreshWindow = getRefreshWindow();
        refreshWindow.location.href = 'https://test-connect.ibmaspera.com';
      } else if (event.data === EVENT.CONTINUE) {
        Utils.addVersionException();
        notifyListeners(event.data);
        if ((Utils.BROWSER.SAFARI && !Utils.BROWSER.SAFARI_NO_NPAPI) || Utils.BROWSER.IE) {
          const refreshWindow = getRefreshWindow();
          // @ts-ignore
          refreshWindow.location.reload(true);
        } else {
          this.showLaunching();
        }
      } else if (event.data === EVENT.RETRY) {
        notifyListeners(event.data);
        this.showLaunching();
      } else if (event.data === '100%') {
        setCarbonBannerStyle(iframe, false);
      } else if (typeof event.data === 'string' && event.data.endsWith(EVENT.RESIZE)) {
        iframe.style.height = event.data;
        iframe.style.maxWidth = '600px';
      } else if (event.data === EVENT.EXTENSION_INSTALL) {
        notifyListeners(event.data);
        this.startExtensionInstall();
      }
    };
    // IE will complain that in strict mode functions cannot be nested inside a statement, so we have to define it here
    const iframeLoaded = () => {
      iframeLoadedFlag = true;
      notifyListeners(EVENT.IFRAME_LOADED);

      const iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;

      if (Utils.BROWSER.SAFARI || Utils.BROWSER.IE) {
        const downloadTimestamp = Utils.getLocalStorage('aspera-connect-app-download');
        if (!Utils.isNullOrUndefinedOrEmpty(downloadTimestamp)) {
          iframe.contentWindow?.postMessage('downloadTimestamp=' + downloadTimestamp, '*');
        }
      }

      // populate the iframe with the information pulled from connectversions.js
      const populateIframe = function (referencesJSON: any) {
        if (referencesJSON) {
          for (let i = 0; i < referencesJSON.links.length; i++) {
            const link = referencesJSON.links[i];

            if (link.rel === 'enclosure-one-click') {
              if (typeof iframe !== 'undefined' && iframe !== null) {
                iframe.contentWindow?.postMessage('downloadlink=' + link.hrefAbsolute, '*');
                iframe.contentWindow?.postMessage('downloadVersion=' + referencesJSON.version, '*');
              }
            }
          }
        } else {
          Logger.error('Could not load Connect installation json!');
        }

        // Set dialog type
        iframe.contentWindow?.postMessage(eventType, '*');
      };

      this.installationJSON(populateIframe);
      // load an stylesheet if provided
      if (connectOptions.stylesheetLocation) {
        // Inserting a stylesheet into the DOM for more manageable styles.
        if (typeof iframe !== 'undefined' && iframe !== null) {
          iframe.contentWindow?.postMessage('insertstylesheet=' + connectOptions.stylesheetLocation, '*');
        }
      }

      if (connectOptions.correlationId) {
        iframe.contentWindow?.postMessage('correlationId=' + connectOptions.correlationId, '*');
      }
    };

    if (!iframe) {
      if (connectOptions.style === 'none') {
        Logger.debug('style=none specified, will not load banner.');
        return;
      }

      // Build and insert the iframe.
      iframe = document.createElement('iframe');
      iframe.id = connectOptions.iframeId;
      iframe.className = connectOptions.iframeId;
      iframe.frameBorder = '0';

      setCarbonBannerStyle(iframe, true);
      iframe.srcdoc = connectInstallerBanner;

      document.body.appendChild(iframe);
      // Check for tight security policies
      if (!iframe.contentWindow?.postMessage) {
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
    setHideClass(false);

    if (iframeLoadedFlag) {
      iframe.contentWindow?.postMessage(eventType, '*');
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
  this.showLaunching = function (timeout = 3500) {
    if (showInstallTimerID !== 0) {
      clearTimeout(showInstallTimerID);
    }

    const showLaunchingHelperFunction = function () {
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
    if (isSupportedBrowser) {
      show('download');
    } else {
      this.showUnsupportedBrowser();
    }
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
    if (isSupportedBrowser) {
      show('install');
      Utils.setLocalStorage('aspera-install-attempted', 'true');
    } else {
      this.showUnsupportedBrowser();
    }
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
    if (isSupportedBrowser) {
      show('update');
    } else {
      this.showUnsupportedBrowser();
    }
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
      const extHelper = document.createElement('div');
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
  this.connected = (timeout = 2000) => {
    clearTimeout(showInstallTimerID);
    const iframe = document.getElementById(connectOptions.iframeId);
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

    setHideClass(true);
    return;
  };
} as any as types.ConnectInstallerType;

ConnectInstaller.EVENT = EVENT;
ConnectInstaller.ACTIVITY_EVENT = ACTIVITY_EVENT;
ConnectInstaller.EVENT_TYPE = EVENT_TYPE;
ConnectInstaller.supportsInstallingExtensions = false;

export { ConnectInstaller };
