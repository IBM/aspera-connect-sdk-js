import React from 'react';
import ReactDOM from 'react-dom';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import App from '../components/App';
import ThreeStepBanner from '../components/ThreeStepBanner';
import StatusBanner from '../components/StatusBanner';

Enzyme.configure({ adapter: new Adapter() });

it('renders correctly', () => {
  const wrapper = shallow(<App />);
  expect(wrapper.exists()).toBe(true);
});

it('handles messages', () => {
  const spy = jest.spyOn(App.prototype, 'handleMessage');
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  map.message({data: 'download'});
  expect(spy).toHaveBeenCalled();
  spy.mockClear();
});

it('renders status banner', () => {
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  map.message({data: 'launching'});
  expect(wrapper.find(StatusBanner)).toHaveLength(1);
});

it('renders three step banner', () => {
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  map.message({data: 'download'});
  expect(wrapper.find(ThreeStepBanner)).toHaveLength(1);
});

it('handles \'download\' message', () => {
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  const instance = wrapper.instance();
  map.message({data: 'download'});
  expect(instance.state.banner).toEqual('download');
});

it('handles \'install\' message', () => {
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  const instance = wrapper.instance();
  map.message({data: 'install'});
  expect(instance.state.banner).toEqual('install');
});

it('handles \'extension_install\' message', () => {
  const map = {};
  window.addEventListener = jest.fn((event, cb) => {
    map[event] = cb;
  });
  const wrapper = shallow(<App />);
  const instance = wrapper.instance();
  map.message({data: 'extension_install'});
  expect(instance.state.banner).toEqual('extension_install');
});
