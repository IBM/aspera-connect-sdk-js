var testVersion = function(exp) {
  it('should call ' + exp, function(done) {
      this.asperaWeb.version(callback);
      setTimeout(() => {
        if (this.useExtensions) {
          uri = extensionRequests.last().uri_reference;
        } else {
          uri = this.server.lastRequest.url;
        }
        expect(uri).to.equal(exp);
        done();
      }, 50);
  });

  it('should use method GET', function(done) {
    this.asperaWeb.version(callback);

    setTimeout(() => {
      if (this.useExtensions) {
        method = extensionRequests.last().method;
      } else {
        method = this.server.lastRequest.method;
      }
      expect(method).to.equal('GET');
      done();
    }, 50);

  });

  it('should call success callback', function(done) {
    this.asperaWeb.version(callback);

    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);

  });

  it('should call error callback', function(done) {
    extensionResponse(404, 'Internal Server Error');
    this.server.respondWith('GET', /version/, [500, { "Content-Type": "application/json" }, 'Internal Server Error']);

    this.asperaWeb.version(callback);

    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};
