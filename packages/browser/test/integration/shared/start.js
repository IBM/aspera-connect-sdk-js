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
