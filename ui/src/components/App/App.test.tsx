import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Dictionary as dict } from '../../constants/en-us';
import App from '.';

// Simulate window.postMessage() from parent page
const fireMessage = async (message: {data: string}) => {
  fireEvent(window, new MessageEvent('message', message));
  await new Promise((resolve) => setTimeout(resolve, 100));
};

const jestFn = jest.fn();
window.parent.postMessage = async (message) => {
  jestFn(message);
  await new Promise((resolve) => setTimeout(resolve, 100));
};

it('handles launching message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'launching' });
  expect(app.getByText(dict.launching)).toBeTruthy();
});

it('handles running message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'running' });
  expect(app.getByText(dict.running)).toBeTruthy();
});

it('handles unsupported_browser message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'unsupported_browser' });
  expect(app.getByText(/not supported/)).toBeTruthy();
});

it('handles safari_mitigate message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'safari_mitigate' });
  expect(app.getByText(dict.retry)).toBeTruthy();
});

it('handles downloadlink message properly', async () => {
  const link = 'https://example.com/connect.dmg';
  const app = render(<App />);
  fireMessage({ data: `downloadlink=${link}` });
  fireMessage({ data: 'download' }); // fire download to render proper banner
  expect(app.getByText(dict.installConnect)).toHaveAttribute('href', link);
});

it('handles downloadVersion message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'downloadVersion=4.1.2.10' });
  fireMessage({ data: 'download' }); // fire download to render proper banner
  expect(app.getByText(/4.1.2/)).toBeTruthy();
});

it('handles download message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'download' });
  expect(app.getByText(dict.installConnect)).toBeTruthy();
});

it('handles install message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'install' });
  expect(app.getByText(dict.installConnect)).toBeTruthy();
});

it('handles extension_install message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'extension_install' });
  expect(app.getByText(dict.installExtension)).toBeTruthy();
});

it('handles update message properly', async () => {
  const app = render(<App />);
  fireMessage({ data: 'update' });
  expect(app.getByText(dict.upgradeConnect)).toBeTruthy();
});

it('sends removeiframe message on close click', async () => {
  jestFn.mockClear();
  const app = render(<App />);
  const close = app.getByRole('button');
  close.click();
  expect(jestFn).toHaveBeenCalledWith('removeiframe');
});

it('sends 100% and connect_bar_visible messages on download render', async () => {
  jestFn.mockClear();
  render(<App />);
  fireMessage({ data: 'download' });
  expect(jestFn).toHaveBeenCalledWith('100%');
  expect(jestFn).toHaveBeenCalledWith('connect_bar_visible');
});

it('sends clicked_troubleshoot message on troubleshoot click', async () => {
  jestFn.mockClear();
  const app = render(<App />);
  fireMessage({ data: 'download' });
  const troubleshoot = app.getByText(dict.troubleshoot);
  troubleshoot.click();
  expect(jestFn).toHaveBeenCalledWith('clicked_troubleshoot');
});

it('sends refresh message on troubleshoot click', async () => {
  jestFn.mockClear();
  const app = render(<App />);
  fireMessage({ data: 'download' });
  const refresh = app.getByText(dict.refreshButton);
  refresh.click();
  expect(jestFn).toHaveBeenCalledWith('refresh');
});
