import BROWSER from '../shared/browser';
import { STATUS } from '../shared/sharedInternals';
import * as Utils from '../utils';

function mimeType () {
  return 'application/x-aspera-web';
}

interface INPAPIOptions {
  containerId: string;
  pluginId: string;
  initializeTimeout: number;
  callback? (): any;
  requestStatusCallback? (status: number): any;
}

interface IConnectPlugin extends HTMLObjectElement {
  queryBuildVersion (): string;
  httpRequestImplementation (method: string, path: string, data: any, requestCallback: any): void;
}

class NPAPIrequestImplementation {
  VERSION_PREFIX = '/v5';
  npapiPlugin: IConnectPlugin | null = null;
  pluginId: string = '';
  listenerId: string = '';

  constructor () {}

  isSupportedByBrowser () {
    if (BROWSER.IE || BROWSER.SAFARI && !BROWSER.SAFARI_NO_NPAPI) {
      return true;
    }
    return false;
  }

  /*
   * Create the NPAPI plugin <object> element as a child of the DOM element
   * given (if exists)
   *
   * @param {string} initializeTimeout [[AW4.Connect]] instantiation option
   */
  createNPAPIPlugin = (initializeTimeout: number) => {
    let wrapperDiv = document.getElementById(this.listenerId);
    if (wrapperDiv == null) {
      wrapperDiv = document.createElement('div');
      wrapperDiv.setAttribute('id', this.listenerId);
      wrapperDiv.setAttribute('style', 'display:inline-block;height:1px;width:1px;');
    } else {
      // Remove all elements of the wrapper
      while (wrapperDiv.firstChild) {
        wrapperDiv.removeChild(wrapperDiv.firstChild);
      }
    }

    this.npapiPlugin = document.createElement('object') as IConnectPlugin;
    this.npapiPlugin.setAttribute('name', this.pluginId);
    this.npapiPlugin.setAttribute('id', this.pluginId);
    this.npapiPlugin.setAttribute('type', mimeType());
    this.npapiPlugin.setAttribute('width', '1');
    this.npapiPlugin.setAttribute('height', '1');

    let timeoutParam = document.createElement('param');
    timeoutParam.setAttribute('name', 'connect-launch-wait-timeout-ms');
    timeoutParam.setAttribute('value', String(initializeTimeout));
    this.npapiPlugin.appendChild(timeoutParam);

    wrapperDiv.appendChild(this.npapiPlugin);
    document.body.appendChild(wrapperDiv);
  }

  /*
   * Called to initialize the plugin, it creates a new instance by appending an
   * <object> element to the DOM and runs the callback with the status
   */
  init = (options: INPAPIOptions) => {
    let onLoadCallback = options.callback || function () {};
    let changeConnectStatus = options.requestStatusCallback || function () {};
    try {
      if (!this.isSupportedByBrowser()) {
              // Browser does not support Netscape Plugin API
      } else if (this.npapiPlugin == null) {
        if ((BROWSER.IE && (new ActiveXObject('Aspera.AsperaWebCtrl.1'))) ||
              mimeType() in navigator.mimeTypes) {
          this.listenerId = options.containerId;
          this.pluginId = options.pluginId;
          this.createNPAPIPlugin(options.initializeTimeout);
          /* Safari needs a timeout to finish loading the plugin
           * Firefox if prompts user to allow plugin will take as much as
           * the user takes to allow the plugin to initialize the object,
           * so we just put an interval and keep trying until the object is
           * initialized and has the expected call
           */
          let npapiWaitPluginLoadedID = setInterval(() => {
            if (!this.npapiPlugin || !this.npapiPlugin.queryBuildVersion) {
              return null;
            }
            clearInterval(npapiWaitPluginLoadedID);
            // Check version is correct
            if (Utils.versionLessThan(this.npapiPlugin.queryBuildVersion(), '3.6')) {
              console.log('Plugin too old. Version less than 3.6');
              this.npapiPlugin = null;
              changeConnectStatus(STATUS.FAILED);
            } else {
              /*
 		           * 05-15-19 ASCN-634: Any event listeners assigned during RUNNING
 		           * event will be called twice.
 		           */
              // changeConnectStatus(STATUS.RUNNING);
              // check version callback which will set status to running
              onLoadCallback();
              return;
            }
          }, 500);
        } else {
          // If plugin is still null, it means it is not installed
          if (this.npapiPlugin == null) {
            console.log('Plugin not detected');
            changeConnectStatus(STATUS.FAILED);
          }
        }
      }
    } catch (error) {
      // IE 10 ActiveXObject instantiation error recovery
      console.log('Plugin load error: ' + JSON.stringify(error));
      changeConnectStatus(STATUS.FAILED);
    }
    return null;
  }

      /*
       * Place a request for Connect
       *
       * @param {string} method GET or POST
       * @param {string} path URL path
       * @param {string} data Payload to send with the request
       * @param {function} callback Function to be called when the request has finished
       * @param {int} requestId Identifier that needs to be returned when calling the given callback
       */
  httpRequest = (method: string, path: string, data: any, callback: any, requestId: string) => {
    if (this.npapiPlugin == null) {
      return;
    }
    let requestCallback = function (data: any) {
              // Parse data to find out if an error ocurred
      let parsedData = Utils.parseJson(data);
      if (callback) {
        if (typeof parsedData.error !== 'undefined') {
          callback(parsedData.error.code, data, requestId);
        } else {
          callback(200, data, requestId);
        }
      }
    };
          // NPAPI plugin doesn't accept null data even if it is a GET request
    if (data == null) {
      data = '';
    }

          // Use v5 for npapi
    path = this.VERSION_PREFIX + path;

    this.npapiPlugin.httpRequestImplementation(method, path, data, requestCallback);
    return null;
  }
}

export default NPAPIrequestImplementation;
