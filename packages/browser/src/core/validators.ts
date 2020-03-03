import { isNullOrUndefinedOrEmpty } from '../utils';

export const validateAuthSpec = (request: any) => {
  const msg = 'Invalid authSpec paramter.';
  validateBody(request, msg);
};

export const validateBufferOptions = (request: any) => {
  validateOptions(request);
  const { body } = request;
  if (!body.path || typeof body.offset === 'undefined' || typeof body.chunkSize === 'undefined') {
    throwError('Invalid or missing options parameters');
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

export const validateOptions = (request: any) => {
  const msg = 'Must provide options parameter.';
  validateBody(request, msg);
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

const throwError = (msg: string) => {
  const error = new Error(msg);
  error.name = 'ValidationError';
  throw error;
};
