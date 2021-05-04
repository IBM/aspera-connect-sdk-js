var testStop = function() {
  it('should return true', function() {
    res = this.asperaWeb.stop();
    expect(res).to.equal(true);
  });

  it('should prevent calls to Connect', function(done) {
    this.asperaWeb.stop();
    expected = this.server.requests.length;
    this.asperaWeb.version(callback);

    setTimeout(() => {
      if (this.useExtensions) {
        expect(callback.success.callCount).to.equal(0);
      } else {
        expect(this.server.requests.length).to.equal(expected);
      }
      done();
    }, 50);
  });
};

var testStopExtensions = function() {
  it('should return true', function() {
    res = this.asperaWeb.stop();
    expect(res).to.equal(true);
  });

  it('should prevent calls to Connect', function(done) {
    this.asperaWeb.stop();
    this.asperaWeb.version(callback);
    setTimeout(() => {
      expect(callback.success.callCount).to.equal(0);
      done();
    }, 50);
  });
};
