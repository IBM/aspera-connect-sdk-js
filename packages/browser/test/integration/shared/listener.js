var testAddEventListener = function() {
  beforeEach(function() {
    this.listener = function() {};
    sinon.spy(this, 'listener');
  });
  
  afterEach(function() {
    this.listener.restore();
  });
  
  it('should return error if event is not a string', function() {
    err = this.asperaWeb.addEventListener(4, this.listener);
    expect(err.error.user_message).to.equal('Invalid EVENT parameter');
  });
  
  it('should return error if listener is not a function', function() {
    err = this.asperaWeb.addEventListener('transfer', 2);
    expect(err.error.user_message).to.equal('Invalid Listener parameter');
  });
  
  it('should call /connect/transfers/activity', function() {
    this.asperaWeb.addEventListener('transfer', this.listener);
    this.clock.tick(2000);
    if (this.useExtensions) {
      expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/activity');
    } else {
      expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/transfers/activity');
    }
  });
  
  it('should use method POST', function() {
    this.asperaWeb.addEventListener('transfer', this.listener);
    this.clock.tick(2000);
    if (this.useExtensions) {
      expect(extensionRequests.last().method).to.equal('POST');
    } else {
      expect(this.server.lastRequest.method).to.equal('POST');
    }
  });
  
  it('should include iteration_token', function() {
    this.asperaWeb.addEventListener('transfer', this.listener);
    this.clock.tick(2000);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"iteration_token"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"iteration_token"/);
    }
  });
  
  it('should include app_id', function() {
    this.asperaWeb.addEventListener('transfer', this.listener);
    this.clock.tick(2000);
    if (this.useExtensions) {
      expect(extensionRequests.last().body).to.match(/"app_id"/);
    } else {
      expect(decryptRequest(this.server.lastRequest.requestBody)).to.match(/"app_id"/);
    }
  });
  
  it('should call listener with event type when event triggered', function() {
    this.asperaWeb.addEventListener("transfer", this.listener);
    this.clock.tick(2000);
    expect(this.listener.args[0][0]).to.equal('transfer');
  });
  
  it('should call listener with data when event triggered', function() {
    this.asperaWeb.addEventListener("transfer", this.listener);
    this.clock.tick(4000);
    expect(this.listener.args[0][1]).to.deep.equal({});
  });
  
  context('when Connect is initialized with pollingTime = 5000', function() {
    beforeEach(function() {
      if (this.useExtensions) {
        this.asperaWeb = new AW4.Connect( { pollingTime: 5000, connectMethod: 'extension' } );
      } else {
        this.asperaWeb = new AW4.Connect( { pollingTime: 5000, connectMethod: 'http' } );
      }
    });
    
    it('should poll transfer status after 5s', function() {
      this.asperaWeb.initSession();
      this.asperaWeb.addEventListener("transfer", this.listener);
      this.clock.tick(2000);
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.not.equal('/connect/transfers/activity');
      } else {
        expect(this.server.lastRequest.url).to.not.equal('https://local.connectme.us:43003/v6/connect/transfers/activity');
      }
      
      this.clock.tick(3000);
      if (this.useExtensions) {
        expect(extensionRequests.last().uri_reference).to.equal('/connect/transfers/activity');
      } else {
        expect(this.server.lastRequest.url).to.equal('https://local.connectme.us:43003/v6/connect/transfers/activity');
      }
    });
  });
};

var testRemoveEventListener = function() {
  beforeEach(function() {
    this.listener = function() {};
    sinon.spy(this, 'listener');
    this.asperaWeb.addEventListener("transfer", this.listener);
  });
  
  afterEach(function() {
    this.listener.restore();
  });
  
  it('should remove all event listeners if no type given', function() {
    this.asperaWeb.removeEventListener();
    this.clock.tick(2000);
    expect(this.listener.callCount).to.equal(0);
  });
  
  it('should return true if event listener removed with no type or listener given', function() {
    res = this.asperaWeb.removeEventListener();
    this.clock.tick(2000);
    expect(res).to.equal(true);
  });
  
  it('should return false if no event listeners exist', function() {
    this.asperaWeb.removeEventListener();
    res = this.asperaWeb.removeEventListener();
    this.clock.tick(2000);
    expect(res).to.equal(false);
  });
  
  it('should return false if no event listener with specified type found', function() {
    res = this.asperaWeb.removeEventListener('blah-event');
    this.clock.tick(2000);
    expect(res).to.equal(false);
  });
  
  it('should return true if event listener is removed with type specified', function() {
    res = this.asperaWeb.removeEventListener('transfer');
    this.clock.tick(2000);
    expect(res).to.equal(true);
  });
  
  it('should remove event listener with type specified', function() {
    this.asperaWeb.removeEventListener('transfer');
    this.clock.tick(2000);
    expect(this.listener.callCount).to.equal(0);
  });
  
  it('should return false if no event listeners with specified listener are found', function() {
    var diffListener = function () {};
    res = this.asperaWeb.removeEventListener(diffListener);
    this.clock.tick(2000);
    expect(res).to.equal(false);
  });
  
  it('should return true if event listener is removed with specified listener', function() {
    res = this.asperaWeb.removeEventListener(this.listener);
    this.clock.tick(2000);
    expect(res).to.equal(true);
  });
  
  it('should remove event listener with specified listener', function() {
    res = this.asperaWeb.removeEventListener(this.listener);
    this.clock.tick(2000);
    expect(this.listener.callCount).to.equal(0);
  });
};
