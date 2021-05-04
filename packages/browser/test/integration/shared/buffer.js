var testReadAsArrayBuffer = function() {
  var options = { 'path':'/fake/path/yay.txt' };

  it('should call /connect/file/read-as-array-buffer', function() {
    this.asperaWeb.readAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/file/read-as-array-buffer/');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/file/read-as-array-buffer/');
    }
  });

  it('should use method POST', function() {
    this.asperaWeb.readAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });

  it('should call success callback if request succeeds', function() {
    this.asperaWeb.readAsArrayBuffer(options, callback);
    expect(callback.success.callCount).to.equal(1);
  });

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/file\/read-as-array-buffer/, [500, { "Content-Type": "application/json" }, '{}']);
    this.asperaWeb.readAsArrayBuffer(options, callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include path', function() {
    this.asperaWeb.readAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"path":"\/fake\/path\/yay.txt"/);
    } else {
      expect(this.server.lastRequest.requestBody).to.match(/"path":"\/fake\/path\/yay.txt"/);
    }
  });

  it('should return error if invalid options', function() {
    expect(() => {
      this.asperaWeb.readAsArrayBuffer(null, callback);
    }).to.throw('Invalid #readAsArrayBuffer options parameter: path is missing or invalid');
  });
};

var testReadChunkAsArrayBuffer = function() {
  var options = { 'path' : '/fake/path/yay.txt', 'offset' : 40, 'chunkSize' : 80 };

  it('should call /connect/file/read-chunk-as-array-buffer', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/file/read-chunk-as-array-buffer/');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/file/read-chunk-as-array-buffer/');
    }
  });

  it('should use method POST', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });

  it('should call success callback if request succeeds', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    expect(callback.success.callCount).to.equal(1);
  });

  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/file\/read-chunk-as-array-buffer/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include path', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"path":"\/fake\/path\/yay.txt"/);
    } else {
      expect(this.server.lastRequest.requestBody).to.match(/"path":"\/fake\/path\/yay.txt"/);
    }
  });

  it('should include offset', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"offset":40/);
    } else {
      expect(this.server.lastRequest.requestBody).to.match(/"offset":40/);
    }
  });

  it('should include chunkSize', function() {
    this.asperaWeb.readChunkAsArrayBuffer(options, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"chunkSize":80/);
    } else {
      expect(this.server.lastRequest.requestBody).to.match(/"chunkSize":80/);
    }
  });

  it('should return error if invalid options', function() {
    expect(() => {
      this.asperaWeb.readChunkAsArrayBuffer( { 'path' : '/fake/path.txt' }, callback);
    }).to.throw('Invalid #readChunkAsArrayBuffer options parameter: offset is missing or invalid');
  });
};
