import 'es6-promise/auto';
import { Connect } from './connect';
import { AW4Type, ConnectRoot, getGlobalObject } from './core/aspera-web-global.model';
import { ConnectInstaller } from './installer';
import { Logger } from './logger';
import { Utils } from './utils';
import { __VERSION__ } from './version';

const AW4: AW4Type = { Connect, ConnectInstaller, Logger, Utils, __VERSION__ };

let windowIntegrations = {};
const _window = getGlobalObject<Window>();

// Needed for window integrations with AW4
if (_window.AW4) {
  windowIntegrations = _window.AW4;
}

(window as Window & ConnectRoot).AW4 = {
  ...AW4,
  ...windowIntegrations
};

export * from './exports';
