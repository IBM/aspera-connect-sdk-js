import { Logger } from '../../../logger';
import { atou, recordConnectDetected } from '../../../utils';
import { STATUS } from '../../../constants';
import BaseExtensionStrategy from './base-ext';
import * as types from '../../../core/types';

class NativeHostStrategy extends BaseExtensionStrategy {
  /** Use single tracker for all detection retries. Caveat: don't try detecting extension and Connect at the same time. */
  private _detectionRetry: number | undefined;
  private _extensionDetected = false;
  name = 'nmh';

  /**
   * Handles disconnect messages from the extension.
   */
  handleDisconnect = async (evt: any): Promise<void> => {
    Logger.debug('Native host disconnected. Detail: ' + evt.detail);
    /** Disconnect is expected if Connect is outdated */
    if (this.connectStatus === STATUS.OUTDATED) {
      return;
    }

    if (evt && evt.detail) {
      let installIssueDetected = false;
      [
        'native messaging host not found', // Chrome
        'Error when communicating with the native messaging host', // Chrome - fatal error
        'Access to the specified native messaging host is forbidden', // Development mode id mismatch
        'No such native application' // Firefox
      ].forEach(function (message) {
        if (evt.detail.indexOf(message) !== -1) {
          installIssueDetected = true;
        }
      });

      if (installIssueDetected) {
        this.changeConnectStatus(STATUS.FAILED);
        document.removeEventListener('AsperaConnectDisconnect', this.handleDisconnect);
        return;
      }
    }

    // Handle non-install disconnect issues
    if (this.connectStatus !== STATUS.DEGRADED) {
      this.changeConnectStatus(STATUS.DEGRADED);
      const connectFound = await this.detectConnect(this.options.connectLaunchWaitTimeoutMs);
      if (connectFound) {
        this.changeConnectStatus(STATUS.RUNNING);
      } else {
        this.changeConnectStatus(STATUS.FAILED);
      }
    }
  };

  /**
   * Resolves the extension response
   */
  resolveExtensionResponse = (evt: MessageEvent): void | types.HttpResponse => {
    let data;
    if (
      evt.type === 'message' &&
      typeof evt.data === 'object' &&
      'type' in evt.data &&
      evt.data.type === 'AsperaConnectResponse' &&
      'detail' in evt.data
    ) {
      data = evt.data.detail;
    } else if ('detail' in evt) {
      /**
       * CustomEvent interface used in disconnect event
       */
      // @ts-ignore
      data = evt.detail;
    }

    if (data) {
      Logger.trace('Native host impl received response: ' + JSON.stringify(data));
      const id = data.request_id;
      /**
       * Each instance of this class will receive document events, but
       * the request might not have originated from this instance.
       */
      if (!(id in this.outstandingRequests)) {
        return;
      }

      const resolve = this.outstandingRequests[id].resolve;
      if ('body64' in data) {
        this.outstandingRequests[id].response += data.body64;
        if (data.complete === true) {
          const resp = atou(this.outstandingRequests[id].response);
          delete this.outstandingRequests[id];
          resolve({
            status: data.status,
            body: resp,
            requestId: id
          });
        }
      } else {
        delete this.outstandingRequests[id];
        resolve({
          status: data.status,
          body: data.body,
          requestId: id
        });
      }
    }
  };

  detectionLoop = async (timeoutMs = -1, loop: () => Promise<boolean>): Promise<boolean> => {
    const timeoutPromise = new Promise<false>((resolve) => {
      setTimeout(resolve, timeoutMs, false);
    });
    /**
     * Race against timeout promise if timeout was provided.
     * If timeout is -1, then promise won't return until Connect detected.
     */
    const found = await Promise.race<boolean>([
      ...timeoutMs !== -1 ? [timeoutPromise] : [],
      loop()
    ]);

    clearInterval(this._detectionRetry);
    return found;
  };

  /**
   * Returns promise that resolves with true | false if Connect is detected or not.
   */
  detectConnect = async (timeoutMs = -1): Promise<boolean> => {
    const waitUntilDetected = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attemptNumber = 1;
        const check = async () => {
          try {
            Logger.debug('Detecting Connect installation via extension. Attempt ' + attemptNumber);
            attemptNumber++;
            const endpoint = {
              method: 'GET',
              path: '/connect/info/version'
            };
            // Offset this request id by an additional factor
            const detectConnectRequestId = this.options.objectId * 10500;
            const { status } = await this.httpRequest(endpoint, detectConnectRequestId);
            if (status === 503) {
              Logger.debug('Detected old version of Connect via extension.');
              this.changeConnectStatus(STATUS.OUTDATED);
            } else {
              Logger.debug('Detected Connect installation via extension.');
              recordConnectDetected();
              /** Go to running here if Connect was installed during loop after initial timeout */
              this.changeConnectStatus(STATUS.RUNNING);
              clearInterval(this._detectionRetry);
              resolve(true);
            }
          } catch (error) {
            /** If there was an error, avoid infinitely retrying */
            clearInterval(this._detectionRetry);
            resolve(false);
          }
        };
        this._detectionRetry = setInterval(check, 1000);
        /** Call check() directly to avoid waiting the initial 1 second */
        void check();
      });
    };

    return this.detectionLoop(timeoutMs, waitUntilDetected);
  };

  /**
   * Returns promise that resolves with true | false if extension is detected or not.
   */
  detectExtension = async (timeoutMs = -1): Promise<boolean> => {
    if (this._extensionDetected) {
      return true;
    }

    const waitUntilDetected = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let attemptNumber = 1;
        const check = () => {
          Logger.debug('Detecting Connect extension. Attempt ' + attemptNumber);
          attemptNumber++;
          document.dispatchEvent(new CustomEvent('AsperaConnectCheck', {}));
        };

        const versionResponse = (evt: any) => {
          if (evt.type === 'message' && typeof evt.data === 'object' && 'type' in evt.data
                && evt.data.type === 'AsperaConnectCheckResponse') {
            window.removeEventListener('message', versionResponse);
            Logger.debug('Extension detected: ' + JSON.stringify(evt.data));
            this._extensionDetected = true;
            clearInterval(this._detectionRetry);
            resolve(true);
          }
        };

        window.addEventListener('message', versionResponse);
        const interval = timeoutMs === -1 ? 1000 : 200;
        this._detectionRetry = setInterval(check, interval);
        void check();
      });
    };

    return this.detectionLoop(timeoutMs, waitUntilDetected);
  };

  stop = (): void => {
    clearInterval(this._detectionRetry);
  };

  /**
   * Returns only once extension and Connect are both detected. Caller handles
   * any timeout.
   */
  startup = async (): Promise<void> => {
    /** Setup extension response handlers */
    // @ts-ignore
    document.addEventListener('AsperaConnectResponse', this.resolveExtensionResponse);
    window.addEventListener('message', this.resolveExtensionResponse);
    /** Register disconnect handler before init to handle native host not found issues during install */
    document.addEventListener('AsperaConnectDisconnect', this.handleDisconnect);
    /** Await extension detection */
    await this.detectExtension();
    /** Await Connect detection */
    await this.detectConnect();
    Logger.debug('nmh init finished');
  };
}

export default NativeHostStrategy;
