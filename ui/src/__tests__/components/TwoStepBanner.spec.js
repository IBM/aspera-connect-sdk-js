import React from 'react';
import { render } from '@testing-library/react';
import { Dictionary as dict } from '../../constants/en-us';
import TwoStepBanner from '../../components/TwoStepBanner';

const props = {
  banner: 'download',
  href: 'https://example.com',
  version: '4.1.2',
  outdated: false
}

test('should show header', () => {
  const app = render(<TwoStepBanner currentState={props.banner} href={props.href} majorVersion={props.version} isOutdated={false}/>);
  expect(app.getByText(dict.required)).toBeTruthy();
  expect(app.getByText(/To enable Aspera uploads and downloads/)).toBeTruthy();
  expect(app.getByText(/4.1.2/)).toBeTruthy();
});

test('should show extension and install buttons', () => {
  const app = render(<TwoStepBanner currentState={props.banner} href={props.href} majorVersion={props.version} isOutdated={false}/>);
  expect(app.getByText(dict.installConnect)).toBeTruthy();
  expect(app.getByText(dict.installExtension)).toBeTruthy();
});

test('should show puzzle and download pictograms', () => {
  const app = render(<TwoStepBanner currentState={props.banner} href={props.href} majorVersion={props.version} isOutdated={false}/>);
  expect(app.container.querySelector('.puzzle')).toBeTruthy();
  expect(app.container.querySelector('.downloadBox')).toBeTruthy();
});

test('should show upgrade button if outdated', () => {
  const app = render(<TwoStepBanner currentState={props.banner} href={props.href} majorVersion={props.version} isOutdated={true}/>);
  expect(app.getByText(dict.upgradeConnect)).toBeTruthy();
});

test('should show footer', () => {
  const app = render(<TwoStepBanner currentState={props.banner} href={props.href} majorVersion={props.version} isOutdated={false}/>);
  expect(app.getByText(dict.alreadyInstalled)).toBeTruthy();
  expect(app.getByText(dict.refreshButton)).toBeTruthy();
  expect(app.getByText(dict.troubleshoot)).toBeTruthy();
});
