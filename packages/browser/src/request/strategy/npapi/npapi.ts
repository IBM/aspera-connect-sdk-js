import BROWSER from '../../../helpers/browser';
import { STATUS } from '../../../constants';
import * as Logger from '../../../logger';
import {
  isNullOrUndefinedOrEmpty,
  isError,
  createError,
  versionLessThan,
  parseJson,
  generatePromiseData
} from '../../../utils';
import * as types from '../../../core/types';

function mimeType () {
  return 'application/x-aspera-web';
}

interface IConnectPlugin extends HTMLObjectElement {
  queryBuildVersion (): string;
  httpRequestImplementation (method: string, path: string, data: string | undefined, callback: any): any;
}

class NpapiStrategy implements types.RequestStrategy {
  VERSION_PREFIX = '/v5';
  npapiPlugin: IConnectPlugin | undefined;
  pluginId = '';
  listenerId = '';
  name = 'npapi';

  constructor (private options: types.RequestStrategyOptions) {}

  /*
   * Create the NPAPI plugin <object> element as a child of the DOM element
   * given (if exists)
   *
   * @param {string} initializeTimeout [[AW4.Connect]] instantiation option
   */
  createNPAPIPlugin = (initializeTimeout: number): void => {
    let wrapperDiv = document.getElementById(this.listenerId);
    if (isNullOrUndefinedOrEmpty(wrapperDiv)) {
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

    const timeoutParam = document.createElement('param');
    timeoutParam.setAttribute('name', 'connect-launch-wait-timeout-ms');
    timeoutParam.setAttribute('value', String(initializeTimeout));
    this.npapiPlugin.appendChild(timeoutParam);

    wrapperDiv.appendChild(this.npapiPlugin);
    document.body.appendChild(wrapperDiv);
  };

  /*
   * Place a request for Connect
   *
   * @param {function} callback Function to be called when the request has finished
   * @param {int} requestId Identifier that needs to be returned when calling the given callback
  */
  httpRequest = (endpoint: types.HttpEndpoint, requestId: number): Promise<types.ResolvedHttpResponse> => {
    const requestPromise = generatePromiseData<types.ResolvedHttpResponse>();
    // NPAPI plugin doesn't accept null data even if it is a GET request
    if (isNullOrUndefinedOrEmpty(endpoint.body)) {
      endpoint.body = '';
    }

    const fullEndpoint = `${this.VERSION_PREFIX}${endpoint.path}`;
    const requestCallback = function (data: any) {
      /** Parse data to find out if an error ocurred */
      const parsedData = parseJson(data);
      if (isError(parsedData)) {
        requestPromise.resolver({
          status: parsedData.error.code,
          body: data,
          requestId: requestId
        });
      } else {
        requestPromise.resolver({
          status: 200,
          body: data,
          requestId: requestId
        });
      }
    };

    if (isNullOrUndefinedOrEmpty(this.npapiPlugin)) {
      requestPromise.rejecter(new Error('Plugin not detected.'));
    } else {
      this.npapiPlugin.httpRequestImplementation(endpoint.method, fullEndpoint, endpoint.body, requestCallback);
    }

    return requestPromise.promise;
  };

  /*
   * Called to initialize the plugin, it creates a new instance by appending an
   * <object> element to the DOM and runs the callback with the status
   */
  startup = async (): Promise<void | types.ConnectError> => {
    const changeConnectStatus = this.options.requestStatusCallback;
    try {
      if (isNullOrUndefinedOrEmpty(this.npapiPlugin)) {
        if ((BROWSER.IE && (new ActiveXObject('Aspera.AsperaWebCtrl.1'))) ||
              mimeType() in navigator.mimeTypes) {
          this.listenerId = this.options.containerId;
          this.pluginId = this.options.id;
          this.createNPAPIPlugin(this.options.connectLaunchWaitTimeoutMs);
          /* Safari needs a timeout to finish loading the plugin
           * Firefox if prompts user to allow plugin will take as much as
           * the user takes to allow the plugin to initialize the object,
           * so we just put an interval and keep trying until the object is
           * initialized and has the expected call
           */
          const npapiWaitPluginLoadedID = setInterval(() => {
            if (!this.npapiPlugin || !this.npapiPlugin.queryBuildVersion) {
              return;
            }

            clearInterval(npapiWaitPluginLoadedID);
            // Check version is correct
            if (versionLessThan(this.npapiPlugin.queryBuildVersion(), '3.6')) {
              // Plugin too old
              this.npapiPlugin = undefined;
              changeConnectStatus(STATUS.FAILED);
              return createError(-1, 'Plugin too old. Version less than 3.6');
            }
          }, 500);
        } else {
          // If plugin is still null, it means it is not installed
          if (isNullOrUndefinedOrEmpty(this.npapiPlugin)) {
            changeConnectStatus(STATUS.FAILED);
            return createError(-1, 'Plugin not detected. Either not installed or enabled.');
          }
        }
      }
    } catch (error) {
      // IE 10 ActiveXObject instantiation error recovery
      changeConnectStatus(STATUS.FAILED);
      Logger.debug(JSON.stringify(error));
      return createError(-1, `Plugin load error. Make sure plugin is enabled. Details: ${error}`);
    }
  };
}

export default NpapiStrategy;
