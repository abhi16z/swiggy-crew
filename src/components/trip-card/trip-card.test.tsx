import { render, screen, userEvent } from '@testing-library/react-native';

import { TripCard } from './trip-card';
import type { TripBundle } from './types';
import { withLabels } from './utils';

const SERENGETI: TripBundle = withLabels({
  id: 'serengeti-1',
  destination: 'Serengeti',
  country: 'Tanzania',
  kind: 'experience',
  price: { amount: 34300, currency: 'INR' },
  duration: { nights: 2, days: 3 },
  rating: 4.7,
  image: {
    url: 'https://ik.imagekit.io/a16xyz/crew/1.jpg?tr=w-1280,h-720',
    width: 1280,
    height: 720,
    placeholderColor: '#8a5436',
  },
  highlights: [
    { id: 'serengeti-1-d1', day: 1, text: 'Arrive and get oriented around Serengeti', icon: 'map' },
    { id: 'serengeti-1-d2', day: 2, text: 'Walk the main sight with time to linger', icon: 'walk' },
    { id: 'serengeti-1-d3', day: 3, text: 'Safari jeep at sunset', icon: 'camera' },
  ],
});

const KYOTO: TripBundle = withLabels({
  ...SERENGETI,
  id: 'kyoto-1',
  destination: 'Kyoto',
  country: 'Japan',
  kind: 'flight_stay',
  highlights: [{ id: 'kyoto-1-d1', day: 1, text: 'Higashiyama at dawn', icon: 'walk' }],
});

describe('TripCard', () => {
  it('shows the trip summary with details closed', async () => {
    await render(<TripCard trip={SERENGETI} />);

    expect(screen.getByText('Serengeti')).toBeOnTheScreen();
    expect(screen.getByText('Tanzania')).toBeOnTheScreen();
    expect(screen.getByText('Experience')).toBeOnTheScreen();
    expect(screen.getByText('₹34,300')).toBeOnTheScreen();
    expect(screen.getByText('3 days · per person')).toBeOnTheScreen();
    expect(screen.getByLabelText('Rated 4.7 out of 5')).toBeOnTheScreen();
    expect(screen.getByText('4.7')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Details for Serengeti' })).toBeCollapsed();
    expect(screen.queryByText('Day by day')).not.toBeOnTheScreen();
  });

  // Every card in the feed would otherwise fetch and decode a loader image while scrolling.
  it('shows the hero image over its placeholder color, with no loader image', async () => {
    await render(<TripCard trip={SERENGETI} />);

    const image = screen.getByRole('image', { name: 'Serengeti, Tanzania' });
    expect(image).toHaveProp('placeholder', []);
    expect(image.parent).toHaveStyle({ backgroundColor: SERENGETI.image.placeholderColor });
  });

  it('opens and closes the day by day highlights from the Details button', async () => {
    const user = userEvent.setup();
    await render(<TripCard trip={SERENGETI} />);

    await user.press(screen.getByRole('button', { name: 'Details for Serengeti' }));

    expect(screen.getByRole('button', { name: 'Details for Serengeti' })).toBeExpanded();
    expect(screen.getByText('3 highlights')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Day 1: Arrive and get oriented around Serengeti'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Day 3: Safari jeep at sunset')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Details for Serengeti' }));

    expect(screen.queryByText('Day by day')).not.toBeOnTheScreen();
  });

  it('counts a single highlight in the singular', async () => {
    const user = userEvent.setup();
    await render(<TripCard trip={KYOTO} />);

    await user.press(screen.getByRole('button', { name: 'Details for Kyoto' }));

    expect(screen.getByText('1 highlight')).toBeOnTheScreen();
  });

  // The data can send a kind this build doesn't know yet; the card must still render.
  it('renders without a badge when the trip kind is unknown', async () => {
    // Cast because the unknown kind is exactly what the type rules out.
    const cruise = { ...SERENGETI, kind: 'cruise' } as unknown as TripBundle;

    await render(<TripCard trip={cruise} />);

    expect(screen.getByText('Serengeti')).toBeOnTheScreen();
    expect(screen.queryByText('Experience')).not.toBeOnTheScreen();
  });

  // A recycled list cell keeps its state; an open card must not stay open for the next trip.
  it('starts closed when the card is reused for another trip', async () => {
    const user = userEvent.setup();
    await render(<TripCard trip={SERENGETI} />);
    await user.press(screen.getByRole('button', { name: 'Details for Serengeti' }));

    await screen.rerender(<TripCard trip={KYOTO} />);

    expect(screen.getByText('Flight + Stay')).toBeOnTheScreen();
    expect(screen.queryByText('Day by day')).not.toBeOnTheScreen();
  });
});
