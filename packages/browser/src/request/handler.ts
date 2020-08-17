import * as Logger from '../logger';
import * as Utils from '../utils';
import { MIN_SECURE_VERSION, MAX_POLLING_ERRORS, STATUS } from '../constants';
import { ConnectGlobals } from '../helpers/globals';
import Provider from './strategy/provider';
import * as types from '../core/types';

/**
 * Stategy pattern for selecting the correct request implementation during runtime
 * given the user's configuration options.
 *
 * TODO: Remove dependency on session id. Specific to http strategy.
 */
class RequestHandler implements types.RequestHandler {
  /** Debugging variable to keep track of multiple instances */
  private _objectId = 0;
  /** Simple counter to increment request ids */
  private _nextId = 0;
  /** Implementation we are going to use to make the http requests */
  private _strategy!: types.RequestStrategy;
  private versionChecked = false;
  private connectStatus: string = STATUS.INITIALIZING;
  /** Internal cache for active requests */
  private _idRequestHash: types.RequestInfoHash<types.RequestInfo> = {};
  /** Array in which we are going to store all the requests that cannot be processed at this time */
  private _queue: types.RequestInfo[] = [];
  /** Track number of polling errors for debounce */
  private _pollingRequestErrors: number = 0;
  /** Internal state of the request handler */
  private _handlerStatus: string = '';
  private _provider: types.Provider;

  constructor (private _options: types.RequestHandlerOptions) {
    this._provider = new Provider({
      ..._options,
      requestStatusCallback: this.changeConnectStatus
    });

    this._objectId = _options.objectId;
    this._nextId = this._objectId * 10000;
    /** Setup continue event listener */
    window.addEventListener('message', (evt) => {
      if (this.connectStatus !== STATUS.RUNNING && evt.data === 'continue') {
        if (this._strategy) {
          if (this._strategy.stop) {
            this._strategy.stop();
            this._strategy = this._provider.getHttpStrategy();
          }
        }
      }
    });
  }

  /**
   * Process all pending client requests starting with most recent
   */
  processQueue = () => {
    while (this._queue.length > 0) {
      let requestInfo = this._queue.pop();
      if (requestInfo) {
        let endpoint: types.HttpEndpoint = {
          method: requestInfo.method,
          path: requestInfo.path,
          body: requestInfo.body
        };

        Logger.debug(`Processing request queue for endpoint: ${endpoint.path}`);
        this._strategy.httpRequest(endpoint, requestInfo.requestId)
          .then((response) => {
            return this.handleResponse<any>(response);
          })
          .then((response) => {
            if (requestInfo && requestInfo.resolve) {
              requestInfo.resolve(response);
            }
          })
          .catch(error => {
            /** TODO: Call requestInfo.reject here to reject 404 api responses for queued requests */
            throw new Error(error);
          });
      }
    }

    Logger.debug('Request queue empty.');
  }

  changeConnectStatus = (newConnectStatus: string) => {
    /**
     * Make sure we check the Connect version before going to running. Happens
     * during normal install sequence after initial timeout.
     */
    if (!this.versionChecked && newConnectStatus === STATUS.RUNNING) {
      return this.checkVersion();
    }

    // Workaround for weird safari extension detector logic. We don't want to go to
    // running from outdated unless it's from a version check. ASCN-2271.
    if (
      Utils.BROWSER.SAFARI &&
      this.connectStatus === STATUS.OUTDATED &&
      newConnectStatus === STATUS.RUNNING
    ) {
      return this.checkVersion();
    }

    // Avoid duplicate event notifications
    if (this.connectStatus === newConnectStatus) {
      return;
    }

    Logger.debug('[' + this._objectId + '] Request handler status changing from[' + this.connectStatus
          + '] to[' + newConnectStatus + ']');
    this.connectStatus = newConnectStatus;

    if (this.connectStatus === STATUS.RUNNING) {
      this.processQueue();
    }

      // Check for status internal to request handler
    if (this._handlerStatus === STATUS.DEGRADED) {
      return this.checkVersion(); // Attempt to reconnect
    }

    // these are handler states - don't bubble up to Connect
    if (newConnectStatus === STATUS.WAITING || newConnectStatus === STATUS.STOPPED) {
      return;
    }

    this._options.statusListener(this.connectStatus);
  }

  /**
   * Verify Connect version meets minimum version requirements
   */
  checkVersionCallback = (response: types.ResolvedHttpResponse) => {
    this.versionChecked = true;
    delete this._idRequestHash[response.requestId];
    if (Utils.isSuccessCode(response.status)) {
      let parsedResponse = Utils.parseJson<types.VersionOutput>(response.body);
      if (Utils.isError(parsedResponse)) {
        Logger.error('Failed to parse version response: ' + response);
        return;
      } else {
        ConnectGlobals.connectVersion = parsedResponse.version;
      }
    } else if (response.status === 0) {
      Logger.debug('Bad check version response. Retrying...');
      /** Keep trying to check version until connection to the server resumes */
      this.versionChecked = false;
      setTimeout(() => {
        void this.checkVersion();
      }, 500);
      return;
    }

    if (!Utils.checkVersionException()) {
      if (this._options.minVersion === '' || Utils.versionLessThan(this._options.minVersion, MIN_SECURE_VERSION)) {
        this._options.minVersion = MIN_SECURE_VERSION;
      }

      if (Utils.versionLessThan(ConnectGlobals.connectVersion, this._options.minVersion)) {
        /** Check if already in the outdated state. Don't want to notify */
        /**  event listeners of same status and calling require multiple times. */
        if (this.connectStatus !== STATUS.OUTDATED) {
          this.changeConnectStatus(STATUS.OUTDATED);
          /** Trigger update interface in Connect */
          let requestId = this._nextId++;
          let postData = { min_version: this._options.minVersion, sdk_location: this._options.sdkLocation };
          let endpoint: types.HttpEndpoint = {
            method: 'POST',
            path: '/connect/update/require',
            body: JSON.stringify(postData)
          };
          this.cacheRequest(endpoint, requestId);
          void this._strategy.httpRequest(endpoint, requestId);
        }

        // Since Connect is outdated, go into a version detection loop
        let attemptNumber = 1;
        let check = () => {
          Logger.debug('Checking for Connect upgrade. Attempt ' + attemptNumber);
          if (Utils.BROWSER.SAFARI) {
            Logger.debug('Safari upgrade requires a page refresh. Extension context becomes invalidated.');
          }

          attemptNumber++;
          if (this.connectStatus !== STATUS.RUNNING && this._handlerStatus !== STATUS.STOPPED) {
            let endpoint = {
              method: 'GET',
              path: '/connect/info/version'
            };
            let requestId = this._nextId++;
            this._strategy.httpRequest(endpoint, requestId).then(
              (response) => {
                let waitUpgradeResponse = Utils.parseJson<types.VersionOutput>(response.body);
                // TODO: Remove duplication here
                if (Utils.isError(waitUpgradeResponse)) {
                  Logger.error('Failed to parse version response: ' + response);
                  return;
                }
                if (!Utils.versionLessThan(waitUpgradeResponse.version, this._options.minVersion)) {
                  Logger.debug('Updated Connect found.');
                  clearInterval(connectVersionRetry);
                  // Go back to running state
                  void this.checkVersion();
                }
              }).catch(error => {
                throw new Error(error);
              });
          } else {
            // If Connect is running, we shouldn't be calling this anymore
            clearInterval(connectVersionRetry);
          }
        };
        // Triggers version check until version response satisfies min version requirement
        let connectVersionRetry = setInterval(check, 1000);
        return;
      }
    }

    this.changeConnectStatus(STATUS.RUNNING);
  }

  /**
   * Helper function to add request to internal cache for request tracking
   */
  cacheRequest = (endpoint: types.HttpEndpoint, requestId: number, resolve?: Function) => {
    let requestInfo: types.RequestInfo = {
      method: endpoint.method,
      path: endpoint.path,
      body: endpoint.body,
      requestId: requestId,
      resolve: resolve
    };
    this._idRequestHash[requestId] = requestInfo;

    return requestInfo;
  }

  /**
   * Get Connect version and enforce version requirements
   */
  checkVersion = async () => {
    let endpoint: types.HttpEndpoint = {
      method: 'GET',
      path: '/connect/info/version'
    };

    let requestId = this._nextId++;
    this.cacheRequest(endpoint, requestId);
    let response = await this._strategy.httpRequest(endpoint, requestId);
    if (response) {
      this.checkVersionCallback(response);
    }
  }

  /** Promise that resolves successful client requests. */
  handleResponse = <T>(response: types.ResolvedHttpResponse): Promise<T> => {
    return new Promise((resolve, reject) => {
      /** Implementation handler might handle this case already */
      if (this._handlerStatus === STATUS.STOPPED) {
        Logger.debug('Connect stopped. Skipping request processing.');
        return reject(
          Utils.createError(-1, 'Connect is stopped. Skipping request processing.')
        );
      }

      let requestInfo = this._idRequestHash[response.requestId];
      if (response.status === 0) {
        if (
          this._pollingRequestErrors < MAX_POLLING_ERRORS &&
          requestInfo.path.indexOf('/connect/transfers/activity') > 0
        ) {
          this._pollingRequestErrors++;
          return reject(
            Utils.createError(-1, 'Error processing transfer activity request')
          );
        }

        /** This was a client request, so queue it for processing later. */
        this._queue.push(requestInfo);
        return;
      }

      if (this.connectStatus !== STATUS.RUNNING) {
        this.changeConnectStatus(STATUS.RUNNING);
      }

      let parsedResponse = Utils.parseJson<T>(response.body);
      delete this._idRequestHash[response.requestId];
      // Reject if response has error fields or if status code is not 2xx
      if (Utils.isError(parsedResponse) || !Utils.isSuccessCode(response.status)) {
        Logger.trace('rejecting response...');
        reject(parsedResponse);
      } else {
        resolve(parsedResponse);
      }
    });
  }

  start = <T>(endpoint: types.HttpEndpoint): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      if (this._handlerStatus === STATUS.STOPPED) {
        return reject(Utils.createError(-1, 'Connect is stopped. Call #start to resume session.'));
      }

      if (this._handlerStatus === STATUS.DEGRADED) {
        return this.checkVersion(); // Attempt to reconnect
      }

      let requestId = this._nextId++;
      let requestInfo = this.cacheRequest(endpoint, requestId, resolve);
      /**
       * If Connect is not ready, queue the client request and resolve the
       * request when the queue is processed.
       */
      if (this.connectStatus !== STATUS.RUNNING) {
        Logger.debug(`Queueing request. Connect is currently ${this.connectStatus}.`);
        this._queue.push(requestInfo);
        return;
      }

      this._strategy.httpRequest(endpoint, requestId)
        .then((response) => {
          return this.handleResponse<T>(response);
        })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  handleFallback = <T>(response: types.ResolvedHttpResponse): T | void => {
    if (response.status === 0) {
      return;
    }

    let parsedResponse = Utils.parseJson<T>(response.body);
    delete this._idRequestHash[response.requestId];
    if (Utils.isError(parsedResponse)) {
      return;
    } else {
      return parsedResponse;
    }
  }

  /**
   * Send version or ping requests via the http strategy for debugging.
   */
  async httpFallback <T> (api: 'version' | 'ping'): Promise<T | void> {
    let httpFallback = this._provider.getHttpStrategy();
    let endpoint = {
      path: '/connect/info/' + api,
      method: 'GET'
    };
    let requestId = this._nextId++;
    this.cacheRequest(endpoint, requestId);
    let response = await httpFallback.httpRequest(endpoint, requestId);
    return this.handleFallback<T>(response);
  }

  /** Define timeout behavior */
  async handleTimeout (timeout: types.ConnectError) {
    /**
     * Return error message from strategy. Otherwise do some debugging first.
     */
    if (timeout.error.user_message !== 'timeout') {
      return Promise.reject(new Error(`Reason: ${timeout.error.user_message}`));
    }

    if (this._handlerStatus === STATUS.STOPPED) {
      return Promise.reject(new Error('Reason: stop() was called during initialization.'));
    }

    if (this.connectStatus !== STATUS.RUNNING && this.connectStatus !== STATUS.OUTDATED && this.connectStatus !== STATUS.EXTENSION_INSTALL) {
      Logger.debug(`Connect detection timed out after: ${this._options.connectLaunchWaitTimeoutMs}ms`);
      if (this._strategy.name === 'http' || this._strategy.name === 'safari' || this._strategy.name === 'npapi' || this._strategy.name === 'nmh') {
        this.changeConnectStatus(STATUS.FAILED);
      }

      /**
       * Expose common error reasons via some simple debugging.
       */
      if (this._strategy.name === 'nmh') {
        if (this.connectStatus === STATUS.FAILED) {
          let response = await this.httpFallback<types.VersionOutput>('version');
          if (response && Utils.versionLessThan(response.version, '3.9')) {
            return Promise.reject(new Error('Reason: Incompatible version of Connect detected. You must upgrade to 3.9+.'));
          } else if (response && !Utils.versionLessThan(response.version, '3.9')) {
            return Promise.reject(new Error('Reason: Connect 3.9+ was detected and is responding to http requests, but not to extension requests. Check native message host registration.'));
          } else {
            return Promise.reject(new Error('Reason: Check that Connect 3.9+ is installed.'));
          }
        }
      }

      /** Generic timeout error */
      return Promise.reject(new Error(`Reason: ${this._strategy.name} init timeout`));
    }

    if (this.connectStatus === STATUS.EXTENSION_INSTALL) {
      return Promise.reject(new Error('Reason: Extension not detected. Make sure it is enabled if already installed.'));
    }

    /** Connect is detected but outdated. */
    if (this.connectStatus === STATUS.OUTDATED) {
      Logger.debug('Connect detected but is outdated.');
      return;
    }
  }

  /**
   * Select request implementation and initialize Connect
   */
  async init () {
    /** Reset Connect and handler statuses */
    this.changeConnectStatus(STATUS.INITIALIZING);
    this._handlerStatus = '';

    /** Await implementation selection */
    Logger.debug('Determining request strategy...');
    this._strategy = await this._provider.getStrategy();
    /** Reject promise if init times out */
    let timeoutPromise = new Promise<types.ConnectError>((reject) => {
      setTimeout(reject, this._options.connectLaunchWaitTimeoutMs, Utils.createError(-1, 'timeout'));
    });

    /** Await application startup */
    let timeout = await Promise.race([
      timeoutPromise,
      this._strategy.startup()
    ]);

    if (Utils.isError(timeout)) {
      return this.handleTimeout(timeout);
    }

    Logger.debug('Connect initialized. Checking version now.');
    /** Ensure Connect meets version requirements */
    await this.checkVersion();
  }

  stopRequests = () => {
    this._handlerStatus = STATUS.STOPPED;
    if (typeof this._strategy.stop === 'function') {
      this._strategy.stop();
    }

    return true;
  }
}

export default RequestHandler;
