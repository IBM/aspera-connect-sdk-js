export const apiEndpoints: any = {
  activity: {
    route: 'activity',
    prefix: '/connect/transfers/'
  },
  authenticate: {
    route: 'authenticate',
    prefix: '/connect/info/'
  },
  droppedFiles: {
    route: 'dropped-files',
    prefix: '/connect/file/'
  },
  getTransfer: {
    route: 'info/${id}',
    prefix: '/connect/transfers/'
  },
  initDragDrop: {
    route: 'initialize-drag-drop',
    prefix: '/connect/file/'
  },
  modifyTransfer: {
    route: 'modify/${id}',
    prefix: '/connect/transfers/'
  },
  ping: {
    route: 'ping',
    prefix: '/connect/info/'
  },
  readAsArrayBuffer: {
    route: 'read-as-array-buffer/',
    prefix: '/connect/file/'
  },
  readChunkAsArrayBuffer: {
    route: 'read-chunk-as-array-buffer/',
    prefix: '/connect/file/'
  },
  getChecksum: {
    route: 'checksum/',
    prefix: '/connect/file/'
  },
  removeTransfer: {
    route: 'remove/${id}',
    prefix: '/connect/transfers/'
  },
  resumeTransfer: {
    route: 'resume/${id}',
    prefix: '/connect/transfers/'
  },
  showAbout: {
    route: 'about',
    prefix: '/connect/windows/'
  },
  showDirectory: {
    route: 'finder/${id}',
    prefix: '/connect/windows/'
  },
  showPreferences: {
    route: 'preferences',
    prefix: '/connect/windows/'
  },
  showPreferencesPage: {
    route: 'preferences/${id}',
    prefix: '/connect/windows/'
  },
  showSaveFileDialog: {
    route: 'select-save-file-dialog/',
    prefix: '/connect/windows/'
  },
  showSelectFileDialog: {
    route: 'select-open-file-dialog/',
    prefix: '/connect/windows/'
  },
  showSelectFolderDialog: {
    route: 'select-open-folder-dialog/',
    prefix: '/connect/windows/'
  },
  showTransferManager: {
    route: 'transfer-manager',
    prefix: '/connect/windows/'
  },
  showTransferMonitor: {
    route: 'transfer-monitor/${id}',
    prefix: '/connect/windows/'
  },
  startTransfer: {
    route: 'start',
    prefix: '/connect/transfers/'
  },
  stopTransfer: {
    route: 'stop/${id}',
    prefix: '/connect/transfers/'
  },
  version: {
    route: 'version',
    prefix: '/connect/info/'
  }
};
