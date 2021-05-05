import * as types from './types';
import { copyObject, isNullOrUndefinedOrEmpty } from '../utils';
import { validateMethod, validateName } from './validators';

class Request {
  name: string | undefined;
  method: string | undefined;
  param: string | undefined;
  body: Record<string, unknown> | undefined;
  requestId: string | undefined;
  validators: ((request: Request) => void)[] = [];

  addSettings (addStandardSettings: (body: any) => any): void {
    let data = copyObject(this.body);
    data = addStandardSettings(data);

    /** Add additional settings for transfer requests */
    if (this.name === 'startTransfer' && this.requestId) {
      let transferSpec;
      for (let i = 0; i < data.transfer_specs.length; i++) {
        transferSpec = data.transfer_specs[i];
        transferSpec = addStandardSettings(transferSpec);
        (transferSpec.aspera_connect_settings as types.ConnectSettings).request_id = this.requestId;
        if (isNullOrUndefinedOrEmpty(transferSpec.aspera_connect_settings.back_link)) {
          transferSpec.aspera_connect_settings.back_link = window.location.href;
        }
      }
    }

    this.body = data;
  }

  setBody (body: any): Request {
    this.body = body;
    return this;
  }

  setMethod (method: string): Request {
    this.method = method;
    return this;
  }

  setName (name: string): Request {
    this.name = name;
    return this;
  }

  setParam (param: string): Request {
    this.param = param;
    return this;
  }

  setRequestId (id: string): Request {
    this.requestId = id;
    return this;
  }

  setValidator (...validators: ((request: Request) => void)[]): Request {
    this.validators = [...this.validators, ...validators];
    return this;
  }

  validate (): void {
    /** Add default validators here */
    this.validators.push(validateName, validateMethod);

    this.validators.forEach((validator) => {
      validator(this);
    });
  }

  send <T> (api: types.ApiClass): Promise<T> {
    /** Run all validators */
    this.validate();

    return api.send<T>(this);
  }
}

export default Request;
