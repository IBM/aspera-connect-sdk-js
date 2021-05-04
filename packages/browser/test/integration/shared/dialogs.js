var testShowAbout = function() {
  it('should call /v6/connect/windows/about', function(done) {
    this.asperaWeb.showAbout(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/about');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/about');
      }
      done();
    }, 50);
  });

  it('should use method GET', function(done) {
    this.asperaWeb.showAbout(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('GET');
      } else {
        expect(this.server.lastRequest.method).to.equal('GET');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showAbout(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v5\/connect\/windows\/about/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.showAbout(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowDirectory = function() {
  it('should call /connect/windows/finder/:id', function(done) {
    this.asperaWeb.showDirectory('123456', callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/finder/123456');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/finder/123456');
      }
      done();
    }, 50);
  });

  it('should use method GET', function(done) {
    this.asperaWeb.showDirectory('123456', callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('GET');
      } else {
        expect(this.server.lastRequest.method).to.equal('GET');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showDirectory('123456', callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v5\/connect\/windows\/finder\/123456/, [500, { 'Content-Type': 'application/json' }, '{}']);

    this.asperaWeb.showDirectory('123456', callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowPreferences = function() {
  it('should call /connect/windows/preferences', function(done) {
    this.asperaWeb.showPreferences(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/preferences');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/preferences');
      }
      done();
    }, 50);
  });

  it('should use method GET', function(done) {
    this.asperaWeb.showPreferences( callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('GET');
      } else {
        expect(this.server.lastRequest.method).to.equal('GET');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showPreferences(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v5\/connect\/windows\/preferences/, [500, { 'Content-Type': 'application/json' }, '{}']);

    this.asperaWeb.showPreferences(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowSaveFileDialog = function() {
  it('should call /connect/windows/select-save-file-dialog when no options given', function(done) {
    this.asperaWeb.showSaveFileDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-save-file-dialog/');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/select-save-file-dialog/');
      }
      done();
    }, 50);
  });

  it('should use method POST', function(done) {
    this.asperaWeb.showSaveFileDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('POST');
      } else {
        expect(this.server.lastRequest.method).to.equal('POST');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showSaveFileDialog(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/windows\/select-save-file-dialog/, [500, { 'Content-Type': 'application/json' }, '{}']);

    this.asperaWeb.showSaveFileDialog(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include title', function(done) {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSaveFileDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"title":"wow-what-a-title"/);
      }
      done();
    }, 50);
  });

  it('should include suggestedName', function(done) {
    var options = {
      'suggestedName':'save.txt'
    };
    this.asperaWeb.showSaveFileDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"suggestedName":"save.txt"/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"suggestedName":"save.txt"/);
      }
      done();
    }, 50);
  });
};

var testShowSelectFileDialog = function() {
  it('should call /connect/windows/select-open-file-dialog when no options given', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-open-file-dialog/');
      } else {
        expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/select-open-file-dialog/');
      }
      done();
    }, 50);
  });

  it('should use method POST', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('POST');
      } else {
        expect(this.server.lastRequest.method).to.equal('POST');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/windows\/select-open-file-dialog/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.showSelectFileDialog(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include title', function(done) {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSelectFileDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"title":"wow-what-a-title"/);
      }
      done();
    }, 50);
  });

  it('should include allowMultipleSelection = true as default', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"allowMultipleSelection":true/);
      }
      done();
    }, 50);
  });

  it('should include allowMultipleSelection', function(done) {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFileDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"allowMultipleSelection":false/);
      }
      done();
    }, 50);
  });
};

var testShowSelectFolderDialog = function() {
  it('should call /connect/windows/select-open-folder-dialog when no options given', function() {
    this.asperaWeb.showSelectFolderDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-open-folder-dialog/');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/select-open-folder-dialog/');
    }
  });

  it('should use method POST', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().method).to.equal('POST');
      } else {
        expect(this.server.lastRequest.method).to.equal('POST');
      }
      done();
    }, 50);
  });

  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v5\/connect\/windows\/select-open-folder-dialog/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.showSelectFolderDialog(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });

  it('should include title', function(done) {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSelectFolderDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"title":"wow-what-a-title"/);
      }
      done();
    }, 50);
  });

  it('should include allowMultipleSelection=true as default', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"allowMultipleSelection":true/);
      }
      done();
    }, 50);
  });

  it('should include allowMultipleSelection', function(done) {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFolderDialog(callback, options);
    setTimeout(() => {
      if (this.useExtensions) {
        expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
      } else {
        expect(this.server.lastRequest.requestBody).to.match(/"allowMultipleSelection":false/);
      }
      done();
    }, 50);
  });
};

var testShowTransferManager = function() {
  it('should call /v5/connect/windows/transfer-manager', function() {
    this.asperaWeb.showTransferManager(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/transfer-manager');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/transfer-manager');
    }
  });

  it('should use method GET', function() {
    this.asperaWeb.showTransferManager(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('GET');
    } else {
      expect(this.server.lastRequest.method).to.equal('GET');
    }
  });

  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showTransferManager(callback);
    expect(callback.success.callCount).to.equal(1);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v5\/connect\/windows\/transfer-manager/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.showTransferManager(callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowTransferMonitor = function() {
  it('should call /connect/windows/transfer-manager/:id', function() {
    this.asperaWeb.showTransferMonitor('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/transfer-monitor/123456');
    } else {
      expect(this.server.lastRequest.url).to.equal('http://127.0.0.1:33003/v5/connect/windows/transfer-monitor/123456');
    }
  });

  it('should use method GET', function() {
    this.asperaWeb.showTransferMonitor('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('GET');
    } else {
      expect(this.server.lastRequest.method).to.equal('GET');
    }
  });

  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showTransferMonitor('123456', callback);
    expect(callback.success.callCount).to.equal(1);
  });

  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v5\/connect\/windows\/transfer-monitor\/123456/, [500, { "Content-Type": "application/json" }, '{}']);

    this.asperaWeb.showTransferMonitor('123456', callback);
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};
