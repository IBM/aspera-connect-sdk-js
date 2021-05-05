import BROWSER from '../../../helpers/browser';
import * as Logger from '../../../logger';
import * as Utils from '../../../utils';
import {
  DEFAULT_PORT,
  LOCALHOST,
  MAX_PORT_SEARCH,
  MAX_POLLING_ERRORS,
  STATUS
} from '../../../constants';
import * as types from '../../../core/types';

class HttpStrategy implements types.RequestStrategy {
  /** Change Connect status callback */
  private requestStatusCallback: any;
  // private initCallback: any;
  private connectStatus: string = STATUS.INITIALIZING;
  /** Internal tracker for port Connect is listening on */
  private connectPort = DEFAULT_PORT;
  /** Timeout used when iterating ports */
  private scanRetryTimeValues: number[] = [0, 1];
  /** Debugging variable to keep track of multiple instances */
  private objectId = 0;
  /** Simple counter to increment request ids */
  private nextId = 0;
  /** Track number of polling errors for debounce */
  private pollingRequestErrors = 0;
  private windowUnloading = false;
  private VERSION_PREFIX = '/v5';
  name = 'http';

  constructor (private options: types.RequestStrategyOptions) {
    // 2018-06-30 Only Safari 12 has trouble with failing XHR requests when page navigation begins
    if (BROWSER.SAFARI_NO_NPAPI) {
      window.addEventListener('beforeunload', () => {
        this.windowUnloading = true;
      });
    }

    // Associate request ids with object ids
    if (options.objectId) {
      this.objectId = options.objectId;
      this.nextId = this.objectId * 10000;
    }
  }

  /** Track http implementation state */
  changeConnectStatus = (newConnectStatus: string) => {
    if (this.connectStatus === newConnectStatus) {
      return;
    }

    Logger.debug('[' + this.objectId + '] Http request handler status changing from[' + this.connectStatus
          + '] to[' + newConnectStatus + ']');
    this.connectStatus = newConnectStatus;

    if (this.requestStatusCallback) {
      this.requestStatusCallback(newConnectStatus);
    }
  }

  /**
   * Iterates through ports and returns true if Connect responds
   */
  check = async () => {
    let success = false;
    for (let port = DEFAULT_PORT; port < (DEFAULT_PORT + 1 + MAX_PORT_SEARCH); port++) {
      let requestId = this.nextId;
      this.connectPort = port;
      let results = await this.ping(requestId);

      if (results && Utils.isSuccessCode(results.status)) {
        success = true;
        break;
      }
    }

    return success;
  }

  detectConnect = async (firstRun: boolean) => {
    if (this.connectStatus === STATUS.RUNNING || this.connectStatus === STATUS.STOPPED) {
      return true;
    } else if (this.connectStatus === STATUS.INITIALIZING && !firstRun) {
      Utils.launchConnect();
      this.changeConnectStatus(STATUS.RETRYING);
    }

    /** First attempt at detecting Connect */
    let success = await this.check();
    /** If Connect not found, loop until Connect detected */
    if (!success) {
      let retryTimeS = this.scanRetryTimeValues[0] + this.scanRetryTimeValues[1];
      this.scanRetryTimeValues[0] = this.scanRetryTimeValues[1];
      this.scanRetryTimeValues[1] = retryTimeS;

      await new Promise<void>(resolve => {
        setTimeout(async () => {
          await this.detectConnect(false);
          /** Go to running here if Connect was installed during loop after initial timeout */
          this.changeConnectStatus(STATUS.RUNNING);
          resolve();
        }, retryTimeS * 1000);
      });
    }

    return true;
  }

  ping = async (requestId: number) => {
    let request: types.HttpEndpoint = {
      method: 'GET',
      path: '/connect/info/ping'
    };

    return this.httpRequest(request, requestId);
  }

  reconnect = async () => {
    this.changeConnectStatus(STATUS.RETRYING);
    Utils.launchConnect();
    await this.detectConnect(false);
    Logger.debug('Reconnect successful!');
    this.changeConnectStatus(STATUS.RUNNING);
  }

  send = (endpoint: types.HttpEndpoint, requestId: number): Promise<types.ResolvedHttpResponse> => {
    let requestPromise = Utils.generatePromiseData<types.ResolvedHttpResponse>();
    const xhr = Utils.getXMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (this.connectStatus === STATUS.STOPPED || this.windowUnloading) {
        Logger.debug('Connect stopped or page unloading. Skipping xhr processing.');
        return requestPromise.rejecter(
          Utils.createError(-1, 'Connect stopped or page unloading. Skipping xhr processing.')
        );
      }

      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status === 0 && this.connectStatus === STATUS.RUNNING) {
        /**
         * Avoid excessive relaunch related to polling failures.
         * Safari causes CORS failures when new page navigation starts
         */
        if (this.pollingRequestErrors < MAX_POLLING_ERRORS && endpoint.path.indexOf('activity') > 0) {
          this.pollingRequestErrors++;
          return;
        }

        /** If Connect is running, don't need to iterate over ports */
        if (endpoint.path.indexOf(this.connectPort.toString()) === -1 && endpoint.path.indexOf('ping') > 0) {
          return;
        }

        void this.reconnect();
      }

      let response = xhr.responseText;
      Logger.trace('HttpRequest processed[' + endpoint.path + '] postData[' + endpoint.body +
              '] status[' + xhr.status + '] response[' + response + ']');
      requestPromise.resolver({
        status: xhr.status,
        body: response,
        requestId: requestId
      });
    };

    xhr.open(endpoint.method, endpoint.path, true);
    if (endpoint.method.toUpperCase() === 'GET') {
      xhr.send();
    } else {
      xhr.send(endpoint.body);
    }

    return requestPromise.promise;
  }

  httpRequest = async (endpoint: types.HttpEndpoint, requestId: number): Promise<types.ResolvedHttpResponse> => {
    const fullpath = `${LOCALHOST}${this.connectPort}${this.VERSION_PREFIX}${endpoint.path}`;
    // TODO: Make copy of original request
    endpoint.path = fullpath;
    let result = await this.send(endpoint, requestId);
    return result;
  }

  stop = () => {
    this.changeConnectStatus(STATUS.STOPPED);
  }

  startup = async () => {
    this.requestStatusCallback = this.options.requestStatusCallback;

    /** Await Connect detection */
    await this.detectConnect(true);
    Logger.debug('Finished http init');
  }
}

export default HttpStrategy;
