import { expect } from 'chai';
// import { SinonSpy, spy } from 'sinon';
import { Utils } from '../src';

describe('AW4.Utils', () => {
  before(() => {
      // Disable redirects when triggering fasp protocol
      window.onbeforeunload = () => 'Oh no!';
  })
  
  it('should return BROWSER', () => {
    expect(typeof Utils.BROWSER).to.equal('object')
  })
  
  describe('#atou', () => {
    it('should return unicode string', () => {
      let testBase64String = 'ZW5jb2RlLW1l';
      let exp = 'encode-me';
      expect(Utils.atou(testBase64String)).to.equal(exp)
    })
  })
  
  describe('#utoa', () => {
    it('should return unicode string', () => {
      let testUtfString = 'encode-me';
      let exp = 'ZW5jb2RlLW1l';
      expect(Utils.utoa(testUtfString)).to.equal(exp)
    })
  })
  
  describe('#getFullURI', () => {
    it('should return unicode string', () => {
      let res = Utils.getFullURI('test.html');
      let exp = /(file)?(http)?(https)?:\/\/.*(\/)?(\\)?test\.html/;
      expect(res).to.match(exp)
    })
  })
  
  describe('#launchConnect', () => {
    it('should be function', () => {
      expect(typeof Utils.launchConnect).to.equal('function')
    })
  })
})
