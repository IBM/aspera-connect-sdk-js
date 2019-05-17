/**
 * @namespace AW4
 *
 * @property {Module} Utils {@link module:Utils}
 * @property {Module} Logger {@link module:Logger}
 */
 
import * as Utils from './utils';
import * as Logger from './logger';
import RequestHandler from './request/request';
import {
  HTTP_METHOD,
  STATUS,
  EVENT,
  TRANSFER_STATUS
} from './shared/constants';
import { minRequestedVersion, SESSION_ID } from './shared/sharedInternals';
 
interface ConnectOptions {
  connectLaunchWaitTimeoutMs?: number;
  id?: string;
  containerId?: string;
  sdkLocation?: string;
  pollingTime?: number;
  minVersion?: string;
  dragDropEnabled?: boolean;
  authorizationKey?: string;
  connectMethod?: string;
  maxActivityOutstanding?: number;
}

interface IAsperaConnectSettings {
  app_id?: string;
  back_link?: string;
  request_id?: string;
}

interface ITransferSpec {
  direction: 'send' | 'receive';
  paths: any[];
  remote_host: string;
  authentication?: 'password' | 'token';
  cipher?: 'none' | 'aes-128';
  content_protection?: boolean;
  content_protection_passphrase?: string;
  cookie?: string;
  create_dir?: boolean;
  destination_root?: string;
  dgram_size?: number;
  fasp_port?: number;
  http_fallback?: boolean;
  http_fallback_port?: number;
  lock_min_rate?: boolean;
  lock_rate_policy?: boolean;
  lock_target_rate?: boolean;
  min_rate_kbps?: number;
  rate_policy?: 'fixed' | 'high' | 'fair' | 'low';
  remote_password?: string;
  remote_user?: string;
  resume?: 'none' | 'attributes' | 'sparse_checksum' | 'full_checksum';
  source_root?: string;
  ssh_port?: number;
  target_rate_cap_kbps?: number;
  target_rate_kbps?: number;
  token?: string;
}

interface ITransferSpecs {
  transfer_specs: [{
    transfer_spec: ITransferSpec,
    aspera_connect_settings: IAsperaConnectSettings
  }]
}

interface IEvtListener {
  (evt: string, data: any): void;
}

interface ICallbacks {
  success(response: any): any;
  error?(response: any): any;
}

/**
 * @classdesc Contains all the Connect API methods
 *
 * @name Connect
 * @class
 * @memberof AW4
 * @param {Object} options Configuration parameters for Connect
 * @param {Number} [options.connectLaunchWaitTimeoutMs=5000] How long to wait in milliseconds
 *   for Connect to launch. If we reach this timeout without a successful request to Connect,
 *   Connect will go to FAILED status.
 * @param {String} [options.id="aspera-web"] The DOM 'id' of the plug-in object to be inserted.
 * @param {String} [options.containerId] The DOM 'id' of an existing element to insert the plug-in
 *   element into (replacing its contents). If not specified, the plug-in is appended to the document body.
 *   Note that the plug-in must not be hidden in order to be loaded.
 * @param {String} [options.sdkLocation="//d3gcli72yxqn2z.cloudfront.net/connect/v4"] Specifies the custom
 *   SDK location to check for Connect installers. It has to be in the following format: '//domain/path/to/connect/sdk'.
 *   If you are hosting your own SDK, then you must provide the location to your copy
 *   of the SDK. This points to the /v4 folder of the provided SDK. The URL provided
 *   must be in the same level of security as the web page (HTTP/HTTPS), HTTPS preferred.
 * @param {Number} [options.pollingTime=2000] How often in milliseconds we want to get
 *   updates of transfer status.
 * @param {String} [options.minVersion] Minimum version of Connect required by the web
 *   application in order to work. Format: "3.9.0".
 * @param {Boolean} [options.dragDropEnabled=false] Enable drag and drop of files/folders
 *   into the browser.
 * @param {("http"|"extension")} [options.connectMethod] Specify the preferred method of
 *   Connect communication. Default is "extension" for `minVersion` >= 3.9.0. Otherwise, default
 *   is "http".
 *
 * @example
 * let options = {
 *   minVersion: "3.9.0",
 *   dragDropEnabled: true
 * }
 * let asperaWeb = new AW4.Connect(options) // returns instance of AW4.Connect
 */
export function Connect (options: ConnectOptions) {
  if (Utils.isNullOrUndefinedOrEmpty(options)) {
    options = {};
  }

  let INITIALIZE_TIMEOUT = options.connectLaunchWaitTimeoutMs || 5000;
  let PLUGIN_ID = options.id || 'aspera-web';
  let PLUGIN_CONTAINER_ID = options.containerId || 'aspera-web-container';
  let SDK_LOCATION = Utils.getFullURI(options.sdkLocation) || '//d3gcli72yxqn2z.cloudfront.net/connect/v4';
  let APPLICATION_ID: any  = '';
  let AUTHORIZATION_KEY = options.authorizationKey || '';
  let POLLING_TIME = options.pollingTime || 2000;
  let MINIMUM_VERSION = options.minVersion || '';
  let CONNECT_METHOD = options.connectMethod || '';
  let DRAGDROP_ENABLED = options.dragDropEnabled || false;
  let MAX_ACTIVITY_OUTSTANDING = options.maxActivityOutstanding || 2;

  // Expose the requested version to the install banner
  if (options.minVersion) {
    // AW4.MIN_REQUESTED_VERSION = options.minVersion;
    minRequestedVersion.set(options.minVersion);
  }

  if (typeof(Storage) !== 'undefined') {
    let overrideMethod = Utils.getLocalStorage('aspera-connect-method');
    if (overrideMethod) {
      CONNECT_METHOD = overrideMethod;
    }
  }

  // TODO: Is this needed?
  // options.addStandardSettings = addStandardConnectSettings;

  let transferListeners: IEvtListener[] = [];
  let transferEventIntervalId = 0;
  let transferEventIterationToken: any = 0;
  let requestHandler: any = null;
  let statusListeners: IEvtListener[] = [];
  let connectStatus = STATUS.INITIALIZING;
  let objectId = Utils.nextObjectId();
  let outstandingActivityReqs = 0; // Keep track of polling requests to avoid overfilling the queue

  function addStandardConnectSettings (data: any) {
    if (AUTHORIZATION_KEY.length !== 0) {
      data.authorization_key = AUTHORIZATION_KEY;
    }
    if (Utils.isNullOrUndefinedOrEmpty(data.aspera_connect_settings)) {
      data.aspera_connect_settings = {};
    }
    data.aspera_connect_settings.app_id = APPLICATION_ID;
    return data;
  }

  function connectHttpRequest (method: string, path: string, data: any | null, sessionId: string, callbacks: ICallbacks | null) {
    if (requestHandler == null) {
      console.error('Connect#initSession must be called before invoking Connect API[' + path + '].');
      return null;
    }
    // Use our own local variable to avoid mutating user's object
    let localData: any = {};
    if (!Utils.isNullOrUndefinedOrEmpty(data)) {
      // 5-10 times faster than JSON.parse(JSON.stringify(data))
      for (let property in data) {
        if (data.hasOwnProperty(property)) {
          localData[property] = data[property];
        }
      }
    }
    // prepare data
    let dataStr = JSON.stringify(addStandardConnectSettings(localData));
    // start request
    requestHandler.start(method, path, dataStr, sessionId, callbacks);
    return null;
  }

  function driveHttpRequest (method: string, path: string, data: string | null, sessionId: string, callbacks: ICallbacks) {
    if (requestHandler == null) {
      return null;
    }
    // prepare data
    let dataStr = JSON.stringify(data);
    // start request
    requestHandler.start(method, path, dataStr, sessionId, callbacks);
    return null;
  }

  function getAllTransfersHelper (iterationToken: string, callbacks: ICallbacks) {
    // This is never supposed to happen
    if (Utils.isNullOrUndefinedOrEmpty(iterationToken)) {
      return null;
    }
    let data = { iteration_token: iterationToken };
    return connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/activity', data, SESSION_ID.value(), callbacks);
  }

  function notifyTransferListeners (response: any) {
    // First update the iterate token for future requests
    transferEventIterationToken = response.iteration_token;
    // Notify the listeners
    for (let i = 0; i < transferListeners.length; i++) {
      transferListeners[i](EVENT.TRANSFER, response);
    }
  }

  function pollTranfersHelperFunction () {
    // TODO: Need to make sure that all request implementations error on timeout
    if (outstandingActivityReqs >= MAX_ACTIVITY_OUTSTANDING) {
      Logger.debug('Skipping activity request. Reached maximum number of outstanding polling requests.');
      return;
    }
    outstandingActivityReqs++;
    getAllTransfersHelper(transferEventIterationToken, {
      success: function (response: any) {
        outstandingActivityReqs--;
        notifyTransferListeners(response);
      },
      error: function () {
        outstandingActivityReqs--;
      }
    });
  }

  function removeEventListenerHelper (listener: IEvtListener, listenerArray: IEvtListener[]) {
    let listenerFound = false;
    let index = listenerArray.indexOf(listener);
    while (index > -1) {
      listenerArray.splice(index, 1);
      listenerFound = true;
      index = listenerArray.indexOf(listener);
    }
    return listenerFound;
  }

  function isAppIdEntropyOk (appId: string) {
    let entropy = 0;
    let len = appId.length;
    let charFreq = Object.create(null);
    appId.split('').forEach(function (s) {
      if (charFreq[s]) {
        charFreq[s] += 1;
      } else {
        charFreq[s] = 1;
      }
    });
    for (let s in charFreq) {
      let percent = charFreq[s] / len;
      entropy -= percent * (Math.log(percent) / Math.log(2));
    }
    return entropy > 3.80;
  }

  ////////////////////////////////////////////////////////////////////////////
  // Manage Connect Status and high level logic
  ////////////////////////////////////////////////////////////////////////////

  function notifyStatusListeners (notifyStatus: any) {
    for (let i = 0; i < statusListeners.length; i++) {
      statusListeners[i](EVENT.STATUS, notifyStatus);
    }
  }

  function setConnectStatus (newStatus: string) {
    Logger.debug('[' + objectId + '] Connect status changing from[' + connectStatus + '] to[' + newStatus + ']');
    connectStatus = newStatus;
  }

  function manageConnectStatus (newStatus: number) {
    // Initialize options before calling RUNNING
    if (newStatus === RequestHandler.STATUS.RUNNING && DRAGDROP_ENABLED) {
      connectHttpRequest(HTTP_METHOD.GET, '/connect/file/initialize-drag-drop', null, SESSION_ID.value(), null);
    }
    if (newStatus === RequestHandler.STATUS.INITIALIZING) {
      setConnectStatus(STATUS.INITIALIZING);
    } else if (newStatus === RequestHandler.STATUS.RETRYING) {
      setConnectStatus(STATUS.RETRYING);
    } else if (newStatus === RequestHandler.STATUS.FAILED) {
      setConnectStatus(STATUS.FAILED);
    } else if (newStatus === RequestHandler.STATUS.EXTENSION_INSTALL) {
      setConnectStatus(STATUS.EXTENSION_INSTALL);
    } else if (newStatus === RequestHandler.STATUS.WAITING) {
      // No change
    } else if (newStatus === RequestHandler.STATUS.OUTDATED) {
      if (connectStatus !== STATUS.OUTDATED) {
        setConnectStatus(STATUS.OUTDATED);
      }
    } else {
      setConnectStatus(STATUS.RUNNING);
    }
    notifyStatusListeners(connectStatus);
  }

  this.connectHttpRequest = connectHttpRequest;
  this.driveHttpRequest = driveHttpRequest;
  this.isNullOrUndefinedOrEmpty = Utils.isNullOrUndefinedOrEmpty;

  /**
   * @function
   * @name AW4.Connect#addEventListener
   * @description Subscribe for Connect events. The first time the listener is
   *   called it will receive an event for each of the transfers already displayed
   *   in Connect, such that the listener will know the complete state of all transfers.
   * @param {EVENT} type The type of event to receive events for.
   * @param {Function} listener The function that will be called when the event occurs.
   *   Format:
   *   ```
   *   function(eventType, data) { ... }
   *   ```
   *   "transfer" event types return data format: {@link AllTransfersInfo}
   * @returns {null|Error}
   *
   * @example
   * // create a transfer listener
   * function transferListener(type, allTransfersInfo) {
   *   if (type === AW4.Connect.EVENT.TRANSFER) {
   *     console.log('Received transfer event!')
   *     handleTransferEvent(allTransfersInfo) // do something with the transfers data
   *   }
   * }
   * asperaWeb.addEventListener(AW4.Connect.EVENT.TRANSFER, transferListener)
   */
  this.addEventListener = function (type: string, listener: IEvtListener) {
    // Check the parameters
    if (typeof type !== typeof EVENT.ALL) {
      return Utils.createError(-1, 'Invalid EVENT parameter');
    } else if (typeof listener !== 'function') {
      return Utils.createError(-1, 'Invalid Listener parameter');
    }
    // Add the listener
    if (type === EVENT.TRANSFER || type === EVENT.ALL) {
      if (transferEventIntervalId === 0) {
        transferEventIntervalId = setInterval(pollTranfersHelperFunction, POLLING_TIME);
      }
      // Already set a function for polling the status, just add to the queue
      transferListeners.push(listener);
    }
    if (type === EVENT.STATUS || type === EVENT.ALL) {
      statusListeners.push(listener);
    }
    return null;
  };

  /**
   * Test authentication credentials against a transfer server.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#authenticate
   * @param {Object} authSpec Authentication credentials.
   *
   *  Options for `authSpec` (subset of {@link TransferSpec}):
   *  * `remote_host`
   *  * `ssh_port`
   *  * `remote_user`
   *  * `remote_password`
   *  * `token`
   *
   * @param  {Callbacks} callbacks `success` and `error` functions to receive results.
   *
   * Object returned to success callback:
   * `{}`
   * @return {null|Error}
   */
  this.authenticate = function (authSpec: Partial<ITransferSpec>, callbacks: ICallbacks) {
    if (Utils.isNullOrUndefinedOrEmpty(authSpec)) {
      return Utils.createError(-1, 'Invalid authSpec parameter');
    }
    connectHttpRequest(HTTP_METHOD.POST, '/connect/info/authenticate', authSpec, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Get statistics for all transfers.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#getAllTransfers
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{@link AllTransfersInfo}`
   * @param {String} [iterationToken='0'] If specified, return only transfers that have
   *   had activity since the last call.
   * @return {null}
   */
  this.getAllTransfers = function (callbacks: ICallbacks, iterationToken: string = '0') {
    getAllTransfersHelper(iterationToken, callbacks);
    return null;
  };

  /**
   * Get current status of Connect.
   *
   * @function
   * @name AW4.Connect#getStatus
   * @return {STATUS}
   */
  this.getStatus = function () {
    return connectStatus;
  };
   
  /**
   * Call this method after creating the {@link Connect} object. It is mandatory to call this
   * function before making use of any other function of the API. If called more than
   * once on the same instance, it will return an error.
   *
   * Return format:
   * ```
   * {
   *  "app_id": "MjY2ZTM0YWItMGM2NC00ODdhLWJkNzQtNzU0YzVjN2FjYjJj"
   * }
   * ```
   *
   * @function
   * @name AW4.Connect#initSession
   * @param  {String} [applicationId] An ID to represent this session. Transfers
   *   initiated during this session will be associated with the ID. To continue
   *   a previous session, use the same ID as before. Use a unique ID in order to
   *   keep transfer information private from other websites. IF not specified,
   *   an ID is automatically generated for you.
   *
   * @returns {Object}
   */
  this.initSession = function (applicationId?: string) {
    if (Utils.isNullOrUndefinedOrEmpty(APPLICATION_ID)) {
      if (Utils.isNullOrUndefinedOrEmpty(applicationId)) {
        APPLICATION_ID = Utils.getLocalStorage(Utils.LS_CONNECT_APP_ID);
        if (Utils.isNullOrUndefinedOrEmpty(APPLICATION_ID)) {
          APPLICATION_ID = Utils.utoa(Utils.generateUuid());
          Utils.setLocalStorage(Utils.LS_CONNECT_APP_ID, APPLICATION_ID);
        }
      } else {
        APPLICATION_ID = applicationId;
      }
    } else {
      return Utils.createError(-1, 'Session was already initialized');
    }
    if (!isAppIdEntropyOk(APPLICATION_ID)) {
      Logger.warn('WARNING: app_id field entropy might be too low.');
    }
    // Initialize requests
    let error = this.start();
    if (error == null) {
      return { 'app_id' : APPLICATION_ID };
    }
    return error;
  };

  /**
   * Change the speed of a running transfer.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#modifyTransfer
   * @param {String} transferId The ID of the transfer to modify
   * @param {Object} options A subset of {@link TransferSpec}
   *
   * Options:
   * * `rate_policy`
   * * `target_rate_kbps`
   * * `min_rate_kbps`
   * * `target_rate_cap_kbps`
   * * `lock_rate_policy`
   * * `lock_target_rate`
   * * `lock_min_rate`
   * @param {Callbacks} callbacks `success` and `error` functions to receive results.
   *
   * Object returned to success callback:
   * `{@link TransferSpec}`
   * @return {null}
   */
  this.modifyTransfer = function (transferId: string, options: Partial<ITransferSpec>, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/modify/' + transferId, options, SESSION_ID.value(), callbacks);
    return null;
  };
   
  /**
   * Read file as 64-bit encoded data.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#readAsArrayBuffer
   * @param {Object} options Object with options needed for reading the file.
   *
   * Options:
   * * `path` (String) - Absolute path to the file we want to read.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   * results.
   *
   * Object returned to success callback:
   * ```
   * {
   *   "type" : "image/pjpeg",
   *   "data" : "/9j/4AAQSkZ..."
   * }
   * ```
   * @return {null|Error}
   */
  this.readAsArrayBuffer = function (options: { path: string }, callbacks: ICallbacks) {
    console.warn('AW4.Connect#readAsArrayBuffer will be deprecated in the future.');
    // let params = {};
    if (!options) {
      return Utils.createError(-1, 'Invalid options parameter');
    }
    connectHttpRequest(HTTP_METHOD.POST, '/connect/file/read-as-array-buffer/', options, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Read 64-bit encoded chunk from file.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#readChunkAsArrayBuffer
   * @param {Object} options Object with options needed for reading a chunk.
   *
   * Options:
   * * `path` (String) - Absolute path to the file we want to read the chunk from.
   * * `offset` (Number) - Offset (in bytes) that we want to start reading the file.
   * * `chunkSize` (Number) - The size (in bytes) of the chunk we want.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   * results.
   *
   * Object returned to success callback:
   * ```
   * {
   *   "type" : "image/pjpeg",
   *   "data" : "/9j/4AAQSkZ..."
   * }
   * ```
   * @return {null|Error}
   */
   
  this.readChunkAsArrayBuffer = function (options: { path: string, offset: number, chunkSize: number }, callbacks: ICallbacks) {
    console.warn('AW4.Connect#readChunkAsArrayBuffer will be deprecated in the future.');
    if (!options.path || typeof options.offset === 'undefined' || typeof options.chunkSize === 'undefined') {
      return Utils.createError(-1, 'Invalid parameters');
    }
    connectHttpRequest(HTTP_METHOD.POST, '/connect/file/read-chunk-as-array-buffer/', options, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Unsubscribe from Aspera Web events. If `type` is not specified,
   * all versions of the `listener` with different types will be removed.
   * If `listener` is not specified, all listeners for the `type` will be
   * removed. If neither `type` nor `listener` are specified, all listeners
   * will be removed.
   *
   * Return values:
   * * `true` - If we could find a listener with the parameters provided.
   * * `false` - If we could not find a listener for the parameters provided.
   *
   * @function
   * @name AW4.Connect#removeEventListener
   * @param {EVENT} [type] The type of event to stop receiving events for.
   * @param {Function} [listener] The function used to subscribe in {@link Connect#addEventListener}
   * @return {Boolean}
   */
  this.removeEventListener = function (type?: string, listener?: () => any) {
    let listenerFound = false;

    if (typeof type === 'undefined') {
      if (transferListeners.length > 0) {
        transferListeners = [];
        listenerFound = true;
      }
      if (statusListeners.length > 0) {
        statusListeners = [];
        listenerFound = true;
      }
    } else if (typeof type !== typeof EVENT.ALL) {
      // The parameter type is actually the listener
      // @ts-ignore
      listenerFound = listenerFound || removeEventListenerHelper(type, transferListeners);
      // @ts-ignore
      listenerFound = listenerFound || removeEventListenerHelper(type, statusListeners);
    } else if (typeof listener !== 'function') {
      // The user only provided the type
      // First the TRANSFER events
      if (type === EVENT.TRANSFER || type === EVENT.ALL) {
        if (transferListeners.length > 0) {
          transferListeners = [];
          listenerFound = true;
        }
      }
      // Then the STATUS events
      if (type === EVENT.STATUS || type === EVENT.ALL) {
        if (statusListeners.length > 0) {
          statusListeners = [];
          listenerFound = true;
        }
      }
    } else {
      // The user provided both arguments
      // First the TRANSFER events
      if (type === EVENT.TRANSFER || type === EVENT.ALL) {
        listenerFound = listenerFound || removeEventListenerHelper(listener, transferListeners);
      }
      // Then the STATUS events
      if (type === EVENT.STATUS || type === EVENT.ALL) {
        listenerFound = listenerFound || removeEventListenerHelper(listener, statusListeners);
      }
    }
    if (transferListeners.length === 0) {
      clearInterval(transferEventIntervalId);
      transferEventIntervalId = 0;
    }
    return listenerFound;
  };
   
  /**
   * Remove the transfer - terminating it if necessary - from Connect.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#removeTransfer
   * @param {String} transferId The ID(`uuid`) of the transfer to delete.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{@link TransferSpec}`
   * @return {null}
   */
  this.removeTransfer = function (transferId: string, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/remove/' + transferId, null, SESSION_ID.value(), callbacks);
    return null;
  };
   
   /**
    * Resume a transfer that was stopped.
    *
    * *This method is asynchronous.*
    *
    * @function
    * @name AW4.Connect#resumeTransfer
    * @param {String} transferId The ID(`uuid`) of the transfer to resume
    * @param {Object} options A subset of {@link TransferSpec}
    *
    * Options:
    * * `token`
    * * `cookie`
    * * `authentication`
    * * `remote_user`
    * * `remote_password`
    * * `content_protection_passphrase`
    * @param {Callbacks} callbacks `success` and `error` functions to receive results.
    *
    * Object returned to success callback:
    * `{@link TransferSpec}`
    * @return {null}
    */
  this.resumeTransfer = function (transferId: string, options: Partial<ITransferSpec>, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/resume/' + transferId, options, SESSION_ID.value(), callbacks);
    return null;
  };

  interface IDragDropOptions {
    dragEnter?: boolean;
    dragOver?: boolean;
    dragLeave?: boolean;
    drop?: boolean;
  }

  /**
   * Sets drag and drop options for the element given in the cssSelector. Please note that
   * the `dragDropEnabled` option must have been set to `true` when creating the {@link Connect}
   * object.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#setDragDropTargets
   * @param {String} cssSelector CSS selector for drop targets.
   * @param {Object} [options] Drag and drop options for these targets.
   *
   *  Options:
   *  * `dragEnter` (Boolean) - `true` if drag enter event should trigger the listener. Default: `false`.
   *  * `dragOver` (Boolean) - `true` if drag over event should trigger the listener. Default: `false`.
   *  * `dragLeave` (Boolean) - `true` if drag leave event should trigger the listener. Default: `false`.
   *  * `drop` (Boolean) - `true` if drop event should trigger the listener. Default: `true`.
   * @param {Function} listener Function to be called when each of the events occurs.
   *
   *   Format:
   *   ```
   *   function(event, files) { ... }
   *   ```
   *   * `event` (Object) - DOM Event object as implemented by the browser.
   *   * `files` (Object) - See {@link dataTransfer}. This is only valid on `drop` events.
   * @return {null|Error}
   */
  this.setDragDropTargets = function (cssSelector: string, options: IDragDropOptions, listener: (evt: any) => any) {
    if (!DRAGDROP_ENABLED) {
      return Utils.createError(-1, 'Drop is not enabled in the initialization ' +
        'options, please instantiate Connect again with the dragDropEnabled option set to true.');
    }
    if (typeof listener !== 'function') {
      return Utils.createError(-1, 'You must provide a valid listener');
    }
    if (Utils.isNullOrUndefinedOrEmpty(options)) {
      return Utils.createError(-1, 'You must provide a valid options object');
    }
    let elements = document.querySelectorAll(cssSelector);
    if (elements.length === 0) {
      return Utils.createError(-1, 'No valid elements for the selector given');
    }
    let dragListener = function (evt: any) {
      evt.stopPropagation();
      evt.preventDefault();
      listener({ event: evt });
    };
    // Needed for the Drop event to be called
    let dragOverListener = function (evt: any) {
      evt.stopPropagation();
      evt.preventDefault();
      if (options.dragOver === true) {
        listener({ event: evt });
      }
    };
    let dropListener = function (evt: any) {
      evt.stopPropagation();
      evt.preventDefault();
      // Prepare request and create a valid JSON object to be serialized
      let filesDropped = evt.dataTransfer.files;
      let data: any = {};
      data.dataTransfer = {};
      data.dataTransfer.files = [];
      for (let i = 0; i < filesDropped.length; i++) {
        let fileObject = {
          'lastModifiedDate' : filesDropped[i].lastModifiedDate,
          'name'             : filesDropped[i].name,
          'size'             : filesDropped[i].size,
          'type'             : filesDropped[i].type
        };
        data.dataTransfer.files.push(fileObject);
      }
      // Drop helper
      let dropHelper = function (response: any) {
        listener({ event: evt, files: response });
      };
      connectHttpRequest(HTTP_METHOD.POST, '/connect/file/dropped-files', data, SESSION_ID.value(), { success: dropHelper });
    };
    for (let i = 0; i < elements.length; i++) {
      // Independent from our implementation
      if (options.dragEnter === true) {
        elements[i].addEventListener('dragenter', dragListener);
      }
      if (options.dragLeave === true) {
        elements[i].addEventListener('dragleave', dragListener);
      }
      if (options.dragOver === true || options.drop !== false) {
        elements[i].addEventListener('dragover', dragOverListener);
      }
      if (options.drop !== false) {
        elements[i].addEventListener('drop', dropListener);
      }
    }
    return null;
  };

   /**
    * Displays the IBM Aspera Connect "About" window.
    *
    * *This method is asynchronous.*
    *
    * @function
    * @name AW4.Connect#showAbout
    * @param {Callbacks} callbacks `success` and `error` functions to receive
    *   results.
    *
    *   Object returned to success callback:
    *   `{}`
    * @return {null}
    */
  this.showAbout = function (callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.GET, '/connect/windows/about', null, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Open the destination directory of the transfer using the system file
   * browser.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showDirectory
   * @param {String} transferId The ID(`uuid`) of the transfer to show files for.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{}`
   * @return {null}
   */
  this.showDirectory = function (transferId: string, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.GET, '/connect/windows/finder/' + transferId, null, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Displays the IBM Aspera Connect "Preferences" window.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showPreferences
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{}`
   * @return {null}
   */
  this.showPreferences = function (callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.GET, '/connect/windows/preferences', null, SESSION_ID.value(), callbacks);
    return null;
  };

  interface ISaveFileDialogOptions {
    allowedFileTypes?: any;
    suggestedName?: string;
    title?: string;
  }
  /**
   * Displays a file chooser dialog for the user to pick a "save-to" path.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showSaveFileDialog
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   * Object returned to success callback:
   * See `{@link dataTransfer}`.
   * @param {Object} [options] File chooser options
   *
   * Options:
   * * `allowedFileTypes` ({@link FileFilters}) - Filter the files displayed by file extension.
   * * `suggestedName` (String) - The file name to pre-fill the dialog with.
   * * `title` (String) - The name of the dialog window.
   * @return {null|Error}
   */
  this.showSaveFileDialog = function (callbacks: ICallbacks, options?: ISaveFileDialogOptions) {
    // Prepare the options object, use our own local variable to avoid mutating user's object
    let localOptions: any = {};
    if (Utils.isNullOrUndefinedOrEmpty(options)) {
      options = {};
    }
    localOptions.title = options!.title || '';
    localOptions.suggestedName = options!.suggestedName || '';
    localOptions.allowedFileTypes = options!.allowedFileTypes || '';
    connectHttpRequest(HTTP_METHOD.POST, '/connect/windows/select-save-file-dialog/', localOptions, SESSION_ID.value(), callbacks);
    return null;
  };

  interface ISelectFileDialog {
    allowedFileTypes?: any;
    allowMultipleSelection?: boolean;
    suggestedName?: string;
    title?: string;
  }
  /**
   * Displays a file browser dialog for the user to select files. The select file
   * dialog call(s) may be separated in time from the later startTransfer(s) call,
   * but they must occur in the same Connect session.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showSelectFileDialog
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   * Object returned to success callback:
   * See `{@link dataTransfer}`.
   * @param {Object} [options] File chooser options
   *
   * Options:
   * * `allowedFileTypes` ({@link FileFilters}) - Filter the files displayed by file extension.
   * * `allowMultipleSelection` (Boolean) -  Allow the selection of multiple
   *    files. Default: `true`.
   * * `title` (String) - The name of the dialog window.
   * @return {null|Error}
   */
  this.showSelectFileDialog = function (callbacks: ICallbacks, options: ISelectFileDialog) {
    // Prepare the options object, use our own local variable to avoid mutating user's object
    let localOptions: any = {};
    if (Utils.isNullOrUndefinedOrEmpty(options)) {
      options = {};
    }
    localOptions.title = options.title || '';
    localOptions.suggestedName = options!.suggestedName || '';
    localOptions.allowMultipleSelection = Utils.isNullOrUndefinedOrEmpty(options.allowMultipleSelection) || options.allowMultipleSelection;
    localOptions.allowedFileTypes = options!.allowedFileTypes || '';
    connectHttpRequest(HTTP_METHOD.POST, '/connect/windows/select-open-file-dialog/', localOptions, SESSION_ID.value(), callbacks);
    return null;
  };

  interface ISelectFolderDialog {
    allowMultipleSelection?: boolean;
    title?: string;
  }
  /**
   * Displays a file browser dialog for the user to select directories. The select
   * folder dialog call(s) may be separated in time from the later startTransfer(s)
   * call, but they must occur in the same Connect session.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showSelectFolderDialog
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   * Object returned to success callback:
   * See `{@link dataTransfer}`.
   * @param {Object} [options] File chooser options
   *
   * Options:
   * * `allowMultipleSelection` (Boolean) -  Allow the selection of multiple
   *    folders. Default: `true`.
   * * `title` (String) - The name of the dialog window.
   * @return {null|Error}
   */
  this.showSelectFolderDialog = function (callbacks: ICallbacks, options: ISelectFolderDialog) {
    // Prepare the options object, use our own local variable to avoid mutating user's object
    let localOptions: any = {};
    if (Utils.isNullOrUndefinedOrEmpty(options)) {
      options = {};
    }
    localOptions.title = options.title || '';
    localOptions.allowMultipleSelection = Utils.isNullOrUndefinedOrEmpty(options.allowMultipleSelection) || options.allowMultipleSelection;
    connectHttpRequest(HTTP_METHOD.POST, '/connect/windows/select-open-folder-dialog/', localOptions, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Displays the IBM Aspera Connect "Activity" window.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showTransferManager
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{}`
   * @return {null}
   */
  this.showTransferManager = function (callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.GET, '/connect/windows/transfer-manager', null, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Displays the IBM Aspera Connect "Transfer Monitor" window for the transfer.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#showTransferMonitor
   * @param {String} transferId The ID(`uuid`) of the corresponding transfer.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{}`
   * @return {null}
   */
  this.showTransferMonitor = function (transferId: string, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.GET, '/connect/windows/transfer-monitor/' + transferId, null, SESSION_ID.value(), callbacks);
    return null;
  };

  /**
   * Start looking for Connect. Please note that this is called internally by {@link Connect#initSession}
   * and it should only be called directory after a call to {@link Connect#stop}.
   *
   * @function
   * @name AW4.Connect#start
   * @return {null|Error}
   */
  this.start = function () {
    if (APPLICATION_ID === '') {
      return Utils.createError(-1, 'Please call initSession first');
    }
    requestHandler = new RequestHandler();
    // Add status listener to connect
    requestHandler.addStatusListener(manageConnectStatus);
    // Initialize request
    let options = {
      pluginId: PLUGIN_ID,
      containerId: PLUGIN_CONTAINER_ID,
      initializeTimeout: INITIALIZE_TIMEOUT,
      sdkLocation: SDK_LOCATION,
      connectMethod: CONNECT_METHOD,
      minVersion: MINIMUM_VERSION
    };
    return requestHandler.init(options);
  };
   
  /**
   * Initiates a single transfer. Call {@link Connect#getAllTransfers} to get transfer
   * statistics, or register an event listener through {@link Connect#addEventListener}.
   *
   * Return format:
   * ```
   * {
   *  "request_id": "bb1b2e2f-3002-4913-a7b3-f7aef4e79132"
   * }
   * ```
   * The `request_id`, which is returned immediately, may be used for matching
   * this transfer with its events.
   *
   * @function
   * @name AW4.Connect#startTransfer
   * @param {TransferSpec} transferSpec Transfer parameters.
   * @param {ConnectSpec} connectSpec Connect options
   * @param {Callbacks} callbacks `success` and `error` functions to receive results.
   *   This call is successful if Connect is able to start the
   *   transfer. Note that an error could still occur after the transfer starts,
   *   e.g. if authentication fails. Use {@link Connect#addEventListener} to
   *   receive notifications about errors that occur during a transfer session.
   *   This call fails if validation fails or the user rejects the transfer.
   *
   * Object returned to success callback:
   * `{@link TransferInfo}`
   *
   * @returns {Object|Error}
   */
  this.startTransfer = function (transferSpec: ITransferSpec, asperaConnectSettings: IAsperaConnectSettings, callbacks: ICallbacks) {
    if (Utils.isNullOrUndefinedOrEmpty(transferSpec)) {
      return Utils.createError(-1, 'Invalid transferSpec parameter');
    }

    let aspera_connect_settings = asperaConnectSettings || {};

    let transferSpecs: ITransferSpecs = {
      transfer_specs : [{
        transfer_spec : transferSpec,
        aspera_connect_settings : aspera_connect_settings
      }]
    };

    return this.startTransfers(transferSpecs, callbacks);
  };
   
  /**
   * Initiates one or more transfers (_currently only the first `transfer_spec`
   * is used_). Call {@link Connect#getAllTransfers} to get transfer
   * statistics, or register an event listener through {@link Connect#addEventListener}.
   *
   * *This method is asynchronous.*
   *
   * Return format:
   * ```
   * {
   *  "request_id": "bb1b2e2f-3002-4913-a7b3-f7aef4e79132"
   * }
   * ```
   * The `request_id`, which is returned immediately, may be used for matching
   * this transfer with its events.
   *
   * @function
   * @name AW4.Connect#startTransfers
   * @param {Object} transferSpecs Transfer parameters.
   *
   * Format:
   * ```
   * {
   *   transfer_specs : [
   *     {
   *       transfer_spec : {@link TransferSpec},
   *       aspera_connect_settings : {@link ConnectSpec}
   *     },
   *     {
   *       transfer_spec : {@link TransferSpec},
   *       aspera_connect_settings : {@link ConnectSpec}
   *     },
   *     ...
   *   ]
   * }
   * ```
   * @param {Callbacks} callbacks `success` and `error` functions to receive results.
   *   This call is successful if Connect is able to start the
   *   transfer. Note that an error could still occur after the transfer starts,
   *   e.g. if authentication fails. Use {@link Connect#addEventListener} to
   *   receive notifications about errors that occur during a transfer session.
   *   This call fails if validation fails or the user rejects the transfer.
   *
   * Object returned to success callback:
   * `{@link TransferInfo}`
   *
   * @returns {Object|Error}
   */
  this.startTransfers = function (transferSpecs: ITransferSpecs, callbacks: ICallbacks) {
    if (Utils.isNullOrUndefinedOrEmpty(transferSpecs)) {
      return Utils.createError(-1, 'Invalid transferSpecs parameter');
    }
    let i;
    let requestId;
    let transferSpec;

    requestId = Utils.generateUuid();

    for (i = 0; i < transferSpecs.transfer_specs.length; i++) {
      transferSpec = transferSpecs.transfer_specs[i];
      addStandardConnectSettings(transferSpec);
      transferSpec.aspera_connect_settings.request_id = requestId;
      if (Utils.isNullOrUndefinedOrEmpty(transferSpec.aspera_connect_settings.back_link)) {
        transferSpec.aspera_connect_settings.back_link = window.location.href;
      }
    }
    connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/start', transferSpecs, SESSION_ID.value(), callbacks);
    return { request_id : requestId };
  };
   
  /**
   * Stop all requests from Connect to restart activity, please
   * create a new {@link Connect} object or call {@link Connect#start}.
   *
   * @function
   * @name AW4.Connect#stop
   * @return {null}
   */
  this.stop = function () {
    return requestHandler.stopRequests();
  };
   
  /**
   * Terminate the transfer. Use {@link Connect#resumeTransfer} to resume.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#stopTransfer
   * @param {String} transferId The ID(`uuid`) of the transfer to stop.
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   `{}`
   * @return {null}
   */
  this.stopTransfer = function (transferId: string, callbacks: ICallbacks) {
    connectHttpRequest(HTTP_METHOD.POST, '/connect/transfers/stop/' + transferId, null, SESSION_ID.value(), callbacks);
    return null;
  };
   
  /**
   * Get the IBM Aspera Connect version.
   *
   * *This method is asynchronous.*
   *
   * @function
   * @name AW4.Connect#version
   * @param {Callbacks} callbacks `success` and `error` functions to receive
   *   results.
   *
   *   Object returned to success callback:
   *   ```
   *   {
   *     "version": "3.9.1.171801"
   *   }
   *   ```
   * @return {null}
   */
  this.version = function (callbacks: ICallbacks) {
    if (Utils.isNullOrUndefinedOrEmpty(callbacks)) {
      return null;
    }
    connectHttpRequest(HTTP_METHOD.GET, '/connect/info/version', null, SESSION_ID.value(), callbacks);
    return null;
  };
};

/**
 * AW4.Connect.EVENT
 * @typedef {Object} EVENT
 * @property {string} ALL="all" all event
 * @property {string} TRANSFER="transfer" transfer event
 * @property {string} STATUS="status" status event
 * @example
 *
 * AW4.Connect.EVENT.ALL // returns "all"
 * AW4.Connect.EVENT.STATUS // returns "status"
 * AW4.Connect.EVENT.TRANSFER // returns "transfer"
 */
Connect.EVENT = EVENT;
Connect.HTTP_METHOD = HTTP_METHOD;
/**
 * AW4.Connect.STATUS
 * @typedef {Object} STATUS
 * @property {string} INITIALIZING="INITIALIZING" initializing status event
 * @property {string} RETRYING="RETRYING" retrying status event
 * @property {string} RUNNING="RUNNING" running status event
 * @property {string} OUTDATED="OUTDATED" outdated status event
 * @property {string} FAILED="FAILED" failed status event
 * @property {string} EXTENSION_INSTALL="EXTENSION_INSTALL" extension install event type
 * @example
 *
 * AW4.Connect.STATUS.INITIALIZING // returns "INITIALIZING"
 * AW4.Connect.STATUS.RETRYING // returns "RETRYING"
 * // etc...
 */
Connect.STATUS = STATUS;
/**
 * AW4.Connect.TRANSFER_STATUS
 *
 * The possible states of a transfer reported by`status` in {@link TransferInfo}.
 * @typedef {Object} TRANSFER_STATUS
 * @property {String} CANCELLED="cancelled" The user stopped the transfer.
 * @property {String} COMPLETED="completed" The transfer finished successfully.
 * @property {String} FAILED="failed" The transfer had an error.
 * @property {String} INITIATING="initiating" The transfer reqeust was accepted. Now
 *   starting transfer.
 * @property {String} QUEUED="queued" The transfer is waiting for other transfers to finish.
 *   The queue is configurable in Connect.
 * @property {String} REMOVED="removed" The user deleted the transfer.
 * @property {String} RUNNING="running" Transfer in progress.
 * @property {String} WILLRETRY="willretry" Transfer waiting to retry after a
 *   recoverable error.
 */
Connect.TRANSFER_STATUS = TRANSFER_STATUS;

/**
 * The data format for statistics for all existing transfers.
 * See {@link TransferInfo}
 *
 * @typedef {Object} AllTransfersInfo
 * @property {Number} iteration_token=0 A marker that represents the moment in time
 *   that the transfer status was retrieved. If it is passed as an argument to
 *   a {@link Connect#getAllTransfers} call, the response returned will only contain transfers
 *   that have had activity since the previous call. Note that this token persists
 *   even if the user restarts Connect.
 * @property {Number} result_count=0 The number of {@link TransferInfo} objects returned
 *   {@link AllTransfersInfo.transfers}.
 * @property {Array} transfers An array that contains {@link TransferInfo} objects.
 *
 * @example
 * {
 *  "iteration_token": 28,
 *  "result_count": 3,
 *  "transfers": [
 *    {@link TransferInfo},
 *    {@link TransferInfo},
 *    {@link TransferInfo}
 *   ]
 * }
 */

/**
 * The data format for statistics for on transfer session.
 *
 * See {@link TransferSpec} and {@link AsperaConnectSettings} for definitions.
 *
 * @typedef {Object} TransferInfo
 * @property {String} add_time The time when the transfer was added (according
 *   to the system's clock).
 * @property {Object} aspera_connect_settings {@link AsperaConnectSettings}
 * @property {Number} bytes_expected The number of bytes that are still
 *   remaining to be written.
 * @property {Number} bytes_written The number of bytes that have already been
 *   written to disk.
 * @property {Number} calculated_rate_kbps The current rate of the transfer in kbps.
 * @property {String} current_file The full path of the current file.
 * @property {Number} elapsed_usec The duration in microseconds of the transfer since it started
 *   transferring.
 * @property {String} end_time The time when the transfer was completed.
 * @property {Array} files A list of files that have been active in this
 *   transfer session. Note that files that have not been active yet in this session
 *   will not be reported (and you can assume bytes_written is 0).
 *
 *   Format:
 *   ```
 *   [
 *     {
 *       "bytes_expected": 10485760,
 *       "bytes_written": 1523456,
 *       "fasp_file_id": "3c40b511-5b2dfebb-a2e63483-9b58cb45-9cd9abff",
 *       "file": "/Users/aspera/Downloads/connect_downloads/10MB.3"
 *     }, {
 *       "bytes_expected": 10485760,
 *       "bytes_written": 10485760,
 *       "fasp_file_id": "d5b7deea-2d5878f4-222661f6-170ce0f2-68880a6c",
 *       "file": "/Users/aspera/Downloads/connect_downloads/10MB.2"
 *     }
 *   ]
 *   ```
 * @property {String} modify_time The last time the transfer was modified
 * @property {Number} percentage The progress of the transfer over 1.
 * @property {String} previous_status The previous status of the transfer.
 * @property {Number} remaining_usec The ETA of the transfer in microseconds.
 * @property {String} start_time The time when the transfer moved to initiating
 *   status.
 * @property {String} status The status of the transfer. See {@link TRANSFER_STATUS}.
 * @property {String} title The name of the file.
 * @property {Number} transfer_iteration_token A marker that represents the moment
 *   in time that the transfer status was checked.
 * @property {Object} transfer_spec {@link TransferSpec}
 * @property {"fasp"|"http"} transport="fasp" `fasp` - (default) <br>
 *   `http` - Set when a fasp transfer could not be performed and http fallback was used.
 * @property {String} uuid
 *
 * @example
 *     {
 *       "add_time": "2012-10-05T17:53:16",
 *       "aspera_connect_settings": {@link AsperaConnectSettings},
 *       "bytes_expected": 102400,
 *       "bytes_written": 11616,
 *       "calculated_rate_kbps": 34,
 *       "current_file": "/temp/tinyfile0001",
 *       "elapsed_usec": 3000000,
 *       "end_time": "",
 *       "files": [
 *          {
 *            "bytes_expected": 10485760,
 *            "bytes_written": 1523456,
 *            "fasp_file_id": "3c40b511-5b2dfebb-a2e63483-9b58cb45-9cd9abff",
 *            "file": "/Users/aspera/Downloads/connect_downloads/10MB.3"
 *          }, {
 *            "bytes_expected": 10485760,
 *            "bytes_written": 10485760,
 *            "fasp_file_id": "d5b7deea-2d5878f4-222661f6-170ce0f2-68880a6c",
 *            "file": "/Users/aspera/Downloads/connect_downloads/10MB.2"
 *          }
 *       ],
 *       "modify_time": "2012-10-05T17:53:18",
 *       "percentage": 0.113438,
 *       "previous_status": "initiating",
 *       "remaining_usec": 21000000,
 *       "start_time": "2012-10-05T17:53:16",
 *       "status": "running",
 *       "title": "tinyfile0001",
 *       "transfer_iteration_token": 18,
 *       "transfer_spec": {@link TransferSpec},
 *       "transport": "fasp",
 *       "uuid": "add433a8-c99b-4e3a-8fc0-4c7a24284ada",
 *     }
 */
  
/**
 * The parameters for starting a transfer.
 *
 * @typedef {Object} TransferSpec
 *
 * @property {"password"|"token"} [authentication="password"] The type of authentication to use.
 * @property {"none"|"aes-128"} [cipher="aes-128"] The algorithm used to encrypt
 *   data sent during a transfer. Use this option when transmitting sensitive data.
 *   Increases CPU utilization.
 * @property {"encrypt"|"decrypt"} [content_protection] Enable content protection
 *   (encryption-at-rest), which keeps files encrypted on the server. Encrypted
 *   files have the extension ".aspera-env". <br><br>
 *   `encrypt` - Encrypt uploaded files. If `content_protection_passphrase` is
 *   not specified, Connect will prompt for the passphrase. <br><br>
 *   `decrypt` - Decrypt downloaded fiels. If `content_protection_passphrase` is
 *   not specified, Connect will prompt for the passphrase.
 * @property {String} [content_protection_passphrase] A passphrase to encrypt or
 *   decrypt files when using `content_protection`.
 * @property {String} [cookie] Data to associate with the transfer. The cookie is
 *   reported to both client and server-side applications monitoring fasp™ transfers.
 *   It is often used by applications to identify associated transfers.
 * @property {Boolean} [create_dir=false] Creates the destination directory if it
 *   does not already exist. When enabling this option, the destination path is
 *   assumed to be a directory path.
 * @property {String} [destination_root="/"] The transfer destination file path.
 *   If destinations are specified in `paths`, this value is prepended to each destination.
 *
 *   Note that the download destination paths are relative to the user's Connect
 *   download directory setting unless `ConnectSpec.use_absolute_destination_path`
 *   is enabled.
 * @property {Number} [dgram_size] The IP datagram size for fasp™ to use. If not
 *   specified, fasp™ will automatically detect and use the path MTU as the
 *   datagram size. Use this option only to satisfy networks with strict MTU
 *   requirements.
 * @property {"send"|"receive"} direction Whether to perform an upload or download.
 *
 *   `send` - Upload <br>
 *   `receive` - Download
 * @property {Number} [fasp_port=33001] The UDP port for fasp™ to use. The default value
 *   is satisfactory for most situations. However, it can be changed to satisfy
 *   firewall requirements.
 * @property {Boolean} [http_fallback=false] Attempts to perform an HTTP transfer
 *   if a fasp™ transfer cannot be performed.
 * @property {Number} [http_fallback_port] The port where the Aspera HTTP server is
 *   servicing HTTP transfers. Defaults to port 443 if a `cipher` is enabled, or
 *   port 80 otherwise.
 * @property {Boolean} [lock_min_rate=false] Prevents the user from changing the
 *   minimum rate during a transfer.
 * @property {Boolean} [lock_rate_policy=false] Prevents the user from changing the
 *   rate policy during a transfer.
 * @property {Boolean} [lock_target_rate=false] Prevents the user from changing the
 *   target rate during a transfer.
 * @property {Number} [min_rate_kbps] The minimum speed of the transfer. fasp™
 *   will only share bandwidth exceeding this value.
 *
 *   Note: This value has no effect if `rate_policy` is `fixed`.
 *
 *   Default: Server-side minimum rate default setting (aspera.conf). Will respect
 *   both local and server-side minimum rate caps if set.
 * @property {Array} paths A list of the file and directory paths to transfer.
 *   Use `destination_root` to specify the destination directory.
 *
 *   *Source list format*
 *   ```
 *     [
 *       {
 *         "source": "/foo"
 *       }, {
 *         "source": "/bar/baz"
 *       },
 *       ...
 *     ]
 *   ```
 *   Optionally specify a destination path - including the file name - for each file.
 *   This format is useful for renaming files or sending to different destinations.
 *   Note that for this format all paths must be file paths (not directory paths).
 *
 *   *Source-Destination pair format*
 *   ```
 *     [
 *       {
 *         "source": "/foo",
 *         "destination": "/qux/foofoo"
 *       }, {
 *         "source": "/bar/baz",
 *         "destination": "/qux/bazbaz"
 *       },
 *       ...
 *     ]
 *   ```
 * @property {"fixed"|"high"|"fair"|"low"} [rate_policy="fair"] The congestion
 *   control behavior to use when sharing bandwidth.
 *
 *   `fixed` - Transfer at the target rate regardless of actual network capacity.
 *   Do not share bandwidth.
 *
 *   `high` - When sharing bandwidth, transfer at twice the rate of a transfer using
 *   "fair" policy.
 *
 *   `fair` - Share bandwidth equally with other traffic.
 *
 *   `low` - Use only unutilized bandwidth.
 * @property {String} remote_host The fully qualified domain name or IP address
 *   of the transfer server.
 * @property {String} [remote_password] The password to use when `authentication`
 *   is set to `password`. If this value is not specified, Connect will prompt
 *   the user.
 * @property {String} [remote_user] The username to use for authentication. For
 *   password authentication, if this value is not specified, Connect will prompt
 *   the user.
 * @property {"none"|"attributes"|"sparse_checksum"|"full_checksum"} [resume="sparse_checksum"]
 *   The policy to use when resuming partially transferred (incomplete) files.
 *
 *   `none` - Transfer the entire file again.
 *
 *   `attributes` - Resume if the files' attributes match.
 *
 *   `sparse_checksum` - Resume if the files' attributes and sparse (fast) checksums
 *   match.
 *
 *   `full_checksum` - Resume if the files' attributes and full checksums match.
 *   Note that computing full checksums of large files takes time, and heavily
 *   utilizes the CPU.
 * @property {String} [source_root="/"] A path to prepend to the source paths specified
 *   in `paths`. If this is not specified, then `paths` should contain absolute
 *   paths.
 * @property {Number} [ssh_port=33001] The server's TCP port that is listening
 *   for SSH connections. fasp™ initiates transfers through SSH.
 * @property {Number} [target_rate_cap_kbps] Limit the transfer rate that the
 *   user can adjust the target and minimum rates to. Default: no limit.
 * @property {Number} [target_rate_kbps] The desired speed of the transfer. If
 *   there is competing network traffic, fasp™ may share this bandwidth, depending
 *   on the `rate_policy`.
 *
 *   Default: Server-side target rate default setting (aspera.conf). Will respect
 *   both local and server-side target rate caps if set.
 * @property {String} [token] Used for token-based authorization, which involves
 *   the server-side application generating a token that gives the client rights
 *   to transfer a predetermined set of files.
 *
 * @example
 * ##### Minimal example
 * {
 *   "paths": [
 *     {
 *       "source": "/foo/1"
 *     }
 *   ],
 *   "remote_host": "10.0.203.80",
 *   "remote_user": "aspera",
 *   "direction": "send"
 * }
 *
 * ##### Download example
 * {
 *   "paths": [
 *     {
 *       "source": "tinyfile0001"
 *     }, {
 *       "source": "tinyfile0002"
 *     }
 *   ],
 *   "remote_host": "demo.asperasoft.com",
 *   "remote_user": "asperaweb",
 *   "authentication": "password",
 *   "remote_password": "**********",
 *   "fasp_port": 33001,
 *   "ssh_port": 33001,
 *   "http_fallback": true,
 *   "http_fallback_port": 443,
 *   "direction": "receive",
 *   "create_dir": false,
 *   "source_root": "aspera-test-dir-tiny",
 *   "destination_root": "/temp",
 *   "rate_policy": "high",
 *   "target_rate_kbps": 1000,
 *   "min_rate_kbps": 100,
 *   "lock_rate_policy": false,
 *   "target_rate_cap_kbps": 2000,
 *   "lock_target_rate": false,
 *   "lock_min_rate": false,
 *   "resume": "sparse_checksum",
 *   "cipher": "aes-128",
 *   "cookie": "foobarbazqux",
 *   "dgram_size": 1492,
 *   "preserve_times": true,
 *   "tags": {
 *     "your_company": {
 *       "key": "value"
 *     }
 *   }
 * }
 */
   
/**
 * The data format for the connect web app parameters.
 *
 * @typedef {Object} AsperaConnectSettings
 * @property {String} app_id A secure, random identifier for all transfers
 *   associated with this webapp. Do not hardcode this id. Do not use the same
 *   id for different users. Do not including the host name, product name in the id.
 *   Do not use monotonically increasing ids. If you do not provide one, a
 *   random id will be generated for you and persisted in localStorage.
 * @property {String} back_link Link to the webapp.
 * @property {String} request_id Universally Unique IDentifier for the webapp.
 *
 * @example
 * {
 *   "app_id": "TUyMGQyNDYtM2M1NS00YWRkLTg0MTMtOWQ2OTkxMjk5NGM4",
 *   "back_link": "http://demo.asperasoft.com",
 *   "request_id": "36d3c2a4-1856-47cf-9865-f8e3a8b47822"
 * }
 */
     
/**
 * This object is returned if an error occurs. It contains an error code and a message.
 *
 * *Note that this is not related to the Javascript `Error` object, but is used
 * only to document the format of errors returned by this API.*
 *
 * @typedef {Object} Error
 *
 * @example
 * {
 *   "error": {
 *     "code": Number,
 *     "internal_message": String,
 *     "user_message": String
 *   }
 * }
 */
  
/**
 * This object can be passed to an asynchronous API call to get the results
 *   of the call.
 *
 * #### Format
 * ```
 * {
 *   success: function(Object) { ... },
 *   error: function(Error) { ... }
 * }
 * ```
 * The argument passed to the `success` function depends on the original method
 * invoked. The argument to the `error` function is an {@link Error} object.
 *
 * If an Error is thrown during a callback, it is logged to window.console
 * (if supported by the browser).
 *
 * @typedef {Object} Callbacks
 */
 
/**
 * This object holds the data of the files that have been selected by the user. It
 *   may hold one or more data items.
 *
 * #### Format
 * ```
 * {
 *   "dataTransfer" : {
 *     "files": [
 *       {
 *         "lastModifiedDate": "Wed Jan 24 12:22:02 2019",
 *         "name": "/Users/aspera/Desktop/foo.txt",
 *         "size": 386,
 *         "type": "text/plain"
 *       },
 *       {
 *         "lastModifiedDate": "Mon Jan 22 18:01:02 2019",
 *         "name": "/Users/aspera/Desktop/foo.rb",
 *         "size": 609,
 *         "type": "text/x-ruby-script"
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * @typedef {Object} dataTransfer
 */

/**
 * A set of file extension filters.
 *
 * #### Example
 * ```
 * [
 *   {
 *     filter_name : "Text file",
 *     extensions : ["txt"]
 *   },
 *   {
 *     filter_name : "Image file",
 *     extensions : ["jpg", "png"]
 *   },
 *   {
 *     filter_name : "All types",
 *     extensions : ["*"]
 *   }
 * ]
 * ```
 *
 * @typedef {Object} FileFilters
 */
 
 /**
  * Connect-specific parameters when starting a transfer.
  *
  * @typedef {Object} ConnectSpec
  * @property {Boolean} [allow_dialogs=true] If this value is `false`, Connect will no longer prompt or display windows
  *   automatically, except to ask the user to authorize transfers if the server
  *   is not on the list of trusted hosts.
  * @property {String} [back_link=URL of current page] A URL to associate with the transfer. Connect will display this link
  *   in the context menu of the transfer.
  * @property {Boolean} [return_files=true] If this value is `false`, {@link TransferInfo} will not contain
  *   `files`. Use this option to prevent performance deterioration
  *   when transferring large number of files.
  * @property {Boolean} [return_paths=true] If this value is `false`, the `transfer_spec` property in {@link TransferInfo} will not contain
  *   `paths`. Use this option to prevent performance deterioration
  *   when specifying a large number of source paths.
  * @property {Boolean} [use_absolute_destination_path=false] By default, the destination of a download is relative to the user's Connect
  *   download directory setting. Setting this value to `true` overrides this
  *   behavior, using absolute paths instead.
  *
  * @example
  * {
  *   "allow_dialogs" : false,
  *   "back_link" : "www.foo.com",
  *   "return_paths" : false,
  *   "return_files" : false,
  *   "use_absolute_destination_path" : true
  * }
  */
