import { makeTrips } from '@/components/discover-feed/test-data';

import { countTripsByFilter } from './utils';

describe('countTripsByFilter', () => {
  it('counts every trip for "all" and each trip under its own type', () => {
    const trips = makeTrips(6, ['villa', 'villa', 'flight_stay']);

    expect(countTripsByFilter(trips)).toEqual({
      all: 6,
      villa: 4,
      flight_stay: 2,
      experience: 0,
    });
  });

  it('counts zero everywhere before the trips load', () => {
    expect(countTripsByFilter([])).toEqual({ all: 0, villa: 0, flight_stay: 0, experience: 0 });
  });
});
