import * as types from '../core/types';

/**
 * Expose various shared variables across all modules
 */
const ConnectGlobals: types.Globals = {
  connectVersion: '',
  minVersion: '',
  sessionId: '',
  sessionKey: ''
};

export {
  ConnectGlobals
};
