var testModifyTransfer = function() {
  it('should call /connect/transfers/modify/:id', function(done) {
    this.asperaWeb.modifyTransfer('123456', {}, callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/modify/123456');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/transfers/modify/123456');
      }
      done();
    }, 50);
  });

  it('should use method POST', function(done) {
    this.asperaWeb.modifyTransfer('123456', {}, callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('POST');
      } else {
        expect(this.server.lastRequest.method).to.equal('POST');
      }
      done();
    }, 50);
  });

  it('should call success callback if request succeeds', function(done) {
    this.asperaWeb.modifyTransfer('123456', {}, callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/transfers\/modify\/123456/, [500, { 'Content-Type': 'application/json' }, '{}']);

    this.asperaWeb.modifyTransfer('123456', {}, callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include options', function() {
    var options = {'target_rate_kbps':'5000','min_rate_kpbs':'5000','lock_min_rate':true,'rate_policy':'high','target_rate_cap_kbps':'6000','lock_target_rate':true};
    this.asperaWeb.modifyTransfer('123456', options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(new RegExp(options));
    } else {
      expect(this.server.lastRequest.requestBody).to.match(new RegExp(options));
    }
  });
};
