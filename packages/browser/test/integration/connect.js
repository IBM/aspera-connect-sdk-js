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
    xcontext('using http', function() {
      beforeEach(function() {
        this.asperaWeb = new AW4.Connect({connectMethod: 'http'});
        this.asperaWeb.initSession();
      });

      describe('#initSession', function() {
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

      describe('#getAllTransfers', function() {
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

      describe('#readAsArrayBuffer', function() {
        testReadAsArrayBuffer();
      });

      describe('#readChunkAsArrayBuffer', function() {
        testReadChunkAsArrayBuffer();
      });

      describe('#startTransfer', function() {
        testStartTransfer();
      });

      describe('#modifyTransfer', function() {
        testModifyTransfer();
      });

      describe('#resumeTransfer', function() {
        testResumeTransfer();
      });

      describe('#addEventListener', function() {
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

      describe('#showSaveFileDialog', function() {
        testShowSaveFileDialog();
      });

      describe('#showSelectFileDialog', function() {
        testShowSelectFileDialog();
      });

      describe('#showSelectFolderDialog', function() {
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
