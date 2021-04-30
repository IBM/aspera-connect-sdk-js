var testInitSessionExtensions = function() {
  context('when not given app_id', function() {
    it('should return new app_id', function(done) {
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'http' } );
      }
      app_id = this.asperaWeb.initSession();

      setTimeout(() => {
        expect(app_id).to.have.property('app_id').and.to.match(/(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/);
        done();
      }, 100);
    });
  });

  context('when given app_id', function() {
    it('should return app_id', function(done) {
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'http' } );
      }
      app_id = this.asperaWeb.initSession("dwosk");

      setTimeout(() => {
        expect(app_id).to.have.property('app_id').and.to.equal("dwosk");
        done();
      }, 100);
    });
  });

  context('when called twice in same session', function() {
    beforeEach(function(done) {
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'http' } );
      }
      this.asperaWeb.initSession();

      setTimeout(() => {
        done();
      }, 100);
    });

    it('should return error with code -1', function(done) {
      this.err = this.asperaWeb.initSession();

      setTimeout(() => {
        expect(this.err.error.code).to.equal(-1);
        done();
      }, 100);
    });

    it('should return error with \"Invalid request\"', function(done) {
      this.err = this.asperaWeb.initSession();

      setTimeout(() => {
        expect(this.err.error.internal_message).equal("Invalid request");
        done();
      }, 100);
    });

    it('should return error with \"Session was already initialized.\"', function(done) {
      this.err = this.asperaWeb.initSession();

      setTimeout(() => {
        expect(this.err.error.user_message).to.equal("Session was already initialized.");
        done();
      }, 100);
    });
  });

  context('when Connect initialized with no minVersion', function() {
    beforeEach(function() {
      // Reset Connect session
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { connectMethod: 'http' } );
      }
    });

    context('when user does not have Connect installed', function() {
      beforeEach(function() {
        this.clock = sinon.useFakeTimers();
      });

      it('should set Connect status to FAILED', function(done) {
        // Simulate extension not installed
        document.removeEventListener('AsperaConnectCheck', returnVersion);
        this.server.respondWith('GET', /ready/, [404, { "Content-Type": "application/json" }, '{}']);

        this.asperaWeb.initSession();
        this.clock.tick(5000);
        // async + fake timers don't work well together
        this.clock.restore();
        // Detect extension timeout is hardcoded to 1s so set timeout here to 1s
        setTimeout(() => {
          if (this.useExtensions)
            expect(this.asperaWeb.getStatus()).to.equal('EXTENSION_INSTALL');
          else
            expect(this.asperaWeb.getStatus()).to.equal('FAILED');
          done();
        }, 100);
      });
    });
  });

  context('when Connect initialized with minVersion = 3.9.0', function() {
    beforeEach(function() {
      // Reset Connect session
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { minVersion: '3.9.0', connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { minVersion: '3.9.0', connectMethod: 'http' } );
      }
    });

    context('when user has Connect 3.8.0 installed', function() {
      it('should set Connect status to OUTDATED', function(done) {
        extensionResponse(200, '{ "version": "3.8.0.157934" }');
        this.server.respondWith('GET', /version/, [200, { "Content-Type": "application/json" }, '{ "version": "3.8.0.157934" }']);

        this.asperaWeb.initSession();

        setTimeout(() => {
          expect(this.asperaWeb.getStatus()).to.equal('OUTDATED');
          this.asperaWeb.stop();
          done();
        }, 100);
      });
    });

    context('when user has Connect 4.0.0 installed', function() {
      it('should set Connect status to RUNNING', function(done) {
        this.asperaWeb.initSession();

        setTimeout(() => {
          expect(this.asperaWeb.getStatus()).to.equal('RUNNING');
          done();
        }, 100);
      });
    });
  });

  context('when Connect initialized with minVersion = 4.1.0', function() {
    var optional;
    beforeEach(function() {
      // Reset Connect session
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { minVersion: '4.1.0', connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { minVersion: '4.1.0', connectMethod: 'http' } );
      }
    });

    context('when user has Connect 4.0.0 installed', function() {
      it('should set Connect status to OUTDATED', function(done) {
        this.asperaWeb.initSession();

        setTimeout(() => {
          expect(this.asperaWeb.getStatus()).to.equal('OUTDATED');
          this.asperaWeb.stop();
          done();
        }, 100);
      });

      it('should call /connect/update/require', function(done) {
        // http context: expect /v6 because using Connect 3.8+.
        // NOTE: extension hardcoded to use /v5 as encryption is not required. Only
        // have access to uri here anyways.
        this.asperaWeb.initSession();

        setTimeout(() => {
          if (this.useExtensions) {
            expect(extensionRequests.last().uri_reference).to.equal('/connect/update/require');
          } else {
            expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/update/require');
          }
          this.asperaWeb.stop();
          done();
        }, 100);

      });

      it('should call /connect/update/require with minVersion', function(done) {
        this.asperaWeb.initSession();

        setTimeout(() => {
          if (this.useExtensions) {
            expect(extensionRequests.last().body).to.match(/"min_version":"4.1.0"/);
          } else {
            expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"min_version":"4.1.0"/);
          }
          this.asperaWeb.stop();
          done();
        }, 100);
      });

      context('when Connect initialized with sdkLocation', function() {
        beforeEach(function() {
          if (this.useExtensions) {
            this.asperaWeb = new AW4.Connect({
              minVersion: '4.1.0',
              sdkLocation: 'example.com/connect/v4',
              connectMethod: 'extension'
            });
          } else {
            this.asperaWeb = new AW4.Connect({
              minVersion: '4.1.0',
              sdkLocation: 'example.com/connect/v4',
              connectMethod: 'http'
            });
          }
        });

        it('should call /connect/update/require with sdk_location', function(done) {
          this.asperaWeb.initSession();

          setTimeout(() => {
            if (this.useExtensions) {
              expect(extensionRequests.last().body).to.match(/sdk_location.*example.com\/connect\/v4/);
            } else {
              expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/sdk_location.*example.com\/connect\/v4/);
            }
            this.asperaWeb.stop();
            done();
          }, 100);
        });
      });
    });
  });

  context('when Connect initialized with connectLaunchWaitTimeoutMs = 2000', function() {
    var timeout = 2000;
    beforeEach(function() {
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { connectLaunchWaitTimeoutMs: timeout, connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { connectLaunchWaitTimeoutMs: timeout, connectMethod: 'http' } );
      }
    });

    // TODO: Fix async with fake timers
    context('after 2000ms', function() {
      it('should set Connect status to EXTENSION_INSTALL', function(done) {
        document.removeEventListener('AsperaConnectCheck', returnVersion);
        this.server.respondWith('GET', /ready/, [404, { "Content-Type": "application/json" }, '{}']);

        this.asperaWeb.initSession();
        // this.clock = sinon.useFakeTimers();
        // this.clock.tick(timeout);
        // this.clock.restore();
        setTimeout(() => {
          if (this.useExtensions)
            expect(this.asperaWeb.getStatus()).to.equal('EXTENSION_INSTALL');
          else
            expect(this.asperaWeb.getStatus()).to.equal('FAILED');
          done();
        }, 1000);
      });
    });

    context('before 2000ms', function() {
      it('should set Connect status to INITIALIZING (extensions) or RETRYING (http)', function(done) {
        document.removeEventListener('AsperaConnectCheck', returnVersion);
        this.server.respondWith('GET', /ready/, [404, { "Content-Type": "application/json" }, '{}']);

        this.asperaWeb.initSession();
        // this.clock.tick(1000);

        setTimeout(() => {
          var status = this.asperaWeb.getStatus();
          if (this.useExtensions) {
            expect(status).to.equal('INITIALIZING');
          } else {
            expect(status).to.equal('RETRYING');
          }
          done();
      }, 100);
      });
    });
  });
};
