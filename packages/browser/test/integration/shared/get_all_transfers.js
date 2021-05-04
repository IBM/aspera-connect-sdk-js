var testGetAllTransfers = function() {
  it('should call /connect/transfers/activity', function() {
    this.asperaWeb.getAllTransfers(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/activity');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/transfers/activity');
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

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, 'Internal Server Error');
    this.server.respondWith('POST', /v5\/connect\/transfers\/activity/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.getAllTransfers(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  context('with no iterationToken', function() {
    it('should use iterationToken=0', function() {
      this.asperaWeb.getAllTransfers(callback);
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"iteration_token":0/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"iteration_token":0/);
      }
    });
  });

  context('with iterationToken = 680', function() {
    it('should use iterationToken=680', function() {
      this.asperaWeb.getAllTransfers(callback, 680);
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"iteration_token":680/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"iteration_token":680/);
      }
    });
  });
};
