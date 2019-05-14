import { INSTALL_EVENT as EVENT, MIN_SECURE_VERSION } from './shared/constants';
import * as Utils from './utils';
import * as Logger from './logger';
import { connectVersion, connectVersions, minRequestedVersion } from './shared/sharedInternals';
import NativeMessageExtRequestImplementation from './request/native-message-ext';
import SafariAppExtRequestImplementation from './request/safari-app-ext';
/**
 * == API ==
 **/

/** section: API
 * AW4
 *
 * The Aspera Web namespace.
 **/

/** section: API
 * class AW4.ConnectInstaller
 *
 * The [[AW4.ConnectInstaller]] class offers support for connect installation.
 **/

 /**
 * new AW4.ConnectInstaller([options])
 * - options (Object): Configuration parameters for the plug-in.
 *
 * Creates a new [[AW4.ConnectInstaller]] object.
 *
 * ##### Options
 *
 * 1. `sdkLocation` (`String`):
 *     URL to the SDK location that has to be served in the same level of security
 *     as the web page (http/https). It has to be in the following format:\
 *     `//domain/path/to/connect/sdk`\
 *     Default: \
 *     `//d3gcli72yxqn2z.cloudfront.net/connect/v4`.
 *
 *     If the installer cannot reach the needed files (by checking for connectversions.js
 *     or connectversions.min.js) on the default server it will automatically fallback to
 *     locate them at the hosted SDKs location.
 *
 *     The client web application can choose to load connectinstaller-4.js (or connectinstaller-4.min.js)
 *     from a local deployment of the Connect SDK (by specifying an `sdklocation`).
 *     The Connect installer tries to reach the default cloudfront.net location and, if reachable,
 *     delivers the Connect installer from the cloudfront.net.
 *     If cloudfront.net is not reachable, connectinstaller-4.js will deliver the Connect
 *     installer from the provided `sdkLocation`.
 *
 * 2. `stylesheetLocation` (`String`):
 *     URL to an stylesheet that has to be served in the same level of security
 *     as the web page (http/https). It has to be in the following format:\
 *     `//domain/path/to/css/file.css`\
 *     Default: ``
 * 3. `iframeId` (`String`):
 *     Id of the iframe that is going to be inserted in the DOM
 *     Default: `aspera-iframe-container`
 * 4. `iframeClass` (`String`):
 *     Class to be added to the iframe that is going to be inserted in the DOM,
 *     for easier use with the custom stylesheet
 *     Default: `aspera-iframe-container`
 * 5. `style` (`String`):
 *     Style of the Connect bar design. There are two options currently, blue or carbon.
 *     Default style is carbon.
 *
 * ##### Example
 *
 * The following JavaScript creates an [[AW4.ConnectInstaller]] object to manage
 * the installation process.
 *
 *     var asperaInstaller = new AW4.ConnectInstaller();
 *
 **/
 interface IConnectInstallerOptions {
   sdkLocation?: string;
   stylesheetLocation?: string;
   iframeId?: string;
   iframeClass?: string;
   style?: string;
 }
 
function ConnectInstaller (options: IConnectInstallerOptions) {

    ////////////////////////////////////////////////////////////////////////////
    // Public constants
    ////////////////////////////////////////////////////////////////////////////

    /**
     * AW4.ConnectInstaller.EVENT -> Object
     *
     * Event types:
     *
     * 1. `AW4.ConnectInstaller.EVENT.DOWNLOAD_CONNECT` (`"downloadconnect"`)
     * 2. `AW4.ConnectInstaller.EVENT.REFRESH_PAGE` (`"refresh"`)
     * 3. `AW4.ConnectInstaller.EVENT.IFRAME_REMOVED` (`"removeiframe"`)
     * 4. `AW4.ConnectInstaller.EVENT.IFRAME_LOADED` (`"iframeloaded"`)
     * 5. `AW4.ConnectInstaller.EVENT.TROUBLESHOOT` (`"troubleshoot"`)
     * 6. `AW4.ConnectInstaller.EVENT.CONTINUE` (`"continue"`)
     * 7. `AW4.ConnectInstaller.EVENT.RETRY` (`"retry"`)
     * 8. `AW4.ConnectInstaller.EVENT.EXTENSION_INSTALL` (`"extension_install"`)
     **/
    // AW4.ConnectInstaller.EVENT = {
    //     DOWNLOAD_CONNECT : "downloadconnect",
    //     REFRESH_PAGE : "refresh",
    //     IFRAME_REMOVED : "removeiframe",
    //     IFRAME_LOADED : "iframeloaded",
    //     TROUBLESHOOT : "troubleshoot",
    //     CONTINUE : "continue",
    //     RESIZE : "px",
    //     RETRY : "retry",
    //     EXTENSION_INSTALL : 'extension_install',
    //     DOWNLOAD_EXTENSION : 'download_extension'
    // };

    /**
     * AW4.ConnectInstaller.supportsInstallingExtensions
     *
     * If you have a custom Connect install experience that can handle the EXTENSION_INSTALL state, set this value to 'true'
     * This value is used by AW4.Connect to determine if EXTENSION_INSTALL event should be used.
     **/
    // AW4.ConnectInstaller.supportsInstallingExtensions = false;

    ////////////////////////////////////////////////////////////////////////////
    // Private constants
    ////////////////////////////////////////////////////////////////////////////
    const DEFAULT_SDK_LOCATION = "//d3gcli72yxqn2z.cloudfront.net/connect/v4";
    // const CONNECT_VERSIONS_JS = "/connectversions.min.js";
    const CONNECT_VERSIONS_JSON = "/connect_references.min.json";

    ////////////////////////////////////////////////////////////////////////////
    // Private variables
    ////////////////////////////////////////////////////////////////////////////
    let connectOptions: any = {};
    let listeners: any = [];
    let connectJSONreferences: any = null;
    let showInstallTimerID = 0;
    let iframeLoadedFlag = false;
    // let iframeLoadedTimerID = 0;
    
    // @ts-ignore :disable:no-unused-variable
    let retry_count = 0;

    if (Utils.isNullOrUndefinedOrEmpty(options)) {
        options = {};
    }

    if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage("aspera-install-attempted")))
        Utils.setLocalStorage("aspera-install-attempted", "true");
    if (Utils.isNullOrUndefinedOrEmpty(Utils.getLocalStorage("aspera-last-detected")))
        Utils.setLocalStorage("aspera-last-detected", "");

    connectOptions.iframeId = options.iframeId || 'aspera-iframe-container';
    connectOptions.sdkLocation = (Utils.isNullOrUndefinedOrEmpty(options.sdkLocation)) ? DEFAULT_SDK_LOCATION : Utils.getFullURI(options.sdkLocation) ;
    connectOptions.stylesheetLocation = Utils.getFullURI(options.stylesheetLocation);
    if (typeof(options.style) != 'undefined') {
        connectOptions.style = options.style;
    } else {
        if (minRequestedVersion.value() && !Utils.versionLessThan(minRequestedVersion.value(), "3.9.0")) {
           // Set to carbon if 3.9 is requested
            connectOptions.style = 'carbon';
        } else {
            // Default to blue if no min version or min version is old
            connectOptions.style = 'blue';
        }
    }
    if (typeof(Storage) != 'undefined') {
        var overrideStyle = Utils.getLocalStorage('aspera-connect-install-style');
        if (overrideStyle)
            connectOptions.style = overrideStyle;
    }
    if (connectOptions.style == 'carbon')
        ConnectInstaller.supportsInstallingExtensions = true;

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
    var loadFiles = function(files: string[], type: string, callback: any) {
        if (files === null || typeof files === 'undefined' || !(files instanceof Array)) {
            return null;
        } else if (type === null || typeof type !== 'string') {
            return null;
        }
        var
        numberOfFiles = 0,
            head = document.getElementsByTagName("head")[0] || document.documentElement;

        /* Loads the file given, and sets a callback, when the file is the last one and a callback is
         * provided, it will call it
         * Loading mechanism based on https://jquery.org (MIT license)
         */
        var loadFilesHelper = function (file: string) {
            //IE9+ supports both script.onload AND script.onreadystatechange thus the done check
            let done = false;
            let fileref: any = null;

            if (type.toLowerCase() === "js") {
                fileref = document.createElement('script');
                fileref.setAttribute("type","text/javascript");
                fileref.setAttribute("src", file);
            } else if (type.toLowerCase() === "css") {
                fileref = document.createElement("link");
                fileref.setAttribute("rel", "stylesheet");
                fileref.setAttribute("type", "text/css");
                fileref.setAttribute("href", file);
            } else if (type.toLowerCase() === "json") {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                  if (this.readyState == 4 && this.status == 200) {
                    var resp = this.responseText;
                    var jsonVersions = JSON.parse(resp);
                    connectVersions.set(jsonVersions);
                    
                    if (typeof callback === 'function') {
                      callback(true);
                    }
                  }
                }
                xhttp.open('GET', file, true);
                xhttp.send();
                return null;
            } else {
                return null;
            }
            if (typeof callback === 'function') {
                // Attach handlers for all browsers
                fileref.onload = fileref.onreadystatechange = function() {
                    if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
                        done = false;
                        // Handle memory leak in IE
                        fileref.onload = fileref.onreadystatechange = null;
                        if (head && fileref.parentNode) {
                            head.removeChild(fileref);
                        }
                        if (--numberOfFiles <= 0 && typeof callback === 'function') {
                            callback(true);
                        }
                    }
                };
                fileref.onerror = function() {
                    callback(false);
                };
            }
            // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
            head.insertBefore(fileref, head.firstChild);
        }
        numberOfFiles = files.length;
        for (var i = 0; i < numberOfFiles; i++) {
            if (typeof files[i] === 'string') {
                loadFilesHelper(files[i]);
            }
        }
    };

    var osPlatform = function () {
        var os = "Not supported"
        if (/Win/.test(navigator.platform)) {
            if (navigator.userAgent.indexOf("WOW64") != -1 || navigator.userAgent.indexOf("Win64") != -1 ) {
                os = "Win64";
            } else {
                os = "Win32";
            }
        }
        else if (/Mac OS X 10[._]6/.test(navigator.userAgent)) {
            os = "MacIntel-10.6-legacy"
        }else if (/Mac/.test(navigator.platform)) {
            os = "MacIntel";
        } else if (/Linux x86_64/.test(navigator.platform)) {
            os = "Linux x86_64";
        } else if (/Linux/.test(navigator.platform)) {
            os = "Linux i686";
        }


        return os;
    };

    var osVersion = function () {
        let match: any = "";
        if (/Win/.test(navigator.platform)) {
            match = navigator.userAgent.match(/Windows NT (\d+)[._](\d+)/);
        } else if (/Mac/.test(navigator.platform)) {
            match = navigator.userAgent.match(/OS X (\d+)[._](\d+)/);
        }
        if (Utils.isNullOrUndefinedOrEmpty(match))
            return null;
        var os_version = {
            highWord:parseFloat(match[1]),
            loWord:parseFloat( match[2])
        }
        return os_version;
    };

    var platformVersion = function (arg0: any) {
        if (!Utils.isNullOrUndefinedOrEmpty(arg0)) {
            var match = arg0.match(/(\d+)[.](\d+)/);
            if (Utils.isNullOrUndefinedOrEmpty(match))
                return null;
            var platform_version = {
                highWord: parseFloat(match![1]),
                loWord: parseFloat(match![2])
            }
            return platform_version;
        }
        return arg0;
    }

    var notifyListeners = function(event: any) {
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](event);
        }
    };

    var addStyleString = function(str: string) {
        var node = document.createElement('style');
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

    ////////////////////////////////////////////////////////////////////////////
    // API Functions
    ////////////////////////////////////////////////////////////////////////////

    /*
     * AW4.ConnectInstaller#addEventListener(listener) -> null
     * - listener (Function): function that will be called when the event is fired
     *
     * ##### Event types ([[AW4.ConnectInstaller.EVENT]])
     *
     **/
    var addEventListener = function(listener: any) {
        if (typeof listener !== 'function') {
            return null;
        }
        listeners.push(listener);
        return null;
    };

    /**
     * AW4.ConnectInstaller#installationJSON(callback) -> null
     * - callback (Function): function that will be called when the result is retrieved.
     *
     * Querys the SDK for the current system's information, returning the full spec of all the
     * documentation and binaries available for it.
     *
     * ##### Object returned to the callback function as parameter
     *
     *      {
     *        "title": "Aspera Connect for Windows",
     *        "platform": {
     *            "os": "win32"
     *       },
     *        "navigator": {
     *            "platform": "Win32"
     *        },
     *        "version": "3.6.0.105660",
     *        "id": "urn:uuid:589F9EE5-0489-4F73-9982-A612FAC70C4E",
     *        "updated": "2012-10-30T10:16:00+07:00",
     *        "links": [
     *            {
     *                "title": "Windows Installer",
     *                "type": "application/octet-stream",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/bin/AsperaConnect-ML-3.6.0.105660.msi",
     *                "hreflang": "en",
     *                "rel": "enclosure"
     *            },
     *            {
     *                "title": "Aspera Connect PDF Documentation for Windows",
     *                "type": "application/pdf",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/zh-cn/pdf/Connect_3.6.0_Windows_User_Guide_SimplifiedChinese.pdf",
     *                "hreflang": "zh-cn",
     *                "rel": "documentation"
     *            },
     *            {
     *                "title": "Aspera Connect PDF Documentation for Windows",
     *                "type": "application/pdf",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/ja-jp/pdf/Connect_3.6.0_Windows_User_Guide_Japanese.pdf",
     *                "hreflang": "ja-jp",
     *                "rel": "documentation"
     *            },
     *            {
     *                "title": "Aspera Connect PDF Documentation for Windows",
     *                "type": "application/pdf",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/en/pdf/Connect_3.6.0_Windows_User_Guide_English.pdf",
     *                "hreflang": "en",
     *                "rel": "documentation"
     *            },
     *            {
     *                "title": "Aspera Connect PDF Documentation for Windows",
     *                "type": "application/pdf",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/es/pdf/Connect_3.6.0_Windows_User_Guide_Spanish.pdf",
     *                "hreflang": "es",
     *                "rel": "documentation"
     *            },
     *            {
     *                "title": "Aspera Connect PDF Documentation for Windows",
     *                "type": "application/pdf",
     *                "href": "//d3gcli72yxqn2z.cloudfront.net/connect/v4/docs/user/win/fr/pdf/Connect_3.6.0_Windows_User_Guide_French.pdf",
     *                "hreflang": "fr",
     *                "rel": "documentation"
     *            },
     *            {
     *                "title": "Aspera Connect Release Notes for Windows",
     *                "type": "text/html",
     *                "href": "http://www.asperasoft.com/en/release_notes/default_1/release_notes_55",
     *                "hreflang": "en",
     *                "rel": "release-notes"
     *            }
     *          ]
     *      }
     *
     **/
    var installationJSON = function(callback: any) {
        if (typeof callback !== 'function') {
            return null;
        }
        if (connectJSONreferences !== null) {
            callback(connectJSONreferences);
            return null;
        }
        var updatesURL = connectOptions.sdkLocation;
        var replaceJSONWithFullHref = function (connectversionsSdkLocation: string, entryJSON: any) {
            for (var i = 0; i < entryJSON.links.length; i++) {
                var hrefLink = entryJSON.links[i].href;
                if (!/^https?:\/\//i.test(hrefLink) && !/^\/\//.test(hrefLink)) {
                    entryJSON.links[i].hrefAbsolute = connectversionsSdkLocation + '/' + hrefLink;
                }
            }
        };
        // load references from file and parse to load in the iframe
        var parseIstallJSON = function (connectversionsSdkLocation: string) {
            // var parsedInstallJSON = AW4.connectVersions;
            var parsedInstallJSON = connectVersions.value();
            var installEntries = parsedInstallJSON.entries;
            var procesJSONentry = function(entryJSON: any) {
                replaceJSONWithFullHref(connectversionsSdkLocation, entryJSON);
                connectJSONreferences = entryJSON;
                callback(entryJSON);
            };
            var userOS = osPlatform();
            for (var i = 0; i < installEntries.length; i++) {
                var entry = installEntries[i];
                if (entry.navigator.platform === userOS) {
                    var userOSVersion = osVersion();
                    var currentPlatform = platformVersion(entry.platform.version);
                    if (!Utils.isNullOrUndefinedOrEmpty(currentPlatform) && !Utils.isNullOrUndefinedOrEmpty(userOSVersion)) {
                        if ((userOSVersion!.highWord > currentPlatform!.highWord) ||
                            (userOSVersion!.highWord >= currentPlatform!.highWord &&
                                userOSVersion!.loWord >= currentPlatform!.loWord)) {
                            procesJSONentry(entry);
                            return null;
                        }
                    } else {
                        procesJSONentry(entry);
                        return null;
                    }
                }
            }
            showUnsupportedBrowser();
        };
        var scriptLoaded = function(success: boolean) {
            var fallbackURL = DEFAULT_SDK_LOCATION;//connectOptions.sdkLocation;
            if (success && connectVersions.value() != undefined) {
                parseIstallJSON(updatesURL);
            } else if (updatesURL !== fallbackURL) {
                updatesURL = fallbackURL;
            }
        };
        loadFiles([updatesURL + CONNECT_VERSIONS_JSON], 'json', scriptLoaded);
        return null;
    };

    /**
     * AW4.ConnectInstaller#isExtensionInstalled(timeout, callback) -> null
     * - timeout (Number): Milliseconds to wait before extension is considered missing.
     * - callbacks (Callbacks): `success` and `timedout` functions to receive results.
     *
     * *This method is asynchronous.*
     **/
    var isExtensionInstalled = function(timeout: number, callback: any) {
        // Prereq: asperaweb-4 needs to be loaded first
        let extReqImpl: any = new NativeMessageExtRequestImplementation();
        if (Utils.BROWSER.SAFARI_NO_NPAPI)
            extReqImpl = new SafariAppExtRequestImplementation();
        if (!extReqImpl.isSupportedByBrowser()) {
            Logger.log('This browser does not use extensions.');
            return;
        }
        extReqImpl.detectExtension(timeout, callback);
    }

    /**
     * AW4.ConnectInstaller#doesBrowserNeedExtensionStore() -> Boolean
     *
     * ##### Return values
     *
     * 1. `true` : if the current browser requires the web store to install extensions.
     * 2. `false` : if current browser doesn't require extension installation.
     **/
    var doesBrowserNeedExtensionStore = function() {
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
     * AW4.ConnectInstaller#getExtensionStoreLink() -> String
     *
     * ##### Return values
     *
     * For support browsers, returns a url for extension installation.
     *
     **/
    var getExtensionStoreLink = function() {
        if (Utils.BROWSER.FIREFOX === true) {
            return 'https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect';
        } else if (Utils.BROWSER.EDGE_WITH_EXTENSION === true) {
            return 'ms-windows-store://pdp/?productid=9N6XL57H8BMG';
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
     **/
    var startExtensionInstall = function() {
        var lnk = getExtensionStoreLink();
        if (lnk != '') {
            window.open(lnk, '_blank');
        }
    };

    var getRefreshWindow = function() {
        // Fix for refreshing only window in which we are contained, if we are an iframe just refresh the iframe (Sharepoint bug)
        var inIframe = false;
        try {
            inIframe = window.self !== window.top;
        } catch (e) {
            inIframe = true;
        }
        var refreshWindow = window;
        // NOTE: contentWindow used in thsi way will always be undefined according to its HTML specification
        if (inIframe) {
          let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;
          if (iframe.contentWindow) {
            refreshWindow = iframe.contentWindow;
          }
        }
        return refreshWindow;
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
     **/
    var show = function(eventType: string) {
        //We always need to check if launching was going to be popped up, if so delete it
        if (showInstallTimerID !== 0) {
            clearTimeout(showInstallTimerID);
        }
        let iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;

        // To support old browser that don't have it
        if (typeof(String.prototype.endsWith) === 'undefined') {
            String.prototype.endsWith = function(suffix) {
                return this.indexOf(suffix, this.length - suffix.length) !== -1;
            };
        }
        //IE will complain that in strict mode functions cannot be nested inside a statement, so we have to define it here
        function handleMessage(event: any) {
            // iFrame installation: Handling of messages by the parent window.
            if (event.data === EVENT.DOWNLOAD_CONNECT) {
                notifyListeners(event.data);
                showInstall();
            } else if (event.data === EVENT.DOWNLOAD_EXTENSION) {
                notifyListeners(event.data);
                showDownload();
            } else if (event.data === EVENT.REFRESH_PAGE) {
                notifyListeners(event.data);
                var refreshWindow = getRefreshWindow();
                refreshWindow.location.reload(true);
            } else if (event.data === EVENT.IFRAME_REMOVED) {
                notifyListeners(event.data);
                dismiss();
            } else if (event.data === EVENT.TROUBLESHOOT) {
                notifyListeners(event.data);
                var refreshWindow = getRefreshWindow();
                refreshWindow.location.href = "https://test-connect.asperasoft.com";
            } else if (event.data === EVENT.CONTINUE) {
                Utils.addVersionException();
                notifyListeners(event.data);
                showLaunching();
            } else if (event.data === EVENT.RETRY) {
                notifyListeners(event.data);
                showLaunching();
            } else if (event.data == '100%') {
                iframe!.setAttribute('style', 'height:100%;width:100%;max-width: 100%;margin: 0 auto;background-color:rgba(223, 227, 230, 0.75);');
            } else if (typeof event.data == 'string' && event.data.endsWith(EVENT.RESIZE)) {
                iframe!.style.height = event.data;
                iframe!.style.maxWidth = '600px';
            } else if (event.data === EVENT.EXTENSION_INSTALL) {
                notifyListeners(event.data);
                startExtensionInstall();
            }
        };
        //IE will complain that in strict mode functions cannot be nested inside a statement, so we have to define it here
        function iframeLoaded() {
            iframeLoadedFlag = true;
            notifyListeners(EVENT.IFRAME_LOADED);
            var iframe = document.getElementById(connectOptions.iframeId) as HTMLIFrameElement;
            //Set dialog type
            iframe.contentWindow!.postMessage(eventType, "*");
            //populate the iframe with the information pulled from connectversions.js
            var populateIframe = function(referencesJSON: any) {
                for (var i = 0; i < referencesJSON.links.length; i++) {
                    var link = referencesJSON.links[i];
                    if (link.rel === 'enclosure') {
                        if (typeof iframe !== 'undefined' && iframe !== null) {
                            iframe.contentWindow!.postMessage('downloadlink=' + link.hrefAbsolute, "*");
                        }
                    }
                }
            }
            installationJSON(populateIframe);
            //load an stylesheet if provided
            if (connectOptions.stylesheetLocation) {
                // Inserting a stylesheet into the DOM for more manageable styles.
                if (typeof iframe !== 'undefined' && iframe !== null) {
                    iframe.contentWindow!.postMessage('insertstylesheet=' + connectOptions.stylesheetLocation, "*");
                }
            }
            notifyListeners(EVENT.IFRAME_LOADED);
        };
        if (!iframe) {
            //Set iframe styling
            if (connectOptions.style == 'carbon') {
                addStyleString('.' + connectOptions.iframeId + '{width: 100%;max-width: 600px;height: 80px;margin: 0 auto;position: fixed;top: 0;right: 0;left: 0;z-index: 20;box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1)}');
            } else if (connectOptions.style == 'blue') {
                addStyleString('.' + connectOptions.iframeId + '{position: absolute;width: 100%;height: 80px;margin: 0px;padding: 0px;border: none;outline: none;overflow: hidden;top: 0px;left: 0px;z-index: 999999999}');
            }
            // Build and insert the iframe.
            iframe = document.createElement('iframe') as HTMLIFrameElement;
            iframe.id = connectOptions.iframeId;
            iframe.className = connectOptions.iframeId;
            iframe.frameBorder = '0';

            if(connectOptions.style == 'carbon'){
                iframe.src = connectOptions.sdkLocation + '/install/carbon-installer/index.html';
            } else if (connectOptions.style = 'blue'){
                iframe.src = connectOptions.sdkLocation + '/install/auto-topbar/index.html';
            }

            document.body.appendChild(iframe);
            //Check for tight security policies
            if (!iframe.contentWindow!.postMessage) {
                return;
            }

            // Set listener for messages from the iframe installer.
            if (window.attachEvent) {
                window.attachEvent("onmessage", handleMessage);
            } else {
                window.addEventListener("message", handleMessage, false);
            }
        }
        // if the iframe is hidden due to dismiss, make it visible again.
        iframe.style.visibility = 'visible';

        if (iframeLoadedFlag) {
            iframe.contentWindow!.postMessage(eventType, "*");
        } else {
            // Give time to the iFrame to be loaded #31040
            // @ts-ignore
            if (iframe.attachEvent)
                // @ts-ignore
                iframe.attachEvent('onload', iframeLoaded);
            else
                iframe.onload = iframeLoaded;
        }
    };

    // Direct communication from Connect
    window.addEventListener("message", function(event) {
        if (event.data === 'show_extension_install') {
            showExtensionInstall();
        }
    }, false);

    /**
     * AW4.ConnectInstaller#showLaunching(timeout) -> null
     * - timeout (Number): (*optional*) Timeout to show the banner in milliseconds. If at any point
     * during this timeout [[AW4.ConnectInstaller#connected]] or [[AW4.ConnectInstaller#dismiss]]
     * are called, the banner will not show up. Default: `3500`.
     *
     * Displays a banner in the top of the screen explaining the user that Aspera Connect
     * is trying to be launched.
     *
     **/
    var showLaunching = function(timeout = 3500) {
        if (showInstallTimerID !== 0) {
            clearTimeout(showInstallTimerID);
        }
        var showLaunchingHelperFunction = function() {
            show('launching');
        };
        showInstallTimerID = setTimeout(showLaunchingHelperFunction, timeout);
    };

    var allowContinue = function() {
        // Check if web app wants to force an upgrade
        if (minRequestedVersion.value() && !Utils.versionLessThan(minRequestedVersion.value(), MIN_SECURE_VERSION))
            return false;
        return true;
    }

    var isSecurityUpdate = function() {
        // Only true if local Connect version has been identified
        if (typeof(connectVersion.value()) === 'undefined')
            return false;
        return Utils.versionLessThan(connectVersion.value(), MIN_SECURE_VERSION);
    };

    /**
     * AW4.ConnectInstaller#showDownload() -> null
     *
     * Displays a banner in the top of the screen urging the user to download Aspera Connect.
     *
     **/
    var showDownload = function() {
        show('download');
    };

    /**
     * AW4.ConnectInstaller#showInstall() -> null
     *
     * Displays a banner in the top of the screen explaining the user what he has to do once
     * Aspera Connect has been downloaded
     *
     **/
    var showInstall = function() {
        show('install');
        Utils.setLocalStorage("aspera-install-attempted", "true");
    };

    /**
     * AW4.ConnectInstaller#showUpdate() -> null
     *
     * Displays a banner in the top of the screen urging the user to update Aspera Connect
     * to the latest version.
     *
     **/
    var showUpdate = function() {
        if(isSecurityUpdate() && allowContinue()){
            show('continue');
        } else {
            show('update');
        }
    };

    /**
     * AW4.ConnectInstaller#showRetry() -> null
     *
     **/
    var showRetry = function() {
        show('retry');
        retry_count++;
    };

    /**
     * AW4.ConnectInstaller#showExtensionInstall() -> null
     *
     * Displays a page about the instruction to install native browser extension
     *
     **/
    var showExtensionInstall = function() {
        show('extension_install');

        // Create a DOM element to help the extension return to the right page
        var extHelper = document.createElement('div');
        extHelper.className = 'aspera-connect-ext-locator'; // TODO: Document
        extHelper.style.display = 'none';
        document.body.appendChild(extHelper);
    };

    /**
     * AW4.ConnectInstaller#showUnsupportedBrowser() -> null
     *
     * Displays a banner explaining that the browser is not supported by Connect
     *
     **/
    var showUnsupportedBrowser = function() {
        show('unsupported_browser');
    };

    /**
     * AW4.ConnectInstaller#connected(timeout) -> null
     * - timeout (Number): (*optional*) If specified, this will add a timeout to the
     * dismiss function. Default: `2000`.
     *
     * Displays a temporary message that connect has been found, and after *timeout* dismisses the
     * banner
     *
     **/
    var connected = function(timeout = 2000) {
        clearTimeout(showInstallTimerID);
        var iframe = document.getElementById(connectOptions.iframeId);
        if (typeof iframe !== 'undefined' && iframe !== null) {
            show('running');
            setTimeout(dismiss, timeout);
            Utils.setLocalStorage("aspera-last-detected", String(Date.now()));
        }
        return null;
    };

    /**
     * AW4.ConnectInstaller#dismiss() -> null
     *
     * Dismisses the banner
     *
     **/
    var dismiss = function() {
        if (showInstallTimerID !== 0) {
            clearTimeout(showInstallTimerID);
        }
        var iframe = document.getElementById(connectOptions.iframeId);
        if (typeof iframe !== 'undefined' && iframe !== null) {
            iframe.style.visibility = 'hidden';
        }
        return null;
    };

    // The symbols to export.
    return {
        //FUNCTIONS
        addEventListener: addEventListener,
        installationJSON: installationJSON,
        showLaunching: showLaunching,
        showDownload: showDownload,
        showInstall: showInstall,
        showUpdate: showUpdate,
        showRetry: showRetry,
        connected: connected,
        dismiss: dismiss,
        showExtensionInstall: showExtensionInstall,
        showUnsupportedBrowser: showUnsupportedBrowser,
        startExtensionInstall: startExtensionInstall,
        isExtensionInstalled: isExtensionInstalled,
        doesBrowserNeedExtensionStore: doesBrowserNeedExtensionStore,
        getExtensionStoreLink: getExtensionStoreLink
    };
};

ConnectInstaller.EVENT = EVENT;
ConnectInstaller.supportsInstallingExtensions = false;

export {
  ConnectInstaller
}

// Object.assign(ConnectInstaller, {
//   EVENT,
//   supportsInstallingExtensions: false
// })

// export default ConnectInstaller;
