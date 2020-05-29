var testRemoveTransfer = function() {
  beforeEach(function() {
    this.server.respondWith('POST', /v6\/connect\/transfers\/remove\/123456/, [200, { "Content-Type": "application/json" }, '{}']);
  });

  it('should call /connect/transfers/remove/:id', function() {
    this.asperaWeb.removeTransfer('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/remove/123456');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/transfers/remove/123456');
    }
  });

  it('should use method POST', function() {
    this.asperaWeb.removeTransfer('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });

  it('should call success callback if request succeeds', function() {
    this.asperaWeb.removeTransfer("123456", callback);
    expect(callback.success.callCount).to.equal(1);
  });

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/transfers\/remove\/123456/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.removeTransfer("123456", callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testRemoveTransferExtensions = function() {
  beforeEach(function() {
    this.server.respondWith('POST', /v6\/connect\/transfers\/remove\/123456/, [200, { "Content-Type": "application/json" }, '{}']);
  });

  it('should call /connect/transfers/remove/:id', function(done) {
    this.asperaWeb.removeTransfer('123456', callback);

    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/remove/123456');
      done();
    }, 50);
  });

  it('should use method POST', function(done) {
    this.asperaWeb.removeTransfer('123456', callback);

    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('POST');
      done();
    }, 50);
  });

  it('should call success callback if request succeeds', function(done) {
    this.asperaWeb.removeTransfer("123456", callback);

    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/transfers\/remove\/123456/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.removeTransfer("123456", callback);

    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};
