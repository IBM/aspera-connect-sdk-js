import React from 'react';
import { render } from '@testing-library/react';
import { Dictionary as dict } from '../../constants/en-us';
import StatusBanner from '../../components/StatusBanner';

test('should render the proper running banner', () => {
  const app = render(<StatusBanner currentState='running' />);
  expect(app.getByText(dict.running)).toBeTruthy();
});

test('should render the proper launching banner', () => {
  const app = render(<StatusBanner currentState='launching' />);
  expect(app.getByText(dict.launching)).toBeTruthy();
});

test('should render the proper unsupported banner', () => {
  const app = render(<StatusBanner currentState='unsupported_browser' />);
  expect(app.getByText(/This browser is not supported/)).toBeTruthy();
});

test('should render the proper safari banner', () => {
  const app = render(<StatusBanner currentState='safari_mitigate' />);
  expect(app.getByText(dict.retry)).toBeTruthy();
});
