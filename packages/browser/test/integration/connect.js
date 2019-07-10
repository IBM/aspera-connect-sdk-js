describe('AW4', function() {
  describe('.Connect', function() {
    context('using extensions', function() {
      beforeEach(function(done) {
        this.clock.restore();
        this.useExtensions = true;
        this.asperaWeb = new AW4.Connect({connectMethod: 'extension'});
        this.asperaWeb.initSession();

        setTimeout(() => {
          done();
        }, 100);
      });
      // Extension tests use their own tests because each SDK call is asynchronous
      describe('#initSession', function() {
        beforeEach(function() {
          // Reset Connect session
          this.clock.restore();
        });

        testInitSessionExtensions();
      });

      describe('#version', function() {
        testVersionExtensions('/connect/info/version');
      });

      describe('#authenticate', function() {
        testAuthenticateExtensions();
      });

      describe('#getAllTransfers', function() {
        testGetAllTransfersExtensions();
      });

      describe('#removeTransfer', function() {
        testRemoveTransferExtensions();
      });

      describe('#stopTransfer', function() {
        testStopTransferExtensions();
      });

      describe('#stop', function() {
        testStopExtensions();
      });

      describe('#start', function() {
        testStartExtensions();
      });

      describe('#readAsArrayBuffer', function() {
        testReadAsArrayBufferExtensions();
      });

      describe('#readChunkAsArrayBuffer', function() {
        testReadChunkAsArrayBufferExtensions();
      });

      describe('#startTransfer', function() {
        testStartTransferExtensions();
      });

      describe('#modifyTransfer', function() {
        testModifyTransferExtensions();
      });

      describe('#resumeTransfer', function() {
        testResumeTransferExtensions();
      });

      xdescribe('#addEventListener', function() {
        testAddEventListener();
      });

      describe('#addRemoveListener', function() {
        testRemoveEventListener();
      });

      describe('#showAbout', function() {
        testShowAboutExtensions();
      });

      describe('#showDirectory', function() {
        testShowDirectoryExtensions();
      });

      describe('#showPreferences', function() {
        testShowPreferencesExtensions();
      });

      describe('#showSaveFileDialog', function() {
        testShowSaveFileDialogExtensions();
      });

      describe('#showSelectFileDialog', function() {
        testShowSelectFileDialogExtensions();
      });

      describe('#showSelectFolderDialog', function() {
        testShowSelectFolderDialogExtensions();
      });

      describe('#showTransferManager', function() {
        testShowTransferManagerExtensions();
      });

      describe('#showTransferMonitor', function() {
        testShowTransferMonitorExtensions();
      });
    });

    // TODO: Fix decrypting requests
    context('using http', function() {
      beforeEach(function() {
        this.asperaWeb = new AW4.Connect({connectMethod: 'http'});
        this.asperaWeb.initSession();
      });

      xdescribe('#initSession', function() {
        beforeEach(function() {
          this.clock.restore();
          // Reset Connect session
          this.asperaWeb = new AW4.Connect({connectMethod: 'http'});
        });

        testInitSession();
      });

      describe('#version', function() {
        beforeEach(function() {
          this.clock.restore();
        });
        testVersion('https://local.connectme.us:43003/v5/connect/info/version');
      });

      describe('#authenticate', function() {
        testAuthenticate();
      });

      xdescribe('#getAllTransfers', function() {
        testGetAllTransfers();
      });

      describe('#removeTransfer', function() {
        testRemoveTransfer();
      });

      describe('#stopTransfer', function() {
        testStopTransfer();
      });

      describe('#stop', function() {
        testStop();
      });

      describe('#start', function() {
        testStart();
      });

      xdescribe('#readAsArrayBuffer', function() {
        testReadAsArrayBuffer();
      });

      xdescribe('#readChunkAsArrayBuffer', function() {
        testReadChunkAsArrayBuffer();
      });

      xdescribe('#startTransfer', function() {
        testStartTransfer();
      });

      xdescribe('#modifyTransfer', function() {
        testModifyTransfer();
      });

      xdescribe('#resumeTransfer', function() {
        testResumeTransfer();
      });

      xdescribe('#addEventListener', function() {
        testAddEventListener();
      });

      describe('#addRemoveListener', function() {
        testRemoveEventListener();
      });

      describe('#showAbout', function() {
        testShowAbout();
      });

      describe('#showDirectory', function() {
        testShowDirectory();
      });

      describe('#showPreferences', function() {
        testShowPreferences();
      });

      xdescribe('#showSaveFileDialog', function() {
        testShowSaveFileDialog();
      });

      xdescribe('#showSelectFileDialog', function() {
        testShowSelectFileDialog();
      });

      xdescribe('#showSelectFolderDialog', function() {
        testShowSelectFolderDialog();
      });

      describe('#showTransferManager', function() {
        testShowTransferManager();
      });

      describe('#showTransferMonitor', function() {
        testShowTransferMonitor();
      });
    });
  });
});
