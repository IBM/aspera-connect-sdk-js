import 'core-js/features/object/assign';
import 'core-js/features/array/find';

import {
  atou,
  getFullURI,
  launchConnect,
  utoa,
  BROWSER
} from './utils';

export { Connect } from './connect';
export { ConnectInstaller } from './installer';

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
}

export const Logger = {
  debug,
  error,
  log,
  setLevel,
  trace,
  warn
}

let LocalizeDirlist = {};

const _window = window as any;
if (_window.AW4) {
  if (_window.AW4.LocalizeDirlist) {
    LocalizeDirlist = _window.AW4.LocalizeDirlist;
  }
}

export { LocalizeDirlist }
