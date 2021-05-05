import { isNullOrUndefinedOrEmpty, generatePromiseData } from '../../../utils';
import { STATUS } from '../../../constants';
import * as types from '../../../core/types';
import { debug } from '../../../logger';

/*
 * Abstract base class that holds all code that is common to any extension
 * request handler.
 */
abstract class BaseExtensionStrategy implements types.RequestStrategy {
  /** Internal cache for active requests */
  outstandingRequests: types.RequestInfoHash<types.ExtensionRequestInfo> = {};
  connectStatus: string = STATUS.INITIALIZING;
  options: types.RequestStrategyOptions;
  /** Default dialog timeout (24 hours) */
  defaultDialogTimeout = 86400000;
  abstract name: string;

  constructor (options: types.RequestStrategyOptions) {
    this.options = options;
  }

  changeConnectStatus = (newConnectStatus: string): void => {
    if (this.connectStatus === newConnectStatus) {
      return;
    }

    this.connectStatus = newConnectStatus;
    this.options.requestStatusCallback(newConnectStatus);
  };

  httpRequest = (endpoint: types.HttpEndpoint, requestId: number): Promise<types.ResolvedHttpResponse> => {
    const requestPromise = generatePromiseData<types.ResolvedHttpResponse>();
    if (endpoint.path.indexOf('/v5/') > -1 || endpoint.path.indexOf('/v6/') > -1) {
      // TODO: Don't mutate original object
      endpoint.path = endpoint.path.replace('/v5', '').replace('/v6', '');
    }

    // Safari extension doesn't accept undefined data even if it is a GET request
    if (isNullOrUndefinedOrEmpty(endpoint.body)) {
      endpoint.body = '';
    }

    const req: types.ExtensionRequest = {
      'request_id': requestId,
      'min_version': this.options.minVersion || '',
      'method': endpoint.method,
      'uri_reference': endpoint.path,
      'body': endpoint.body
    };

    /**
     * If it's a dialog api and user sets a request timeout, set the request timeout here.
     * Otherwise, use default 24 hour timeout.
     */
    if (/select/i.test(endpoint.path)) {
      if (this.options.extensionRequestTimeout) {
        req.timeout = this.options.extensionRequestTimeout;
      } else {
        req.timeout = this.defaultDialogTimeout;
      }
    }

    debug(req);

    this.outstandingRequests[requestId] = {
      'req': req,
      'response': '',
      'resolve': requestPromise.resolver
    };
    // TODO: Validate the data length is not over 100MB
    document.dispatchEvent(new CustomEvent('AsperaConnectRequest', { 'detail': req }));

    return requestPromise.promise;
  };

  abstract startup (): Promise<void>;
}

export default BaseExtensionStrategy;
