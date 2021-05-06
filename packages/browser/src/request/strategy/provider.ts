import BROWSER from '../../helpers/browser';
import { STATUS } from '../../constants';
import * as Utils from '../../utils';
import { Logger } from '../../logger';
import { ConnectInstaller } from '../../installer';
import NpapiStrategy from './npapi';
import { NativeHostStrategy, SafariAppStrategy } from './extension';
import HttpStrategy from './http';
import * as types from '../../core/types';

/*
 * Responsible for selecting the appropriate request implementation to
 * use for handling API requests.
 */
class Provider implements types.Provider {
  private strategy!: types.RequestStrategy;

  constructor (private _options: types.RequestStrategyOptions) {}

  create = (klass: any): types.RequestStrategy => {
    return new klass(this._options);
  };

  getHttpStrategy = (): types.RequestStrategy => {
    return this.create(HttpStrategy);
  };

  getStrategy = async (): Promise<types.RequestStrategy> => {
    try {
      /**
       * Priority:
       * 1. NPAPI
       * 2. If required, use HTTP
       * 3. If extension installed, use extensions
       * 4. Otherwise, use HTTP unless Connect init'd with 3.9 or extensions
       */
      if (this.supportsNpapi()) {
        Logger.debug('Using npapi strategy');
        this.strategy = this.create(NpapiStrategy);
      } else if (this.requiresHttp()) {
        this.setHttpStrategy();
      } else {
        Logger.debug('Attempting extension strategy');
        this.strategy = this.supportsNativeHost() ? this.create(NativeHostStrategy) : this.create(SafariAppStrategy);

        Logger.debug('Checking if extension installed...');
        const installed = await this.strategy.detectExtension?.(1000);
        if (!installed) {
          const supportsInstall = ConnectInstaller.supportsInstallingExtensions === true;

          if (this._options.connectMethod === 'extension' || supportsInstall) {
            if (!this.supportsSafariAppExt()) {
              this._options.requestStatusCallback(STATUS.EXTENSION_INSTALL);
              window.postMessage('show_extension_install', '*');
            }
          } else {
            Logger.debug('Falling back to http strategy');
            this.setHttpStrategy();
          }
        }
      }

      return this.strategy;
    } catch (e) {
      throw new Error(`Unexpected error while determining the request implementation: ${e}`);
    }
  };

  requiresHttp = (): boolean => {
    return (this._options.connectMethod === 'http' || !this.supportsExtensions() || Utils.checkVersionException());
  };

  setHttpStrategy = (): void => {
    Logger.debug('Using http strategy');
    this.strategy = this.getHttpStrategy();
  };

  supportsExtensions = (): boolean => {
    return (this.supportsNativeHost() || this.supportsSafariAppExt());
  };

  supportsHttp = (): boolean => {
    if (Utils.getXMLHttpRequest() === null) {
      return false;
    }

    return true;
  };

  supportsNativeHost = (): boolean => {
    return (BROWSER.CHROME || BROWSER.EDGE_WITH_EXTENSION || BROWSER.FIREFOX);
  };

  supportsNpapi = (): boolean => {
    return (BROWSER.IE || BROWSER.SAFARI && !BROWSER.SAFARI_NO_NPAPI);
  };

  supportsSafariAppExt = (): boolean => {
    return BROWSER.SAFARI_NO_NPAPI;
  };
}

export default Provider;
