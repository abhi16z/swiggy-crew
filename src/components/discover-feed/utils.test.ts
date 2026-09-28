import { formatTripCount } from './utils';

it('uses the singular for one trip', () => {
  expect(formatTripCount(1)).toBe('1 trip');
  expect(formatTripCount(261)).toBe('261 trips');
});
