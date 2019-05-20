var testStartTransfer = function() {
  var transferSpec = {
    'paths': [
      {
        'source': '/foo/1'
      }
    ],
    'remote_host': '10.0.203.80',
    'remote_user': 'aspera',
    'direction': 'send'
  },
  connectSpec = {
    'allow_dialogs' : false,
    'back_link' : 'www.foo.com',
    'return_paths' : false,
    'use_absolute_destination_path' : true
  };
  
  it('should return error if transferSpec is invalid', function() {
    err = this.asperaWeb.startTransfer(null, callback);
    expect(err.error.user_message).to.equal('Invalid transferSpec parameter');
  });
  
  it('should call /connect/transfers/start', function() {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/start');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/transfers/start');
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
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback if request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v6\/connect\/transfers\/start/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    expect(callback.error.callCount).to.equal(1);
  });
  
  it('should return transfer request_id', function() {
    res = this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    expect(res).to.have.property('request_id').and.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  
  it('should include transferSpec', function() {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"transfer_specs":\[{"transfer_spec":{"paths":\[{"source":"\/foo\/1"}\],"remote_host":"10.0.203.80","remote_user":"aspera","direction":"send"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"transfer_specs":\[{"transfer_spec":{"paths":\[{"source":"\/foo\/1"}\],"remote_host":"10.0.203.80","remote_user":"aspera","direction":"send"/);
    }
  });
  
  it('should include connectSpec', function() {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"aspera_connect_settings":{"allow_dialogs":false,"back_link":"www.foo.com","return_paths":false,"use_absolute_destination_path":true,"app_id":".*","request_id":/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"aspera_connect_settings":{"allow_dialogs":false,"back_link":"www.foo.com","return_paths":false,"use_absolute_destination_path":true,"app_id":".*","request_id":/);
    }
  });
  
  it('should include requestId', function() {
    res = this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(new RegExp(res.request_id));
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(new RegExp(res.request_id));
    }
  });
};

var testStartTransferExtensions = function() {
  var transferSpec = {
    'paths': [
      {
        'source': '/foo/1'
      }
    ],
    'remote_host': '10.0.203.80',
    'remote_user': 'aspera',
    'direction': 'send'
  },
  connectSpec = {
    'allow_dialogs' : false,
    'back_link' : 'www.foo.com',
    'return_paths' : false,
    'use_absolute_destination_path' : true
  };
  
  it('should return error if transferSpec is invalid', function() {
    err = this.asperaWeb.startTransfer(null, callback);
    expect(err.error.user_message).to.equal('Invalid transferSpec parameter');
  });
  
  it('should call /connect/transfers/start', function(done) {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/start');
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
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  it('should call error callback if request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v6\/connect\/transfers\/start/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  it('should return transfer request_id', function(done) {
    res = this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(res).to.have.property('request_id').and.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      done();
    }, 50);
  });
  
  it('should include transferSpec', function(done) {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"transfer_specs":\[{"transfer_spec":{"paths":\[{"source":"\/foo\/1"}\],"remote_host":"10.0.203.80","remote_user":"aspera","direction":"send"/);
      done();
    }, 50);
  });
  
  it('should include connectSpec', function(done) {
    this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"aspera_connect_settings":{"allow_dialogs":false,"back_link":"www.foo.com","return_paths":false,"use_absolute_destination_path":true,"app_id":".*","request_id":/);
      done();
    }, 50);
  });
  
  it('should include requestId', function(done) {
    res = this.asperaWeb.startTransfer(transferSpec, connectSpec, callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(new RegExp(res.request_id));
      done();
    }, 50);
  });
};
