import BROWSER from '../shared/browser';
import { STATUS, SESSION_ID, SESSION_KEY } from '../shared/sharedInternals';
import * as Logger from '../logger';
import * as Utils from '../utils';
import {
  DEFAULT_PORT,
  LOCALHOST,
  MAX_PORT_SEARCH,
  MAX_POLLING_ERRORS,
  VERSION_PREFIX,
  SS_SESSION_LASTKNOWN_ID,
  SESSION_LASTKNOWN_KEY,
  SESSION_LASTKNOWN_PORT
} from '../shared/constants';

var encryptRequired = function(sessionId: string | null | undefined) {
    return sessionId !== undefined && sessionId !== null;
};

var encryptReqBody = function(data: any, sessionId: string | null | undefined) {
    var dataToSend = data;
    if (encryptRequired(sessionId)) {
        dataToSend = Utils.encrypt(data);
    }
    return dataToSend;
};

var getXMLHttpRequest = function() {
    if (typeof XMLHttpRequest === "undefined") {
        // @ts-ignore
        XMLHttpRequest = function() {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.6.0");
            } catch (e) {}
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch (e) {}
            try {
                return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {}
            // This browser does not support XMLHttpRequest
            return null;
        };
    }
    return new XMLHttpRequest();
};

class XMLhttpRequestImplementation {
  requestStatusCallback: any;
  initCallback: any;
  connectStatus: number = 0;
  connectPort = DEFAULT_PORT;
  nextId = 0;
  idCallbackHash: any = {};
  scanRetryTimeValues: number[] = [0, 1];
  objectId = Utils.nextObjectId;
  minVersion = '';
  waitReadyTimer: any;
  pollingRequestErrors = 0;
  windowUnloading = false;
  
  constructor() {
    // 2018-06-30 Only Safari 12 has trouble with failing XHR requests when page navigation begins
    if (BROWSER.SAFARI_NO_NPAPI) {
        window.addEventListener('beforeunload', () => {
            this.windowUnloading = true;
        });
    }
  }
  
  isSupportedByBrowser = () => {
      if (getXMLHttpRequest() === null) {
          return false;
      }
      return true
  };
  
  changeConnectStatus = (newConnectStatus: number) => {
      Logger.debug('[' + this.objectId() + '] Http request handler status changing from[' + STATUS.toString(this.connectStatus)
          + '] to[' + STATUS.toString(newConnectStatus) + ']');
      this.connectStatus = newConnectStatus;

      if (this.initCallback && newConnectStatus == STATUS.RUNNING) {
          this.initCallback();
          return;
      }
      if (this.requestStatusCallback) {
          this.requestStatusCallback(newConnectStatus);
      }
  };

  stopWaitReady = () => {
      if (this.waitReadyTimer != null) {
          clearInterval(this.waitReadyTimer);
          this.waitReadyTimer = null;
      }
  };
  
  waitReadyCallback = (httpCode: number, response: any, requestId: string) => {
      // NOTE: This state only applies to /v6 api
      delete this.idCallbackHash[requestId];
      if (this.connectStatus != STATUS.WAITING) {
          this.stopWaitReady();
          return null;
      }
      if (httpCode == 200) {
          this.stopWaitReady();
          if (typeof sessionStorage != 'undefined') {
              sessionStorage.setItem(SS_SESSION_LASTKNOWN_ID, SESSION_ID.value());
              sessionStorage.setItem(SESSION_LASTKNOWN_KEY, SESSION_KEY.value());
              sessionStorage.setItem(SESSION_LASTKNOWN_PORT, String(this.connectPort));
          }
          this.changeConnectStatus(STATUS.RUNNING);
      }
      return null;
  };
  
  enterWaitReady = () => {
      var waitReady = () => {
          if (this.connectStatus != STATUS.WAITING) {
              this.stopWaitReady();
              return;
          }
          var requestId = this.nextId++;
          var method = "GET";
          var path = "/connect/info/ready";
          var requestInfo = {id: requestId, method: method, port: this.connectPort, path: path, data: null, callbacks: null};
          this.idCallbackHash[requestId] = requestInfo;

          this.httpRequest(method, path, null, this.waitReadyCallback, requestId, SESSION_ID.value());
      };

      this.stopWaitReady();
      this.changeConnectStatus(STATUS.WAITING);
      if (this.waitReadyTimer == null) {
          this.waitReadyTimer = setInterval(waitReady, 1000);
      }
      waitReady();
  };
  
  versionCheckCallback = (httpCode: number, response: any, requestId: string) => {
      // Minimum compatibility check (3.8+)
      if (httpCode == 200) {
          var parsedResponse = Utils.parseJson(response);
          var hasError = typeof parsedResponse.error != 'undefined';
          if (!hasError && Utils.versionLessThan(parsedResponse.version, '3.8')) {
              this.changeConnectStatus(STATUS.OUTDATED);
          } else {
              this.enterWaitReady();
          }
      }
  };

  versionCheck = () => {
      // Minimum compatibility check (3.8+)
      var currentRequestId = this.nextId++;
      this.httpRequest('GET', '/connect/info/version', null, this.versionCheckCallback, currentRequestId, null);
  };
  
  iteratePortsCallback = (httpCode: number, response: any, requestId: string) => {
      //retrieve wanted value (copy because primitive) and remove request
      var checkedPort = this.idCallbackHash[requestId].port;
      delete this.idCallbackHash[requestId];

      //check always if we have found connect, if so stop searching
      if (this.connectStatus == STATUS.RUNNING || this.connectStatus == STATUS.STOPPED) {
          return null;
      }

      if (httpCode == 200) {
          this.connectPort = checkedPort;
          this.versionCheck();
          return null;
      }
      if (checkedPort === DEFAULT_PORT) {
          //Check the rest of the ports
          for (var port = DEFAULT_PORT + 1; port < (DEFAULT_PORT + MAX_PORT_SEARCH); port++) {
              var currentRequestId = this.nextId++;
              var method = 'GET';
              var path = "/connect/info/ping";
              var requestInfo = {id: currentRequestId, method: method, port: port, path: path, data: null, callbacks: null};
              this.idCallbackHash[currentRequestId] = requestInfo;

              this.connectPort = port; // XXX
              this.httpRequest(method, path, null, this.iteratePortsCallback, currentRequestId, null);
          }
      }
      return null;
  };
  
  iteratePorts = (firstRun = false) => {
      //check always if we have found connect or stopped the requests, if so stop searching
      if (this.connectStatus == STATUS.RUNNING || this.connectStatus == STATUS.STOPPED) {
          return null;
      } else if (this.connectStatus == STATUS.INITIALIZING && firstRun) {
          Utils.launchConnect();
          this.changeConnectStatus(STATUS.RETRYING);
      }

      //Set next ping request, we scale back using an exponential function (Fibonacci sequence)
      var retryTimeS = this.scanRetryTimeValues[0] + this.scanRetryTimeValues[1];
      setTimeout(this.iteratePorts, retryTimeS * 1000);
      this.scanRetryTimeValues[0] = this.scanRetryTimeValues[1];
      this.scanRetryTimeValues[1] = retryTimeS;

      var requestId = this.nextId++;
      var method = 'GET';
      var path = "/connect/info/ping";
      this.connectPort = DEFAULT_PORT; // XXX
      var requestInfo = {id: requestId, method: method, port: DEFAULT_PORT, path: path, data: null, callbacks: null};
      this.idCallbackHash[requestId] = requestInfo;

      this.httpRequest(method, path, null, this.iteratePortsCallback, requestId, null);
      return null;
  };
  
  fastInitCallback = (httpCode: number, response: any, requestId: string) => {
      delete this.idCallbackHash[requestId];
      if (httpCode == 200) {
          Logger.debug('Connect fast init success');
          this.changeConnectStatus(STATUS.RUNNING);
      } else {
          this.iteratePorts(true);
      }
  };
  
  fastInit = () => {
      // Help reduce the number of protocol handler calls
      // Check if we can restablish connection quickly
      if (typeof sessionStorage == 'undefined') { // Min support IE 8
          return false;
      }

      var id = sessionStorage.getItem(SS_SESSION_LASTKNOWN_ID);
      if (Utils.isNullOrUndefinedOrEmpty(id)) {
          id = SESSION_ID.value();
          sessionStorage.setItem(SS_SESSION_LASTKNOWN_ID, SESSION_ID.value());
      } else {
          SESSION_ID.set(id!);
      }

      var key = sessionStorage.getItem(SESSION_LASTKNOWN_KEY);
      if (Utils.isNullOrUndefinedOrEmpty(key)) {
          key = SESSION_KEY.value();
          sessionStorage.setItem(SESSION_LASTKNOWN_KEY, SESSION_KEY.value());
      } else {
          SESSION_KEY.set(key!);
      }

      var port = sessionStorage.getItem(SESSION_LASTKNOWN_PORT);
      if (Utils.isNullOrUndefinedOrEmpty(port)) {
          return false;
      }
      this.connectPort = Number(port);

      Logger.debug('Connect fast init');
      var requestId = this.nextId++;
      var method = 'GET';
      var path = "/connect/info/ready";
      var requestInfo = {id: requestId, method: method, port: this.connectPort, path: path, data: null, callbacks: null};
      this.idCallbackHash[requestId] = requestInfo;
      this.httpRequest(method, path, null, this.fastInitCallback, requestId, SESSION_ID.value());
      return true;
  };
  
  reconnect = () => {
      this.changeConnectStatus(STATUS.RETRYING);
      Utils.launchConnect();
      this.iteratePorts();
  };
  
  // TODO: callbacks should be last parameter
  // TODO: requestId and sessionId should be internal to request implementation
  httpRequest = (method: string, path: string, data: any, callback: any, requestId: number, sessionId: string | null) => {
      // For backwards compatibility, use v5
      var version = VERSION_PREFIX;
      if (path == '/connect/info/ping' || path == '/connect/info/version')
          version = '/v5';

      var fullpath = LOCALHOST + this.connectPort + version + path;
      var request = getXMLHttpRequest();
      request.onreadystatechange = (XMLHttpRequestProgressEvent) => {
          if (typeof callback != 'function') {
              return;
          }
          if (this.connectStatus == STATUS.STOPPED || this.windowUnloading) {
              Logger.debug('Connect stopped or page unloading. Skipping xhr processing.');
              return;
          }
          if (request.readyState != 4) {
              return;
          }
          if (request.status === 0 && this.connectStatus == STATUS.RUNNING) {
              //Avoid excessive re-launch related to polling failures
              //Safari causes CORS failures when new page navigation starts
              if (this.connectStatus == STATUS.RUNNING && this.pollingRequestErrors < MAX_POLLING_ERRORS
                  && fullpath.indexOf('/connect/transfers/activity') > 0) {
                  this.pollingRequestErrors++;
                  return;
              }
              this.reconnect();
          }
          var respToProcess = request.responseText;
          if (request.status === 200) {
              this.pollingRequestErrors = 0;
              var contentType = request.getResponseHeader("Content-Type");
              if (contentType == 'application/x-aspera-encrypted'
                  && sessionId !== undefined
                  && typeof(request.responseText) != 'undefined'
                  && request.responseText.length > 0
                  && request.responseText[0] != '{')
              {
                  respToProcess = Utils.decrypt(request.responseText);
                  // NOTE: It's already decrypted at this point
                  // respToProcess = crypt.aesjs.utils.utf8.fromBytes(respToProcess);
              }
          }
          Logger.trace('HttpRequest processed[' + fullpath + '] postData[' + data +
              '] status[' + request.status + '] response[' + respToProcess + ']');
          callback(request.status, respToProcess, requestId);
      }

      request.open(method, fullpath, true);
      if (encryptRequired(sessionId))
          request.setRequestHeader('x-aspera-session-id', sessionId!);

      if (method.toUpperCase() === "GET") {
          request.send();
      } else {
          request.send(encryptReqBody(data, sessionId));
      }
      return null;
  };
  
  stop = () =>{
      this.changeConnectStatus(STATUS.STOPPED);
  };
  
  //options
  //{sdkLocation: , callback:}
  init = (options: any) => {
      if (options.requestStatusCallback)
          this.requestStatusCallback = options.requestStatusCallback;
      if (typeof options.callback === 'function') {
          this.initCallback = options.callback;
      }
      if (!this.fastInit()) {
          this.iteratePorts(true);
      }

  };
}

export default XMLhttpRequestImplementation;
