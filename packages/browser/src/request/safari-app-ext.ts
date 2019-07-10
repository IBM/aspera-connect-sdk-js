import ExtRequestImpl, { IReqInitOptions, IDetectCallback } from './extRequestImpl';
import * as Utils from '../utils';
import * as Logger from '../logger';
import BROWSER from '../shared/browser';

const MAX_POLLING_ERRORS = 3;

class SafariAppExtRequestImplementation extends ExtRequestImpl {
  eventName = 'AsperaConnectCheckResponse';
  pollingRequestErrors = 0;
  extensionDetected = false;
  timeoutTimer: any;
  retryTimer: any;

  constructor () {
    super();
  }

  isSupportedByBrowser () {
    if (BROWSER.SAFARI_NO_NPAPI) {
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

    document.addEventListener('AsperaConnectResponse', this.httpResponse);

    this.detectExtension(-1, {
      success: options.callback || function () {}
    });

    /* Disabled because it creates undesirable prompts if Connect is not already installed
    // If extension is not immediately detected, try launching Connect to enable it
    setTimeout(function() {
        if (!extensionDetected) {
            triggerExtensionCheck();
        }
    }, 1500); */
    return null;
  }

  httpResponse = (evt: any) => {
    Logger.trace('Safari extension impl received response: ' + JSON.stringify(evt));
    if (evt.detail) {
      let id = evt.detail.request_id;
          // Each instance of this class will received document events, but
          // the request might not have originated from this instance
      if (!(id in this.outstandingRequests)) {
        return;
      }
      let cb = this.outstandingRequests[id].callback;
      let path = this.outstandingRequests[id].req.uri_reference;
      delete this.outstandingRequests[id];

      if (evt.detail.status === 0 && path.indexOf('/connect/transfers/activity') > 0
              && this.pollingRequestErrors < MAX_POLLING_ERRORS) {
        this.pollingRequestErrors++;
      } else {
        this.pollingRequestErrors = 0;
        if (Utils.isNullOrUndefinedOrEmpty(cb)) {
          return;
        }
        cb(evt.detail.status, evt.detail.body, id);
      }
    }
  }

  checkEvent = () => {
    document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
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

    // Event based extension detector
    // NOTE: Safari bugs sometime leads to breakdown in getting responses
    let versionResponse = (evt: any) => {
      document.removeEventListener('AsperaConnectCheckResponse', versionResponse);
        // TODO: Check if extension version is ok
      Logger.log('Extension detected: ' + JSON.stringify(evt));
      if (timeoutMs !== -1) {
        clearTimeout(this.timeoutTimer);
      }
      clearInterval(this.retryTimer);
      this.extensionDetected = true;
      if (callbacks.success) {
        callbacks.success();
      }
    };

    document.addEventListener('AsperaConnectCheckResponse', versionResponse);

    let attemptNumber = 1;
    let interval = timeoutMs === -1 ? 500 : 200;
    let extensionDetector = () => {
      Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
      attemptNumber++;
        // Event based
      this.checkEvent();
        // DOM based extension detector
      let connectDetected = document.getElementById('aspera-connect-detector');
      if (connectDetected) {
        let extensionEnable = connectDetected.getAttribute('extension-enable');
        if (extensionEnable === 'true') {
          if (timeoutMs !== -1) {
            clearTimeout(this.timeoutTimer);
          }
          clearInterval(this.retryTimer);
                // Additional check to see if connect check is responding
          this.checkEvent();
                // wait for connect check response for 1 second
          setTimeout(() => {
            if (!this.extensionDetected) {
              window.postMessage('show_safari_mitigate', '*');
            }
          }, 1000);
        }
      }
        // create detector
      if (!connectDetected) {
        Logger.debug('Creating detector in sdk...');
        let div = document.createElement('div');
        div.id = 'aspera-connect-detector';
        div.setAttribute('extension-enable', 'false');
        document.body.appendChild(div);
      }
    };
    this.retryTimer = setInterval(extensionDetector, interval);
    extensionDetector();
  }

  triggerExtensionCheck () {
    let dummyIframe = document.createElement('IFRAME') as HTMLIFrameElement;
    dummyIframe.src = 'fasp://initialize?checkextensions';
    dummyIframe.style.visibility = 'hidden';
    dummyIframe.style.position = 'absolute';
    dummyIframe.style.width = '0px';
    dummyIframe.style.height = '0px';
    dummyIframe.style.border = '0px';
    document.body.appendChild(dummyIframe);
  }

  stop = () => {
	  clearTimeout(this.timeoutTimer);
	  clearInterval(this.retryTimer);
	 }
}

export default SafariAppExtRequestImplementation;
