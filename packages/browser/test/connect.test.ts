import { expect } from 'chai';
// import { SinonSpy, spy } from 'sinon';
import { Connect } from '../src';

describe('AW4.Connect', () => {
  before(() => {
      // Disable redirects when triggering fasp protocol
      window.onbeforeunload = () => 'Oh no!';
  })
  
  it('should be a function', () => {
    expect(typeof Connect).to.equal('function')
  })
  
  it('should have static property EVENT', () => {
    expect(typeof Connect.EVENT).to.equal('object')
  })
  
  it('should have static property HTTP_METHOD', () => {
    expect(typeof Connect.HTTP_METHOD).to.equal('object')
  })
  
  it('should have static property STATUS', () => {
    expect(typeof Connect.STATUS).to.equal('object')
  })
  
  it('should have static property TRANSFER_STATUS', () => {
    expect(typeof Connect.TRANSFER_STATUS).to.equal('object')
  })
})
