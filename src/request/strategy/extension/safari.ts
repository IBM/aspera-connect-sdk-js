import { Logger } from '../../../logger';
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
      const id = evt.detail.request_id;
      /**
       * Each instance of this class will receive document events, but
       * the request might not have originated from this instance.
       */
      if (!(id in this.outstandingRequests)) {
        return;
      }
      const path = this.outstandingRequests[id].req.uri_reference;
      const resolve = this.outstandingRequests[id].resolve;
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
  };

  checkEvent = (): void => {
    document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
  };

  detectExtension = async (timeoutMs = -1): Promise<boolean> => {
    /** First check if we have already detected the extension */
    if (this.extensionDetected) {
      Logger.debug('Skipping extension check - already detected.');
      return true;
    }

    const timeoutPromise = new Promise<false>((resolve) => {
      setTimeout(resolve, timeoutMs, false);
    });

    const waitUntilDetected = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attemptNumber = 1;

        const check = () => {
          Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
          attemptNumber++;
          // Event based
          this.checkEvent();
          // DOM based extension detector
          const connectDetected = document.getElementById('aspera-connect-detector');
          if (connectDetected) {
            const extensionEnable = connectDetected.getAttribute('extension-enable');
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
            const div = document.createElement('div');
            div.id = 'aspera-connect-detector';
            div.setAttribute('extension-enable', 'false');
            document.body.appendChild(div);
          }
        };

        // NOTE: Safari bugs sometime leads to breakdown in getting responses
        const versionResponse = (evt: any) => {
          if (evt.type === 'AsperaConnectCheckResponse' && 'detail' in evt && typeof evt.detail === 'object') {
            document.removeEventListener('AsperaConnectCheckResponse', versionResponse);
            Logger.debug('Got response from Connect: ' + JSON.stringify(evt.detail));
            clearInterval(this.detectionRetry);
            this.extensionDetected = true;
            resolve(true);
          }
        };

        document.addEventListener('AsperaConnectCheckResponse', versionResponse);
        const interval = timeoutMs === -1 ? 500 : 200;
        this.detectionRetry = setInterval(check, interval);
        check();
      });
    };

    const found = await Promise.race<boolean>([
      ...timeoutMs !== -1 ? [timeoutPromise] : [],
      waitUntilDetected()
    ]);

    clearInterval(this.detectionRetry);
    return found;

  };

  triggerExtensionCheck (): void {
    const hiddenIframe = document.createElement('IFRAME') as HTMLIFrameElement;
    hiddenIframe.src = 'fasp://initialize?checkextensions';
    hiddenIframe.style.visibility = 'hidden';
    hiddenIframe.style.position = 'absolute';
    hiddenIframe.style.width = '0px';
    hiddenIframe.style.height = '0px';
    hiddenIframe.style.border = '0px';
    document.body.appendChild(hiddenIframe);
  }

  stop = (): void => {
    clearTimeout(this.detectionRetry);
  };

  startup = async (): Promise<void> => {
    Logger.debug('startup()');
    // @ts-ignore
    document.addEventListener('AsperaConnectResponse', this.resolveHttpResponse);
    /** Await extension detection */
    await this.detectExtension();
    Logger.debug('safari init finished');
  };
}

export default SafariAppStrategy;
