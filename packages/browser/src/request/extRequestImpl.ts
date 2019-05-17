import * as Logger from '../logger';
import { STATUS } from '../shared/sharedInternals';
import { LS_CONNECT_DETECTED } from '../shared/constants';
import { isNullOrUndefinedOrEmpty, atou } from '../utils';

export interface IReqInitOptions {
  pluginId: string;
  containerId: string;
  initializeTimeout: number;
  sdkLocation: string;
  callback: any;
  requestStatusCallback: any;
}

export interface IDetectCallback {
  timedout? (): any;
  success (): any;
}

class ExtRequestImpl {
  static STATUS = STATUS;
  static LS_CONNECT_DETECTED = LS_CONNECT_DETECTED;
  requestStatusCallback: any = {};
  outstandingRequests: any = {};
  connectStatus: number = 0;
  readonly subclassType: string = this.constructor.name.toString();

  // Cannot directly instantiate this class
  protected constructor () {}

  atou (inputString: string) {
    return atou(inputString);
  }

  changeConnectStatus (newConnectStatus: number) {
    this.connectStatus = newConnectStatus;
    if (this.requestStatusCallback) {
      this.requestStatusCallback(newConnectStatus);
    }
  }

  isNullOrUndefinedOrEmpty (x: any) {
    return isNullOrUndefinedOrEmpty(x);
  }

  detectExtension = (timeoutMs: number, callbacks: IDetectCallback) => {
    let timeoutTimer: number;
    let retryTimer: number;

    if (timeoutMs !== -1) {
      timeoutTimer = setTimeout(function () {
        clearInterval(retryTimer);
        if (callbacks.timedout) {
          callbacks.timedout();
        }
      }, timeoutMs);
    }

    let attemptNumber = 1;
    let check = function () {
      Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
      attemptNumber++;
      document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
    };
    let interval = timeoutMs === -1 ? 1000 : 200;
    retryTimer = setInterval(check, interval);

    if (this.subclassType === 'SafariAppExtRequestImplementation') {
      let versionResponse = (evt: any) => {
        document.removeEventListener('AsperaConnectCheckResponse', versionResponse);
        Logger.log('Extension detected: ' + JSON.stringify(evt));
        if (timeoutMs !== -1) {
          clearTimeout(timeoutTimer);
        }
        clearInterval(retryTimer);
        if (callbacks.success) {
          callbacks.success();
        }
      };

      document.addEventListener('AsperaConnectCheckResponse', versionResponse);
    } else {
      let versionResponse = (evt: any) => {
        if (evt.type === 'message' && typeof evt.data === 'object' && 'type' in evt.data
               && evt.data.type === 'AsperaConnectCheckResponse') {
          window.removeEventListener('message', versionResponse);
          Logger.log('Extension detected: ' + JSON.stringify(evt));
          if (timeoutMs !== -1) {
            clearTimeout(timeoutTimer);
          }
          clearInterval(retryTimer);
          if (callbacks.success) {
            callbacks.success();
          }
        }
      };

      window.addEventListener('message', versionResponse);
    }

    check();
  }

  httpRequest = (method: string, path: string, data: string | null, callback: any, requestId: string | number) => {
    let req = {
      'request_id': requestId,
      'method': method,
      'uri_reference': path,
      'body': data
    };
    this.outstandingRequests[requestId] = {
      'req': req,
      'callback': callback,
      'response': ''
    };

      // TODO: Validate the data length is not over 100MB
    Logger.trace(`${this.subclassType} request: ` + JSON.stringify(req));
    document.dispatchEvent(new CustomEvent('AsperaConnectRequest', { 'detail': req }));
    return null;
  }

}

export default ExtRequestImpl;
