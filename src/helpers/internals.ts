// TODO: Use window.AW4 namespace
export let applicationId = '';
export function setApplicationId (id: string): void {
  applicationId = id;
}

export let connectVersion = '';
export function setConnectVersion (version: string): void {
  connectVersion = version;
}

export let minVersion = '';
export function setMinVersion (version: string): void {
  minVersion = version;
}

export let sessionId = '';
export function setSessionId (id: string): void {
  sessionId = id;
}

export let sessionKey = '';
export function setSessionKey (key: string): void {
  sessionKey = key;
}

export let sdkLocation = '';
export function setSdkLocation (uri: string): void {
  sdkLocation = uri;
}

// ConnectInstaller specific
export let connectRefs: any = {};
export function setConnectRefs (refs: any): void {
  connectRefs = refs;
}
