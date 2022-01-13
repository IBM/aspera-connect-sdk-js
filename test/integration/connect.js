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

        testInitSession();
      });

      describe('#version', function() {
        testVersion('/connect/info/version');
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
    context('using http', function() {
      beforeEach(function(done) {
        this.clock.restore();
        this.asperaWeb = new AW4.Connect({connectMethod: 'http'});
        this.asperaWeb.initSession();

        setTimeout(() => {
          done();
        }, 100);
      });

      describe('#version', function() {
        testVersion('http://127.0.0.1:33003/v5/connect/info/version');
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
