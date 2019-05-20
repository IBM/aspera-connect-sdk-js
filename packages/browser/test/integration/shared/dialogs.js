var testShowAbout = function() {
  it('should call /v6/connect/windows/about', function() {
    this.asperaWeb.showAbout(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/about');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/about');
    }
  });
  
  it('should use method GET', function() {
    this.asperaWeb.showAbout(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('GET');
    } else {
      expect(this.server.lastRequest.method).to.equal('GET');
    }
  });
  
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showAbout(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/about/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.showAbout(callback);
    expect(callback.error.callCount).to.equal(1);
  });
};

var testShowAboutExtensions = function() {
  it('should call /v6/connect/windows/about', function(done) {
    this.asperaWeb.showAbout(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/about');
      done();
    }, 50);
  });
  
  it('should use method GET', function(done) {
    this.asperaWeb.showAbout(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('GET');
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
    this.server.respondWith('GET', /v6\/connect\/windows\/about/, [500, { 'Content-Type': 'application/json' }, '{}']);
    this.asperaWeb.showAbout(callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowDirectory = function() {
  it('should call /connect/windows/finder/:id', function() {
    this.asperaWeb.showDirectory('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/finder/123456');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/finder/123456');
    }
  });
  
  it('should use method GET', function() {
    this.asperaWeb.showDirectory('123456', callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('GET');
    } else {
      expect(this.server.lastRequest.method).to.equal('GET');
    }
  });
    
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showDirectory('123456', callback);
    expect(callback.success.callCount).to.equal(1);
  });
   
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/finder\/123456/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
    this.asperaWeb.showDirectory('123456', callback);
    expect(callback.error.callCount).to.equal(1);
  });
};

var testShowDirectoryExtensions = function() {
  it('should call /connect/windows/finder/:id', function(done) {
    this.asperaWeb.showDirectory('123456', callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/finder/123456');
      done();
    }, 50);
  });
  
  it('should use method GET', function(done) {
    this.asperaWeb.showDirectory('123456', callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('GET');
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
    this.server.respondWith('GET', /v6\/connect\/windows\/finder\/123456/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
    this.asperaWeb.showDirectory('123456', callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowPreferences = function() {
  it('should call /connect/windows/preferences', function() {
    this.asperaWeb.showPreferences(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/preferences');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/preferences');
    }
  });
  
  it('should use method GET', function() {
    this.asperaWeb.showPreferences( callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('GET');
    } else {
      expect(this.server.lastRequest.method).to.equal('GET');
    }
  });
  
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showPreferences(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/preferences/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
    this.asperaWeb.showPreferences(callback);
    expect(callback.error.callCount).to.equal(1);
  });
};

var testShowPreferencesExtensions = function() {
  it('should call /connect/windows/preferences', function(done) {
    this.asperaWeb.showPreferences(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/preferences');
      done();
    }, 50);
  });
  
  xit('should use method GET', function(done) {
    this.asperaWeb.showPreferences(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('GET');
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
    this.server.respondWith('GET', /v6\/connect\/windows\/preferences/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
    this.asperaWeb.showPreferences(callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};

var testShowSaveFileDialog = function() {
  it('should call /connect/windows/select-save-file-dialog when no options given', function() {
    this.asperaWeb.showSaveFileDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-save-file-dialog/');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/select-save-file-dialog/');
    }
  });
  
  it('should use method POST', function() {
    this.asperaWeb.showSaveFileDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });
  
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showSaveFileDialog(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v6\/connect\/windows\/select-save-file-dialog/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
    this.asperaWeb.showSaveFileDialog(callback);
    expect(callback.error.callCount).to.equal(1);
  });
  
  it('should include title', function() {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSaveFileDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"title":"wow-what-a-title"/);
    }
  });
  
  it('should include suggestedName', function() {
    var options = {
      'suggestedName':'save.txt'
    };
    this.asperaWeb.showSaveFileDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"suggestedName":"save.txt"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"suggestedName":"save.txt"/);
    }
  });
};

var testShowSaveFileDialogExtensions = function() {
  it('should call /connect/windows/select-save-file-dialog when no options given', function(done) {
    this.asperaWeb.showSaveFileDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-save-file-dialog/');
      done();
    }, 50);
  });
  
  it('should use method POST', function(done) {
    this.asperaWeb.showSaveFileDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('POST');
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
    this.server.respondWith('POST', /v6\/connect\/windows\/select-save-file-dialog/, [500, { 'Content-Type': 'application/json' }, '{}']);
    
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
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      done();
    }, 50);
  });
  
  it('should include suggestedName', function(done) {
    var options = {
      'suggestedName':'save.txt'
    };
    this.asperaWeb.showSaveFileDialog(callback, options);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"suggestedName":"save.txt"/);
      done();
    }, 50);
  });
};

var testShowSelectFileDialog = function() {
  it('should call /connect/windows/select-open-file-dialog when no options given', function() {
    this.asperaWeb.showSelectFileDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-open-file-dialog/');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/select-open-file-dialog/');
    }
  });
  
  it('should use method POST', function() {
    this.asperaWeb.showSelectFileDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });
  
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showSelectFileDialog(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v6\/connect\/windows\/select-open-file-dialog/, [500, { "Content-Type": "application/json" }, '{}']);
    
    this.asperaWeb.showSelectFileDialog(callback);
    expect(callback.error.callCount).to.equal(1);
  });
  
  it('should include title', function() {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSelectFileDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"title":"wow-what-a-title"/);
    }
  });
  
  it('should include allowMultipleSelection = true as default', function() {
    this.asperaWeb.showSelectFileDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"allowMultipleSelection":true/);
    }
  });
  
  it('should include allowMultipleSelection', function() {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFileDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"allowMultipleSelection":false/);
    }
  });
};

var testShowSelectFileDialogExtensions = function() {
  it('should call /connect/windows/select-open-file-dialog when no options given', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-open-file-dialog/');
      done();
    }, 50);
  });
  
  it('should use method POST', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('POST');
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
    this.server.respondWith('POST', /v6\/connect\/windows\/select-open-file-dialog/, [500, { "Content-Type": "application/json" }, '{}']);
    
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
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      done();
    }, 50);
  });
  
  it('should include allowMultipleSelection = true as default', function(done) {
    this.asperaWeb.showSelectFileDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
      done();
    }, 50);
  });
  
  it('should include allowMultipleSelection', function(done) {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFileDialog(callback, options);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
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
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/select-open-folder-dialog/');
    }
  });
  
  it('should use method POST', function() {
    this.asperaWeb.showSelectFolderDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });
  
  it('should call success callback when request succeeds', function() {
    this.asperaWeb.showSelectFolderDialog(callback);
    expect(callback.success.callCount).to.equal(1);
  });
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('POST', /v6\/connect\/windows\/select-open-folder-dialog/, [500, { "Content-Type": "application/json" }, '{}']);
    
    this.asperaWeb.showSelectFolderDialog(callback);
    expect(callback.error.callCount).to.equal(1);
  });
  
  it('should include title', function() {
    var options = {
      'title':'wow-what-a-title'
    };
    this.asperaWeb.showSelectFolderDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"title":"wow-what-a-title"/);
    }
  });
  
  it('should include allowMultipleSelection=true as default', function() {
    this.asperaWeb.showSelectFolderDialog(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"allowMultipleSelection":true/);
    }
  });
  
  it('should include allowMultipleSelection', function() {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFolderDialog(callback, options);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"allowMultipleSelection":false/);
    }
  });
};

var testShowSelectFolderDialogExtensions = function() {
  it('should call /connect/windows/select-open-folder-dialog when no options given', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/select-open-folder-dialog/');
      done();
    }, 50);
  });
  
  it('should use method POST', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('POST');
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
    this.server.respondWith('POST', /v6\/connect\/windows\/select-open-folder-dialog/, [500, { "Content-Type": "application/json" }, '{}']);
    
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
      expect(extensionRequests.last().body).to.match(/"title":"wow-what-a-title"/);
      done();
    }, 50);
  });
  
  it('should include allowMultipleSelection=true as default', function(done) {
    this.asperaWeb.showSelectFolderDialog(callback);
    
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":true/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"allowMultipleSelection":true/);
    }
  });
  
  it('should include allowMultipleSelection', function(done) {
    var options = {
      'allowMultipleSelection':false
    };
    this.asperaWeb.showSelectFolderDialog(callback, options);
    
    setTimeout(() => {
      expect(extensionRequests.last().body).to.match(/"allowMultipleSelection":false/);
      done();
    }, 50);
  });
};

var testShowTransferManager = function() {
  it('should call /v6/connect/windows/transfer-manager', function() {
    this.asperaWeb.showTransferManager(callback);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/transfer-manager');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/transfer-manager');
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
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/transfer-manager/, [500, { "Content-Type": "application/json" }, '{}']);
    
    this.asperaWeb.showTransferManager(callback);
    expect(callback.error.callCount).to.equal(1);
  });
};

var testShowTransferManagerExtensions = function() {
  it('should call /v6/connect/windows/transfer-manager', function(done) {
    this.asperaWeb.showTransferManager(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/transfer-manager');
      done();
    }, 50);
  });
  
  it('should use method GET', function(done) {
    this.asperaWeb.showTransferManager(callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('GET');
      done();
    }, 50);
  });
  
  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showTransferManager(callback);
    
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/transfer-manager/, [500, { "Content-Type": "application/json" }, '{}']);
    
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
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/windows/transfer-monitor/123456');
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
  
  it('should call error callback when request fails', function() {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/transfer-monitor\/123456/, [500, { "Content-Type": "application/json" }, '{}']);
    
    this.asperaWeb.showTransferMonitor('123456', callback);
    expect(callback.error.callCount).to.equal(1);
  });
};

var testShowTransferMonitorExtensions = function() {
  it('should call /connect/windows/transfer-manager/:id', function(done) {
    this.asperaWeb.showTransferMonitor('123456', callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/windows/transfer-monitor/123456');
      done();
    }, 50);
  });
  
  it('should use method GET', function(done) {
    this.asperaWeb.showTransferMonitor('123456', callback);
    
    setTimeout(() => {
      expect(extensionRequests.last().method).to.equal('GET');
      done();
    }, 50);
  });
  
  it('should call success callback when request succeeds', function(done) {
    this.asperaWeb.showTransferMonitor('123456', callback);
    
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 50);
  });
  
  it('should call error callback when request fails', function(done) {
    extensionResponse(500, '{}');
    this.server.respondWith('GET', /v6\/connect\/windows\/transfer-monitor\/123456/, [500, { "Content-Type": "application/json" }, '{}']);
    
    this.asperaWeb.showTransferMonitor('123456', callback);
    
    setTimeout(() => {
      expect(callback.error.callCount).to.equal(1);
      done();
    }, 50);
  });
};
