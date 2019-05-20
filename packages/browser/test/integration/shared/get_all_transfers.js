var testGetAllTransfers = function() {
  it('should call /connect/transfers/activity', function() {
    this.asperaWeb.getAllTransfers(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/activity');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/transfers/activity');
    }
  });
  
  it('should use method POST', function() {
    this.asperaWeb.getAllTransfers(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });
  
  it('should call success callback if request succeeds', function() {
    this.asperaWeb.getAllTransfers(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback if request fails', function() {
    extensionResponse(500, 'Internal Server Error');
    this.server.respondWith('POST', /v6\/connect\/transfers\/activity/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.getAllTransfers(callback);
    expect(callback.error.callCount).to.equal(1);
  });
  
  context('with no iterationToken', function() {
    it('should use iterationToken=0', function() {
      this.asperaWeb.getAllTransfers(callback);
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"iteration_token":0/);
      } else {
        expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"iteration_token":0/);
      }
    });
  });
  
  context('with iterationToken = 680', function() {
    it('should use iterationToken=680', function() {
      this.asperaWeb.getAllTransfers(callback, 680);
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"iteration_token":680/);
      } else {
        expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"iteration_token":680/);
      }
    });
  });
};

var testGetAllTransfersExtensions = function() {
  it('should call /connect/transfers/activity', function(done) {
    this.asperaWeb.getAllTransfers(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/activity');
      done();
    }, 50);
  });
  
  it('should use method POST', function(done) {
    this.asperaWeb.getAllTransfers(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('POST');
      done();
    }, 50);
  });
  
  it('should call success callback if request succeeds', function(done) {
    this.asperaWeb.getAllTransfers(callback);
    
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  it('should call error callback if request fails', function(done) {
    extensionResponse(500, 'Internal Server Error');
    this.server.respondWith('POST', /v6\/connect\/transfers\/activity/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.getAllTransfers(callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  context('with no iterationToken', function() {
    it('should use iterationToken=0', function(done) {
      this.asperaWeb.getAllTransfers(callback);
      
      setTimeout(() => {
        expect(extensionRequests.last().body).to.match(/"iteration_token":0/);
        done();
      }, 50);
    });
  });
  
  context('with iterationToken = 680', function() {
    it('should use iterationToken=680', function(done) {
      this.asperaWeb.getAllTransfers(callback, 680);
      
      setTimeout(() => {
        expect(extensionRequests.last().body).to.match(/"iteration_token":680/);
        done();
      }, 50);
    });
  });
};
