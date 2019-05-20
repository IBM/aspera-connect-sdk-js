var testStop = function() {
  it('should return true', function() {
    res = this.asperaWeb.stop();
    expect(res).to.equal(true);
  });
  
  it('should prevent calls to Connect', function() {
    this.asperaWeb.stop();
    if (this.useExtensions) {
      this.asperaWeb.version(callback);
      expect(callback.success.callCount).to.equal(0);
    } else {
      exp = this.server.requests.length;
      this.asperaWeb.version(callback);
      expect(this.server.requests.length).to.equal(exp);
    }
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
