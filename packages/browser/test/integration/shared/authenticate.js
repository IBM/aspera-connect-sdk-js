var testAuthenticate = function() {
  var authSpec = {
    "remote_host":"demo.asperasoft.com",
    "ssh_port":22,
    "remote_user":"asperaweb",
    "remote_password":"demoaspera",
    "token":""
  };
  
  context('when given valid authSpec', function() {
    it('should POST /connect/info/authenticate', function() {
      this.asperaWeb.authenticate(authSpec, callback);
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/info/authenticate');
      } else {
        expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/info/authenticate');
      }
    });
    
    it('should call success callback if request succeeds', function() {
      this.asperaWeb.authenticate(authSpec, callback);
      expect(callback.success.callCount).to.equal(1);
    });
    
    it('should call error callback if request fails', function() {
      extensionResponse(404, 'Internal Server Error');
      this.server.respondWith('POST', /authenticate/, [500, { "Content-Type": "application/json" }, '{}']);
      
      this.asperaWeb.authenticate(authSpec, callback);
      expect(callback.error.callCount).to.equal(1);
    });
  });

  context('when given invalid authSpec', function() {
    it('should return error with code -1', function() {
      err = this.asperaWeb.authenticate('', callback);
      expect(err.error.code).to.equal(-1);
    });
    
    it('should return error with \"Invalid request\"', function() {
      err = this.asperaWeb.authenticate('', callback);
      expect(err.error.internal_message).equal('Invalid request');
    });
    
    it('should return error with \"Invalid authSpec parameter\"', function() {
      err = this.asperaWeb.authenticate("", callback);
      expect(err.error.user_message).to.equal('Invalid authSpec parameter');
    });
  });
};

var testAuthenticateExtensions = function() {
  var authSpec = {
    "remote_host":"demo.asperasoft.com",
    "ssh_port":22,
    "remote_user":"asperaweb",
    "remote_password":"demoaspera",
    "token":""
  };
  
  context('when given valid authSpec', function() {
    it('should POST /connect/info/authenticate', function(done) {
      this.asperaWeb.authenticate(authSpec, callback);
      
      setTimeout(() => {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/info/authenticate');
        done();
      }, 50);
    });
    
    it('should call success callback if request succeeds', function(done) {
      this.asperaWeb.authenticate(authSpec, callback);
      
      setTimeout(() => {
        expect(callback.success.callCount).to.equal(1);
        done();
      }, 50);
    });
    
    it('should call error callback if request fails', function(done) {
      extensionResponse(404, 'Internal Server Error');
      this.server.respondWith('POST', /authenticate/, [500, { "Content-Type": "application/json" }, '{}']);
      
      this.asperaWeb.authenticate(authSpec, callback);
      
      setTimeout(() => {
        expect(callback.error.callCount).to.equal(1);
        done();
      }, 50);
    });
  });

  context('when given invalid authSpec', function() {
    it('should return error with code -1', function() {
      err = this.asperaWeb.authenticate('', callback);
      expect(err.error.code).to.equal(-1);
    });
    
    it('should return error with \"Invalid request\"', function() {
      err = this.asperaWeb.authenticate('', callback);
      expect(err.error.internal_message).equal('Invalid request');
    });
    
    it('should return error with \"Invalid authSpec parameter\"', function() {
      err = this.asperaWeb.authenticate("", callback);
      expect(err.error.user_message).to.equal('Invalid authSpec parameter');
    });
  });
};