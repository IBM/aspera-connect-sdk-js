describe('Utils', function() {
  describe('#atou', function() {
    it('should create unicode string (TestRail: C730630)', function() {
      var output = AW4.Utils.atou('ZW5jb2RlLW1l');
      expect(output).to.equal('encode-me');
    });
  });
  
  describe('#utoa', function() {
    it('should create base64 string (TestRail: C730631)', function() {
      var output = AW4.Utils.utoa('encode-me');
      expect(output).to.equal('ZW5jb2RlLW1l');
    });
  });
  
  describe('#getFullURI', function() {
    it('should return full URL (TestRail: C730632)', function() {
      var output = AW4.Utils.getFullURI('blah');
      expect(output).to.match(/(file)?(http)?(https)?:\/\/.*(\/)?(\\)?blah/);
    });
      
    it('should return input if already full URL (TestRail: C730633)', function() {
      var output = AW4.Utils.getFullURI('https://connect.aspera.com/index.html');
      expect(output).to.equal('https://connect.aspera.com/index.html');
    });
    
    it('should return null if input is not string (TestRail: C730634)', function() {
      var output = AW4.Utils.getFullURI({'path':'index.html'});
      expect(output).to.equal(null);
    });
  });
});
