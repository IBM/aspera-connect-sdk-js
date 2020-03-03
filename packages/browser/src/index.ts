import 'core-js/features/object/assign';
import 'core-js/features/array/find';
import 'core-js/features/promise';

import {
  atou,
  getFullURI,
  launchConnect,
  utoa,
  BROWSER
} from './utils';

export { default as Connect } from './connect';
export { ConnectInstaller } from './installer';
export { __VERSION__ } from './version';

import {
  debug,
  error,
  log,
  setLevel,
  trace,
  warn
} from './logger';

export const Utils = {
  atou,
  getFullURI,
  launchConnect,
  utoa,
  BROWSER
};

export const Logger = {
  debug,
  error,
  log,
  setLevel,
  trace,
  warn
};

// Necessary in order to support Connect Server AW4 integration.
// For this to work, webpack must use the 'window' libraryTarget.
let LocalizeDirlist = {};
const _window = window as any;
if (_window.AW4 && _window.AW4.LocalizeDirlist) {
  LocalizeDirlist = _window.AW4.LocalizeDirlist;
}

export { LocalizeDirlist };
