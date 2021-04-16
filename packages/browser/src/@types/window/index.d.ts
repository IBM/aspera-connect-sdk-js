declare interface Window {
  attachEvent(evt: string, handleMessage: (evt: any) => any): any;

  AsperaMobile?: {
    getAllTransfers: (iterationToken: number) => Promise<any>;
    getTransfer: (transferId: string) => Promise<any>;
    resumeTransfer: (transferId: string, options: any) => Promise<any>;
    showSelectFileDialog: () => Promise<any>;
    startTransfer: (transferSpec: any) => Promise<any>;
    stopTransfer: (transferId: string) => Promise<any>;
    testSshPorts: (options: unknown) => Promise<any>;
    version: () => any;
  };
}
