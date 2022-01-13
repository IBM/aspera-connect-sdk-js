import { ConnectInstallerType, ConnectType} from './types';

export interface AW4Type {
  Connect: ConnectType;
  ConnectInstaller: ConnectInstallerType;
  Logger: {
    setLevel: (level: number) => void;
  };
  Utils: {
    BROWSER: {
      CHROME: boolean;
      EDGE_CHROMIUM: boolean;
      EDGE_LEGACY: boolean;
      EDGE_WITH_EXTENSION: boolean;
      FIREFOX: boolean;
      FIREFOX_LEGACY: boolean;
      IE: boolean;
      OPERA: boolean;
      SAFARI: boolean;
      SAFARI_NO_NPAPI: boolean;
    };
    atou: (input: string) => string;
    getFullURI: (path: string) => string | void;
    launchConnect: () => unknown;
    utoa: (input: string) => string;
  };
}

export interface ConnectRoot {
  AW4?: AW4Type;
}

export function getGlobalObject<T> (): T & ConnectRoot {
  return (typeof window === 'object' ? window : {}) as T & ConnectRoot;
}
