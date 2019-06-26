import BROWSER from '../shared/browser';
import * as Logger from '../logger';
import ExtRequestImpl, { IReqInitOptions, IDetectCallback } from './extRequestImpl';

class NativeMessageExtRequestImplementation extends ExtRequestImpl {
  eventName: string = 'message';
  successfulCalls: number = 0;
  installErrors: number = 0;
  connectDetectionTimeout: any;
  connectDetectionRetry: any;
  timeoutTimer: any;
  retryTimer: any;

  constructor () { super(); }

  isSupportedByBrowser (): boolean {
    if (BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX) {
      return true;
    }
    return false;
  }

  init = (options: IReqInitOptions) => {
    if (!this.isSupportedByBrowser()) {
      return;
    }

    this.minVersion = options.minVersion;
    if (options.requestStatusCallback) {
      this.requestStatusCallback = options.requestStatusCallback;
    }

    document.addEventListener('AsperaConnectResponse', (evt) => this.extensionResponse(evt)); // TODO: Phase out because Firefox doesn't support
    window.addEventListener(this.eventName, (evt) => this.extensionResponse(evt));
    // Retry detecting extension until user installs it
    this.detectExtension(-1, { success: () => {
      this.detectConnect(options.initializeTimeout, {
        success: options.callback,
        timedout: function () {
          if (this.connectStatus !== ExtRequestImpl.STATUS.OUTDATED) {
            this.changeConnectStatus(ExtRequestImpl.STATUS.FAILED);
          }
          // Continue looking for Connect in case it gets installed
          this.detectConnect(-1, {
            success: options.callback,
            timedout: function () { }
          });
        }
      });
    }
    }
  );

    let disconnect = (evt: any) => {
      Logger.log('Native host disconnected. Detail: ' + evt.detail);
      // Disconnect is expected if Connect is outdated
	    if (this.connectStatus === ExtRequestImpl.STATUS.OUTDATED) {
      return;
    }
      if (evt.detail) {
        let installIssueDetected = false;
        [
          'native messaging host not found', // Chrome
          'Error when communicating with the native messaging host', // Chrome - fatal error
          'Access to the specified native messaging host is forbidden', // Development mode id mismatch
          'No such native application' // Firefox
        ].forEach(function (str) {
          if (evt.detail.indexOf(str) !== -1) {
            installIssueDetected = true;
          }
        });
        if (installIssueDetected) {
          this.installErrors++;
        }
      }
      if (this.successfulCalls === 0 && this.installErrors === 1) {
        this.changeConnectStatus(ExtRequestImpl.STATUS.FAILED);
          // Assuming user is going through an installation process
          // Check for Connect forever until it's detected
        this.detectConnect(-1, { success: options.callback });
        document.removeEventListener('AsperaConnectDisconnect', disconnect);
      } else if (this.connectStatus !== ExtRequestImpl.STATUS.DEGRADED) {
        this.changeConnectStatus(ExtRequestImpl.STATUS.DEGRADED);
        this.detectConnect(options.initializeTimeout, {
          success: () => {
                  // NOTE: Set status internally and do not propogate
                  // request.js does additional validation before setting running state
            this.connectStatus = ExtRequestImpl.STATUS.RUNNING;
          },
          timedout: () => { this.changeConnectStatus(ExtRequestImpl.STATUS.FAILED); }
        });
      }
    };
    document.addEventListener('AsperaConnectDisconnect', disconnect);
    return null;
  }

  extensionResponse = (evt: any) => {
    let data;
    if (evt.type === 'message' && typeof evt.data === 'object' && 'type' in evt.data
          && evt.data.type === 'AsperaConnectResponse'
          && 'detail' in evt.data) {
      data = evt.data.detail;
    } else if ('detail' in evt) {
      data = evt.detail;
    }

    if (data) {
      Logger.trace('Native host impl received response: ' + JSON.stringify(data));
      let id = data.request_id;
          // Each instance of this class will received document events, but
          // the request might not have originated from this instance
      if (!(id in this.outstandingRequests)) {
        return;
      }
      let cb = this.outstandingRequests[id].callback;
          // var path = this.outstandingRequests[id].req.uri_reference;

          // Callback is expected to guaranteed by request.js
      if (this.isNullOrUndefinedOrEmpty(cb)) {
        return;
      }

      if ('body64' in data) {
        this.outstandingRequests[id].response += data.body64;
        if (data.complete === true) {
          let resp = this.atou(this.outstandingRequests[id].response);
          delete this.outstandingRequests[id];
          cb(data.status, resp, id);
        }
      } else {
        delete this.outstandingRequests[id];
        cb(data.status, data.body, id);
      }

      if (data.status !== 0) {
        this.successfulCalls++;
      }
    }
  }

  detectConnect = (timeoutMs: number, callbacks: IDetectCallback) => {
      // Stop any existing detection loops
    if (this.connectDetectionRetry) {
      clearInterval(this.connectDetectionRetry);
      this.connectDetectionRetry = null;
    }
    if (this.connectDetectionTimeout) {
      clearInterval(this.connectDetectionTimeout);
      this.connectDetectionTimeout = null;
    }

    if (timeoutMs !== -1) {
      this.connectDetectionTimeout = setTimeout(() => {
        clearInterval(this.connectDetectionRetry);
        if (callbacks.timedout) {
          callbacks.timedout();
        }
      }, timeoutMs);
    }

    let attemptNumber = 1;
    let check = () => {
      Logger.debug('Detecting Connect installation via extension. Attempt ' + attemptNumber);
      attemptNumber++;
      this.httpRequest('GET', '/connect/info/version', null, function (status: any) {
	      if (status === 503) {
	        Logger.debug('Detected old version of Connect via extension.');
	        this.changeConnectStatus(ExtRequestImpl.STATUS.OUTDATED);
	      } else {
	        Logger.debug('Detected Connect installation via extension.');
	        if (timeoutMs !== -1) {
          clearTimeout(this.connectDetectionTimeout);
        }
	        _recordConnectInstall();
	        clearInterval(this.connectDetectionRetry);
	        if (callbacks.success) {
          callbacks.success();
        }
	      }
      }, 0);
    };
    this.connectDetectionRetry = setInterval(check, 1000);
    check();
  }

  detectExtension = (timeoutMs: number, callbacks: IDetectCallback) => {
    if (timeoutMs !== -1) {
      this.timeoutTimer = setTimeout(() => {
        clearInterval(this.retryTimer);
        if (callbacks.timedout) {
          callbacks.timedout();
        }
      }, timeoutMs);
    }

    let attemptNumber = 1;
    let check = () => {
      Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
      attemptNumber++;
      document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
    };
    let interval = timeoutMs === -1 ? 1000 : 200;
    this.retryTimer = setInterval(() => check, interval);

    let versionResponse = (evt: any) => {
      if (evt.type === 'message' && typeof evt.data === 'object' && 'type' in evt.data
            && evt.data.type === 'AsperaConnectCheckResponse') {
        window.removeEventListener('message', versionResponse);
        Logger.log('Extension detected: ' + JSON.stringify(evt));
        if (timeoutMs !== -1) {
          clearTimeout(this.timeoutTimer);
        }
        clearInterval(this.retryTimer);
        if (callbacks.success) {
          callbacks.success();
        }
      }
    };
    window.addEventListener('message', (evt) => versionResponse(evt));
    check();
  }

  cancel = () => {
    clearTimeout(this.timeoutTimer);
    clearInterval(this.retryTimer);
    clearTimeout(this.connectDetectionTimeout);
    clearInterval(this.connectDetectionRetry);
  }
}

let _recordConnectInstall = function _recordConnectInstall () {
  window.localStorage.setItem(ExtRequestImpl.LS_CONNECT_DETECTED, Date.now().toString());
};

export default NativeMessageExtRequestImplementation;
