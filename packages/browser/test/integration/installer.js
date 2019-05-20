var getIFrame = function(id) {
  if (!id) {
    return document.getElementById('aspera-iframe-container');
  } else {
    return document.getElementById(id);
  }
};

var getLocation = function() {
  //IMPORTANT: The karma web server serves files under //localhost:<port>/base
  if (window.location.protocol === "file:"){
    return 'src'
  } else {
      return '//localhost:8080/src'
  }
};

describe('AW4.ConnectInstaller', function() {
  beforeEach(function() {
    localStorage.clear();
  });
    
  describe('#doesBrowserNeedExtensionStore', function() {
    beforeEach(function() {
      this.installer = new AW4.ConnectInstaller();
      this.browser_ctx = copyData(AW4.Utils.BROWSER);
    });
      
    afterEach(function() {
      AW4.Utils.BROWSER = copyData(this.browser_ctx);
    });
       
    context('using Chrome', function() {
      it('should return true (TestRail: Cxxxxxx)', function() {
        AW4.Utils.BROWSER.CHROME = true;
        var res = this.installer.doesBrowserNeedExtensionStore();
        expect(res).to.equal(true);
      });
    });
      
    context('using Firefox', function() {
      it('should return true (TestRail: Cxxxxxx)', function() {
        AW4.Utils.BROWSER.FIREFOX = true;
        var res = this.installer.doesBrowserNeedExtensionStore();

        expect(res).to.equal(true);
      });
    });
      
    context('using Edge', function() {
      it('should return true (TestRail: Cxxxxxx)', function() {
        AW4.Utils.BROWSER.EDGE = true;
        var res = this.installer.doesBrowserNeedExtensionStore();

        expect(res).to.equal(true);
      });
    });
      
      context('using IE', function() {
        it('should return false (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.IE = true;
          AW4.Utils.BROWSER.CHROME = false;
          AW4.Utils.BROWSER.FIREFOX = false;
          AW4.Utils.BROWSER.SAFARI = false;
          var res = this.installer.doesBrowserNeedExtensionStore();

          expect(res).to.equal(false);
        });
      });
      
      context('using Safari', function() {
        it('should return false (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.SAFARI = true;
          AW4.Utils.BROWSER.CHROME = false;
          AW4.Utils.BROWSER.FIREFOX = false;
          AW4.Utils.BROWSER.SAFARI = false;
          var res = this.installer.doesBrowserNeedExtensionStore();

          expect(res).to.equal(false);
        });
      });
    });
    
    describe('#getExtensionStoreLink', function() {
      beforeEach(function() {
        this.installer = new AW4.ConnectInstaller();
        this.browser_ctx = copyData(AW4.Utils.BROWSER);
      });
      
      afterEach(function() {
        AW4.Utils.BROWSER = copyData(this.browser_ctx);
      });
      
      context('using Chrome', function() {
        it('should return webstore link (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.CHROME = true;
          var res = this.installer.getExtensionStoreLink();

          expect(res).to.equal('https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn');
        });
      });
      
      context('using Firefox', function() {
        it('should return addon link (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.FIREFOX = true;
          var res = this.installer.getExtensionStoreLink();

          expect(res).to.equal('https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect');
        });
      });
      
      // TODO: Once Edge extension is posted
      xcontext('using Edge', function() {
        it('should return link (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.EDGE = true;
          var res = this.installer.getExtensionStoreLink();

          expect(res).to.equal('');
        });
      });
      
      context('using IE', function() {
        it('should return empty string (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.IE = true;
          AW4.Utils.BROWSER.CHROME = false;
          AW4.Utils.BROWSER.FIREFOX = false;
          AW4.Utils.BROWSER.SAFARI = false;
          var res = this.installer.getExtensionStoreLink();

          expect(res).to.equal('');
        });
      });
      
      context('using Safari', function() {
        it('should return empty string (TestRail: Cxxxxxx)', function() {
          AW4.Utils.BROWSER.SAFARI = true;
          AW4.Utils.BROWSER.CHROME = false;
          AW4.Utils.BROWSER.FIREFOX = false;
          var res = this.installer.getExtensionStoreLink();

          expect(res).to.equal('');
        });
      });
    });
    
    describe('#showInstall', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function() {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showInstall();
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "Welcome!" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Welcome!/);
              done();
            }, 100);
          });
          
          it('should show banner with "Please run the Connect installer." (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Please run the Connect installer./);
              done();
            }, 100);
          });
          
          it('should show banner with "Install extension", "Download Connect", and "Install Connect" steps (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Install extension/);
              expect(content).to.match(/Download Connect/);
              expect(content).to.match(/Install Connect/);
              done();
            }, 100);
          });
          
          it('should show banner with "Refresh" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Refresh/);
              done();
            }, 100);
          });
          
          it('should show banner with "Download failed? Download Connect" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Download failed\? Download Connect/);
              done();
            }, 100);
          });
          
          it('should show banner with "Downloading Connect installer" icon (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Downloading Connect installer/);
              done();
            }, 100);
          });
        });
      });
    });
    
    describe('#showExtensionInstall', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function() {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showExtensionInstall();
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "Welcome!" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Welcome!/);
              done();
            }, 100);
          });
          
          it('should show banner with "Uploads and downloads require IBM Aspera Connect." (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Uploads and downloads require IBM Aspera Connect./);
              done();
            }, 100);
          });
          
          it('should show banner with "Install extension", "Download Connect", and "Install Connect" steps (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Install extension/);
              expect(content).to.match(/Download Connect/);
              expect(content).to.match(/Install Connect/);
              done();
            }, 100);
          });
          
          it('should show banner with "Install extension" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Install extension\n/);
              done();
            }, 100);
          });
          
          it('should show banner with "Already installed? Troubleshoot" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Already installed\? Troubleshoot/);
              done();
            }, 100);
          });
        });
      });
    });
    
    describe('#showDownload', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          context('with Connect not previously detected', function() {
            beforeEach(function() {
              this.clock.restore();
              localStorage.clear();
              this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
              this.installer.showDownload();
            });
                  
            afterEach(function() {
              this.installer.dismiss();
            });
            
            // IMPORTANT: Remove iframe after each block to clean up.
            after(function() {
              document.body.removeChild(getIFrame());
            });
                  
            it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
              setTimeout(() => {
                var iframe = getIFrame();
                expect(iframe.src).to.match(/carbon-installer\/index.html/);
                done();
              }, 100);
            });
            
            it('should show banner with "Welcome!" (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Welcome!/);
                done();
              }, 100);
            });
            
            it('should show banner with "Uploads and downloads require IBM Aspera Connect." (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Uploads and downloads require IBM Aspera Connect./);
                done();
              }, 100);
            });
            
            it('should show banner with "Install extension", "Download Connect", and "Install Connect" steps (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Install extension/);
                expect(content).to.match(/Download Connect/);
                expect(content).to.match(/Install Connect/);
                done();
              }, 100);
            });
            
            it('should show banner with "Install extension" button (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Download Connect\n/);
                done();
              }, 100);
            });
            
            it('should show banner with "Already installed? Troubleshoot" button (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Already installed\? Troubleshoot/);
                done();
              }, 100);
            });
          });
          
          context('with Connect previously detected', function() {
            beforeEach(function() {
              this.clock.restore();
              localStorage.clear();
              localStorage.setItem('aspera-last-detected', true);
              this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
              this.installer.showDownload();
            });
                  
            afterEach(function() {
              this.installer.dismiss();
            });
            
            // IMPORTANT: Remove iframe after each block to clean up.
            after(function() {
              document.body.removeChild(getIFrame());
            });
                  
            it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
              setTimeout(() => {
                var iframe = getIFrame();
                expect(iframe.src).to.match(/carbon-installer\/index.html/);
                done();
              }, 100);
            });
            
            it('should show banner with "Cannot reach Connect" (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Cannot reach Connect/);
                done();
              }, 100);
            });
            
            it('should show banner with "Retry" button (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Retry/);
                done();
              }, 100);
            });
            
            it('should show banner with "Troubleshoot" (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Troubleshoot/);
                done();
              }, 100);
            });
            
            it('should show banner with "Download Connect" (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Download Connect/);
                done();
              }, 100);
            });
          });
          
          context('with Connect recently downloaded', function() {
            beforeEach(function() {
              this.clock.restore();
              localStorage.clear();
              localStorage.setItem('aspera-download-time', Date.now());
              this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
              this.installer.showDownload();
            });
                  
            afterEach(function() {
              this.installer.dismiss();
            });
            
            // IMPORTANT: Remove iframe after each block to clean up.
            after(function() {
              document.body.removeChild(getIFrame());
            });
                  
            it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
              setTimeout(() => {
                var iframe = getIFrame();
                expect(iframe.src).to.match(/carbon-installer\/index.html/);
                done();
              }, 100);
            });
            
            it('should show banner with "Welcome!" (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Welcome!/);
                done();
              }, 100);
            });
            
            it('should show banner with "Please run the Connect installer." (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Please run the Connect installer./);
                done();
              }, 100);
            });
            
            it('should show banner with "Install extension", "Download Connect", and "Install Connect" steps (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Install extension/);
                expect(content).to.match(/Download Connect/);
                expect(content).to.match(/Install Connect/);
                done();
              }, 100);
            });
            
            it('should show banner with "Refresh" button (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Refresh/);
                done();
              }, 100);
            });
            
            it('should show banner with "Download failed? Download Connect" button (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Download failed\? Download Connect/);
                done();
              }, 100);
            });
            
            it('should show banner with "Downloading Connect installer" icon (TestRail: Cxxxxxx)', function (done) {
              setTimeout(() => {
                var iframe = getIFrame();
                content = iframe.contentDocument.documentElement.innerText;
                expect(content).to.match(/Downloading Connect installer/);
                done();
              }, 100);
            });
          });
        });
      });
    });
    
    describe('#showLaunching', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function() {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showLaunching(100);
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "Launching IBM Aspera Connect" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Launching IBM Aspera Connect.../);
              done();
            }, 100);
          });
        });
      });
    });
    
    describe('#showRetry', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function() {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showRetry();
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "Cannot reach Connect" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Cannot reach Connect/);
              done();
            }, 100);
          });
          
          it('should show banner with "Retry" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Retry/);
              done();
            }, 100);
          });
          
          it('should show banner with "Troubleshoot" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Troubleshoot/);
              done();
            }, 100);
          });
          
          it('should show banner with "Download Connect" (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Download Connect/);
              done();
            }, 100);
          });
        });
      });
    });
    
    describe('#showUpdate', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function() {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showUpdate();
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "This site requires a newer version of IBM Aspera Connect." (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/This site requires a newer version of IBM Aspera Connect./);
              done();
            }, 100);
          });
          
          it('should show banner with "Download latest version" button (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/Download latest version/);
              done();
            }, 100);
          });
        });
      });
    });
    
    describe('#connected', function() {
      context('with style = carbon', function() {
        context('using Chrome', function() {
          beforeEach(function(done) {
            this.clock.restore();
            localStorage.clear();
            this.installer = new AW4.ConnectInstaller({ sdkLocation: getLocation(), style: 'carbon' });
            this.installer.showLaunching(100);
            
            setTimeout(() => {
              this.installer.connected(100);
              done();
            }, 100);
          });
                
          afterEach(function() {
            this.installer.dismiss();
          });
          
          // IMPORTANT: Remove iframe after each block to clean up.
          after(function() {
            document.body.removeChild(getIFrame());
          });
                 
          it('should create iframe with src pointing to carbon-installer index.html (TestRail: Cxxxxxx)', function(done) {
            setTimeout(() => {
              var iframe = getIFrame();
              expect(iframe.src).to.match(/carbon-installer\/index.html/);
              done();
            }, 100);
          });
          
          it('should show banner with "This site requires a newer version of IBM Aspera Connect." (TestRail: Cxxxxxx)', function (done) {
            setTimeout(() => {
              var iframe = getIFrame();
              content = iframe.contentDocument.documentElement.innerText;
              expect(content).to.match(/IBM Aspera Connect is running!/);
              done();
            }, 100);
          });
        });
      });
    });
});
