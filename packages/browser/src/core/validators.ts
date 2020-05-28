import { isNullOrUndefinedOrEmpty } from '../utils';

export const validateAuthSpec = (request: any) => {
  validateOptions(request);
  const required = ['remote_host'];
  validateKeys(request, 'authSpec', required);
};

export const validateBufferOptions = (request: any) => {
  validateOptions(request);
  const required = ['path', 'offset', 'chunkSize'];
  validateKeys(request, '#readChunkAsArrayBuffer options', required);
};

export const validateChecksumOptions = (request: any) => {
  validateOptions(request);
  const required = ['path'];
  validateKeys(request, '#getChecksum options', required);

  const allowedMethods = ['md5', 'sha1', 'sha256', 'sha512'];
  const { body } = request;
  if (body && body.checksumMethod && allowedMethods.indexOf(body.checksumMethod) === -1) {
    throwError(`${body.checksumMethod} is not a supported checksum method`);
  }
};

export const validateMethod = (request: any) => {
  const { method } = request;
  if (!method) {
    throw new Error('Request is missing property: method');
  }
};

export const validateName = (request: any) => {
  const { name } = request;
  if (!name) {
    throw new Error('Request is missing property: name');
  }
};

export const validateArrayBufferOptions = (request: any) => {
  validateOptions(request);
  const required = ['path'];
  validateKeys(request, '#readAsArrayBuffer options', required);
};

export const validateTransferId = (request: any) => {
  const { param } = request;
  if (isNullOrUndefinedOrEmpty(param)) {
    throwError('Must provide transfer id.');
  }
};

const validateBody = (request: any, msg: string) => {
  const { body } = request;
  if (isNullOrUndefinedOrEmpty(body)) {
    throwError(msg);
  }
};

/**
 * Validate request body contains given keys
 */
const validateKeys = (request: any, parameterName: string, keys: string[]) => {
  keys.forEach((key) => {
    if (isNullOrUndefinedOrEmpty(request.body[key])) {
      const msg = `Invalid ${parameterName} parameter: ${key} is missing or invalid`;
      throwError(msg);
    }
  });
};

const validateOptions = (request: any) => {
  const msg = 'Must provide options parameter.';
  validateBody(request, msg);
};

const throwError = (msg: string) => {
  const error = new Error(msg);
  error.name = 'ValidationError';
  throw error;
};
