import * as Logger from '../../../logger';
import { STATUS } from '../../../constants';
import BaseExtensionStrategy from './base-ext';
import * as types from '../../../core/types';

const MAX_POLLING_ERRORS = 3;

class SafariAppStrategy extends BaseExtensionStrategy {
  private pollingRequestErrors = 0;
  private extensionDetected = false;
  private detectionRetry: number | undefined;
  name = 'safari';

  /**
   * Resolves the http response
   */
  resolveHttpResponse = (evt: CustomEvent): void | types.HttpResponse => {
    if (evt.detail) {
      Logger.trace('Safari extension impl received response: ' + JSON.stringify(evt));
      let id = evt.detail.request_id;
      /**
       * Each instance of this class will receive document events, but
       * the request might not have originated from this instance.
       */
      if (!(id in this.outstandingRequests)) {
        return;
      }
      let path = this.outstandingRequests[id].req.uri_reference;
      let resolve = this.outstandingRequests[id].resolve;
      delete this.outstandingRequests[id];

      if (evt.detail.status === 0 && path.indexOf('/connect/transfers/activity') > 0
              && this.pollingRequestErrors < MAX_POLLING_ERRORS) {
        this.pollingRequestErrors++;
        return;
      } else {
        this.pollingRequestErrors = 0;

        resolve({
          status: evt.detail.status,
          body: evt.detail.body,
          requestId: id
        });
      }
    }
  }

  checkEvent = () => {
    document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
  }

  detectExtension = async (timeoutMs: number = -1): Promise<boolean> => {
    /** First check if we have already detected the extension */
    if (this.extensionDetected) {
      Logger.debug('Skipping extension check - already detected.');
      return true;
    }

    let timeoutPromise = new Promise<false>((resolve) => {
      setTimeout(resolve, timeoutMs, false);
    });

    let waitUntilDetected = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attemptNumber = 1;

        let check = () => {
          Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
          attemptNumber++;
          // Event based
          this.checkEvent();
          // DOM based extension detector
          let connectDetected = document.getElementById('aspera-connect-detector');
          if (connectDetected) {
            let extensionEnable = connectDetected.getAttribute('extension-enable');
            if (extensionEnable === 'true') {
              Logger.debug('Detected extension');
              clearInterval(this.detectionRetry);
              // Additional check to see if connect check is responding
              this.checkEvent();
              // wait for connect check response for 1 second
              setTimeout(() => {
                if (!this.extensionDetected) {
                  window.postMessage('show_safari_mitigate', '*');
                  resolve(false);
                } else {
                  /** Go to running here if Connect was installed during loop after initial timeout */
                  this.changeConnectStatus(STATUS.RUNNING);
                  resolve(true);
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

        // NOTE: Safari bugs sometime leads to breakdown in getting responses
        let versionResponse = (evt: any) => {
          if (evt.type === 'AsperaConnectCheckResponse' && 'detail' in evt && typeof evt.detail === 'object') {
            document.removeEventListener('AsperaConnectCheckResponse', versionResponse);
            Logger.debug('Got response from Connect: ' + JSON.stringify(evt.detail));
            clearInterval(this.detectionRetry);
            this.extensionDetected = true;
            resolve(true);
          }
        };

        document.addEventListener('AsperaConnectCheckResponse', versionResponse);
        let interval = timeoutMs === -1 ? 500 : 200;
        this.detectionRetry = setInterval(check, interval);
        check();
      });
    };

    let found = await Promise.race<boolean>([
      ...timeoutMs !== -1 ? [timeoutPromise] : [],
      waitUntilDetected()
    ]);

    clearInterval(this.detectionRetry);
    return found;

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
    clearTimeout(this.detectionRetry);
  }

  startup = async () => {
    Logger.debug('startup()');
    // @ts-ignore
    document.addEventListener('AsperaConnectResponse', this.resolveHttpResponse);
    /** Await extension detection */
    await this.detectExtension();
    Logger.debug('safari init finished');
  }
}

export default SafariAppStrategy;
