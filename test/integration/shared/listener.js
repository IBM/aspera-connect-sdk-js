var testRemoveEventListener = function() {
  beforeEach(function() {
    this.listener = function() {};
    sinon.spy(this, 'listener');
    this.asperaWeb.addEventListener("transfer", this.listener);
  });

  afterEach(function() {
    this.listener.restore();
    this.asperaWeb.removeEventListener();
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
