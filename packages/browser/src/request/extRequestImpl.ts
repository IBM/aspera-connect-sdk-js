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
  minVersion: string;
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
  minVersion: string = '';
  readonly subclassType: string = this.constructor.name.toString();

  // Cannot directly instantiate this class
  protected constructor () {}

  atou (inputString: string) {
    return atou(inputString);
  }

  changeConnectStatus = (newConnectStatus: number) => {
    if (this.connectStatus === newConnectStatus) {
      return;
    }
    this.connectStatus = newConnectStatus;
    if (this.requestStatusCallback) {
      this.requestStatusCallback(newConnectStatus);
    }
  }

  isNullOrUndefinedOrEmpty (x: any) {
    return isNullOrUndefinedOrEmpty(x);
  }

  httpRequest = (method: string, path: string, data: string | null, callback: any, requestId: string | number) => {
    let req = {
      'request_id': requestId,
      'min_version': this.minVersion,
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
