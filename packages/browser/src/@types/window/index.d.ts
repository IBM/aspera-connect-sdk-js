declare interface Window {
  attachEvent(evt: string, handleMessage: (evt: any) => any): any;
}