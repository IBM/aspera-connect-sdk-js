/*
  Get/Set global variables and share between modules instead of assigning
  variables to the AW4 namespace
*/

let connectVersionInternal = "";

export let connectVersion = {
  set: (v: string) => {
    connectVersionInternal = v;
  },
  value: () => {
    return connectVersionInternal;
  }
};

let minRequestedVersionInternal = "";

export let minRequestedVersion = {
  set: (v: string) => {
    minRequestedVersionInternal = v;
  },
  value: () => {
    return minRequestedVersionInternal;
  }
};
 
interface IReqImplStatus {
  INITIALIZING: number;
  RETRYING: number;
  RUNNING: number;
  FAILED: number;
  STOPPED: number;
  WAITING: number;
  OUTDATED: number;
  DEGRADED: number;
  EXTENSION_INSTALL: number;
  toString(status: number): string;
}

const STATUS: IReqImplStatus =  {
    INITIALIZING : 0,
    RETRYING : 1,
    RUNNING : 2,
    FAILED : 3,
    STOPPED : 4,
    WAITING : 5,
    OUTDATED : 6,
    DEGRADED : 7,
    EXTENSION_INSTALL: 8,
    toString : function(status: number): string {
      if (status == STATUS.INITIALIZING)
          return "initializing";
      if (status == STATUS.RETRYING)
          return "retrying";
      if (status == STATUS.RUNNING)
          return "running";
      if (status == STATUS.FAILED)
          return "failed";
      if (status == STATUS.STOPPED)
          return "stopped";
      if (status == STATUS.WAITING)
          return "waiting";
      if (status == STATUS.OUTDATED)
          return "outdated";
      if (status == STATUS.DEGRADED)
          return "degraded";
      if (status == STATUS.EXTENSION_INSTALL)
          return "extension installation";
      return "unknown";
  }
};

export { STATUS, IReqImplStatus };

let sessionIdInternal = "";

export let SESSION_ID = {
  set: (id: string) => {
    sessionIdInternal = id;
  },
  value: () => {
    return sessionIdInternal;
  }
};

let sessionKeyInternal = "";

export let SESSION_KEY = {
  set: (key: string) => {
    sessionKeyInternal = key;
  },
  value: () => {
    return sessionKeyInternal;
  }
};

let connectVersionsInternal: any = {};

export let connectVersions = {
  set: (v: any) => {
    connectVersionsInternal = v;
  },
  value: () => {
    return connectVersionsInternal;
  }
};
