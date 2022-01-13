describe('AW4.Logger', function() {
  var input = 'Log to the console.';
  
  beforeEach(function() {
    sandbox.spy(console, 'log');
    sandbox.spy(console, 'warn');
    sandbox.spy(console, 'error');
    sandbox.spy(console, 'debug');
    sandbox.spy(console, 'trace');
  });
  
  afterEach(function() {
    sandbox.restore();
    // Restore default logging level
    AW4.Logger.setLevel(0);
  });
  
  describe('#log', function() {
    it('should print input to console (TestRail: C730622)', function() {
      AW4.Logger.log(input);
      expect(console.log.args[0][0]).to.equal(input);
    });
  });
  
  describe('#warn', function() {
    it('should print input to console (TestRail: C730623)', function() {
      AW4.Logger.warn(input);
      expect(console.warn.args[0][0]).to.equal(input);
    });
  });
  
  describe('#error', function() {
    it('should print input to console (TestRail: C730624)', function() {
      AW4.Logger.error(input);
      expect(console.error.args[0][0]).to.equal(input);
    });
  });
  
  describe('#debug', function() {
    context('when default log level', function() {
      it('should not print input to console (TestRail: C730625)', function() {
        AW4.Logger.debug(input);
        expect(console.log.callCount).to.equal(0);
      });
    });
    
    context('when log level is 1', function() {
      it('should print input to console (TestRail: C730626)', function() {
        AW4.Logger.setLevel(1);
        AW4.Logger.debug(input);
        expect(console.log.args[0][0]).to.equal(input);
      });
    });
  });
  
  describe('#trace', function() {
    context('when default log level', function() {
      it('should not print input to console (TestRail: C730627)', function() {
        AW4.Logger.trace(input);
        expect(console.log.callCount).to.equal(0);
      });
    });
    
    context('when log level is 2', function() {
      it('should print input to console (TestRail: C730628)', function() {
        AW4.Logger.setLevel(2);
        AW4.Logger.trace(input);
        expect(console.log.args[0][0]).to.equal(input);
      });
    });
  });
});