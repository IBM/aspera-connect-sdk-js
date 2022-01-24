import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '.';

test('should render children', () => {
  const text = 'Click Me!';
  const app = render(<Button>{text}</Button>);
  expect(app.getByText(text)).toBeTruthy();
});

test('should be active by default', () => {
  const app = render(<Button />);
  expect(app.container.querySelector('.active')).toBeTruthy();
});

test('should pass in disabled prop', () => {
  const app = render(<Button disabled={true} />);
  expect(app.container.querySelector('.notActive')).toBeTruthy();
});

test('should pass in href prop', () => {
  const href = 'https://example.com';
  const app = render(<Button href={href} />);
  expect(app.getByRole('link')).toHaveAttribute('href', href);
});

test('should call click event', () => {
  const jestFn = jest.fn();
  const app = render(<Button href='https://example.com' onClick={jestFn} />);
  const link = app.getByRole('link');
  link.click();
  expect(jestFn).toHaveBeenCalledTimes(1);
});
