/*
  Get/Set global variables and share between modules instead of assigning
  variables to the AW4 namespace
*/

export let applicationId = '';
export function setApplicationId (id: string) {
  applicationId = id;
}

export let connectVersion = '';
export function setConnectVersion (version: string) {
  connectVersion = version;
}

export let minVersion = '';
export function setMinVersion (version: string) {
  minVersion = version;
}

export let sessionId = '';
export function setSessionId (id: string) {
  sessionId = id;
}

export let sessionKey = '';
export function setSessionKey (key: string) {
  sessionKey = key;
}

export let sdkLocation = '';
export function setSdkLocation (uri: string) {
  sdkLocation = uri;
}

// ConnectInstaller specific
export let connectRefs: any = {};
export function setConnectRefs (refs: any) {
  connectRefs = refs;
}
