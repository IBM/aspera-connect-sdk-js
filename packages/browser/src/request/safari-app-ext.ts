import ExtRequestImpl, { IReqInitOptions } from './extRequestImpl';
import * as Utils from '../utils';
import * as Logger from '../logger';
import BROWSER from '../shared/browser';

const MAX_POLLING_ERRORS = 3;

class SafariAppExtRequestImplementation extends ExtRequestImpl {
  eventName = 'AsperaConnectCheckResponse';
  pollingRequestErrors = 0;
  extensionDetected = false;

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

    if (options.requestStatusCallback) {
      this.requestStatusCallback = options.requestStatusCallback;
    }

    document.addEventListener('AsperaConnectResponse', (evt) => this.httpResponse(evt));

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

  httpResponse (evt: any) {
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
}

export default SafariAppExtRequestImplementation;
