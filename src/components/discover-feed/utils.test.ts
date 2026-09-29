import { makeTrips } from './test-data';
import { formatTripCount, getVisibleTrips, parseTrips } from './utils';

it('uses the singular for one trip', () => {
  expect(formatTripCount(1)).toBe('1 trip');
  expect(formatTripCount(261)).toBe('261 trips');
});

// The JSON has no labels; cards only read them, so every parsed trip must carry them.
it('formats the card labels of every trip it parses', () => {
  const [trip] = makeTrips(1);
  const { labels, ...raw } = trip;

  const [parsed] = parseTrips(JSON.parse(JSON.stringify([raw])));

  expect(parsed).toEqual(trip);
  expect(parsed.labels).toMatchObject({ price: '₹34,300', details: 'Details for Trip 1' });
});

describe('getVisibleTrips', () => {
  // Trip 1..4: villa 30k/4.5, experience 10k/4.9, villa 20k/4.9, experience 10k/4.1.
  const trips = makeTrips(4, ['villa', 'experience']).map((trip, index) => ({
    ...trip,
    price: { ...trip.price, amount: [30000, 10000, 20000, 10000][index] },
    rating: [4.5, 4.9, 4.9, 4.1][index],
  }));
  const names = (list: typeof trips) => list.map((trip) => trip.destination);

  it('keeps every trip in data order for all trips + recommended', () => {
    expect(getVisibleTrips(trips, { tripFilter: 'all', tripSort: 'recommended' })).toBe(trips);
  });

  it('keeps only the chosen type, in data order', () => {
    const visible = getVisibleTrips(trips, { tripFilter: 'villa', tripSort: 'recommended' });
    expect(names(visible)).toEqual(['Trip 1', 'Trip 3']);
  });

  it('sorts by price, cheapest first, keeping data order on ties', () => {
    const visible = getVisibleTrips(trips, { tripFilter: 'all', tripSort: 'price_low' });
    expect(names(visible)).toEqual(['Trip 2', 'Trip 4', 'Trip 3', 'Trip 1']);
  });

  it('sorts by rating, highest first, keeping data order on ties', () => {
    const visible = getVisibleTrips(trips, { tripFilter: 'all', tripSort: 'top_rated' });
    expect(names(visible)).toEqual(['Trip 2', 'Trip 3', 'Trip 1', 'Trip 4']);
  });

  it('filters and sorts together', () => {
    const visible = getVisibleTrips(trips, { tripFilter: 'experience', tripSort: 'top_rated' });
    expect(names(visible)).toEqual(['Trip 2', 'Trip 4']);
  });

  // "Recommended" must still mean data order after another sort was applied and undone.
  it('never reorders the stored trips', () => {
    getVisibleTrips(trips, { tripFilter: 'all', tripSort: 'price_low' });
    expect(names(trips)).toEqual(['Trip 1', 'Trip 2', 'Trip 3', 'Trip 4']);
  });
});
