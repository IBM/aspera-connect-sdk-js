var testStart = function() {
  beforeEach(function() {
    // Reset Connect session
    if (this.useExtensions) {
      this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
    } else {
      this.asperaWeb = new AW4.Connect( { connectMethod: 'http' } );
    }
  });

  it('should return error if called before initSession', function() {
    err = this.asperaWeb.start();
    expect(err.error.user_message).to.equal("Please call #initSession first.");
  });

  it('should allow calls to Connect', function() {
    this.asperaWeb.initSession();

    setTimeout(() => {
      this.asperaWeb.stop();
      this.asperaWeb.start();
      this.asperaWeb.getAllTransfers(callback);
      this.asperaWeb.version(callback);
      // Initially called during initSession
      expect(callback.success.callCount).to.not.equal(1);
    });
  });
};

var testStartExtensions = function() {
  beforeEach(function() {
    // Reset Connect session
    this.asperaWeb = new AW4.Connect( { connectMethod: 'extension' } );
  });

  it('should return error if called before initSession', function(done) {
    err = this.asperaWeb.start();

    setTimeout(() => {
      expect(err.error.user_message).to.equal("Please call #initSession first.");
      done();
    }, 50);
  });

  it('should allow calls to Connect', function(done) {
    this.asperaWeb.initSession();

    setTimeout(() => {
      this.asperaWeb.stop();
      this.asperaWeb.start();
    }, 50);

    setTimeout(() => {
      this.asperaWeb.getAllTransfers(callback);
    }, 100);

    setTimeout(() => {
      // Initially called during initSession
      expect(callback.success.callCount).to.equal(1);
      done();
    }, 150);
  });
};
