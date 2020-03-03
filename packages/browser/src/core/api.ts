import { apiEndpoints } from '../constants';
import * as types from './types';

class ApiService implements types.ApiClass {
  constructor (private requestHandler: types.RequestHandler) {}

  send = <T>(request: any): Promise<T> => {
    const fullEndpoint = this.getEndpointUrl(request.name, request.param);

    return this.httpRequest<T>(
      request.method,
      fullEndpoint,
      request.method === 'POST' ? JSON.stringify(request.body) : undefined
    );
  }

  /**
   * Forms the URL to use for the API call
   */
  private getEndpointUrl (name: string, param?: string) {
    const endpointInfo = apiEndpoints[name];
    if (!endpointInfo) {
      throw new Error(`Connect API (${name}) not known`);
    }

    let route = endpointInfo.route;
    let prefix = endpointInfo.prefix;
    if (param) {
      route = route.replace('${id}', param);
    }

    return `${prefix}${route}`;
  }

  private httpRequest = <T>(method: string, path: string, data?: string): Promise<T> => {
    let endpoint: types.HttpEndpoint = {
      method: method,
      path: path,
      body: data
    };
    return this.requestHandler.start<T>(endpoint);
  }
}

export default ApiService;
